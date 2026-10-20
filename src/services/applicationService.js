import { supabase } from '../config/supabase'
import { normalizeRecord } from './api'

export async function getApplicationByUserId(userId) {
  try {
    if (!userId) return null
    const { data, error } = await supabase
      .from('business_applications')
      .select('*, stall:stalls(*)')
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return normalizeRecord(data)
  } catch (error) {
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

    // 1. Fetch stakeholder record
    const { data: stData } = await supabase
      .from('stakeholders')
      .select('*, occupant:occupants(*, stall:stalls(*)), stall:stalls(*)')
      .eq('user_id', resolvedUserId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 2. Fetch business application record
    const { data: appData } = await supabase
      .from('business_applications')
      .select('*, stall:stalls(*)')
      .eq('user_id', resolvedUserId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!stData && !appData) {
      return null
    }

    // Merge them together so whichever has the latest progress is respected
    const base = stData || appData
    const normalized = normalizeRecord(base)

    if (stData && appData) {
      const normApp = normalizeRecord(appData)
      normalized.businessApplicationId = appData.id
      normalized.stakeholderId = stData.id

      // Sync latest office approvals
      if (!normalized.marketSupervisorApproved && (normApp.marketApprovalStatus === 'APPROVED' || normApp.marketSupervisorApproved)) {
        normalized.marketSupervisorApproved = true
        normalized.marketApprovalStatus = 'APPROVED'
      }
      if (!normalized.bploApproved && (normApp.bploStatus === 'APPROVED' || normApp.bploApproved)) {
        normalized.bploApproved = true
        normalized.bploStatus = 'APPROVED'
      }
      if (!normalized.finalEndorsed && (normApp.endorsementStatus === 'APPROVED' || normApp.endorsingStatus === 'ENDORSED' || normApp.finalEndorsed)) {
        normalized.finalEndorsed = true
        normalized.endorsingApproved = true
        normalized.endorsementStatus = 'APPROVED'
      }
      if (!normalized.applicantFeePaid && normApp.applicantFeePaid) {
        normalized.applicantFeePaid = true
      }
      if (normalized.applicationStatus === 'PENDING' && normApp.applicationStatus && normApp.applicationStatus !== 'PENDING') {
        normalized.applicationStatus = normApp.applicationStatus
      }
      if (!normalized.selectedStallId && normApp.selectedStallId) {
        normalized.selectedStallId = normApp.selectedStallId
        normalized.selected_stall_id = normApp.selectedStallId
        if (normApp.stall) normalized.stall = normApp.stall
      }
    } else if (appData && !stData) {
      normalized.businessApplicationId = appData.id
      normalized.id = appData.id
    }

    // Unpack occupant array if returned as list
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

    // Check payment records for business permit / application fee
    if (sid) {
      try {
        const { data: pList } = await supabase
          .from('payments')
          .select('id, payment_type, amount, payment_date')
          .eq('stakeholder_id', Number(sid))
          .in('payment_type', ['BUSINESS_PERMIT_PAYMENT', 'APPLICATION_FORM', 'APPLICATION_FEE'])
          .order('id', { ascending: false })
          .limit(1)

        if (pList && pList.length > 0) {
          normalized.applicantFeePaid = true
          normalized.applicant_fee_paid = true
          normalized.applicationFormPaid = true
          normalized.application_form_paid = true
          normalized.treasurerPaid = true
          normalized.treasurer_paid = true
          normalized.verifiedStakeholder = true
          normalized.verified_stakeholder = true
          normalized.applicantFeeAmount = pList[0].amount
          normalized.applicantFeeDate = pList[0].payment_date
        }
      } catch (pErr) {
        console.warn('[applicationService] Could not check payments table:', pErr)
      }
    }

    // Normalize applicant fee payment flags
    const hasFeePayment = Boolean(
      normalized.applicantFeePaid ||
      normalized.applicant_fee_paid ||
      normalized.applicationFormPaid ||
      normalized.application_form_paid ||
      normalized.treasurerPaid ||
      normalized.treasurer_paid
    )

    if (hasFeePayment) {
      normalized.applicantFeePaid = true
      normalized.applicant_fee_paid = true
      normalized.applicationFormPaid = true
      normalized.application_form_paid = true
      normalized.treasurerPaid = true
      normalized.treasurer_paid = true
      normalized.verifiedStakeholder = true
      normalized.verified_stakeholder = true
    }

    // A profile is ONLY a verified tenant if they completed onboarding and have an assigned stall/contract
    const hasStall = Boolean(normalized.stallNo || normalized.occupant || normalized.selectedStall || normalized.stall_id || normalized.stall)
    const isTenantOnboarded = Boolean(
      (stData?.verified_tenant || normalized.verified_tenant || normalized.onboardingStatus === 'COMPLETED' || normalized.applicationStatus === 'FULLY_APPROVED') &&
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
      supabase.from('business_applications').select('*, stall:stalls(*)').order('id', { ascending: false }),
      supabase.from('stakeholders').select('*, occupant:occupants(*, stall:stalls(*)), stall:stalls(*)').order('id', { ascending: false }),
      supabase.from('stakeholder_documents').select('*').order('id', { ascending: false })
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

    const stakeholderByUser = new Map()
    const stakeholderByEmail = new Map()

    for (const st of stakeholders) {
      const normSt = normalizeRecord(st)
      if (st.user_id) stakeholderByUser.set(String(st.user_id), normSt)
      if (st.email) stakeholderByEmail.set(String(st.email).trim().toLowerCase(), normSt)
    }

    const merged = apps.map(app => {
      const normApp = normalizeRecord(app)
      const linkedSt = (app.user_id && stakeholderByUser.get(String(app.user_id))) ||
                       (app.email && stakeholderByEmail.get(String(app.email).trim().toLowerCase())) || null

      if (linkedSt) {
        normApp.stakeholderId = linkedSt.id
        if (linkedSt.marketSupervisorApproved || linkedSt.marketApprovalStatus === 'APPROVED') {
          normApp.marketApprovalStatus = 'APPROVED'
          normApp.marketSupervisorApproved = true
        }
        if (linkedSt.bploApproved || linkedSt.bploStatus === 'APPROVED') {
          normApp.bploStatus = 'APPROVED'
          normApp.bploApproved = true
        }
        if (linkedSt.finalEndorsed || linkedSt.endorsementStatus === 'APPROVED' || linkedSt.endorsingStatus === 'ENDORSED') {
          normApp.endorsementStatus = 'APPROVED'
          normApp.endorsingStatus = 'ENDORSED'
          normApp.finalEndorsed = true
        }
        if (linkedSt.applicantFeePaid) {
          normApp.applicantFeePaid = true
        }
        if (linkedSt.applicationStatus && linkedSt.applicationStatus !== 'PENDING') {
          normApp.applicationStatus = linkedSt.applicationStatus
        }
        if (!normApp.stall && (linkedSt.stall || linkedSt.occupant?.stall)) {
          normApp.stall = linkedSt.stall || (Array.isArray(linkedSt.occupant) ? linkedSt.occupant[0]?.stall : linkedSt.occupant?.stall)
        }
      } else {
        normApp.stakeholderId = normApp.id
      }

      const sid = linkedSt?.id || normApp.stakeholderId
      const stDocs = sid ? (docsByStakeholder.get(Number(sid)) || []) : []

      // 1. Hazard-Free Document
      const hDoc = stDocs.find(d => ['HAZARD_FREE_CONFIRMATION', 'HAZARD_FREE_CERTIFICATE'].includes(d.document_type))
      normApp.hazardFreeConfirmed = Boolean(
        hDoc?.file_path ||
        linkedSt?.hazard_free_confirmed || linkedSt?.hazardFreeConfirmed ||
        app.hazard_free_confirmed || app.hazardFreeConfirmed
      )
      normApp.hazardFreeDocumentUrl = (
        hDoc?.file_path ||
        linkedSt?.hazard_free_document_url || linkedSt?.hazardFreeDocumentUrl ||
        app.hazard_free_document_url || app.hazardFreeDocumentUrl || null
      )
      normApp.hazardFreeFileName = hDoc?.file_name || 'Hazard_Free_Stall_Confirmation.pdf'

      // 2. Valid ID Document
      const idDoc = stDocs.find(d => d.document_type === 'VALID_ID')
      normApp.idDocumentUrl = idDoc?.file_path || app.id_document_url || app.idDocumentUrl || linkedSt?.id_document_url || null
      normApp.idDocumentName = idDoc?.file_name || 'Valid_Government_ID'

      // 3. Letter of Intent Document
      const letterDoc = stDocs.find(d => d.document_type === 'APPLICATION_LETTER')
      normApp.letterDocumentUrl = letterDoc?.file_path || app.letter_document_url || app.letterDocumentUrl || linkedSt?.letter_document_url || null
      normApp.letterDocumentName = letterDoc?.file_name || 'Letter_of_Intent'

      // 4. Complete documents list
      normApp.documents = stDocs

      return normApp
    })

    return merged
  } catch (error) {
    console.error('[applicationService] getApplications error:', error)
    return []
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

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath)

  // 3. Save to stakeholder_documents table
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
      await supabase.from('business_applications').update({
        hazard_free_confirmed: true,
        hazard_free_document_url: publicUrl
      }).eq('id', Number(applicationId))
    } catch (_) {}

    try {
      await supabase.from('stakeholder_applications').update({
        hazard_free_confirmed: true,
        hazard_free_document_url: publicUrl
      }).eq('id', Number(applicationId))
    } catch (_) {}
  }

  // Also sync by user_id if available from session
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (userId) {
      await supabase.from('business_applications').update({
        hazard_free_confirmed: true,
        hazard_free_document_url: publicUrl
      }).eq('user_id', userId)

      await supabase.from('stakeholders').update({
        hazard_free_confirmed: true,
        hazard_free_document_url: publicUrl
      }).eq('user_id', userId)

      await supabase.from('stakeholder_applications').update({
        hazard_free_confirmed: true,
        hazard_free_document_url: publicUrl
      }).eq('user_id', userId)
    }
  } catch (_) {}

  // Sync with Express backend endpoint
  try {
    const targetId = applicationId || stakeholderId
    if (targetId) {
      await api.put(`/applications/${targetId}/hazard-free`, { documentUrl: publicUrl })
    }
  } catch (_) {}

  return { publicUrl, fileName: file.name }
}

