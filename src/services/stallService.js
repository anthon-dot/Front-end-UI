import api, { invalidateApiCache, normalizeRecord } from './api'
import { supabase } from '../config/supabase'

export async function fetchStalls() {
  try {
    // 1. Try natural embedding
    const res = await supabase
      .from('stalls')
      .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
      .order('id', { ascending: true })

    if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((st) => {
        const norm = normalizeRecord(st)
        if (st.map_coordinates && typeof st.map_coordinates === 'object' && st.map_coordinates.imageUrl) {
          norm.imageUrl = st.map_coordinates.imageUrl
          norm.image_url = st.map_coordinates.imageUrl
        }
        return norm
      })
    }
  } catch (_) {}

  try {
    // 2. Try with named foreign key constraint if defined
    const res = await supabase
      .from('stalls')
      .select('*, occupant:occupants!fk_stalls_occupant(*, stakeholder:stakeholders(*))')
      .order('id', { ascending: true })

    if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((st) => {
        const norm = normalizeRecord(st)
        if (st.map_coordinates && typeof st.map_coordinates === 'object' && st.map_coordinates.imageUrl) {
          norm.imageUrl = st.map_coordinates.imageUrl
          norm.image_url = st.map_coordinates.imageUrl
        }
        return norm
      })
    }
  } catch (_) {}

  try {
    // 3. Fallback: Direct select on stalls without embedding
    const res = await supabase
      .from('stalls')
      .select('*')
      .order('id', { ascending: true })

    if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map(normalizeRecord)
    }
  } catch (_) {}

  // 4. Fallback baseline if DB is empty or tables not migrated yet
  return [
    { id: 1, stallNo: 'A-01', stall_no: 'A-01', stallType: 'Wet Market Section', stall_type: 'Wet Market Section', monthlyRent: 1800, monthly_rent: 1800, status: 'AVAILABLE', section: 'Wet Market (Fish & Meat)' },
    { id: 2, stallNo: 'A-02', stall_no: 'A-02', stallType: 'Wet Market Section', stall_type: 'Wet Market Section', monthlyRent: 1800, monthly_rent: 1800, status: 'AVAILABLE', section: 'Wet Market (Fish & Meat)' },
    { id: 3, stallNo: 'B-01', stall_no: 'B-01', stallType: 'Dry Goods Section', stall_type: 'Dry Goods Section', monthlyRent: 2300, monthly_rent: 2300, status: 'AVAILABLE', section: 'Dry Goods & Groceries' },
    { id: 4, stallNo: 'B-02', stall_no: 'B-02', stallType: 'Dry Goods Section', stall_type: 'Dry Goods Section', monthlyRent: 2300, monthly_rent: 2300, status: 'AVAILABLE', section: 'Dry Goods & Groceries' },
    { id: 5, stallNo: 'C-01', stall_no: 'C-01', stallType: 'Vegetable/Fruit Section', stall_type: 'Vegetable/Fruit Section', monthlyRent: 1500, monthly_rent: 1500, status: 'AVAILABLE', section: 'Fruits & Vegetables' },
    { id: 6, stallNo: 'D-01', stall_no: 'D-01', stallType: 'Commercial Stall (Corner)', stall_type: 'Commercial Stall (Corner)', monthlyRent: 2500, monthly_rent: 2500, status: 'AVAILABLE', section: 'Commercial & Eatery' }
  ].map(normalizeRecord)
}

