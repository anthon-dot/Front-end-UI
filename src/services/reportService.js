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

// 1. Collection Report: Shows the rental payments collected by the Treasurer's Office
export function getCollectionReport(params = {}) {
  return api.get('/reports/collection', { params })
}

export function getDailyCollections(params = {}) {
  return api.get('/reports/daily-collections', { params })
}

// 2. Liability Report: Shows the rental obligations and unpaid balances of stakeholders
export function getLiabilityReport(params = {}) {
  return api.get('/reports/liability', { params })
}

export function getOutstandingBalances(params = {}) {
  return api.get('/reports/outstanding-balances', { params })
}

// 3. Stall Occupancy Report: Shows the occupancy and assignment of stalls in the public market
export function getStallOccupancyReport(params = {}) {
  return api.get('/reports/occupancy', { params })
}

// CSV Export Utility
export function exportToCsv(filename, headers, rows) {
  if (!rows || !rows.length) return
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const csvRows = []
  csvRows.push(headers.map(h => escapeCsv(h.label || h.title || h)).join(','))

  for (const row of rows) {
    const line = headers.map(h => {
      const key = h.key || h.field || h
      return escapeCsv(row[key])
    })
    csvRows.push(line.join(','))
  }

  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename || 'report'}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
