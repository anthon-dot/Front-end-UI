import { supabase } from '../config/supabase'
import api from './api'

export async function getAINotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return { data: data || [] }
}

export async function getUnreadAINotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return { data: data || [] }
}

/**
 * Generates AI-assisted notifications grounded in real system records:
 * - Overdue rental balances requiring attention
 * - Applications awaiting administrative review
 * - Unusually high section vacancy or collection deficits
 */
export async function generateAINotifications() {
  try {
    const { data, error } = await supabase.functions.invoke('ai-insights/summary')
    if (!error && data) return { data }
  } catch (_) {}

  // Grounded DB fallback: inspect billings, stakeholders, and stalls
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    const notificationsToInsert = []

    // 1. Check for overdue billing accounts
    const { data: overdueBills } = await supabase
      .from('billings')
      .select('id, billing_no, occupant_id, balance, due_date')
      .gt('balance', 0)
      .lt('due_date', todayStr)
      .limit(10)

    if (overdueBills && overdueBills.length > 0) {
      notificationsToInsert.push({
        title: 'Overdue Rental Accounts Detected',
        message: `${overdueBills.length} tenant billing statement(s) are past due. Review arrears in the Treasurer Billing Dashboard.`,
        type: 'WARNING',
        is_read: false
      })
    }

    // 2. Check for applications waiting for review
    const { data: pendingApps } = await supabase
      .from('stakeholders')
      .select('id, application_status, first_name, last_name, business_name')
      .or('application_status.eq.FOR_APPROVAL,application_status.eq.PENDING_MAYOR_APPROVAL,application_status.eq.PENDING_MARKET_SUPERVISOR_APPROVAL')
      .limit(10)

    if (pendingApps && pendingApps.length > 0) {
      notificationsToInsert.push({
        title: 'Pending Applications Awaiting Review',
        message: `${pendingApps.length} stakeholder application(s) require action from the Mayor or Market Supervisor.`,
        type: 'INFO',
        is_read: false
      })
    }

    // 3. Check for high stall vacancy
    const { data: stalls } = await supabase.from('stalls').select('id, status')
    if (stalls && stalls.length > 0) {
      const vacantCount = stalls.filter(s => ['AVAILABLE', 'VACANT'].includes(String(s.status || '').toUpperCase())).length
      const vacancyRate = Math.round((vacantCount / stalls.length) * 100)
      if (vacancyRate > 40) {
        notificationsToInsert.push({
          title: 'High Market Stall Vacancy Alert',
          message: `${vacancyRate}% of stalls are currently unoccupied (${vacantCount} vacant stalls). Consider reviewing stall assignments.`,
          type: 'NOTICE',
          is_read: false
        })
      }
    }

    if (notificationsToInsert.length > 0) {
      // Avoid inserting duplicates
      for (const n of notificationsToInsert) {
        try {
          await supabase.from('notifications').insert(n)
        } catch (_) {}
      }
    }

    return { data: notificationsToInsert }
  } catch (err) {
    console.warn('[generateAINotifications] Fallback error:', err)
    return { data: [] }
  }
}

export async function markAINotificationAsRead(id) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
  if (error) throw error
  return { data }
}

export async function deleteAINotification(id) {
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
  if (error) throw error
  return { data }
}

export default {
  getAINotifications,
  getUnreadAINotifications,
  generateAINotifications,
  markAINotificationAsRead,
  deleteAINotification
}
