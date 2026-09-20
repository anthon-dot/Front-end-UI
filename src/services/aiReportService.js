import { supabase } from '../config/supabase'
import api from './api'

export async function getAIReportSummary() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
}

export async function getPaymentAnalysis() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
}

export async function getOccupancyAnalysis() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
}

export async function getFinancialInsights() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
}

export async function getFinancialAnalysis() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
}

export async function getBillingAnalysis() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
}

export async function getContractAnalysis() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
}

export async function getStakeholderAnalysis() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
}

export async function getOccupancyReport() {
  const { data, error } = await supabase.functions.invoke('ai-insights/summary')
  if (error) throw error
  return { data }
}

export async function generateAIReport(reportTypeOrPrompt) {
  const prompt = typeof reportTypeOrPrompt === 'string' ? reportTypeOrPrompt : 'Generate comprehensive market management report'
  const { data, error } = await supabase.functions.invoke('ai-insights/generate', {
    body: { prompt }
  })
  if (error) throw error
  return { data }
}

export function exportAIReportPdf() {
  return Promise.resolve({ data: new Blob() })
}

export function exportAIReportExcel() {
  return Promise.resolve({ data: new Blob() })
}

export default {
  getAIReportSummary,
  getPaymentAnalysis,
  getOccupancyAnalysis,
  getFinancialInsights,
  getFinancialAnalysis,
  getBillingAnalysis,
  getContractAnalysis,
  getStakeholderAnalysis,
  getOccupancyReport,
  generateAIReport,
  exportAIReportPdf,
  exportAIReportExcel
}
