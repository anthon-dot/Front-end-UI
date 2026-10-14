import { supabase } from '../config/supabase'
import { normalizeRecord } from './api'

/**
 * Ensures that every eligible tenant has their billing cycle started.
 * 1. Ensures an active occupant record exists
 * 2. Ensures an active contract record exists with stall monthly rent
 * 3. Checks advance_balance (deducts advance balance if available)
 * 4. Generates billing statements in billings table
 */
export async function ensureBillingsForVerifiedTenants() {
  try {
    // 1. Fetch eligible stakeholders (verified tenants, verified stakeholders, or completed onboarding)
    const { data: verifiedStakeholders, error: stErr } = await supabase
      .from('stakeholders')
      .select('*, occupant:occupants(*, stall:stalls(*))')
      .or('verified_tenant.eq.true,verified_stakeholder.eq.true,verified.eq.true,onboarding_status.eq.COMPLETED,final_status.eq.APPROVED')

    if (stErr) {
      console.warn('[billingService] Error fetching verified stakeholders:', stErr)
    }

    // Also fetch any active occupants who might not have been captured above
    const { data: activeOccupants, error: occErr } = await supabase
      .from('occupants')
      .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
      .eq('status', 'ACTIVE')

    if (occErr) {
      console.warn('[billingService] Error fetching active occupants:', occErr)
    }

    // Build consolidated map of stakeholders
    const stakeholderMap = new Map()
    for (const s of (verifiedStakeholders || [])) {
      if (s.id) stakeholderMap.set(Number(s.id), s)
    }

    for (const occ of (activeOccupants || [])) {
      if (occ.stakeholder && !stakeholderMap.has(Number(occ.stakeholder.id))) {
        stakeholderMap.set(Number(occ.stakeholder.id), {
          ...occ.stakeholder,
          occupant: occ
        })
      }
    }

    const eligibleList = Array.from(stakeholderMap.values())
    if (eligibleList.length === 0) return

    const todayDate = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    for (const s of eligibleList) {
      try {
        let occ = Array.isArray(s.occupant) ? s.occupant[0] : s.occupant
        if (!occ) {
          const { data: existingOcc } = await supabase
            .from('occupants')
            .select('*')
            .eq('stakeholder_id', s.id)
            .maybeSingle()

          if (existingOcc) {
            occ = existingOcc
          } else {
            const { data: createdOcc } = await supabase
              .from('occupants')
              .insert({
                stakeholder_id: s.id,
                status: 'ACTIVE',
                occupancy_date: todayDate,
                advance_balance: Number(s.advance_balance || 0)
              })
              .select()
              .maybeSingle()
            occ = createdOcc
          }
        }

        if (!occ?.id) continue

        // Find or create contract to get monthly rent
        let contract = null
        const { data: existingCon } = await supabase
          .from('contracts')
          .select('*')
          .eq('occupant_id', occ.id)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingCon) {
          contract = existingCon
        } else {
          let stallId = s.selected_stall_id || s.stall_id || occ.stall_id
          if (!stallId && s.user_id) {
            try {
              const { data: appData } = await supabase
                .from('business_applications')
                .select('selected_stall_id, stall_id')
                .eq('user_id', s.user_id)
                .order('id', { ascending: false })
                .limit(1)
                .maybeSingle()
              stallId = appData?.selected_stall_id || appData?.stall_id
            } catch (appLookupErr) {
              console.warn('[billingService] Could not lookup business application stall:', appLookupErr)
            }
          }

          let stallRent = 1500

          if (stallId) {
            const { data: stallData } = await supabase
              .from('stalls')
              .select('*')
              .eq('id', Number(stallId))
              .maybeSingle()

            if (stallData?.monthly_rent) stallRent = Number(stallData.monthly_rent)

            const { data: createdCon } = await supabase
              .from('contracts')
              .insert({
                occupant_id: occ.id,
                stall_id: Number(stallId),
                contract_no: `CON-${Date.now().toString().slice(-8)}`,
                start_date: todayDate,
                end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                monthly_rent: stallRent,
                billing_frequency: 'MONTHLY',
                status: 'ACTIVE'
              })
              .select()
              .maybeSingle()

            contract = createdCon

            // Update stall occupant and status
            await supabase.from('stalls').update({
              occupant_id: occ.id,
              status: 'OCCUPIED'
            }).eq('id', Number(stallId))
          }
        }

        const rentAmount = Number(contract?.monthly_rent || 1500)

        // Fetch all existing bills for this occupant
        const { data: existingBills } = await supabase
          .from('billings')
          .select('id, billing_period, total_amount, paid_amount, balance, status')
          .eq('occupant_id', occ.id)

        const existingPeriodMap = new Map()
        ;(existingBills || []).forEach(b => {
          if (b.billing_period) existingPeriodMap.set(b.billing_period, b)
        })

        // Determine starting month (from contract/occupant start, or up to 3 months back)
        let startYear = currentYear
        let startMonth = currentMonth

        const rawStartDate = contract?.start_date || occ.occupancy_date
        if (rawStartDate) {
          const sDate = new Date(rawStartDate)
          if (!isNaN(sDate.getTime())) {
            const contractYear = sDate.getFullYear()
            const contractMonth = sDate.getMonth() + 1
            const diffMonths = (currentYear - contractYear) * 12 + (currentMonth - contractMonth)
            if (diffMonths > 0) {
              const backMonths = Math.min(diffMonths, 3)
              const pastDate = new Date(currentYear, currentMonth - 1 - backMonths, 1)
              startYear = pastDate.getFullYear()
              startMonth = pastDate.getMonth() + 1
            }
          }
        }

        // Generate from startMonth/startYear up to (currentMonth + 2 months advance = 3 months total)
        let iterYear = startYear
        let iterMonth = startMonth
        let curAdvance = Number(occ.advance_balance || s.advance_balance || 0)

        while (true) {
          const monthOffset = (iterYear - currentYear) * 12 + (iterMonth - currentMonth)
          if (monthOffset > 2) break // Stop after current + 2 months ahead (3 months advance)

          const billingPeriod = `MONTHLY-${iterMonth}-${iterYear}`

          if (!existingPeriodMap.has(billingPeriod)) {
            // Due date: 5th of that month
            const dueDateStr = `${iterYear}-${String(iterMonth).padStart(2, '0')}-05`
            const billingNo = `BILL-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`

            let paidAmount = 0
            let balance = rentAmount
            let status = 'UNPAID'

            if (curAdvance <= 0) {
              paidAmount = 0
              balance = rentAmount
              status = 'UNPAID'
            } else if (curAdvance >= rentAmount) {
              paidAmount = rentAmount
              balance = 0
              status = 'PAID'
              curAdvance = curAdvance - rentAmount
            } else {
              paidAmount = curAdvance
              balance = rentAmount - curAdvance
              status = 'PARTIAL'
              curAdvance = 0
            }

            await supabase.from('billings').insert({
              occupant_id: occ.id,
              contract_id: contract?.id || null,
              billing_no: billingNo,
              billing_period: billingPeriod,
              total_amount: rentAmount,
              paid_amount: paidAmount,
              balance: balance,
              due_date: dueDateStr,
              status: status
            })

            console.log(`[billingService] Generated billing invoice ${billingNo} (${billingPeriod}) for stakeholder ${s.id} (Status: ${status})`)
          }

          iterMonth++
          if (iterMonth > 12) {
            iterMonth = 1
            iterYear++
          }
        }

        // Update remaining advance balance on occupant and stakeholder if modified
        if (Number(occ.advance_balance || 0) !== curAdvance) {
          await supabase.from('occupants').update({ advance_balance: curAdvance }).eq('id', occ.id)
          await supabase.from('stakeholders').update({ advance_balance: curAdvance }).eq('id', s.id)
        }
      } catch (innerErr) {
        console.warn('[billingService] Could not start billing for stakeholder', s.id, innerErr)
      }
    }
  } catch (err) {
    console.warn('[billingService] Error in ensureBillingsForVerifiedTenants', err)
  }
}

