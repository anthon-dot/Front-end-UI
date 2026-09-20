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
  const receiptNo = payload.receiptNo || `RCP-${Date.now().toString().slice(-8)}`

  const { data, error } = await supabase
    .from('payments')
    .insert({
      stakeholder_id: payload.stakeholderId,
      billing_id: payload.billingId || null,
      amount: payload.amount,
      payment_type: payload.paymentType || 'RENT_PAYMENT',
      reference_no: payload.referenceNo || '',
      receipt_no: receiptNo,
      payment_date: payload.paymentDate || new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export default {
  fetchPayments,
  createPayment
}