export async function endorseApplication(id, remarks = 'Supervisor endorsed to Mayor for executive review.', stakeholderId = null) {
  const targetStakeholderId = stakeholderId || id

  try {
    await supabase.from('stakeholders').update({
      market_supervisor_approved: true,
      market_approval_status: 'APPROVED',
      application_status: 'PENDING_MAYOR_APPROVAL'
    }).eq('id', targetStakeholderId)
  } catch (_) {}

  try {
    await supabase.from('business_applications').update({
      market_supervisor_approved: true,
      market_approval_status: 'APPROVED',
      application_status: 'PENDING_MAYOR_APPROVAL'
    }).eq('id', id)
  } catch (_) {}

  try {
    await supabase.from('stakeholder_applications').update({
      market_supervisor_approved: true,
      market_supervisor_approved_at: new Date().toISOString(),
      status: 'PENDING_MAYOR_APPROVAL',
      current_holding_office: 'Office of the Mayor'
    }).eq('id', id)
  } catch (_) {}

  try {
    await api.put(`/applications/${id}/supervisor-review`, { approved: true, remarks })
  } catch (_) {}

  // Non-blocking notification dispatch
  void (async () => {
    try {
      const { sendApplicationProgressNotification } = await import('./emailNotificationService')
      await sendApplicationProgressNotification({
        stakeholderId: targetStakeholderId,
        stage: 'SUPERVISOR',
        status: 'APPROVED',
        title: 'Market Supervisor Endorsement Granted',
        message: 'Your application has been endorsed by the Market Supervisor and routed to the Municipal Mayor for LOI decision.',
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
    }).eq('id', targetStakeholderId)
  } catch (_) {}

  try {
    await supabase.from('business_applications').update({
      market_approval_status: 'REJECTED',
      application_status: 'SUPERVISOR_REJECTED'
    }).eq('id', id)
  } catch (_) {}

  try {
    await supabase.from('stakeholder_applications').update({
      status: 'SUPERVISOR_REJECTED',
      current_holding_office: 'Market Supervisor'
    }).eq('id', id)
  } catch (_) {}

  try {
    await api.put(`/applications/${id}/supervisor-review`, { approved: false, remarks })
  } catch (_) {}

  // Non-blocking notification dispatch
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
      application_status: 'PENDING_TREASURER_PAYMENT'
    }).eq('id', targetStakeholderId)
  } catch (_) {}

  try {
    await supabase.from('business_applications').update({
      endorsement_status: 'APPROVED',
      application_status: 'PENDING_TREASURER_PAYMENT'
    }).eq('id', id)
  } catch (_) {}

  try {
    await supabase.from('stakeholder_applications').update({
      mayor_decision: 'APPROVED',
      mayor_approved_at: new Date().toISOString(),
      mayor_remarks: remarks,
      status: 'PENDING_TREASURER_PAYMENT',
      current_holding_office: "Treasurer's Office"
    }).eq('id', id)
  } catch (_) {}

  try {
    await api.put(`/applications/${id}/mayor-review`, { approved: true, remarks })
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
    }).eq('id', targetStakeholderId)
  } catch (_) {}

  try {
    await supabase.from('business_applications').update({
      endorsement_status: 'REJECTED',
      application_status: 'MAYOR_REJECTED'
    }).eq('id', id)
  } catch (_) {}

  try {
    await supabase.from('stakeholder_applications').update({
      mayor_decision: 'REJECTED',
      mayor_remarks: remarks,
      status: 'MAYOR_REJECTED',
      current_holding_office: 'Office of the Mayor'
    }).eq('id', id)
  } catch (_) {}

  try {
    await api.put(`/applications/${id}/mayor-review`, { approved: false, remarks })
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
    }).eq('id', targetStakeholderId)
  } catch (_) {}

  try {
    await supabase.from('business_applications').update({
      hazard_free_confirmed: checklist.status !== 'FAILED',
      application_status: checklist.status === 'FAILED' ? 'PENDING_INSPECTION' : 'INSPECTION_PASSED'
    }).eq('id', id)
  } catch (_) {}

  try {
    await api.put(`/applications/${id}/inspector-verify`, checklist)
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
  try {
    const res = await api.put(`/applications/${id}/endorsing-review`, { approved: true, remarks })
    return res.data || { success: true }
  } catch (err) {
    throw err
  }
}

