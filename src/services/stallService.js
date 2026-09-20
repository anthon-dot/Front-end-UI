import { supabase } from '../config/supabase'

export async function fetchStalls() {
  const { data, error } = await supabase
    .from('stalls')
    .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
    .order('id', { ascending: true })

  if (error) throw error
  return data
}

export async function createStall(payload) {
  const { data, error } = await supabase
    .from('stalls')
    .insert({
      stall_no: payload.stallNo,
      stall_type: payload.stallType,
      monthly_rent: payload.monthlyRent,
      status: payload.status || 'AVAILABLE',
      image_url: payload.imageUrl || null,
      info: payload.info || null,
      latitude: payload.latitude || null,
      longitude: payload.longitude || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStall(id, payload) {
  const updateBody = {}
  if (payload.stallNo !== undefined) updateBody.stall_no = payload.stallNo
  if (payload.stallType !== undefined) updateBody.stall_type = payload.stallType
  if (payload.monthlyRent !== undefined) updateBody.monthly_rent = payload.monthlyRent
  if (payload.status !== undefined) updateBody.status = payload.status
  if (payload.imageUrl !== undefined) updateBody.image_url = payload.imageUrl
  if (payload.info !== undefined) updateBody.info = payload.info
  if (payload.latitude !== undefined) updateBody.latitude = payload.latitude
  if (payload.longitude !== undefined) updateBody.longitude = payload.longitude

  const { data, error } = await supabase
    .from('stalls')
    .update(updateBody)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadStallImage(formData) {
  const file = formData.get('file') || formData.get('image')
  if (!file) throw new Error('No image file provided')

  const fileName = `stalls/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`
  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function allocateOccupant(stallId, stakeholderId) {
  const { data, error } = await supabase.functions.invoke('approval-workflow/assign-stall', {
    body: { stallId, stakeholderId }
  })

  if (error) throw error
  return data
}

export default {
  fetchStalls,
  createStall,
  updateStall,
  uploadStallImage,
  allocateOccupant
}