export async function fetchBillings() {
  // 1. Ensure all eligible tenants have their billing statements generated
  try {
    await ensureBillingsForVerifiedTenants()
  } catch (ensureErr) {
    console.warn('[billingService] Error in ensureBillingsForVerifiedTenants:', ensureErr)
  }

  // 2. Query all billings with occupant, stakeholder, and contract relations
  const { data: billingsData, error } = await supabase
    .from('billings')
    .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
    .order('id', { ascending: false })

  if (error) {
    console.error('[billingService] Error fetching billings:', error)
    throw error
  }

  // 3. Fetch all stalls to accurately link stallNo for occupants without direct contract.stall
  let stallsByOccupantId = new Map()
  let stallsById = new Map()
  try {
    const { data: stallsData } = await supabase.from('stalls').select('id, stall_no, occupant_id, monthly_rent, info, section')
    if (stallsData) {
      for (const st of stallsData) {
        stallsById.set(Number(st.id), st)
        if (st.occupant_id) stallsByOccupantId.set(Number(st.occupant_id), st)
      }
    }
  } catch (stallErr) {
    console.warn('[billingService] Could not fetch stalls map:', stallErr)
  }

  // 4. Enrich every billing record
  const enrichedBillings = (billingsData || []).map(b => {
    const occupant = b.occupant || b.contract?.occupant || {}
    const stakeholder = occupant.stakeholder || b.stakeholder || {}

    // Resolve stall number from contract.stall, occupantId map, or stakeholder's selected_stall_id
    let stallObj = b.contract?.stall || (occupant.id ? stallsByOccupantId.get(Number(occupant.id)) : null)
    if (!stallObj && stakeholder.selected_stall_id) {
      stallObj = stallsById.get(Number(stakeholder.selected_stall_id))
    }
    const stallNo = stallObj?.stall_no || stallObj?.stallNo || b.stall_no || b.stallNo || ''

    const totalVal = Number(b.total_amount ?? b.totalAmount ?? 0)
    const paidVal = Number(b.paid_amount ?? b.paidAmount ?? 0)
    const balanceVal = Number(b.balance ?? Math.max(totalVal - paidVal, 0))

    const stakeholderId = stakeholder.id || occupant.stakeholder_id || occupant.stakeholderId || b.stakeholder_id || b.stakeholderId

    const enriched = {
      ...b,
      rawId: b.id,
      occupant,
      stakeholder,
      stakeholderId,
      stall: stallObj,
      stallNo,
      totalAmount: totalVal,
      paidAmount: paidVal,
      balance: balanceVal,
      status: (b.status || (balanceVal <= 0 ? 'PAID' : 'UNPAID')).toUpperCase()
    }

    return normalizeRecord(enriched)
  })

  return enrichedBillings
}

