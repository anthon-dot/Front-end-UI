import api from './api'

/**
 * Fetch all billing records
 * @returns {Promise<Array>}
 */
export async function fetchBillings() {
  const response = await api.get('/billings')
  return response.data
}

/**
 * Send notification for a specific billing record
 * @param {string|number} billingId
 * @returns {Promise<any>}
 */
export async function sendBillingNotification(billingId) {
  const response = await api.post(`/billings/notify/${billingId}`)
  return response.data
}

export default {
  fetchBillings,
  sendBillingNotification
}
