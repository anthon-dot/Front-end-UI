import api from './api'

export function getAIReportSummary() {
  return api.get('/ai/reports/summary')
}

export function getPaymentAnalysis() {
  return api.get('/ai/reports/payment-analysis')
}

export function getOccupancyAnalysis() {
  return api.get('/ai/reports/occupancy-analysis')
}

export function getFinancialInsights() {
  return api.get('/ai/reports/financial-insights')
}

export function getFinancialAnalysis() {
  return api.get('/ai/reports/financial-analysis')
}

export function getBillingAnalysis() {
  return api.get('/ai/reports/billing-analysis')
}

export function getContractAnalysis() {
  return api.get('/ai/reports/contract-analysis')
}

export function getStakeholderAnalysis() {
  return api.get('/ai/reports/stakeholder-analysis')
}

export function getOccupancyReport() {
  return api.get('/ai/reports/occupancy-report')
}

export function generateAIReport(reportType) {
  return api.post('/ai/reports/generate', null, {
    params: { reportType }
  })
}

export function exportAIReportPdf() {
  return api.get('/reports/export/pdf', {
    responseType: 'blob'
  })
}

export function exportAIReportExcel() {
  return api.get('/reports/export/excel', {
    responseType: 'blob'
  })
}
