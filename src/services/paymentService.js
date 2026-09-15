import api from './api'

/**
 * Fetch all payments
 * @returns {Promise<Array>}
 */
export async function fetchPayments() {
  const response = await api.get('/payments')
  return response.data
}

/**
 * Record a new payment
 * @param {Object} payload
 * @returns {Promise<any>}
 */
export async function createPayment(payload) {
  const response = await api.post('/payments', payload)
  return response.data
}

export default {
  fetchPayments,
  createPayment
}