export async function rejectByEndorsingOffice(id, remarks = '', stakeholderId = null) {
  try {
    const res = await api.put(`/applications/${id}/endorsing-review`, { approved: false, remarks })
    return res.data || { success: true }
  } catch (err) {
    throw err
  }
}

export async function bploAssessFee(id, assessedAmount = 1500, remarks = '', stakeholderId = null) {
  try {
    const res = await api.put(`/applications/${id}/bplo-assess`, { assessedAmount, remarks })
    return res.data || { success: true }
  } catch (err) {
    throw err
  }
}

export async function bploReleasePermit(id, permitNo = null, remarks = '', stakeholderId = null) {
  try {
    const res = await api.put(`/applications/${id}/bplo-release`, { permitNo, remarks })
    return res.data || { success: true }
  } catch (err) {
    throw err
  }
}

export const approveByBPLO = async (id, stakeholderId = null) => {
  try {
    return await bploReleasePermit(id, null, 'Approved and released by BPLO', stakeholderId);
  } catch (err) {
    // If not yet assessed or paid, fallback to assess
    return await bploAssessFee(id, 1500, 'Assessed by BPLO', stakeholderId);
  }
};

export const rejectByBPLO = async (id, remarks = '', stakeholderId = null) => {
  return await verifyStallByInspector(id, { status: 'FAILED', remarks }, stakeholderId);
};

