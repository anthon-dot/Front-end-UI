import api from './api'

export function getReports() {
  return api.get('/reports')
}

export function getReport(id) {
  return api.get(`/reports/${id}`)
}

export function createReport(payload) {
  return api.post('/reports', payload)
}

export function updateReport(id, payload) {
  return api.put(`/reports/${id}`, payload)
}

export function deleteReport(id) {
  return api.delete(`/reports/${id}`)
}
