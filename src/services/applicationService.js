import { supabase } from '../config/supabase'

export async function getApplicationByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from('business_applications')
      .select('*, stall:stalls(*)')
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (error) {
    return null
  }
}

export async function getStakeholderByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*, occupant:occupants(*, stall:stalls(*))')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data || null
  } catch (error) {
    return null
  }
}

export async function getStakeholderRequirements(stakeholderId) {
  const { data, error } = await supabase
    .from('stakeholder_documents')
    .select('*')
    .eq('stakeholder_id', stakeholderId)

  if (error) throw error
  return data || []
}

export async function getApplications() {
  const { data, error } = await supabase
    .from('business_applications')
    .select('*, stall:stalls(*)')
    .order('id', { ascending: false })

  if (error) throw error
  return data
}

export async function endorseApplication(id) {
  const { data, error } = await supabase.functions.invoke('approval-workflow/final-endorse', {
    body: { stakeholderId: id }
  })
  if (error) throw error
  return data
}

export async function rejectEndorsement(id, remarks = '') {
  const { data, error } = await supabase.functions.invoke('approval-workflow/reject', {
    body: { stakeholderId: id, stage: 'ENDORSEMENT', remarks }
  })
  if (error) throw error
  return data
}

export async function approveByBPLO(id) {
  const { data, error } = await supabase.functions.invoke('approval-workflow/bplo-approve', {
    body: { stakeholderId: id }
  })
  if (error) throw error
  return data
}

export async function rejectByBPLO(id, remarks = '') {
  const { data, error } = await supabase.functions.invoke('approval-workflow/reject', {
    body: { stakeholderId: id, stage: 'BPLO', remarks }
  })
  if (error) throw error
  return data
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

  if (application.applicationStatus === 'PENDING_BUSINESS_PERMIT_PAYMENT') {
    return '/applicant-fee'
  }

  return '/application-progress'
}

export default {
  getApplicationByUserId,
  getStakeholderByUserId,
  getStakeholderRequirements,
  getApplications,
  endorseApplication,
  rejectEndorsement,
  approveByBPLO,
  rejectByBPLO,
  isDashboardReady,
  getStakeholderRouteForApplication
}
