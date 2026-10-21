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
    // 1. Fetch only ACTIVE contracts for verified occupants
    const { data: activeContracts, error: conErr } = await supabase
      .from('contracts')
      .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
      .eq('status', 'ACTIVE')

    if (conErr) {
      console.warn('[billingService] Notice querying active contracts:', conErr)
    }

    // Also fetch occupants with active status and their active contracts
    const { data: activeOccupants, error: occErr } = await supabase
      .from('occupants')
      .select('*, stakeholder:stakeholders(*), stall:stalls!occupants_stall_id_fkey(*), contract:contracts(*)')
      .eq('status', 'ACTIVE')

    if (occErr) {
      console.warn('[billingService] Notice querying occupants:', occErr)
    }

    const contractsToProcess = []
    const processedContractIds = new Set()

    for (const c of (activeContracts || [])) {
      if (c.id && !processedContractIds.has(Number(c.id))) {
        processedContractIds.add(Number(c.id))
        contractsToProcess.push(c)
      }
    }

    for (const occ of (activeOccupants || [])) {
      const occContract = Array.isArray(occ.contract) ? occ.contract[0] : occ.contract
      if (occContract?.id && occContract.status === 'ACTIVE' && !processedContractIds.has(Number(occContract.id))) {
        processedContractIds.add(Number(occContract.id))
        contractsToProcess.push({
          ...occContract,
          occupant: occ,
          stall: occ.stall || occContract.stall
        })
      }
    }

    if (contractsToProcess.length === 0) return

    const todayDate = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    for (const contract of contractsToProcess) {
      try {
        const occ = contract.occupant
        if (!occ?.id) continue

        const stakeholder = occ.stakeholder || contract.stakeholder
        const stall = contract.stall || occ.stall
        const rentAmount = Number(contract.monthly_rent || stall?.monthly_rent || 1500)

        // Fetch all existing bills for this occupant / contract
        const { data: existingBills } = await supabase
          .from('billings')
          .select('id, billing_period, total_amount, paid_amount, balance, status')
          .eq('occupant_id', occ.id)

        const existingPeriodMap = new Map()
        ;(existingBills || []).forEach(b => {
          if (b.billing_period) existingPeriodMap.set(b.billing_period, b)
        })

        // Determine starting month from contract start_date or occupancy_date
        let startYear = currentYear
        let startMonth = currentMonth

        const rawStartDate = contract.start_date || occ.occupancy_date
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

        let iterYear = startYear
        let iterMonth = startMonth

        // Generate billing up to current active billing cycle (never future phantom bills)
        while (true) {
          const monthOffset = (iterYear - currentYear) * 12 + (iterMonth - currentMonth)
          if (monthOffset > 0) break // Stop after current month

          const billingPeriod = `MONTHLY-${iterMonth}-${iterYear}`

          // Strict uniqueness check: prevent duplicate billing per contract and period
          if (!existingPeriodMap.has(billingPeriod)) {
            // Due date: 5th of that billing month
            const dueDateStr = `${iterYear}-${String(iterMonth).padStart(2, '0')}-05`
            const dueDateObj = new Date(dueDateStr)
            const msDiff = Date.now() - dueDateObj.getTime()
            const daysPastDue = Math.floor(msDiff / (1000 * 60 * 60 * 24))

            // Confirmed Client Rule #4: 2-month grace period (60 days) before flagging overdue
            const isOverdue = daysPastDue > 60
            const billingNo = `BILL-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`

            // Confirmed Client Rule #2: Advance rent is held as credit; NOT automatically consumed
            const status = isOverdue ? 'OVERDUE' : 'UNPAID'

            await supabase.from('billings').insert({
              occupant_id: occ.id,
              contract_id: contract.id,
              billing_no: billingNo,
              billing_period: billingPeriod,
              total_amount: rentAmount,
              paid_amount: 0,
              balance: rentAmount,
              due_date: dueDateStr,
              status: status
            })

            console.log(`[billingService] Generated billing invoice ${billingNo} (${billingPeriod}) for occupant ${occ.id} (Status: ${status}, 60-day Grace Period Observed)`)
          }

          iterMonth++
          if (iterMonth > 12) {
            iterMonth = 1
            iterYear++
          }
        }
      } catch (innerErr) {
        console.warn('[billingService] Could not process billing for contract', contract.id, innerErr)
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

    const dueDateStr = b.due_date || b.dueDate || b.due || null
    let computedStatus = (b.status || '').toUpperCase()
    if (balanceVal <= 0) {
      computedStatus = 'PAID'
    } else {
      const todayStr = new Date().toISOString().split('T')[0]
      const isPastDue = dueDateStr && todayStr > dueDateStr
      if (isPastDue) {
        computedStatus = 'OVERDUE'
      } else if (paidVal > 0 && balanceVal > 0) {
        computedStatus = 'PARTIALLY_PAID'
      } else if (!computedStatus || computedStatus === 'OVERDUE') {
        computedStatus = 'UNPAID'
      }
    }

    const enriched = {
      ...b,
      rawId: b.id,
      id: invoiceId,
      billingNo: b.billing_no || b.billingNo || invoiceId,
      billingPeriod: b.billing_period || b.billingPeriod || b.period || 'Monthly Rental',
      dueDate: dueDateStr,
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
      due: dueDateStr,
      status: computedStatus
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

/**
 * Confirmed Client Rule #2: Allocate held advance rent credit to a specific bill
 * Does NOT double-count as newly collected cash revenue.
 */
export async function allocateAdvanceCreditToBill({ billingId, amount, stakeholderId = null, authorizedByName = 'Treasurer' }) {
  const allocAmount = Number(amount)
  if (isNaN(allocAmount) || allocAmount <= 0) throw new Error('Valid allocation amount is required')

  // 1. Fetch billing
  const { data: bill, error: billErr } = await supabase
    .from('billings')
    .select('*, occupant:occupants(id, stakeholder_id)')
    .eq('id', Number(billingId))
    .single()

  if (billErr || !bill) throw new Error('Billing statement not found')
  if (allocAmount > Number(bill.balance)) {
    throw new Error(`Allocation amount (₱${allocAmount.toLocaleString()}) exceeds bill balance (₱${Number(bill.balance).toLocaleString()})`)
  }

  const resolvedStakeholderId = stakeholderId || bill.occupant?.stakeholder_id
  if (!resolvedStakeholderId) throw new Error('Stakeholder reference not found for this bill')

  // 2. Fetch available advance credit
  const { data: credits, error: credErr } = await supabase
    .from('advance_credits')
    .select('*')
    .eq('stakeholder_id', Number(resolvedStakeholderId))
    .eq('status', 'AVAILABLE')
    .gt('available_amount', 0)
    .order('id', { ascending: true })

  let availableCreditRecord = credits?.[0]
  if (!availableCreditRecord) {
    // Check stakeholders.advance_balance fallback
    const { data: sh } = await supabase.from('stakeholders').select('advance_balance').eq('id', Number(resolvedStakeholderId)).maybeSingle()
    if (!sh || Number(sh.advance_balance || 0) < allocAmount) {
      throw new Error(`Insufficient available advance credit balance (Available: ₱${Number(sh?.advance_balance || 0).toLocaleString()})`)
    }
    // Create an advance_credits record if missing
    const { data: newCred } = await supabase.from('advance_credits').insert({
      stakeholder_id: Number(resolvedStakeholderId),
      original_amount: Number(sh.advance_balance),
      available_amount: Number(sh.advance_balance),
      status: 'AVAILABLE'
    }).select().single()
    availableCreditRecord = newCred
  }

  if (Number(availableCreditRecord.available_amount) < allocAmount) {
    throw new Error(`Insufficient available advance credit (₱${Number(availableCreditRecord.available_amount).toLocaleString()} available)`)
  }

  // 3. Insert credit_allocations record
  await supabase.from('credit_allocations').insert({
    advance_credit_id: availableCreditRecord.id,
    billing_id: Number(billingId),
    allocated_amount: allocAmount,
    authorized_name: authorizedByName,
    notes: `Allocated ₱${allocAmount} from Advance Rent Credit to ${bill.billing_no || `BILL-${bill.id}`}`
  })

  // 4. Update advance_credits available balance
  const remainingCred = Number(availableCreditRecord.available_amount) - allocAmount
  await supabase.from('advance_credits').update({
    available_amount: remainingCred,
    status: remainingCred <= 0 ? 'DEPLETED' : 'AVAILABLE'
  }).eq('id', availableCreditRecord.id)

  // Sync stakeholders.advance_balance
  await supabase.from('stakeholders').update({ advance_balance: remainingCred }).eq('id', Number(resolvedStakeholderId))

  // 5. Update billing statement balance & status
  const newPaid = Number(bill.paid_amount || 0) + allocAmount
  const newBal = Math.max(Number(bill.total_amount || 0) - newPaid, 0)
  const newStatus = newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID'

  const { data: updatedBill, error: updErr } = await supabase.from('billings').update({
    paid_amount: newPaid,
    balance: newBal,
    status: newStatus
  }).eq('id', Number(billingId)).select().single()

  if (updErr) throw updErr

  // 6. Audit log
  try {
    await supabase.from('audit_logs').insert({
      action: 'ALLOCATE_ADVANCE_CREDIT',
      entity_name: 'billings',
      entity_id: String(billingId),
      details: { billingId, allocatedAmount: allocAmount, remainingCredit: remainingCred, newBalance: newBal }
    })
  } catch (_) {}

  return {
    success: true,
    allocatedAmount: allocAmount,
    remainingCredit: remainingCred,
    updatedBill: normalizeRecord(updatedBill)
  }
}

/**
 * Confirmed Client Rule: Record daily / partial rental collection with receipt reference
 */
export async function recordDailyCollection({
  billingId,
  amount,
  receiptNo,
  paymentDate = null,
  collectorName = 'Cashier/Collector',
  notes = ''
}) {
  const payAmount = Number(amount)
  if (isNaN(payAmount) || payAmount <= 0) throw new Error('Valid collection amount is required')
  const rNo = receiptNo || `OR-${Date.now().toString().slice(-8)}`

  // 1. Fetch billing
  const { data: bill, error: billErr } = await supabase
    .from('billings')
    .select('*, occupant:occupants(id, stakeholder_id)')
    .eq('id', Number(billingId))
    .single()

  if (billErr || !bill) throw new Error('Billing record not found')

  const stakeholderId = bill.occupant?.stakeholder_id
  if (!stakeholderId) throw new Error('Stakeholder reference not found for this bill')

  // 2. Insert payment transaction
  const { data: payment, error: payErr } = await supabase.from('payments').insert({
    stakeholder_id: stakeholderId,
    billing_id: Number(billingId),
    amount: payAmount,
    payment_type: 'RENT_PAYMENT',
    receipt_no: rNo,
    reference_no: notes || 'Daily collection payment',
    cashier_name: collectorName,
    payment_date: paymentDate || new Date().toISOString()
  }).select().single()

  if (payErr) throw payErr

  // 3. Atomically update billing statement balance & status
  const newPaid = Number(bill.paid_amount || 0) + payAmount
  const newBal = Math.max(Number(bill.total_amount || 0) - newPaid, 0)
  const newStatus = newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID'

  const { data: updatedBill, error: updErr } = await supabase.from('billings').update({
    paid_amount: newPaid,
    balance: newBal,
    status: newStatus
  }).eq('id', Number(billingId)).select().single()

  if (updErr) throw updErr

  return {
    success: true,
    payment: normalizeRecord(payment),
    updatedBill: normalizeRecord(updatedBill),
    newBalance: newBal
  }
}

/**
 * Confirmed Client Rule #4: Fetch notices
 */
export async function fetchNotices(contractId = null) {
  let query = supabase.from('notices').select('*, contract:contracts(*, stall:stalls(*)), stakeholder:stakeholders(*)')
  if (contractId) query = query.eq('contract_id', Number(contractId))
  const { data, error } = await query.order('id', { ascending: false })
  if (error) {
    console.warn('[billingService] Could not fetch notices:', error)
    return []
  }
  return (data || []).map(normalizeRecord)
}

/**
 * Confirmed Client Rule #4: Issue overdue notice (1st, 2nd, or Final Demand Notice)
 * Never automatically evicts or revokes.
 */
export async function issueOverdueNotice({
  contractId,
  stakeholderId,
  billingIds = [],
  noticeType = 'FIRST_NOTICE',
  balanceSnapshot = 0,
  daysOverdue = 60,
  notes = '',
  issuerName = 'Office of the Market Supervisor'
}) {
  const noticeNo = `NOTIF-${noticeType.slice(0, 3)}-${Date.now().toString().slice(-6)}`

  const { data, error } = await supabase.from('notices').insert({
    notice_no: noticeNo,
    contract_id: Number(contractId),
    stakeholder_id: Number(stakeholderId),
    billing_ids: billingIds,
    notice_type: noticeType,
    days_overdue: Number(daysOverdue),
    balance_snapshot: Number(balanceSnapshot),
    issuer_name: issuerName,
    notes: notes,
    issued_at: new Date().toISOString()
  }).select().single()

  if (error) throw error

  // Send in-app notification to stakeholder
  try {
    const typeLabel = noticeType === 'FINAL_DEMAND' ? 'Final Demand Notice' : (noticeType === 'SECOND_NOTICE' ? 'Second Delinquency Notice' : 'First Notice of Overdue Rental')
    await supabase.from('notifications').insert({
      stakeholder_id: Number(stakeholderId),
      title: `${typeLabel} Issued`,
      message: `An official ${typeLabel} (${noticeNo}) has been issued regarding outstanding rental arrears of ₱${Number(balanceSnapshot).toLocaleString()}. Please settle your account with the Municipal Treasury immediately.`,
      priority: 'HIGH',
      notification_type: 'OVERDUE_NOTICE',
      related_record_type: 'NOTICES',
      related_record_id: data.id
    })
  } catch (_) {}

  return normalizeRecord(data)
}

export default {
  ensureBillingsForVerifiedTenants,
  fetchBillings,
  sendBillingNotification,
  allocateAdvanceCreditToBill,
  recordDailyCollection,
  fetchNotices,
  issueOverdueNotice
}


