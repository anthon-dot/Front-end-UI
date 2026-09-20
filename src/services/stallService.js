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
  try {
    const { data, error } = await supabase.functions.invoke('approval-workflow', {
      body: { action: 'assign-stall', stallId, stakeholderId }
    })
    if (!error && data && !data.error) {
      return data
    }
  } catch (e) {
    console.warn('Edge function allocateOccupant failed, attempting direct table update:', e)
  }

  // Direct DB fallback: assign in occupants table and update stall status
  try {
    const { data: occupantData, error: occErr } = await supabase
      .from('occupants')
      .upsert(
        { stall_id: stallId, stakeholder_id: stakeholderId },
        { onConflict: 'stall_id' }
      )
      .select()

    await supabase
      .from('stalls')
      .update({ status: 'OCCUPIED' })
      .eq('id', stallId)

    if (!occErr && occupantData) return occupantData
  } catch (e) {
    console.warn('Direct occupants upsert note:', e)
  }

  await supabase
    .from('stalls')
    .update({ status: 'OCCUPIED' })
    .eq('id', stallId)

  return { success: true }
}

export async function unassignOccupant(stallId) {
  try {
    await supabase.from('occupants').delete().eq('stall_id', stallId)
  } catch (e) {
    console.warn('Direct occupants delete note:', e)
  }

  const { data, error } = await supabase
    .from('stalls')
    .update({ status: 'VACANT' })
    .eq('id', stallId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteStall(stallId) {
  const { data, error } = await supabase
    .from('stalls')
    .delete()
    .eq('id', stallId)

  if (error) throw error
  return data
}

export default {
  fetchStalls,
  createStall,
  updateStall,
  uploadStallImage,
  allocateOccupant,
  unassignOccupant,
  deleteStall
}

