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
 * Fetch active stall types
 */
export async function getStallTypes() {
  const { data, error } = await supabase
    .from('stall_types')
    .select('*')
    .eq('status', 'ACTIVE')

  if (error) throw error
  return data
}

/**
 * Submit a business application
 * @param {Object} applicationData
 */
export async function submitApplication(applicationData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to submit application')

  const { data, error } = await supabase
    .from('business_applications')
    .insert({
      user_id: user.id,
      business_name: applicationData.businessName,
      business_type: applicationData.businessType,
      first_name: applicationData.firstName,
      last_name: applicationData.lastName,
      contact: applicationData.contact,
      email: user.email,
      address: applicationData.address,
      selected_stall_id: applicationData.stallId
    })
    .select()
    .single()

  if (error) throw error
  return data
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
