import { supabase } from '../config/supabase'
import { normalizeRecord } from './api'

/**
 * Ensures that every verified tenant has their billing cycle started.
 * Mirrors the exact backend logic from BillingService.java:
 * 1. Ensures an active occupant record exists
 * 2. Ensures an active contract record exists with stall monthly rent
 * 3. Checks advance_balance (deducts advance balance if available)
 * 4. Generates initial billing statement in billings table
 */
export async function ensureBillingsForVerifiedTenants() {
  try {
    const { data: verifiedStakeholders, error: stErr } = await supabase
      .from('stakeholders')
      .select('*, occupant:occupants(*)')
      .or('verified_tenant.eq.true,verified_stakeholder.eq.true,applicant_fee_paid.eq.true')

    if (stErr) {
      console.warn('[billingService] Error fetching verified stakeholders:', stErr)
      return
    }
    if (!verifiedStakeholders || verifiedStakeholders.length === 0) return

    const todayDate = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const billingPeriod = `MONTHLY-${currentMonth}-${currentYear}`
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    for (const s of verifiedStakeholders) {
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

        // Check if billing already exists for this occupant
        const { data: existingBills } = await supabase
          .from('billings')
          .select('id')
          .eq('occupant_id', occ.id)
          .limit(1)

        if (existingBills && existingBills.length > 0) {
          continue // Billing has already started for this tenant
        }

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
          let stallId = s.selected_stall_id || s.stall_id
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
              .eq('id', stallId)
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
        const billingNo = `BILL-${Date.now().toString().slice(-8)}`

        // Apply advance balance (identical to backend BillingService.java lines 520-595)
        let curAdvance = Number(occ.advance_balance || s.advance_balance || 0)
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

        // Start initial billing invoice for the verified tenant
        await supabase.from('billings').insert({
          occupant_id: occ.id,
          contract_id: contract?.id || null,
          billing_no: billingNo,
          billing_period: billingPeriod,
          total_amount: rentAmount,
          paid_amount: paidAmount,
          balance: balance,
          due_date: dueDate,
          status: status
        })

        // Update remaining advance balance on occupant and stakeholder
        if (Number(occ.advance_balance || 0) !== curAdvance) {
          await supabase.from('occupants').update({ advance_balance: curAdvance }).eq('id', occ.id)
          await supabase.from('stakeholders').update({ advance_balance: curAdvance }).eq('id', s.id)
        }

        console.log(`[billingService] Started billing invoice ${billingNo} for verified stakeholder ${s.id} (Status: ${status}, Balance: ${balance})`)
      } catch (innerErr) {
        console.warn('[billingService] Could not start billing for stakeholder', s.id, innerErr)
      }
    }
  } catch (err) {
    console.warn('[billingService] Error in ensureBillingsForVerifiedTenants', err)
  }
}

export async function fetchBillings() {
  // 1. Ensure all verified tenants have their billing started
  await ensureBillingsForVerifiedTenants()

  // 2. Query all billings with occupant, stakeholder, and stall relations
  const { data, error } = await supabase
    .from('billings')
    .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
    .order('id', { ascending: false })

  if (error) throw error

  // 3. Filter to verified tenants only
  const verifiedBillings = (data || []).filter(b => {
    const s = b.occupant?.stakeholder
    if (!s) return true
    return Boolean(
      s.verified_tenant ||
      s.verifiedTenant ||
      s.verified_stakeholder ||
      s.verifiedStakeholder ||
      s.applicant_fee_paid ||
      s.applicantFeePaid ||
      s.treasurer_paid ||
      s.treasurerPaid
    )
  })

  return verifiedBillings.map(normalizeRecord)
}

export async function sendBillingNotification(billingId) {
  const { data: bill, error: billErr } = await supabase
    .from('billings')
    .select('*, occupant:occupants(stakeholder_id)')
    .eq('id', billingId)
    .single()

  if (billErr) throw billErr

  if (bill?.occupant?.stakeholder_id) {
    const { error: notifErr } = await supabase
      .from('notifications')
      .insert({
        stakeholder_id: bill.occupant.stakeholder_id,
        title: 'Billing Statement Ready',
        message: `Your billing invoice ${bill.billing_no || bill.id} has a balance of PHP ${bill.balance} due on ${bill.due_date}.`,
        priority: 'MEDIUM',
        notification_type: 'BILLING_REMINDER',
        related_record_type: 'BILLING',
        related_record_id: billingId
      })
    if (notifErr) throw notifErr
  }

  return { success: true }
}

export default {
  ensureBillingsForVerifiedTenants,
  fetchBillings,
  sendBillingNotification
}
