import { supabase } from '../config/supabase'
import { normalizeRecord } from './api'

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

  const canonicalType = ['APPLICATION_FORM', 'APPLICATION_FEE', 'BUSINESS_PERMIT_PAYMENT'].includes(payload.paymentType)
    ? 'BUSINESS_PERMIT_PAYMENT'
    : (payload.paymentType || 'RENT_PAYMENT')

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

  // 1. If RENT_PAYMENT with billing, update billing status and balance
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

  // 2. If ADVANCE_PAYMENT, update stakeholder advance balance
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
      }
    } catch (sErr) {
      console.warn('[paymentService] Could not update stakeholder advance status:', sErr)
    }
  }

  // 3. If BUSINESS_PERMIT_PAYMENT or APPLICATION_FORM / APPLICATION_FEE, update stakeholder permit & fee status
  const isPermitOrAppPayment = ['APPLICATION_FORM', 'APPLICATION_FEE', 'BUSINESS_PERMIT_PAYMENT'].includes(payload.paymentType)
  const isBusinessPermitPayment = payload.paymentType === 'BUSINESS_PERMIT_PAYMENT'

  if (isPermitOrAppPayment && stakeholderId) {
    try {
      const nowIso = new Date().toISOString()
      const todayDate = nowIso.split('T')[0]
      const amountVal = Number(payload.amount || 0)

      const updateData = {
        application_form_paid: true,
        applicant_fee_paid: true,
        treasurer_paid: true,
        applicant_fee_amount: amountVal,
        applicant_fee_date: todayDate,
        verified_stakeholder: true,
        verification_date: nowIso
      }

      if (isBusinessPermitPayment) {
        updateData.verified_tenant = true
        updateData.verified = true
        updateData.application_status = 'COMPLETED'
        updateData.onboarding_status = 'COMPLETED'
        updateData.final_status = 'APPROVED'
      }

      const { data: sData } = await supabase.from('stakeholders').select('*').eq('id', stakeholderId).maybeSingle()

      const { error: feeErr } = await supabase.from('stakeholders').update(updateData).eq('id', stakeholderId)
      if (feeErr) {
        console.warn('[paymentService] Primary permit update failed, trying fallback:', feeErr)
        const fallbackData = {
          application_form_paid: true,
          applicant_fee_paid: true,
          treasurer_paid: true
        }
        if (isBusinessPermitPayment) {
          fallbackData.verified_tenant = true
          fallbackData.verified_stakeholder = true
          fallbackData.verified = true
          fallbackData.application_status = 'COMPLETED'
        }
        await supabase.from('stakeholders').update(fallbackData).eq('id', stakeholderId)
      }

      // Sync business_applications table if user_id exists
      const targetUserId = sData?.user_id || payload.userId || payload.user_id
      if (targetUserId) {
        try {
          const appUpdateData = {
            applicant_fee_paid: true,
            application_form_paid: true,
            applicant_fee_amount: amountVal,
            applicant_fee_date: todayDate,
            verified_stakeholder: true
          }
          if (isBusinessPermitPayment) {
            appUpdateData.application_status = 'COMPLETED'
            appUpdateData.final_status = 'APPROVED'
            appUpdateData.verified_tenant = true
          }
          await supabase.from('business_applications').update(appUpdateData).eq('user_id', targetUserId)
        } catch (appErr) {
          console.warn('[paymentService] Could not update business_applications:', appErr)
        }
      }

      // Only activate occupant & contract on final business permit payment
      if (isBusinessPermitPayment) {
        try {
          const { data: occ } = await supabase.from('occupants').select('*').eq('stakeholder_id', stakeholderId).maybeSingle()
          if (occ) {
            await supabase.from('occupants').update({
              status: 'ACTIVE',
              occupancy_date: occ.occupancy_date || todayDate
            }).eq('id', occ.id)

            if (occ.contract_id) {
              await supabase.from('contracts').update({ status: 'ACTIVE' }).eq('id', occ.contract_id)
            }
          }
        } catch (occErr) {
          console.warn('[paymentService] Could not activate occupant/contract:', occErr)
        }
      }

      // Record in approval_history
      try {
        await supabase.from('approval_history').insert({
          stakeholder_id: Number(stakeholderId),
          stage: 'PERMIT_PAYMENT',
          status: 'COMPLETED',
          remarks: `Business permit / application fee recorded (₱${amountVal}). Tenant directly verified.`
        })
      } catch (_) {}

      // Add notification for stakeholder
      try {
        await supabase.from('notifications').insert({
          stakeholder_id: Number(stakeholderId),
          title: 'Tenant Verified',
          message: 'Your business permit / application fee has been recorded. Your stakeholder account is now verified!'
        })
      } catch (_) {}
    } catch (sErr) {
      console.warn('[paymentService] Could not update stakeholder application fee status:', sErr)
    }
  }

  return data
}

export default {
  fetchPayments,
  createPayment
}
