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
      .select('*, stakeholder:stakeholders(*), stall:stalls(*), contract:contracts(*)')
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
        let curAdvance = Number(occ.advance_balance ?? stakeholder?.advance_balance ?? 0)

        // Generate billing up to the current active billing cycle (never future phantom bills)
        while (true) {
          const monthOffset = (iterYear - currentYear) * 12 + (iterMonth - currentMonth)
          if (monthOffset > 0) break // Stop after current month

          const billingPeriod = `MONTHLY-${iterMonth}-${iterYear}`

          // Strict uniqueness check: prevent duplicate billing per contract and period
          if (!existingPeriodMap.has(billingPeriod)) {
            // Due date: 5th of that billing month
            const dueDateStr = `${iterYear}-${String(iterMonth).padStart(2, '0')}-05`
            const isPastDue = todayDate > dueDateStr
            const billingNo = `BILL-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`

            let paidAmount = 0
            let balance = rentAmount
            let status = 'UNPAID'

            if (curAdvance <= 0) {
              paidAmount = 0
              balance = rentAmount
              status = isPastDue ? 'OVERDUE' : 'UNPAID'
            } else if (curAdvance >= rentAmount) {
              // Full advance credit allocated
              paidAmount = rentAmount
              balance = 0
              status = 'PAID'
              curAdvance = curAdvance - rentAmount
            } else {
              // Partial advance credit allocated
              paidAmount = curAdvance
              balance = rentAmount - curAdvance
              status = isPastDue ? 'OVERDUE' : 'PARTIALLY_PAID'
              curAdvance = 0
            }

            await supabase.from('billings').insert({
              occupant_id: occ.id,
              contract_id: contract.id,
              billing_no: billingNo,
              billing_period: billingPeriod,
              total_amount: rentAmount,
              paid_amount: paidAmount,
              balance: balance,
              due_date: dueDateStr,
              status: status
            })

            console.log(`[billingService] Generated billing invoice ${billingNo} (${billingPeriod}) for occupant ${occ.id} (Status: ${status}, Advance Credit Applied: ₱${paidAmount})`)
          }

          iterMonth++
          if (iterMonth > 12) {
            iterMonth = 1
            iterYear++
          }
        }

        // Update remaining advance balance on occupant and stakeholder if credit was applied
        if (Number(occ.advance_balance || 0) !== curAdvance) {
          await supabase.from('occupants').update({ advance_balance: curAdvance }).eq('id', occ.id)
          if (stakeholder?.id) {
            await supabase.from('stakeholders').update({ advance_balance: curAdvance }).eq('id', stakeholder.id)
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

export default {
  ensureBillingsForVerifiedTenants,
  fetchBillings,
  sendBillingNotification
}

