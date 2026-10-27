import { supabase } from '../config/supabase'
import api, { normalizeRecord, isUuid } from './api'

export async function getApplicationByUserId(userId) {
  try {
    if (!userId) return null
    if (!isUuid(userId)) {
      try {
        const raw = localStorage.getItem('manticao_applications') || '[]'
        const list = JSON.parse(raw)
        const found = list.find(a => String(a.user_id) === String(userId) || String(a.userId) === String(userId))
        if (found) return normalizeRecord(found)
      } catch (_) {}
      return null
    }
    const { data, error } = await supabase
      .from('stakeholder_applications')
      .select('*, stakeholder:stakeholders(*, occupant:occupants(*, stall:stalls!occupants_stall_id_fkey(*)), selectedStall:stalls!selected_stall_id(*)), stall:stalls(*)')
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) {
      try {
        const raw = localStorage.getItem('manticao_applications') || '[]'
        const list = JSON.parse(raw)
        const found = list.find(a => String(a.user_id) === String(userId) || String(a.userId) === String(userId))
        if (found) return normalizeRecord(found)
      } catch (_) {}
      return null
    }

    const norm = normalizeRecord(data)
    if (data.stakeholder) {
      norm.firstName = data.stakeholder.first_name
      norm.lastName = data.stakeholder.last_name
      norm.middleName = data.stakeholder.middle_name
      norm.businessName = data.stakeholder.business_name
      norm.businessType = data.stakeholder.business_type
      norm.contact = data.stakeholder.contact
      norm.email = data.stakeholder.email
      norm.address = data.stakeholder.address
      norm.selectedStallId = data.stakeholder.selected_stall_id
    }
    norm.idDocumentUrl = data.valid_id_url || norm.idDocumentUrl
    norm.letterDocumentUrl = data.loi_url || norm.letterDocumentUrl
    norm.applicationStatus = data.status || norm.applicationStatus
    norm.currentHoldingOffice = data.current_holding_office || norm.currentHoldingOffice
    return norm
  } catch (error) {
    try {
      const raw = localStorage.getItem('manticao_applications') || '[]'
      const list = JSON.parse(raw)
      const found = list.find(a => String(a.user_id) === String(userId) || String(a.userId) === String(userId))
      if (found) return normalizeRecord(found)
    } catch (_) {}
    return null
  }
}

