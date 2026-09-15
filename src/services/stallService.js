import api from './api'

/**
 * Fetch all stalls
 * @returns {Promise<Array>}
 */
export async function fetchStalls() {
  const response = await api.get('/stalls')
  return response.data
}

/**
 * Create a new stall
 * @param {Object} payload
 * @returns {Promise<any>}
 */
export async function createStall(payload) {
  const response = await api.post('/stalls', payload)
  return response.data
}

/**
 * Update an existing stall
 * @param {string|number} id
 * @param {Object} payload
 * @returns {Promise<any>}
 */
export async function updateStall(id, payload) {
  const response = await api.put(`/stalls/${id}`, payload)
  return response.data
}

/**
 * Upload an image for a stall
 * @param {FormData} formData
 * @returns {Promise<string>}
 */
export async function uploadStallImage(formData) {
  const response = await api.post('/stalls/upload', formData)
  return response.data
}

/**
 * Allocate occupant to stall
 * @param {string|number} stallId
 * @param {string|number} stakeholderId
 * @returns {Promise<any>}
 */
export async function allocateOccupant(stallId, stakeholderId) {
  const response = await api.post(`/occupants/allocate/${stallId}`, {
    stakeholderId
  })
  return response.data
}

export default {
  fetchStalls,
  createStall,
  updateStall,
  uploadStallImage,
  allocateOccupant
}
