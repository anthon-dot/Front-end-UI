import { supabase } from '../config/supabase'

export async function getAdminUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createUser(payload) {
  const cleanUsername = String(payload.username || '').trim()
  if (!cleanUsername) {
    throw new Error('Username is required')
  }
  if (!payload.password) {
    throw new Error('Password is required (min 6 characters)')
  }

  // Invoke approval-workflow Edge Function:
  // 1. Keeps admin's active session intact (no sign-out)
  // 2. Confirms email automatically (no SMTP limits)
  // 3. Creates profile directly with assigned role and status
  const { data, error } = await supabase.functions.invoke('approval-workflow', {
    body: {
      action: 'register',
      username: cleanUsername,
      password: payload.password,
      name: payload.name || cleanUsername,
      role: payload.role || 'STAKEHOLDER',
      status: payload.status || 'ACTIVE'
    }
  })

  if (error || data?.error) {
    throw new Error(error?.message || data?.error || 'Failed to create user')
  }

  return { data: data.user }
}

export async function updateUser(id, payload) {
  const updates = {
    name: payload.name,
    role: payload.role,
    status: payload.status
  }
  if (payload.username) updates.username = payload.username

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // If a new password was specified, update it via Edge Function
  if (payload.password && String(payload.password).trim().length >= 6) {
    await supabase.functions.invoke('approval-workflow', {
      body: {
        action: 'update-password',
        userId: id,
        newPassword: String(payload.password).trim()
      }
    })
  }

  return { data }
}

export async function activateUser(id) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'ACTIVE' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return { data }
}

export async function disableUser(id) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'DISABLED' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return { data }
}

export async function resetUserPassword(id, newPassword = 'Password@123') {
  const { data, error } = await supabase.functions.invoke('approval-workflow', {
    body: {
      action: 'update-password',
      userId: id,
      newPassword
    }
  })

  if (error || data?.error) {
    throw new Error(error?.message || data?.error || 'Failed to reset password')
  }

  return { data: { success: true, message: `Password reset to ${newPassword}` } }
}

export async function getLoginHistory() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .ilike('action', '%LOGIN%')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function getAuditLogs() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function getRentalRates() {
  const { data, error } = await supabase
    .from('rental_rates')
    .select('*')
    .order('id', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createRentalRate(payload) {
  const { data, error } = await supabase
    .from('rental_rates')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return { data }
}

export async function updateRentalRate(id, payload) {
  const { data, error } = await supabase
    .from('rental_rates')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return { data }
}

export async function deleteRentalRate(id) {
  const { data, error } = await supabase
    .from('rental_rates')
    .delete()
    .eq('id', id)

  if (error) throw error
  return { data }
}

export async function getStallTypes() {
  const { data, error } = await supabase
    .from('stall_types')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createStallType(payload) {
  const { data, error } = await supabase
    .from('stall_types')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return { data }
}

export async function updateStallType(id, payload) {
  const { data, error } = await supabase
    .from('stall_types')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return { data }
}

export async function deleteStallType(id) {
  const { data, error } = await supabase
    .from('stall_types')
    .delete()
    .eq('id', id)

  if (error) throw error
  return { data }
}

export async function getSystemSettings() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) throw error
  return data
}

export async function updateSystemSettings(payload) {
  const { data, error } = await supabase
    .from('system_settings')
    .update(payload)
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error
  return { data }
}

export default {
  getAdminUsers,
  createUser,
  updateUser,
  activateUser,
  disableUser,
  resetUserPassword,
  getLoginHistory,
  getAuditLogs,
  getNotifications,
  getRentalRates,
  createRentalRate,
  updateRentalRate,
  deleteRentalRate,
  getStallTypes,
  createStallType,
  updateStallType,
  deleteStallType,
  getSystemSettings,
  updateSystemSettings,
  updateSettings
}

export function updateSettings(payload) {
  return updateSystemSettings(payload)
}
