import { supabase } from '../config/supabase'
import api, { normalizeRecord } from './api'

export async function fetchPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('*, stakeholder:stakeholders(*), billing:billings(*)')
    .order('id', { ascending: false })

  if (error) throw error
  return (data || []).map(item => {
    const norm = normalizeRecord(item)
    if (item.stakeholder) norm.stakeholder = normalizeRecord(item.stakeholder)
    if (item.billing) norm.billing = normalizeRecord(item.billing)
    return norm
  })
}

export async function createPayment(payload) {
  const receiptNo = payload.receiptNo || payload.receipt_no || `OR-${Date.now().toString().slice(-8)}`
  const stakeholderId = payload.stakeholderId || payload.stakeholder?.id
  const billingId = payload.billingId || payload.billing?.id || null

  let canonicalType = payload.paymentType || 'RENT_PAYMENT'
  if (['APPLICATION_FEE', 'BUSINESS_PERMIT_PAYMENT'].includes(canonicalType)) {
    canonicalType = 'APPLICATION_FEE'
  }

  // 1. Prioritize Spring Boot backend API to ensure authoritative transaction, activation, and billing generation
  try {
    const backendPayload = {
      stakeholder: { id: Number(stakeholderId) },
      billing: billingId ? { id: Number(billingId) } : null,
      amount: Number(payload.amount),
      receiptNo: receiptNo,
      referenceNo: payload.referenceNo || '',
      paymentType: canonicalType,
      rentCycle: payload.rentCycle || null,
      totalAdvanceAmount: payload.totalAdvanceAmount ? Number(payload.totalAdvanceAmount) : null
    }
    const backendRes = await api.post('/payments', backendPayload)
    if (backendRes?.data) {
      return normalizeRecord(backendRes.data)
    }
  } catch (apiErr) {
    console.warn('[paymentService] Backend API /payments call unavailable or returned error, evaluating via Supabase fallback:', apiErr)
  }

  // 2. Supabase fallback
  const { data, error } = await supabase
    .from('payments')
    .insert({
      stakeholder_id: stakeholderId,
      billing_id: billingId,
      amount: payload.amount,
      payment_type: canonicalType,
      reference_no: payload.referenceNo || '',
      receipt_no: receiptNo,
      payment_date: payload.paymentDate || new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // 2a. If RENT_PAYMENT with billing, update billing status and balance
  if (billingId) {
    try {
      const { data: bData } = await supabase.from('billings').select('*').eq('id', billingId).single()
      if (bData) {
        const newPaid = Number(bData.paid_amount || 0) + Number(payload.amount || 0)
        const newBalance = Math.max(Number(bData.total_amount || 0) - newPaid, 0)
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'
        await supabase.from('billings').update({
          paid_amount: newPaid,
          balance: newBalance,
          status: newStatus
        }).eq('id', billingId)
      }
    } catch (bErr) {
      console.warn('[paymentService] Could not update billing balance:', bErr)
    }
  }

  // 2b. If ADVANCE_PAYMENT, update stakeholder advance balance
  if (payload.paymentType === 'ADVANCE_PAYMENT' && stakeholderId) {
    try {
      const { data: sData, error: sFetchErr } = await supabase.from('stakeholders').select('*').eq('id', stakeholderId).single()
      if (!sFetchErr && sData) {
        const curAdvance = Number(sData.advance_balance || 0)
        const newAdvance = curAdvance + Number(payload.amount || 0)
        const totalAdv = Number(payload.totalAdvanceAmount || sData.total_advance_amount || newAdvance)
        
        const updatePayload = {
          advance_balance: newAdvance,
          total_advance_amount: totalAdv,
          advance_payment_paid: newAdvance >= totalAdv,
          advance_payment_completed: newAdvance >= totalAdv
        }
        if (sData.advance_payment_amount !== undefined) {
          updatePayload.advance_payment_amount = newAdvance
        }
        if (sData.advance_payment_date !== undefined) {
          updatePayload.advance_payment_date = new Date().toISOString().split('T')[0]
        }

        const { error: sUpdateErr } = await supabase.from('stakeholders').update(updatePayload).eq('id', stakeholderId)
        if (sUpdateErr) {
          console.warn('[paymentService] Primary advance balance update failed, trying fallback:', sUpdateErr)
          await supabase.from('stakeholders').update({ advance_balance: newAdvance }).eq('id', stakeholderId)
        }

        // Non-blocking advance notification dispatch
        void (async () => {
          try {
            const { sendApplicationProgressNotification } = await import('./emailNotificationService')
            await sendApplicationProgressNotification({
              stakeholderId: Number(stakeholderId),
              stage: 'TREASURER',
              status: 'ADVANCE_PAID',
              title: 'Advance Rental Payment Recorded',
              message: `Your advance payment of ₱${Number(payload.amount || 0).toLocaleString()} has been officially credited. Your balance is ₱${newAdvance.toLocaleString()}. Your application has proceeded to Market Supervisor review.`,
              remarks: `Advance credit: ₱${newAdvance.toLocaleString()}`
            })
          } catch (eErr) {
            console.warn('[paymentService] Advance payment email dispatch warning:', eErr)
          }
        })()
      }
    } catch (sErr) {
      console.warn('[paymentService] Could not update stakeholder advance status:', sErr)
    }
  }

  // 2c. If APPLICATION_FEE, record payment details without premature client-side activation
  const isPermitOrAppPayment = ['APPLICATION_FORM', 'APPLICATION_FEE', 'BUSINESS_PERMIT_PAYMENT'].includes(payload.paymentType)
  if (isPermitOrAppPayment && stakeholderId) {
    try {
      const nowIso = new Date().toISOString()
      const todayDate = nowIso.split('T')[0]
      const amountVal = Number(payload.amount || 0)

      const updateData = {
        applicant_fee_paid: true,
        treasurer_paid: true,
        applicant_fee_amount: amountVal,
        applicant_fee_date: todayDate
      }
      await supabase.from('stakeholders').update(updateData).eq('id', stakeholderId)

      // Sync stakeholder_applications table if stakeholder_id or user_id exists
      try {
        await supabase.from('stakeholder_applications').update({
          amount_paid: amountVal,
          treasurer_receipt_no: receiptNo,
          treasurer_recorded_at: nowIso,
          status: 'PAID_READY_FOR_CONTRACT'
        }).eq('stakeholder_id', stakeholderId)
      } catch (appErr) {
        console.warn('[paymentService] Notice updating stakeholder_applications:', appErr)
      }

      // Trigger backend activation evaluation if API is available
      try {
        await api.post(`/contracts/stakeholder/${stakeholderId}/activate-if-eligible`)
      } catch (_) {}

      // Record in approval_history
      try {
        await supabase.from('approval_history').insert({
          stakeholder_id: Number(stakeholderId),
          stage: 'PERMIT_PAYMENT',
          status: 'COMPLETED',
          remarks: `Application fee / business permit recorded (₱${amountVal}).`
        })
      } catch (_) {}

      // Add notification for stakeholder
      // Non-blocking notification & email dispatch
      void (async () => {
        try {
          const { sendApplicationProgressNotification } = await import('./emailNotificationService')
          await sendApplicationProgressNotification({
            stakeholderId: Number(stakeholderId),
            userId: targetUserId,
            stage: 'PERMIT_PAYMENT',
            status: 'COMPLETED',
            title: 'Business Permit Fee Payment Recorded - Onboarding Complete',
            message: `Your business permit fee payment of ₱${amountVal.toLocaleString()} has been officially receipted. Your municipal stall onboarding is now complete and active!`,
            remarks: `Official Receipt on file. Permit fee: ₱${amountVal.toLocaleString()}`
          })
        } catch (eErr) {
          console.warn('[paymentService] Permit payment email dispatch warning:', eErr)
        }
      })()
    } catch (sErr) {
      console.warn('[paymentService] Could not update stakeholder application fee status:', sErr)
    }
  }

  return normalizeRecord(data)
}

export default {
  fetchPayments,
  createPayment
}
