import api from './api'

async function firstSuccessful(paths, fallback = []) {
  let lastError = null

  for (const path of paths) {
    try {
      const response = await api.get(path)
      return response.data ?? fallback
    } catch (error) {
      lastError = error
    }
  }

  if (lastError?.response?.status === 404) {
    return fallback
  }

  return fallback
}

export function getAdminUsers() {
  return firstSuccessful(['/admin/users', '/users', '/auth/users'])
}

export function getLoginHistory() {
  return firstSuccessful(['/admin/login-history', '/login-history', '/auth/login-history'])
}

export function getAuditLogs() {
  return firstSuccessful(['/admin/audit-logs', '/audit-logs'])
}

export function getSystemSettings() {
  return firstSuccessful(['/admin/settings', '/settings'], {})
}

export function getNotifications() {
  return firstSuccessful(['/notifications', '/admin/notifications'])
}

export function getRentalRates() {
  return firstSuccessful(['/rental-rates', '/admin/rental-rates'])
}

export function getStallTypes() {
  return firstSuccessful(['/stall-types', '/admin/stall-types'])
}

export function createUser(payload) {
  return api.post('/auth/register', payload)
}

export function updateUser(id, payload) {
  return api.put(`/admin/users/${id}`, payload)
}

export function activateUser(id) {
  return api.put(`/admin/users/${id}/activate`)
}

export function disableUser(id) {
  return api.put(`/admin/users/${id}/disable`)
}

export function resetUserPassword(id) {
  return api.put(`/admin/users/${id}/reset-password`)
}

export function updateSettings(payload) {
  return api.put('/admin/settings', payload)
}

export default api