export function isDashboardReady(stakeholder, requirements = null) {
  if (!stakeholder) return false
  const feePaid = Boolean(
    stakeholder.applicantFeePaid ||
    stakeholder.applicant_fee_paid ||
    stakeholder.applicationFormPaid ||
    stakeholder.application_form_paid ||
    stakeholder.treasurerPaid ||
    stakeholder.treasurer_paid
  )
  const isVerified = Boolean(
    stakeholder.verified ||
    stakeholder.verifiedStakeholder ||
    stakeholder.verified_stakeholder ||
    stakeholder.verifiedTenant ||
    stakeholder.verified_tenant
  )
  const statusCompleted = Boolean(
    stakeholder.applicationStatus === 'COMPLETED' ||
    stakeholder.application_status === 'COMPLETED' ||
    stakeholder.applicationStatus === 'FULLY_APPROVED' ||
    stakeholder.application_status === 'FULLY_APPROVED'
  )
  return (feePaid && isVerified) || feePaid || isVerified || statusCompleted
}

export function getStakeholderRouteForApplication(application) {
  if (!application) {
    return '/business-application'
  }

  const feePaid = Boolean(
    application.applicantFeePaid ||
    application.applicant_fee_paid ||
    application.applicationFormPaid ||
    application.application_form_paid ||
    application.treasurerPaid ||
    application.treasurer_paid
  )
  const isVerified = Boolean(
    application.verified ||
    application.verifiedStakeholder ||
    application.verified_stakeholder ||
    application.verifiedTenant ||
    application.verified_tenant
  )
  const status = application.applicationStatus || application.application_status

  if (feePaid || isVerified || (status === 'COMPLETED' || status === 'FULLY_APPROVED' || status === 'APPROVED')) {
    return '/stakeholder'
  }

  if (
    status === 'PENDING_BUSINESS_PERMIT_PAYMENT' ||
    application.finalEndorsed === true ||
    application.final_endorsed === true
  ) {
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
  approveByMayor,
  rejectByMayor,
  verifyStallByInspector,
  activateVendor,
  approveByBPLO,
  rejectByBPLO,
  isDashboardReady,
  getStakeholderRouteForApplication
}
