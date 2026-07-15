import api from './api'

export function getStakeholderNotifications(stakeholderId) {
  return api.get(`/notifications/stakeholder/${stakeholderId}`)
}

export function getUnreadNotificationCount(stakeholderId) {
  return api.get(`/notifications/stakeholder/${stakeholderId}/unread-count`)
}

export function markNotificationAsRead(notificationId) {
  return api.put(`/notifications/${notificationId}/read`)
}

export function markAllNotificationsAsRead(stakeholderId) {
  return api.put(`/notifications/stakeholder/${stakeholderId}/read-all`)
}
