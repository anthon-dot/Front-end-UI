import { supabase } from '../config/supabase'

export async function getStakeholderNotifications(stakeholderId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('stakeholder_id', stakeholderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return { data }
}

export async function getUnreadNotificationCount(stakeholderId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('stakeholder_id', stakeholderId)
    .eq('is_read', false)

  if (error) throw error
  return { data: count || 0 }
}

export async function markNotificationAsRead(notificationId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()

  if (error) throw error
  return { data }
}

export async function markAllNotificationsAsRead(stakeholderId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('stakeholder_id', stakeholderId)
    .select()

  if (error) throw error
  return { data }
}

export function subscribeToNotifications(stakeholderId, callback) {
  return supabase
    .channel(`realtime-notifications-${stakeholderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `stakeholder_id=eq.${stakeholderId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}

export default {
  getStakeholderNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications
}