export async function sendBillingNotification(billingIdentifier) {
  let query = supabase
    .from('billings')
    .select('*, occupant:occupants(id, stakeholder_id)')

  if (typeof billingIdentifier === 'number' || /^\d+$/.test(String(billingIdentifier))) {
    query = query.eq('id', Number(billingIdentifier))
  } else {
    query = query.or(`billing_no.eq.${billingIdentifier},id.eq.${billingIdentifier}`)
  }

  const { data: bill, error: billErr } = await query.maybeSingle()

  if (billErr) throw billErr

  let stakeholderId = bill?.occupant?.stakeholder_id
  if (!stakeholderId && bill?.occupant_id) {
    const { data: occ } = await supabase.from('occupants').select('stakeholder_id').eq('id', bill.occupant_id).maybeSingle()
    stakeholderId = occ?.stakeholder_id
  }

  if (stakeholderId) {
    const invoiceLabel = bill.billing_no || `BILL-${bill.id}`
    const dueFormatted = bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'the due date'
    const balFormatted = Number(bill.balance || 0).toLocaleString()

    const { error: notifErr } = await supabase
      .from('notifications')
      .insert({
        stakeholder_id: Number(stakeholderId),
        title: 'Billing Statement Notice',
        message: `Your billing statement ${invoiceLabel} has an outstanding balance of ₱${balFormatted} due on ${dueFormatted}. Please settle on or before the due date.`,
        priority: 'MEDIUM',
        notification_type: 'BILLING_REMINDER',
        related_record_type: 'BILLING',
        related_record_id: bill.id
      })
    if (notifErr) console.warn('[billingService] Could not insert notification:', notifErr)

    let emailResult = null
    try {
      const { sendBillingDueNotification } = await import('./emailNotificationService')
      emailResult = await sendBillingDueNotification({
        billingId: bill.id,
        stakeholderId: Number(stakeholderId),
        billingNo: bill.billing_no || `BILL-${bill.id}`,
        balance: Number(bill.balance || 0),
        dueDate: bill.due_date,
        totalAmount: Number(bill.total_amount || 0),
        billingPeriod: bill.billing_period || 'Monthly Rental'
      })
    } catch (emailErr) {
      console.warn('[billingService] Email dispatch error:', emailErr)
    }

    try {
      await supabase.from('audit_logs').insert({
        action: 'SEND_BILLING_REMINDER',
        details: `Sent billing reminder and email for invoice ${invoiceLabel} to stakeholder #${stakeholderId}`
      })
    } catch (_) {}

    return { success: true, stakeholderId, emailResult }
  }

  return { success: true, stakeholderId }
}

export default {
  ensureBillingsForVerifiedTenants,
  fetchBillings,
  sendBillingNotification
}
