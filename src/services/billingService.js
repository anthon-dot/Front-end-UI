import { supabase } from '../config/supabase'

export async function fetchBillings() {
  const { data, error } = await supabase
    .from('billings')
    .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*)')
    .order('id', { ascending: false })

  if (error) throw error
  return data
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
        message: `Your billing invoice ${bill.billing_no} has a balance of PHP ${bill.balance} due on ${bill.due_date}.`,
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
  fetchBillings,
  sendBillingNotification
}
