import { supabase } from '../config/supabase'

export async function fetchPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('*, stakeholder:stakeholders(*), billing:billings(*)')
    .order('id', { ascending: false })

  if (error) throw error
  return data
}

export async function createPayment(payload) {
  const receiptNo = payload.receiptNo || payload.receipt_no || `OR-${Date.now().toString().slice(-8)}`
  const stakeholderId = payload.stakeholderId || payload.stakeholder?.id
  const billingId = payload.billingId || payload.billing?.id || null

  const { data, error } = await supabase
    .from('payments')
    .insert({
      stakeholder_id: stakeholderId,
      billing_id: billingId,
      amount: payload.amount,
      payment_type: payload.paymentType || 'RENT_PAYMENT',
      reference_no: payload.referenceNo || '',
      receipt_no: receiptNo,
      payment_date: payload.paymentDate || new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // 1. If RENT_PAYMENT with billing, update billing status and balance
  if (billingId) {
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
  }

  // 2. If ADVANCE_PAYMENT, update stakeholder advance balance
  if (payload.paymentType === 'ADVANCE_PAYMENT' && stakeholderId) {
    const { data: sData } = await supabase.from('stakeholders').select('*').eq('id', stakeholderId).single()
    if (sData) {
      const curAdvance = Number(sData.advance_balance || 0)
      const newAdvance = curAdvance + Number(payload.amount || 0)
      const totalAdv = Number(payload.totalAdvanceAmount || sData.total_advance_amount || newAdvance)
      await supabase.from('stakeholders').update({
        advance_balance: newAdvance,
        advance_payment_amount: newAdvance,
        total_advance_amount: totalAdv,
        advance_payment_paid: newAdvance >= totalAdv,
        advance_payment_completed: newAdvance >= totalAdv,
        advance_payment_date: new Date().toISOString().split('T')[0]
      }).eq('id', stakeholderId)
    }
  }

  // 3. If APPLICATION_FORM, update stakeholder application fee status
  if (payload.paymentType === 'APPLICATION_FORM' && stakeholderId) {
    await supabase.from('stakeholders').update({
      application_form_paid: true,
      application_fee_paid: true
    }).eq('id', stakeholderId)
  }

  return data
}

export default {
  fetchPayments,
  createPayment
}
