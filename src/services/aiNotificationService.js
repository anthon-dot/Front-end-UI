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

export async function generateAINotifications() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
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
