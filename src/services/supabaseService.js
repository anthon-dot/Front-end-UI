import { supabase } from '../supabaseClient'

/**
 * Register a new user using Supabase Auth
 * @param {string} email
 * @param {string} password
 * @param {string} username
 * @param {string} fullName
 * @param {string} role (defaults to 'USER')
 */
export async function registerUser(email, password, username, fullName, role = 'USER') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        name: fullName,
        role
      }
    }
  })
  if (error) throw error
  return data
}

/**
 * Sign in a user with email and password
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get profile of currently authenticated user
 */
export async function getCurrentProfile() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return profile
}

/**
 * Fetch all available stalls
 */
export async function getAvailableStalls() {
  const { data, error } = await supabase
    .from('stalls')
    .select('*')
    .eq('status', 'AVAILABLE')
    .order('stall_no', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Fetch active stall types (from authoritative rental_rates table)
 */
export async function getStallTypes() {
  const { data, error } = await supabase
    .from('rental_rates')
    .select('*')
    .eq('is_active', true)
    .order('stall_type', { ascending: true })

  if (error) throw error
  return (data || []).map(r => ({
    ...r,
    id: r.id,
    name: r.stall_type,
    type: r.stall_type,
    stallType: r.stall_type,
    rate: Number(r.base_monthly_rate || 0),
    monthlyRate: Number(r.base_monthly_rate || 0),
    monthly_rent: Number(r.base_monthly_rate || 0),
    stallRightsFee: Number(r.stall_rights_fee || 5000),
    advanceMonths: Number(r.advance_months || 2),
    status: r.is_active ? 'ACTIVE' : 'INACTIVE'
  }))
}

/**
 * Submit a business application
 * @param {Object} applicationData
 */
export async function submitApplication(applicationData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to submit application')

  const stallId = applicationData.stallId || applicationData.selected_stall_id || null

  // 1. Fetch stall details for financial calculations
  let monthlyRent = 1500
  let stallRightsFee = 5000
  if (stallId) {
    const { data: stall } = await supabase.from('stalls').select('*').eq('id', Number(stallId)).maybeSingle()
    if (stall) {
      monthlyRent = Number(stall.monthly_rent || 1500)
      stallRightsFee = Number(stall.stall_rights_fee || 5000)
    }
  }

  const advanceRent = monthlyRent * 2
  const totalInitial = advanceRent + stallRightsFee

  // 2. Upsert master stakeholder record
  let stakeholder = null
  const { data: exSh } = await supabase
    .from('stakeholders')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const stakeholderPayload = {
    user_id: user.id,
    business_name: applicationData.businessName || applicationData.business_name || 'My Business',
    business_type: applicationData.businessType || applicationData.business_type || 'Retail',
    first_name: applicationData.firstName || applicationData.first_name || '',
    middle_name: applicationData.middleName || applicationData.middle_name || null,
    last_name: applicationData.lastName || applicationData.last_name || '',
    contact: applicationData.contact || applicationData.phone || '',
    email: user.email,
    address: applicationData.address || '',
    selected_stall_id: stallId ? Number(stallId) : null,
    total_advance_amount: advanceRent,
    application_status: 'PENDING'
  }

  if (exSh?.id) {
    const { data: updSh, error: updErr } = await supabase
      .from('stakeholders')
      .update(stakeholderPayload)
      .eq('id', exSh.id)
      .select()
      .single()
    if (updErr) throw updErr
    stakeholder = updSh
  } else {
    const { data: newSh, error: newErr } = await supabase
      .from('stakeholders')
      .insert(stakeholderPayload)
      .select()
      .single()
    if (newErr) throw newErr
    stakeholder = newSh
  }

  // 3. Insert formal stakeholder application
  const appNo = `APP-${Date.now().toString().slice(-6)}`
  const { data: newApp, error: appErr } = await supabase
    .from('stakeholder_applications')
    .insert({
      application_no: appNo,
      stakeholder_id: stakeholder.id,
      user_id: user.id,
      stall_id: stallId ? Number(stallId) : 1,
      status: 'PENDING_SUPERVISOR_REVIEW',
      current_holding_office: 'Market Supervisor',
      calculated_stall_rights_fee: stallRightsFee,
      calculated_advance_rent: advanceRent,
      total_initial_amount_due: totalInitial,
      amount_paid: 0
    })
    .select('*, stall:stalls(*), stakeholder:stakeholders(*)')
    .single()

  if (appErr) throw appErr

  // 4. Reserve stall
  if (stallId) {
    await supabase.from('stalls').update({ status: 'RESERVED' }).eq('id', Number(stallId))
  }

  // 5. Log approval history stage
  try {
    await supabase.from('approval_history').insert({
      stakeholder_id: stakeholder.id,
      application_id: newApp.id,
      stage: 'APPLICATION_SUBMITTED',
      status: 'PENDING',
      action_by: user.id,
      actor_name: `${applicationData.firstName || ''} ${applicationData.lastName || ''}`.trim() || 'Applicant',
      actor_role: 'APPLICANT',
      remarks: 'Application submitted online'
    })
  } catch (_) {}

  return {
    ...newApp,
    business_name: stakeholder.business_name,
    business_type: stakeholder.business_type,
    first_name: stakeholder.first_name,
    last_name: stakeholder.last_name,
    contact: stakeholder.contact,
    email: stakeholder.email,
    address: stakeholder.address,
    selected_stall_id: stakeholder.selected_stall_id
  }
}

/**
 * Upload a document to Supabase Storage 'uploads' bucket and save reference to stakeholder_documents
 * @param {File} file
 * @param {string|number} stakeholderId
 * @param {string} documentType
 */
export async function uploadStakeholderDocument(file, stakeholderId, documentType) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${stakeholderId}_${Date.now()}.${fileExt}`
  const filePath = `documents/${fileName}`

  // 1. Upload to Supabase Storage bucket 'uploads'
  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath)

  // 3. Save reference in stakeholder_documents table
  const { data, error: dbError } = await supabase
    .from('stakeholder_documents')
    .insert({
      stakeholder_id: stakeholderId,
      document_type: documentType,
      file_name: file.name,
      file_path: publicUrl
    })
    .select()
    .single()

  if (dbError) throw dbError
  return data
}

/**
 * Subscribe to realtime notifications for a stakeholder
 * @param {string|number} stakeholderId
 * @param {Function} onNewNotification
 */
export function subscribeToNotifications(stakeholderId, onNewNotification) {
  return supabase
    .channel(`notifications-${stakeholderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `stakeholder_id=eq.${stakeholderId}`
      },
      (payload) => {
        onNewNotification(payload.new)
      }
    )
    .subscribe()
}

/**
 * Trigger Supabase Edge Function for approval workflow
 * @param {string|number} stakeholderId
 * @param {string} stage
 * @param {string} status
 * @param {string} remarks
 */
export async function approveStage(stakeholderId, stage, status, remarks) {
  const { data, error } = await supabase.functions.invoke('approval-workflow', {
    body: {
      stakeholderId,
      stage,
      status,
      remarks
    }
  })

  if (error) throw error
  return data
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentProfile,
  getAvailableStalls,
  getStallTypes,
  submitApplication,
  uploadStakeholderDocument,
  subscribeToNotifications,
  approveStage
}