export async function createStall(payload) {
  const insertBody = {
    stall_no: payload.stallNo || payload.stall_no || payload.number,
    stall_type: payload.stallType || payload.stall_type || payload.type,
    monthly_rent: Number(payload.monthlyRent || payload.monthly_rent || payload.rent || 1500),
    status: (payload.status === 'VACANT') ? 'AVAILABLE' : (payload.status || 'AVAILABLE'),
    info: payload.info || payload.section || null,
    latitude: (payload.latitude !== null && payload.latitude !== undefined && payload.latitude !== '') ? Number(payload.latitude ?? payload.lat) : null,
    longitude: (payload.longitude !== null && payload.longitude !== undefined && payload.longitude !== '') ? Number(payload.longitude ?? payload.lng) : null
  }
  const img = payload.imageUrl || payload.image_url
  if (img) {
    insertBody.map_coordinates = {
      ...(typeof payload.map_coordinates === 'object' ? payload.map_coordinates : {}),
      imageUrl: img
    }
  }

  const { data, error } = await supabase
    .from('stalls')
    .insert(insertBody)
    .select()
    .single()

  if (error) {
    if (error.code === '42501') {
      const msg = 'Row Level Security (RLS) blocked stall creation. Please run supabase/migrations/02_unified_system_upgrade_and_rls.sql or "ALTER TABLE public.stalls DISABLE ROW LEVEL SECURITY;" in Supabase SQL Editor.'
      console.error('[stallService] RLS Error 42501:', msg, error)
      throw new Error(msg)
    }
    throw error
  }
  invalidateApiCache('stalls')
  const norm = normalizeRecord(data)
  if (img) {
    norm.imageUrl = img
    norm.image_url = img
  }
  return norm
}

export async function updateStall(id, payload) {
  const updateBody = {}
  if (payload.stallNo !== undefined || payload.number !== undefined) updateBody.stall_no = payload.stallNo || payload.number
  if (payload.stallType !== undefined || payload.type !== undefined) updateBody.stall_type = payload.stallType || payload.type
  if (payload.monthlyRent !== undefined || payload.rent !== undefined) updateBody.monthly_rent = Number(payload.monthlyRent || payload.rent)
  if (payload.status !== undefined) {
    const s = String(payload.status).trim().toUpperCase()
    updateBody.status = (s === 'VACANT') ? 'AVAILABLE' : s
  }
  if (payload.info !== undefined) updateBody.info = payload.info
  if (payload.latitude !== undefined || payload.lat !== undefined) {
    const lat = payload.latitude ?? payload.lat
    updateBody.latitude = (lat !== null && lat !== '') ? Number(lat) : null
  }
  if (payload.longitude !== undefined || payload.lng !== undefined) {
    const lng = payload.longitude ?? payload.lng
    updateBody.longitude = (lng !== null && lng !== '') ? Number(lng) : null
  }
  if (payload.imageUrl !== undefined || payload.image_url !== undefined) {
    const img = payload.imageUrl || payload.image_url
    updateBody.map_coordinates = {
      ...(typeof payload.map_coordinates === 'object' ? payload.map_coordinates : {}),
      imageUrl: img
    }
  }

  const { data, error } = await supabase
    .from('stalls')
    .update(updateBody)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '42501') {
      const msg = 'Row Level Security (RLS) blocked stall update. Please run supabase/migrations/02_unified_system_upgrade_and_rls.sql or "ALTER TABLE public.stalls DISABLE ROW LEVEL SECURITY;" in Supabase SQL Editor.'
      console.error('[stallService] RLS Error 42501:', msg, error)
      throw new Error(msg)
    }
    throw error
  }
  invalidateApiCache('stalls')
  const norm = normalizeRecord(data)
  if (updateBody.map_coordinates?.imageUrl) {
    norm.imageUrl = updateBody.map_coordinates.imageUrl
    norm.image_url = updateBody.map_coordinates.imageUrl
  }
  return norm
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
  // Direct DB update: assign in occupants table with ACTIVE status and update stall status
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
          monthly_rent: 1500,
          billing_frequency: 'MONTHLY',
          status: 'ACTIVE'
        })
      }
    } catch (_) {}

    invalidateApiCache('stalls|stakeholders|occupants|contracts|billings')
    return { success: true, occupantId }
  } catch (e) {
    console.warn('Direct occupants sync error:', e)
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
  const { data, error } = await supabase
    .from('stalls')
    .delete()
    .eq('id', stallId)

  if (error) throw error
  invalidateApiCache('stalls')
  return data
}

export async function archiveStall(stallId) {
  const { data, error } = await supabase
    .from('stalls')
    .update({ status: 'ARCHIVED' })
    .eq('id', stallId)
    .select()
    .single()

  if (error) throw error
  invalidateApiCache('stalls')
  return data
}

export async function restoreStall(stallId) {
  const { data, error } = await supabase
    .from('stalls')
    .update({ status: 'AVAILABLE' })
    .eq('id', stallId)
    .select()
    .single()

  if (error) throw error
  invalidateApiCache('stalls')
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
