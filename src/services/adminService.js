import api from './api'

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminUsers() {
  const response = await api.get('/admin/users')
  return response.data
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

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export async function getLoginHistory() {
  const response = await api.get('/admin/login-history')
  return response.data
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuditLogs() {
  const response = await api.get('/audit-logs')
  return response.data
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotifications() {
  const response = await api.get('/notifications')
  return response.data
}

// ─────────────────────────────────────────────────────────────────────────────
// RENTAL RATES
// ─────────────────────────────────────────────────────────────────────────────

export async function getRentalRates() {
  const response = await api.get('/admin/rental-rates')
  return response.data
}

export function createRentalRate(payload) {
  return api.post('/admin/rental-rates', payload)
}

export function updateRentalRate(id, payload) {
  return api.put(`/admin/rental-rates/${id}`, payload)
}

// ─────────────────────────────────────────────────────────────────────────────
// STALL TYPES
// ─────────────────────────────────────────────────────────────────────────────

export async function getStallTypes() {
  const response = await api.get('/admin/stall-types')
  return response.data
}

export function createStallType(payload) {
  return api.post('/admin/stall-types', payload)
}

export function updateStallType(id, payload) {
  return api.put(`/admin/stall-types/${id}`, payload)
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export async function getSystemSettings() {
  const response = await api.get('/admin/settings')
  return response.data
}

export function updateSettings(payload) {
  return api.put('/admin/settings', payload)
}

export default api
