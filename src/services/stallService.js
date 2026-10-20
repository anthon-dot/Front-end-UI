import api, { invalidateApiCache } from './api'
import { supabase } from '../config/supabase'

export async function fetchStalls() {
  try {
    const res = await api.get('/stalls')
    if (res && res.data) return res.data
  } catch (err) {
    console.warn('[stallService.fetchStalls] api fallback:', err)
  }
  const { data, error } = await supabase
    .from('stalls')
    .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
    .order('id', { ascending: true })

  if (error) throw error
  return data
}

export async function createStall(payload) {
  try {
    const res = await api.post('/stalls', payload)
    if (res && res.data) return res.data
  } catch (err) {
    console.warn('[stallService.createStall] api fallback:', err)
  }
  const { data, error } = await supabase
    .from('stalls')
    .insert({
      stall_no: payload.stallNo || payload.stall_no || payload.number,
      stall_type: payload.stallType || payload.stall_type || payload.type,
      monthly_rent: payload.monthlyRent || payload.monthly_rent || payload.rent,
      status: payload.status || 'AVAILABLE',
      image_url: payload.imageUrl || payload.image_url || null,
      info: payload.info || payload.section || null,
      latitude: payload.latitude ?? payload.lat ?? null,
      longitude: payload.longitude ?? payload.lng ?? null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStall(id, payload) {
  try {
    const res = await api.put(`/stalls/${id}`, payload)
    if (res && res.data) return res.data
  } catch (err) {
    console.warn('[stallService.updateStall] api fallback:', err)
  }
  const updateBody = {}
  if (payload.stallNo !== undefined || payload.number !== undefined) updateBody.stall_no = payload.stallNo || payload.number
  if (payload.stallType !== undefined || payload.type !== undefined) updateBody.stall_type = payload.stallType || payload.type
  if (payload.monthlyRent !== undefined || payload.rent !== undefined) updateBody.monthly_rent = payload.monthlyRent || payload.rent
  if (payload.status !== undefined) updateBody.status = payload.status
  if (payload.imageUrl !== undefined || payload.image_url !== undefined) updateBody.image_url = payload.imageUrl || payload.image_url
  if (payload.info !== undefined) updateBody.info = payload.info
  if (payload.latitude !== undefined || payload.lat !== undefined) updateBody.latitude = payload.latitude ?? payload.lat
  if (payload.longitude !== undefined || payload.lng !== undefined) updateBody.longitude = payload.longitude ?? payload.lng

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
  try {
    const res = await api.post('/stalls/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res && res.data) return res.data
  } catch (err) {
    console.warn('[stallService.uploadStallImage] api upload notice:', err)
  }
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
    const res = await api.post(`/occupants/allocate/${stallId}`, { stakeholderId })
    if (res && res.data) {
      invalidateApiCache('stalls|stakeholders|occupants|contracts|billings')
      return res.data
    }
  } catch (err) {
    console.warn('[stallService.allocateOccupant] api endpoint notice:', err)
  }

  try {
    const { data, error } = await supabase.functions.invoke('approval-workflow', {
      body: { action: 'assign-stall', stallId: Number(stallId), stakeholderId: Number(stakeholderId) }
    })
    if (!error && data && !data.error) {
      invalidateApiCache('stalls|stakeholders|occupants|contracts|billings')
      return data
    }
  } catch (e) {
    console.warn('Edge function allocateOccupant failed, attempting direct table update:', e)
  }

  // Direct DB fallback: assign in occupants table with ACTIVE status and update stall status
  try {
    let occupantId = null
    const { data: existingOcc } = await supabase
      .from('occupants')
      .select('id')
      .eq('stakeholder_id', Number(stakeholderId))
      .maybeSingle()

    if (existingOcc?.id) {
      occupantId = existingOcc.id
      await supabase
        .from('occupants')
        .update({
          status: 'ACTIVE',
          stall_id: Number(stallId),
          is_archived: false,
          occupancy_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', occupantId)
    } else {
      const { data: newOcc, error: newOccErr } = await supabase
        .from('occupants')
        .insert({
          stakeholder_id: Number(stakeholderId),
          stall_id: Number(stallId),
          status: 'ACTIVE',
          occupancy_date: new Date().toISOString().split('T')[0],
          is_archived: false
        })
        .select('id')
        .single()

      if (!newOccErr && newOcc?.id) {
        occupantId = newOcc.id
      }
    }

    if (occupantId) {
      await supabase
        .from('stalls')
        .update({ status: 'OCCUPIED', occupant_id: occupantId })
        .eq('id', Number(stallId))
    }

    await supabase
      .from('stakeholders')
      .update({
        selected_stall_id: Number(stallId),
        onboarding_status: 'STALL_ASSIGNED',
        market_approval_status: 'APPROVED',
        market_supervisor_approved: true
      })
      .eq('id', Number(stakeholderId))

    // Ensure contracts entry exists
    try {
      const { data: exCon } = await supabase.from('contracts').select('id').eq('occupant_id', occupantId).maybeSingle()
      if (!exCon?.id && occupantId) {
        await supabase.from('contracts').insert({
          occupant_id: occupantId,
          stall_id: Number(stallId),
          contract_no: `CON-${Date.now().toString().slice(-8)}`,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          billing_frequency: 'MONTHLY',
          status: 'ACTIVE'
        })
      }
    } catch (_) {}

    invalidateApiCache('stalls|stakeholders|occupants|contracts|billings')
    return { success: true, occupantId }
  } catch (e) {
    console.warn('Direct occupants sync note:', e)
  }

  await supabase
    .from('stalls')
    .update({ status: 'OCCUPIED' })
    .eq('id', Number(stallId))

  invalidateApiCache('stalls|stakeholders|occupants|contracts|billings')
  return { success: true }
}

export async function unassignOccupant(stallId) {
  try {
    const res = await api.put(`/occupants/vacate/${stallId}`)
    if (res && res.data) {
      invalidateApiCache('stalls|stakeholders|occupants|contracts|billings')
      return res.data
    }
  } catch (err) {
    console.warn('[stallService.unassignOccupant] api endpoint notice:', err)
  }

  try {
    const { data: st } = await supabase.from('stalls').select('occupant_id').eq('id', Number(stallId)).maybeSingle()
    if (st?.occupant_id) {
      await supabase.from('occupants').update({ status: 'VACATED', is_archived: true }).eq('id', st.occupant_id)
    }
    await supabase.from('stalls').update({ status: 'AVAILABLE', occupant_id: null }).eq('id', Number(stallId))
  } catch (e) {
    console.warn('Direct occupants update note:', e)
  }

  const { data, error } = await supabase
    .from('stalls')
    .update({ status: 'AVAILABLE', occupant_id: null })
    .eq('id', Number(stallId))
    .select()
    .single()

  invalidateApiCache('stalls|stakeholders|occupants|contracts|billings')
  if (error) throw error
  return data
}

export async function deleteStall(stallId) {
  try {
    const res = await api.delete(`/stalls/${stallId}`)
    if (res && res.data) return res.data
  } catch (err) {
    console.warn('[stallService.deleteStall] api endpoint notice:', err)
  }
  const { data, error } = await supabase
    .from('stalls')
    .delete()
    .eq('id', stallId)

  if (error) throw error
  return data
}

export async function archiveStall(stallId) {
  try {
    const res = await api.put(`/stalls/${stallId}`, { status: 'ARCHIVED', isArchived: true })
    if (res && res.data) return res.data
  } catch (err) {
    console.warn('[stallService.archiveStall] api fallback:', err)
  }
  const { data, error } = await supabase
    .from('stalls')
    .update({ status: 'ARCHIVED' })
    .eq('id', stallId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function restoreStall(stallId) {
  try {
    const res = await api.put(`/stalls/${stallId}`, { status: 'AVAILABLE', isArchived: false })
    if (res && res.data) return res.data
  } catch (err) {
    console.warn('[stallService.restoreStall] api fallback:', err)
  }
  const { data, error } = await supabase
    .from('stalls')
    .update({ status: 'AVAILABLE' })
    .eq('id', stallId)
    .select()
    .single()

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
  deleteStall,
  archiveStall,
  restoreStall
}
