import api from './api'

export function getAINotifications() {
  return api.get('/notifications')
}

export function getUnreadAINotifications() {
  return api.get('/ai/notifications/unread')
}

export function generateAINotifications() {
  return api.post('/ai/notifications/generate')
}

export function markAINotificationAsRead(id) {
  return api.put(`/ai/notifications/${id}/read`)
}

export function deleteAINotification(id) {
  return api.delete(`/ai/notifications/${id}`)
}