export async function getStakeholderByUserId(userId) {
  try {
    let resolvedUserId = userId
    if (!resolvedUserId || resolvedUserId === 'null' || resolvedUserId === 'undefined') {
      const { data: { session } } = await supabase.auth.getSession()
      resolvedUserId = session?.user?.id
    }
    if (!resolvedUserId) return null

    if (!isUuid(resolvedUserId)) {
      try {
        const rawSh = localStorage.getItem('manticao_stakeholders') || '{}'
        const shMap = JSON.parse(rawSh)
        const foundSh = Object.values(shMap).find(s => String(s.user_id) === String(resolvedUserId) || String(s.userId) === String(resolvedUserId))
        const rawApps = localStorage.getItem('manticao_applications') || '[]'
        const apps = JSON.parse(rawApps)
        const foundApp = apps.find(a => String(a.user_id) === String(resolvedUserId) || String(a.userId) === String(resolvedUserId))
        const base = foundSh || foundApp
        if (base) return normalizeRecord(base)
      } catch (_) {}
      return null
    }

    // 1. Fetch stakeholder record
    const { data: stData } = await supabase
      .from('stakeholders')
      .select('*, occupant:occupants(*, stall:stalls!occupants_stall_id_fkey(*)), selectedStall:stalls!selected_stall_id(*)')
      .eq('user_id', resolvedUserId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 2. Fetch formal stakeholder application record
    const { data: appData } = await supabase
      .from('stakeholder_applications')
      .select('*, stall:stalls(*)')
      .eq('user_id', resolvedUserId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!stData && !appData) {
      return null
    }

    const base = stData || appData
    const normalized = normalizeRecord(base)

    if (stData && appData) {
      const normApp = normalizeRecord(appData)
      normalized.applicationId = appData.id
      normalized.applicationNo = appData.application_no
      normalized.stakeholderId = stData.id

      if (normApp.loiUrl || appData.loi_url) normalized.letterDocumentUrl = normApp.loiUrl || appData.loi_url
      if (normApp.validIdUrl || appData.valid_id_url) normalized.idDocumentUrl = normApp.validIdUrl || appData.valid_id_url
      if (normApp.morescoClearanceUrl || appData.moresco_clearance_url) normalized.morescoClearanceUrl = normApp.morescoClearanceUrl || appData.moresco_clearance_url

      // Sync latest office approvals
      if (!normalized.marketSupervisorApproved && (normApp.status === 'CONTRACT_PREPARED' || appData.supervisor_endorsed_at)) {
        normalized.marketSupervisorApproved = true
        normalized.marketApprovalStatus = 'APPROVED'
      }
      if (!normalized.bploApproved && (normApp.bploStatus === 'RELEASED' || appData.business_permit_released)) {
        normalized.bploApproved = true
        normalized.bploStatus = 'RELEASED'
      }
      if (!normalized.finalEndorsed && (appData.mayor_decision === 'APPROVED' || normApp.endorsementStatus === 'APPROVED')) {
        normalized.finalEndorsed = true
        normalized.endorsingApproved = true
        normalized.endorsementStatus = 'APPROVED'
      }
      if (!normalized.applicantFeePaid && (stData.applicant_fee_paid || appData.amount_paid > 0)) {
        normalized.applicantFeePaid = true
      }
      if (normalized.applicationStatus === 'PENDING' && appData.status && appData.status !== 'PENDING') {
        normalized.applicationStatus = appData.status
      }
      if (!normalized.selectedStallId && appData.stall_id) {
        normalized.selectedStallId = appData.stall_id
        normalized.selected_stall_id = appData.stall_id
        if (normApp.stall) normalized.stall = normApp.stall
      }
    } else if (appData && !stData) {
      normalized.applicationId = appData.id
      normalized.id = appData.id
      if (appData.loi_url) normalized.letterDocumentUrl = appData.loi_url
      if (appData.valid_id_url) normalized.idDocumentUrl = appData.valid_id_url
    }

    if (Array.isArray(normalized.occupant)) {
      normalized.occupants = normalized.occupant
      normalized.occupant = normalized.occupant[0] || null
    } else if (normalized.occupant && !normalized.occupants) {
      normalized.occupants = [normalized.occupant]
    }

    if (!normalized.stall && normalized.occupant?.stall) {
      normalized.stall = normalized.occupant.stall
    }
    if (!normalized.stall && (normalized.selectedStallId || normalized.selected_stall_id)) {
      try {
        const targetId = Number(normalized.selectedStallId || normalized.selected_stall_id)
        const { data: stRec } = await supabase.from('stalls').select('*').eq('id', targetId).maybeSingle()
        if (stRec) normalized.stall = normalizeRecord(stRec)
      } catch (_) {}
    }

    // Look for Hazard-Free Stall Confirmation document
    const sid = normalized.stakeholderId || normalized.id
    if (sid) {
      try {
        const { data: hazardDoc } = await supabase
          .from('stakeholder_documents')
          .select('*')
          .eq('stakeholder_id', Number(sid))
          .in('document_type', ['HAZARD_FREE_CONFIRMATION', 'HAZARD_FREE_CERTIFICATE'])
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (hazardDoc?.file_path) {
          normalized.hazardFreeConfirmed = true
          normalized.hazardFreeDocumentUrl = hazardDoc.file_path
          normalized.hazardFreeFileName = hazardDoc.file_name
        }
      } catch (_) {}
    }

    // Check payment records for application fee / advance payment
    if (sid) {
      try {
        const { data: pList } = await supabase
          .from('payments')
          .select('id, payment_type, amount, payment_date')
          .eq('stakeholder_id', Number(sid))
          .order('id', { ascending: false })

        if (pList && pList.length > 0) {
          const appFeePay = pList.find(p => ['APPLICATION_FEE', 'APPLICATION_FORM', 'BUSINESS_PERMIT_PAYMENT'].includes(p.payment_type))
          if (appFeePay) {
            normalized.applicantFeePaid = true
            normalized.applicant_fee_paid = true
            normalized.treasurerPaid = true
            normalized.treasurer_paid = true
            normalized.verifiedStakeholder = true
            normalized.verified_stakeholder = true
            normalized.applicantFeeAmount = appFeePay.amount
            normalized.applicantFeeDate = appFeePay.payment_date
          }
        }
      } catch (pErr) {
        console.warn('[applicationService] Payments check note:', pErr)
      }
    }

    const hasFeePayment = Boolean(
      normalized.applicantFeePaid ||
      normalized.applicant_fee_paid ||
      normalized.treasurerPaid ||
      normalized.treasurer_paid
    )

    if (hasFeePayment) {
      normalized.applicantFeePaid = true
      normalized.applicant_fee_paid = true
      normalized.treasurerPaid = true
      normalized.treasurer_paid = true
      normalized.verifiedStakeholder = true
      normalized.verified_stakeholder = true
    }

    const hasStall = Boolean(normalized.stallNo || normalized.occupant || normalized.selectedStall || normalized.stall_id || normalized.stall)
    const isTenantOnboarded = Boolean(
      (stData?.verified_tenant || normalized.verified_tenant || normalized.onboardingStatus === 'ACTIVE_VENDOR' || normalized.applicationStatus === 'COMPLETED') &&
      hasStall
    )
    normalized.verifiedTenant = isTenantOnboarded
    normalized.verified_tenant = isTenantOnboarded

    return normalized
  } catch (error) {
    console.error('[applicationService] getStakeholderByUserId error:', error)
    return null
  }
}

export async function getStakeholderRequirements(stakeholderId) {
  if (!stakeholderId) return []
  const { data, error } = await supabase
    .from('stakeholder_documents')
    .select('*')
    .eq('stakeholder_id', stakeholderId)

  if (error) return []
  return data || []
}

export async function getApplications() {
  try {
    const [appsRes, stakeholdersRes, docsRes] = await Promise.all([
      supabase
        .from('stakeholder_applications')
        .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
        .order('id', { ascending: false }),
      supabase
        .from('stakeholders')
        .select('*, occupant:occupants(*, stall:stalls!occupants_stall_id_fkey(*)), selectedStall:stalls!selected_stall_id(*)')
        .order('id', { ascending: false }),
      supabase
        .from('stakeholder_documents')
        .select('*')
        .order('id', { ascending: false })
    ])

    const apps = appsRes.data || []
    const stakeholders = stakeholdersRes.data || []
    const docs = docsRes.data || []

    const docsByStakeholder = new Map()
    for (const d of docs) {
      if (d.stakeholder_id) {
        const sid = Number(d.stakeholder_id)
        if (!docsByStakeholder.has(sid)) docsByStakeholder.set(sid, [])
        docsByStakeholder.get(sid).push(d)
      }
    }

    const stakeholderById = new Map()
    const stakeholderByUser = new Map()

    for (const st of stakeholders) {
      const normSt = normalizeRecord(st)
      stakeholderById.set(Number(st.id), normSt)
      if (st.user_id) stakeholderByUser.set(String(st.user_id), normSt)
    }

    const mappedApps = apps.map((app) => {
      const normApp = normalizeRecord(app)
      const linkedSt = (app.stakeholder_id && stakeholderById.get(Number(app.stakeholder_id))) ||
                       (app.user_id && stakeholderByUser.get(String(app.user_id))) ||
                       (app.stakeholder ? normalizeRecord(app.stakeholder) : null)

      if (linkedSt) {
        normApp.stakeholderId = linkedSt.id
        normApp.firstName = linkedSt.first_name || linkedSt.firstName
        normApp.lastName = linkedSt.last_name || linkedSt.lastName
        normApp.middleName = linkedSt.middle_name || linkedSt.middleName
        normApp.businessName = linkedSt.business_name || linkedSt.businessName
        normApp.businessType = linkedSt.business_type || linkedSt.businessType
        normApp.contact = linkedSt.contact
        normApp.email = linkedSt.email
        normApp.address = linkedSt.address
        normApp.selectedStallId = linkedSt.selected_stall_id || linkedSt.selectedStallId
        if (!normApp.stall && (linkedSt.selectedStall || linkedSt.stall)) {
          normApp.stall = linkedSt.selectedStall || linkedSt.stall
        }
      }

      const sid = linkedSt?.id || normApp.stakeholder_id || normApp.stakeholderId
      const stDocs = sid ? (docsByStakeholder.get(Number(sid)) || []) : []

      const hDoc = stDocs.find((d) => ['HAZARD_FREE_CONFIRMATION', 'HAZARD_FREE_CERTIFICATE'].includes(d.document_type))
      normApp.hazardFreeConfirmed = Boolean(
        hDoc?.file_path ||
        linkedSt?.hazard_free_confirmed ||
        app.hazard_free_confirmed
      )
      normApp.hazardFreeDocumentUrl = (
        hDoc?.file_path ||
        linkedSt?.hazard_free_document_url ||
        app.hazard_free_document_url ||
        null
      )
      normApp.hazardFreeFileName = hDoc?.file_name || 'Hazard_Free_Stall_Confirmation.pdf'

      normApp.idDocumentUrl = app.valid_id_url || stDocs.find((d) => d.document_type === 'VALID_ID')?.file_path || null
      normApp.letterDocumentUrl = app.loi_url || stDocs.find((d) => ['LOI', 'APPLICATION_LETTER'].includes(d.document_type))?.file_path || null
      normApp.documents = stDocs

      normApp.bploStatus = app.bplo_status || linkedSt?.bplo_status || 'PENDING'
      normApp.endorsingStatus = app.endorsing_status || linkedSt?.endorsement_status || 'PENDING'
      normApp.businessPermitFeeAssessed = app.business_permit_fee_assessed || linkedSt?.business_permit_fee_assessed || 0
      normApp.businessPermitFeePaid = Boolean(app.business_permit_fee_paid || linkedSt?.business_permit_fee_paid)
      normApp.businessPermitNo = app.business_permit_no || linkedSt?.business_permit_no || null
      normApp.businessPermitReleased = Boolean(app.business_permit_released || linkedSt?.business_permit_released)
      normApp.businessPermitReleasedAt = app.business_permit_released_at || linkedSt?.business_permit_released_at || null

      return normApp
    })

    // Also include any stakeholders that do not yet have a formal stakeholder_applications row
    const existingStIds = new Set(apps.map((a) => Number(a.stakeholder_id)))
    for (const st of stakeholders) {
      if (!existingStIds.has(Number(st.id))) {
        const normSt = normalizeRecord(st)
        const stDocs = docsByStakeholder.get(Number(st.id)) || []
        const hDoc = stDocs.find((d) => ['HAZARD_FREE_CONFIRMATION', 'HAZARD_FREE_CERTIFICATE'].includes(d.document_type))
        mappedApps.push({
          id: st.id,
          stakeholderId: st.id,
          applicationNo: `APP-${st.id}`,
          firstName: st.first_name,
          lastName: st.last_name,
          middleName: st.middle_name,
          businessName: st.business_name,
          businessType: st.business_type,
          contact: st.contact,
          email: st.email,
          address: st.address,
          selectedStallId: st.selected_stall_id,
          stall: st.selectedStall,
          hazardFreeConfirmed: Boolean(hDoc?.file_path || st.hazard_free_confirmed),
          hazardFreeDocumentUrl: hDoc?.file_path || st.hazard_free_document_url || null,
          bploStatus: st.bplo_status || 'PENDING',
          endorsingStatus: st.endorsement_status || 'PENDING',
          businessPermitFeeAssessed: st.business_permit_fee_assessed || 0,
          businessPermitFeePaid: Boolean(st.business_permit_fee_paid),
          businessPermitNo: st.business_permit_no || null,
          businessPermitReleased: Boolean(st.business_permit_released),
          documents: stDocs,
          status: st.application_status || 'PENDING'
        })
      }
    }

    try {
      const raw = localStorage.getItem('manticao_applications') || '[]'
      const localList = JSON.parse(raw)
      const existingIds = new Set(mappedApps.map(a => String(a.id || a.applicationNo || a.application_no)))
      for (const localApp of localList) {
        const key = String(localApp.id || localApp.applicationNo || localApp.application_no)
        if (!existingIds.has(key)) {
          existingIds.add(key)
          mappedApps.unshift(normalizeRecord(localApp))
        }
      }
    } catch (_) {}

    return mappedApps
  } catch (error) {
    console.error('[applicationService] getApplications error:', error)
    try {
      const raw = localStorage.getItem('manticao_applications') || '[]'
      return JSON.parse(raw).map(normalizeRecord)
    } catch (_) {
      return []
    }
  }
}

export async function uploadHazardFreeDocument(file, stakeholderId, applicationId = null) {
  if (!file) throw new Error('File is required')

  const fileExt = file.name.split('.').pop()
  const cleanExt = fileExt ? fileExt.replace(/[^a-zA-Z0-9]/g, '') : 'pdf'
  const fileName = `hazard_free_${stakeholderId || 'app'}_${Date.now()}.${cleanExt}`
  const filePath = `documents/${fileName}`

  // 1. Upload to Supabase Storage bucket 'uploads'
  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath)

  if (stakeholderId) {
    try {
      await supabase.from('stakeholder_documents').insert({
        stakeholder_id: Number(stakeholderId),
        document_type: 'HAZARD_FREE_CONFIRMATION',
        file_name: file.name,
        file_path: publicUrl
      })
    } catch (_) {}

    try {
      await supabase.from('stakeholders').update({
        hazard_free_confirmed: true,
        hazard_free_document_url: publicUrl
      }).eq('id', Number(stakeholderId))
    } catch (_) {}

    try {
      await supabase.from('stakeholder_applications').update({
        hazard_free_confirmed: true,
        hazard_free_document_url: publicUrl
      }).eq('stakeholder_id', Number(stakeholderId))
    } catch (_) {}
  }

  if (applicationId) {
    try {
      await supabase.from('stakeholder_applications').update({
        hazard_free_confirmed: true,
        hazard_free_document_url: publicUrl
      }).eq('id', Number(applicationId))
    } catch (_) {}
  }

  return { publicUrl, fileName: file.name }
}

