import { supabase } from '../config/supabase'
import { normalizeRecord } from './api'
import fallbackBillingsData from '../data/billings'

let lastEnsureRunTime = 0
const ENSURE_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes cache window

/**
 * Ensures that every eligible tenant has their billing cycle started.
 * 1. Ensures an active occupant record exists
 * 2. Ensures an active contract record exists with stall monthly rent
 * 3. Checks advance_balance (deducts advance balance if available)
 * 4. Generates billing statements in billings table
 */
export async function ensureBillingsForVerifiedTenants({ force = false } = {}) {
  const now = Date.now()
  if (!force && (now - lastEnsureRunTime < ENSURE_COOLDOWN_MS)) {
    return // Skip redundant execution within cooldown window
  }
  lastEnsureRunTime = now

  try {
    // 1. Fetch eligible stakeholders (assigned to a stall, verified tenants, approved onboarding, or completed workflow)
    const { data: verifiedStakeholders, error: stErr } = await supabase
      .from('stakeholders')
      .select('*, occupant:occupants(*)')
      .or('selected_stall_id.not.is.null,onboarding_status.eq.COMPLETED,onboarding_status.eq.CONTRACT_CREATED,onboarding_status.eq.STALL_ASSIGNED,market_approval_status.eq.APPROVED,market_supervisor_approved.eq.true')

    if (stErr) {
      console.warn('[billingService] Notice querying eligible stakeholders:', stErr)
    }

    // Also fetch occupants with active or pending status
    const { data: activeOccupants, error: occErr } = await supabase
      .from('occupants')
      .select('*, stakeholder:stakeholders(*)')
      .in('status', ['ACTIVE', 'PENDING'])

    if (occErr) {
      console.warn('[billingService] Notice querying occupants:', occErr)
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
          let stallId = s.selected_stall_id
          if (!stallId) {
            const { data: stByOcc } = await supabase
              .from('stalls')
              .select('id')
              .eq('occupant_id', occ.id)
              .maybeSingle()
            if (stByOcc?.id) stallId = stByOcc.id
          }
          if (!stallId && s.user_id) {
            try {
              const { data: appData } = await supabase
                .from('business_applications')
                .select('selected_stall_id')
                .eq('user_id', s.user_id)
                .order('id', { ascending: false })
                .limit(1)
                .maybeSingle()
              stallId = appData?.selected_stall_id
            } catch (appLookupErr) {
              console.warn('[billingService] Could not lookup business application stall:', appLookupErr)
            }
          }

          let stallRent = 1500

          if (stallId) {
            const { data: stallData } = await supabase
              .from('stalls')
              .select('id, monthly_rent, stall_no')
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

            // Update occupant contract_id
            if (createdCon?.id) {
              await supabase.from('occupants').update({ contract_id: createdCon.id, status: 'ACTIVE' }).eq('id', occ.id)
            }
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

        // Determine starting month (from contract/occupant start, or up to 2 months back)
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
              const backMonths = Math.min(diffMonths, 2)
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
          if (monthOffset > 2) break // Stop after current + 2 months ahead

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

/**
 * Fetches billing records with multi-layered fallbacks and full relation enrichment.
 */
export async function fetchBillings({ forceEnsure = false } = {}) {
  // Run tenant billing generation in the background so it never blocks data loading
  if (forceEnsure) {
    try {
      await ensureBillingsForVerifiedTenants({ force: true })
    } catch (ensureErr) {
      console.warn('[billingService] Notice in ensureBillingsForVerifiedTenants:', ensureErr)
    }
  } else {
    // Non-blocking background check
    ensureBillingsForVerifiedTenants().catch(() => {})
  }

  let billingsData = null

  // 2. Query billings from Supabase with full relational joins
  try {
    const { data, error } = await supabase
      .from('billings')
      .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
      .order('id', { ascending: false })

    if (!error && Array.isArray(data) && data.length > 0) {
      billingsData = data
    } else if (error) {
      console.warn('[billingService] Relational query note, attempting flat query fallback:', error)
    }
  } catch (relErr) {
    console.warn('[billingService] Relational fetch failed, falling back:', relErr)
  }

  // 2b. Fallback: If relational query returned empty or failed, fetch flat billings
  if (!billingsData || billingsData.length === 0) {
    try {
      const { data: flatData, error: flatErr } = await supabase
        .from('billings')
        .select('*')
        .order('id', { ascending: false })

      if (!flatErr && Array.isArray(flatData) && flatData.length > 0) {
        billingsData = flatData
      }
    } catch (flatErr) {
      console.warn('[billingService] Flat billings query note:', flatErr)
    }
  }

  // 2c. Fallback: If Supabase returned empty, try backend API endpoint
  if (!billingsData || billingsData.length === 0) {
    try {
      const { default: api } = await import('./api')
      const apiRes = await api.get('/billings')
      if (apiRes?.data && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
        billingsData = apiRes.data
      }
    } catch (apiErr) {
      console.warn('[billingService] Backend API /billings fallback note:', apiErr)
    }
  }

  // 2d. Fallback: Check localStorage
  if (!billingsData || billingsData.length === 0) {
    try {
      const stored = localStorage.getItem('billings')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          billingsData = parsed
        }
      }
    } catch (_) {}
  }

  // 2e. Fallback: Default mock data if completely empty
  if (!billingsData || billingsData.length === 0) {
    if (Array.isArray(fallbackBillingsData) && fallbackBillingsData.length > 0) {
      billingsData = fallbackBillingsData
    } else {
      billingsData = []
    }
  }

  // 3. Pre-fetch lookup maps to guarantee 100% complete enrichment
  const stallsByOccupantId = new Map()
  const stallsById = new Map()
  const occupantsById = new Map()
  const stakeholdersById = new Map()
  const contractsById = new Map()

  try {
    const [stallsRes, occsRes, staksRes, consRes] = await Promise.allSettled([
      supabase.from('stalls').select('id, stall_no, occupant_id, monthly_rent, info, stall_type, status'),
      supabase.from('occupants').select('*'),
      supabase.from('stakeholders').select('*'),
      supabase.from('contracts').select('*')
    ])

    if (stallsRes.status === 'fulfilled' && stallsRes.value.data) {
      for (const st of stallsRes.value.data) {
        stallsById.set(Number(st.id), st)
        if (st.occupant_id) stallsByOccupantId.set(Number(st.occupant_id), st)
      }
    }
    if (occsRes.status === 'fulfilled' && occsRes.value.data) {
      for (const occ of occsRes.value.data) {
        occupantsById.set(Number(occ.id), occ)
      }
    }
    if (staksRes.status === 'fulfilled' && staksRes.value.data) {
      for (const s of staksRes.value.data) {
        stakeholdersById.set(Number(s.id), s)
      }
    }
    if (consRes.status === 'fulfilled' && consRes.value.data) {
      for (const c of consRes.value.data) {
        contractsById.set(Number(c.id), c)
      }
    }
  } catch (lookupErr) {
    console.warn('[billingService] Reference tables lookup note:', lookupErr)
  }

  // 4. Enrich every billing record
  const enrichedBillings = (billingsData || []).map(b => {
    // Resolve occupant
    const occupantId = b.occupant_id || b.occupantId || b.occupant?.id
    const resolvedOccupant = b.occupant || (occupantId ? occupantsById.get(Number(occupantId)) : null) || b.contract?.occupant || {}

    // Resolve contract
    const contractId = b.contract_id || b.contractId || b.contract?.id
    const resolvedContract = b.contract || (contractId ? contractsById.get(Number(contractId)) : null) || {}

    // Resolve stakeholder
    const stakeholderId = b.stakeholder_id || b.stakeholderId ||
      resolvedOccupant?.stakeholder_id || resolvedOccupant?.stakeholderId ||
      resolvedOccupant?.stakeholder?.id || b.stakeholder?.id

    const resolvedStakeholder = resolvedOccupant?.stakeholder ||
      b.stakeholder ||
      (stakeholderId ? stakeholdersById.get(Number(stakeholderId)) : null) || {}

    // Resolve stall number from contract.stall, occupantId map, or stakeholder's selected_stall_id
    let stallObj = resolvedContract?.stall || (occupantId ? stallsByOccupantId.get(Number(occupantId)) : null)
    if (!stallObj && resolvedContract?.stall_id) {
      stallObj = stallsById.get(Number(resolvedContract.stall_id))
    }
    if (!stallObj && resolvedStakeholder?.selected_stall_id) {
      stallObj = stallsById.get(Number(resolvedStakeholder.selected_stall_id))
    }
    const stallNo = stallObj?.stall_no || stallObj?.stallNo || b.stall_no || b.stallNo || ''

    const totalVal = Number(b.total_amount ?? b.totalAmount ?? b.total ?? 0)
    const paidVal = Number(b.paid_amount ?? b.paidAmount ?? b.paid ?? 0)
    const balanceVal = Number(b.balance ?? Math.max(totalVal - paidVal, 0))

    const stFirstName = resolvedStakeholder.first_name || resolvedStakeholder.firstName || ''
    const stLastName = resolvedStakeholder.last_name || resolvedStakeholder.lastName || ''
    const fullName = `${stFirstName} ${stLastName}`.trim()
    const businessName = resolvedStakeholder.business_name || resolvedStakeholder.businessName || ''
    const stakeholderLabel = fullName || businessName || b.stakeholder || b.occupantName || b.occupant_name || 'Verified Tenant'

    const invoiceId = b.billing_no || b.billingNo || (b.id ? `BILL-${b.id}` : 'BILL-000')
    const tenantEmail = (resolvedStakeholder.email || resolvedOccupant?.email || b.email || '').trim()

    const enriched = {
      ...b,
      rawId: b.id,
      id: invoiceId,
      billingNo: b.billing_no || b.billingNo || invoiceId,
      billingPeriod: b.billing_period || b.billingPeriod || b.period || 'Monthly Rental',
      dueDate: b.due_date || b.dueDate || b.due || null,
      occupant: resolvedOccupant,
      stakeholder: stakeholderLabel,
      stakeholderObj: resolvedStakeholder,
      stakeholderId: stakeholderId || null,
      email: tenantEmail,
      stakeholderEmail: tenantEmail,
      businessName,
      stall: stallObj,
      stallNo,
      totalAmount: totalVal,
      paidAmount: paidVal,
      balance: balanceVal,
      total: totalVal,
      paid: paidVal,
      due: b.due_date || b.dueDate || b.due || null,
      status: (b.status || (balanceVal <= 0 ? 'PAID' : 'UNPAID')).toUpperCase()
    }

    return normalizeRecord(enriched)
  })

  return enrichedBillings
}

export async function sendBillingNotification(billingIdentifier, opts = {}) {
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
  if (!bill) throw new Error('Billing record not found')

  let stakeholderId = opts.stakeholderId || bill?.occupant?.stakeholder_id
  if (!stakeholderId && bill?.occupant_id) {
    const { data: occ } = await supabase.from('occupants').select('stakeholder_id').eq('id', bill.occupant_id).maybeSingle()
    stakeholderId = occ?.stakeholder_id
  }

  let targetEmail = opts.email || bill.email || null
  let targetStall = opts.stallNo || bill.stall_no || ''

  // Look up stakeholder email and assigned stall if not provided
  if (stakeholderId && (!targetEmail || !targetStall)) {
    const { data: st } = await supabase
      .from('stakeholders')
      .select('email, selected_stall_id')
      .eq('id', Number(stakeholderId))
      .maybeSingle()

    if (st) {
      if (!targetEmail && st.email) targetEmail = st.email.trim()
      if (!targetStall && st.selected_stall_id) {
        const { data: stl } = await supabase
          .from('stalls')
          .select('stall_no')
          .eq('id', Number(st.selected_stall_id))
          .maybeSingle()
        if (stl?.stall_no) targetStall = stl.stall_no
      }
    }
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
        stallNo: targetStall,
        balance: Number(bill.balance || 0),
        dueDate: bill.due_date,
        totalAmount: Number(bill.total_amount || 0),
        billingPeriod: bill.billing_period || 'Monthly Rental',
        email: targetEmail
      })
    } catch (emailErr) {
      console.warn('[billingService] Email dispatch error:', emailErr)
    }

    try {
      await supabase.from('audit_logs').insert({
        action: 'SEND_BILLING_REMINDER',
        details: `Sent billing reminder and email for invoice ${invoiceLabel} to stakeholder #${stakeholderId} (${targetEmail || 'no email'})`
      })
    } catch (_) {}

    return { success: true, stakeholderId, emailResult, targetEmail }
  }

  return { success: true, stakeholderId, targetEmail }
}

export default {
  ensureBillingsForVerifiedTenants,
  fetchBillings,
  sendBillingNotification
}

