import api from './api'

export async function getApplicationByUserId(userId) {
  try {
    const response = await api.get(`/applications/user/${userId}`)
    return response.data
  } catch (error) {
    if (error.response?.status === 404 || error.message?.includes('not found')) {
      return null
    }

    throw error
  }
}

export async function getStakeholderByUserId(userId) {
  try {
    const response = await api.get(`/stakeholders/user/${userId}`)
    return response.data || null
  } catch (error) {
    if (error.response?.status === 404 || error.message?.includes('not found')) {
      return null
    }

    throw error
  }
}

export async function getStakeholderRequirements(stakeholderId) {
  const response = await api.get(`/stakeholders/${stakeholderId}/requirements`)
  return response.data
}

export async function getApplications() {
  const response = await api.get('/applications')
  return response.data
}

export async function endorseApplication(id) {
  const response = await api.put(`/applications/${id}/endorse`)
  return response.data
}

export async function rejectEndorsement(id, remarks = '') {
  const response = await api.put(`/applications/${id}/endorse-reject`, null, {
    params: { remarks }
  })
  return response.data
}

export async function approveByBPLO(id) {
  const response = await api.put(`/applications/${id}/bplo-approve`)
  return response.data
}

export async function rejectByBPLO(id, remarks = '') {
  const response = await api.put(`/applications/${id}/bplo-reject`, null, {
    params: { remarks }
  })
  return response.data
}

export function isDashboardReady(stakeholder, requirements = null) {
  return stakeholder?.applicantFeePaid === true &&
    stakeholder?.applicationStatus === 'COMPLETED' &&
    (stakeholder?.verified === true ||
      stakeholder?.verifiedStakeholder === true ||
      stakeholder?.verifiedTenant === true)
}

export function getStakeholderRouteForApplication(application) {
  if (!application) {
    return '/business-application'
  }

  if (application.applicantFeePaid === true && application.applicationStatus === 'COMPLETED') {
    return '/stakeholder'
  }

  if (
    application.applicationStatus === 'PENDING_BUSINESS_PERMIT_PAYMENT'
  ) {
    return '/applicant-fee'
  }

  return '/application-progress'
}