export async function endorseApplication(id, remarks = 'Market Supervisor verified the application after Mayor approval and payment.', stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id

  try {
    await supabase.from('stakeholders').update({
      market_supervisor_approved: true,
      market_approval_status: 'APPROVED',
      application_status: 'CONTRACT_PREPARED'
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  try {
    await supabase.from('stakeholder_applications').update({
      status: 'CONTRACT_PREPARED',
      supervisor_endorsed_at: new Date().toISOString(),
      supervisor_remarks: remarks,
      current_holding_office: 'Market Supervisor'
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  void (async () => {
    try {
      const { sendApplicationProgressNotification } = await import('./emailNotificationService')
      await sendApplicationProgressNotification({
        stakeholderId: targetStakeholderId,
        stage: 'SUPERVISOR',
        status: 'APPROVED',
        title: 'Market Supervisor Endorsement Granted',
        message: 'Your application has been approved by the Market Supervisor after Mayor review and Treasurer payment.',
        remarks
      })
    } catch (eErr) {
      console.warn('[endorseApplication] Email dispatch warning:', eErr)
    }
  })()

  return { success: true }
}

export async function rejectEndorsement(id, remarks = '', stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id

  try {
    await supabase.from('stakeholders').update({
      market_supervisor_approved: false,
      market_approval_status: 'REJECTED',
      application_status: 'SUPERVISOR_REJECTED'
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  try {
    await supabase.from('stakeholder_applications').update({
      status: 'SUPERVISOR_REJECTED',
      supervisor_remarks: remarks,
      current_holding_office: 'Market Supervisor'
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  void (async () => {
    try {
      const { sendApplicationProgressNotification } = await import('./emailNotificationService')
      await sendApplicationProgressNotification({
        stakeholderId: targetStakeholderId,
        stage: 'SUPERVISOR',
        status: 'REJECTED',
        title: 'Application Rejected by Market Supervisor',
        message: 'Your application was not approved during Market Supervisor review.',
        remarks
      })
    } catch (eErr) {
      console.warn('[rejectEndorsement] Email dispatch warning:', eErr)
    }
  })()

  return { success: true }
}

export async function approveByMayor(id, remarks = 'Approved for municipal stall rights and advance rental payment.', stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id

  try {
    await supabase.from('stakeholders').update({
      final_endorsed: true,
      endorsing_approved: true,
      endorsement_status: 'APPROVED',
      application_status: 'APPROVED_PENDING_ADVANCE_PAYMENT'
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  try {
    await supabase.from('stakeholder_applications').update({
      mayor_decision: 'APPROVED',
      mayor_approval_status: 'APPROVED',
      mayor_approved_at: new Date().toISOString(),
      mayor_remarks: remarks,
      status: 'APPROVED_PENDING_ADVANCE_PAYMENT',
      current_holding_office: "Treasurer's Office"
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  void (async () => {
    try {
      const { sendApplicationProgressNotification } = await import('./emailNotificationService')
      await sendApplicationProgressNotification({
        stakeholderId: targetStakeholderId,
        stage: 'MAYOR',
        status: 'APPROVED',
        title: 'Municipal Mayor Approved LOI',
        message: 'The Municipal Mayor has approved your Letter of Intent. Please proceed to the Municipal Treasurer to pay your Stall Rights and 2-Month Advance Rent.',
        remarks
      })
    } catch (eErr) {
      console.warn('[approveByMayor] Email dispatch warning:', eErr)
    }
  })()

  return { success: true }
}

export async function rejectByMayor(id, remarks = '', stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id

  try {
    await supabase.from('stakeholders').update({
      final_endorsed: false,
      endorsing_approved: false,
      endorsement_status: 'REJECTED',
      application_status: 'MAYOR_REJECTED'
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  try {
    await supabase.from('stakeholder_applications').update({
      mayor_decision: 'REJECTED',
      mayor_remarks: remarks,
      status: 'MAYOR_REJECTED',
      current_holding_office: 'Office of the Mayor'
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  void (async () => {
    try {
      const { sendApplicationProgressNotification } = await import('./emailNotificationService')
      await sendApplicationProgressNotification({
        stakeholderId: targetStakeholderId,
        stage: 'MAYOR',
        status: 'REJECTED',
        title: 'Application Disapproved by Municipal Mayor',
        message: 'Your application was not approved during executive Mayoral review.',
        remarks
      })
    } catch (eErr) {
      console.warn('[rejectByMayor] Email dispatch warning:', eErr)
    }
  })()

  return { success: true }
}

export async function verifyStallByInspector(id, checklist = {}, stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id

  try {
    await supabase.from('stakeholders').update({
      hazard_free_confirmed: checklist.status !== 'FAILED',
      application_status: checklist.status === 'FAILED' ? 'PENDING_INSPECTION' : 'INSPECTION_PASSED'
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  try {
    await supabase.from('stakeholder_applications').update({
      inspection_notes: checklist.remarks || '',
      inspection_completed_at: new Date().toISOString(),
      status: checklist.status === 'FAILED' ? 'PENDING_INSPECTION' : 'INSPECTION_PASSED',
      current_holding_office: 'BPLO'
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  void (async () => {
    try {
      const { sendApplicationProgressNotification } = await import('./emailNotificationService')
      await sendApplicationProgressNotification({
        stakeholderId: targetStakeholderId,
        stage: 'INSPECTOR',
        status: checklist.status || 'PASSED',
        title: checklist.status === 'FAILED' ? 'Stall Setup Inspection Requires Rectification' : 'Physical Stall Setup Inspection Passed',
        message: checklist.status === 'FAILED'
          ? 'Field inspector noted items requiring correction before business permit processing.'
          : 'Your physical stall setup has passed safety and sanitation inspection. Business permit eligibility unlocked.',
        remarks: checklist.remarks || ''
      })
    } catch (eErr) {
      console.warn('[verifyStallByInspector] Email dispatch warning:', eErr)
    }
  })()

  return { success: true }
}

export async function activateVendor(id, remarks = '') {
  try {
    const res = await api.put(`/applications/${id}/activate-vendor`, { remarks })
    return res.data || { success: true }
  } catch (err) {
    throw err
  }
}

export async function endorseByEndorsingOffice(id, remarks = 'Application endorsed by Endorsing Office.', stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id

  try {
    await supabase.from('stakeholder_applications').update({
      endorsing_status: 'APPROVED',
      endorsing_approved_at: new Date().toISOString(),
      endorsing_remarks: remarks,
      status: 'PENDING_BPLO_ASSESSMENT',
      current_holding_office: 'BPLO'
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  try {
    await supabase.from('stakeholders').update({
      endorsing_approved: true,
      endorsement_status: 'APPROVED',
      endorsement_remarks: remarks
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  return { success: true }
}

export async function rejectByEndorsingOffice(id, remarks = '', stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id

  try {
    await supabase.from('stakeholder_applications').update({
      endorsing_status: 'REJECTED',
      endorsing_remarks: remarks,
      status: 'ENDORSING_REJECTED'
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  try {
    await supabase.from('stakeholders').update({
      endorsing_approved: false,
      endorsement_status: 'REJECTED',
      endorsement_remarks: remarks
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  return { success: true }
}

export async function bploAssessFee(id, assessedAmount = 1500, remarks = '', stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id

  try {
    await supabase.from('stakeholder_applications').update({
      business_permit_fee_assessed: Number(assessedAmount),
      bplo_status: 'PENDING_PAYMENT',
      bplo_remarks: remarks,
      status: 'PENDING_BPLO_PAYMENT',
      current_holding_office: "Treasurer's Office"
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  try {
    await supabase.from('stakeholders').update({
      business_permit_fee_assessed: Number(assessedAmount),
      bplo_status: 'PENDING_PAYMENT'
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  return { success: true }
}

export async function bploReleasePermit(id, permitNo = null, remarks = '', stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id
  const bpNo = permitNo || `BP-${Date.now().toString().slice(-8)}`

  try {
    await supabase.from('stakeholder_applications').update({
      business_permit_no: bpNo,
      business_permit_released: true,
      business_permit_released_at: new Date().toISOString(),
      bplo_status: 'RELEASED',
      status: 'BUSINESS_PERMIT_RELEASED',
      completed_at: new Date().toISOString(),
      current_holding_office: 'Completed'
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  try {
    await supabase.from('stakeholders').update({
      business_permit_no: bpNo,
      business_permit_released: true,
      business_permit_released_at: new Date().toISOString(),
      bplo_approved: true,
      bplo_status: 'RELEASED',
      application_status: 'COMPLETED',
      onboarding_status: 'ACTIVE_VENDOR',
      verified_tenant: true,
      verified_stakeholder: true
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  return { success: true, permitNo: bpNo }
}

export const approveByBPLO = async (id, stakeholderId = null) => {
  try {
    return await bploReleasePermit(id, null, 'Approved and released by BPLO', stakeholderId)
  } catch (err) {
    return await bploAssessFee(id, 1500, 'Assessed by BPLO', stakeholderId)
  }
}

export const rejectByBPLO = async (id, remarks = '', stakeholderId = null) => {
  const targetStakeholderId = stakeholderId || id
  try {
    await supabase.from('stakeholder_applications').update({
      bplo_status: 'REJECTED',
      bplo_remarks: remarks,
      status: 'REVOKED'
    }).or(`id.eq.${id},stakeholder_id.eq.${targetStakeholderId}`)
  } catch (_) {}

  try {
    await supabase.from('stakeholders').update({
      bplo_approved: false,
      bplo_status: 'REJECTED'
    }).eq('id', Number(targetStakeholderId))
  } catch (_) {}

  return { success: true }
}

export function isDashboardReady(stakeholder, requirements = null) {
  if (!stakeholder) return false
  const status = String(stakeholder.applicationStatus || stakeholder.application_status || '').toUpperCase()
  const isTenantActivated = Boolean(
    ['CONTRACT_ACTIVE', 'OCCUPANT_VERIFIED', 'BILLING_ACTIVE', 'COMPLETED', 'FULLY_APPROVED', 'ACTIVE_VENDOR'].includes(status) ||
    stakeholder.verifiedTenant ||
    stakeholder.verified_tenant
  )
  return isTenantActivated
}

export function getStakeholderRouteForApplication(application) {
  if (!application) {
    return '/business-application'
  }

  const status = String(application.applicationStatus || application.application_status || '').toUpperCase()
  const isTenantActivated = Boolean(
    ['CONTRACT_ACTIVE', 'OCCUPANT_VERIFIED', 'BILLING_ACTIVE', 'COMPLETED', 'FULLY_APPROVED', 'ACTIVE_VENDOR'].includes(status) ||
    application.verifiedTenant ||
    application.verified_tenant
  )

  if (isTenantActivated) {
    return '/stakeholder'
  }

  // All applicants in stages 1 to 6 track their progress on the 10-step progress timeline
  return '/application-progress'
}

export default {
  getApplicationByUserId,
  getStakeholderByUserId,
  getStakeholderRequirements,
  getApplications,
  endorseApplication,
  rejectEndorsement,
  approveByMayor,
  rejectByMayor,
  verifyStallByInspector,
  activateVendor,
  approveByBPLO,
  rejectByBPLO,
  bploAssessFee,
  bploReleasePermit,
  endorseByEndorsingOffice,
  rejectByEndorsingOffice,
  isDashboardReady,
  getStakeholderRouteForApplication
}
