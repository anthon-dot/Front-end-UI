import {
  submitApplication,
  supervisorReviewApplication,
  mayorReviewApplication,
  inspectorVerifyStall,
  activateVendorAndCompleteApplication
} from '../services/applicationWorkflowService.js';
import { supabase } from '../config/supabase.js';
import { ROLES } from '../config/constants.js';

export async function createApplication(req, res, next) {
  try {
    const {
      firstName,
      middleName,
      lastName,
      businessName,
      businessType,
      contact,
      email,
      address,
      stallId,
      selectedStallId,
      loiUrl,
      validIdUrl
    } = req.body;

    let finalIdUrl = validIdUrl;
    let finalLoiUrl = loiUrl;

    if (req.files?.idFile?.[0]) {
      const file = req.files.idFile[0];
      const fileName = `id_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const filePath = `documents/${fileName}`;
      try {
        await supabase.storage.from('uploads').upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
        const { data: pubData } = supabase.storage.from('uploads').getPublicUrl(filePath);
        finalIdUrl = pubData?.publicUrl || filePath;
      } catch (upErr) {
        console.warn('[STORAGE] ID upload notice:', upErr.message);
      }
    }

    if (req.files?.letterFile?.[0]) {
      const file = req.files.letterFile[0];
      const fileName = `loi_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const filePath = `documents/${fileName}`;
      try {
        await supabase.storage.from('uploads').upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
        const { data: pubData } = supabase.storage.from('uploads').getPublicUrl(filePath);
        finalLoiUrl = pubData?.publicUrl || filePath;
      } catch (upErr) {
        console.warn('[STORAGE] LOI upload notice:', upErr.message);
      }
    }

    const targetStallId = stallId || selectedStallId;

    const result = await submitApplication({
      ...req.body,
      userId: req.user.id,
      firstName: firstName || req.body.ownerGivenName || '',
      middleName: middleName || req.body.ownerMiddleName || '',
      lastName: lastName || req.body.ownerSurname || '',
      businessName: businessName || req.body.tradeNameFranchise || '',
      businessType: businessType || 'Fish & Seafood',
      contact: contact || req.body.mobileNo || '',
      email: email || req.user.email,
      address: address || req.body.mainStreet ? `${req.body.mainStreet || ''} ${req.body.mainBarangay || ''}, ${req.body.mainMunicipality || ''}, ${req.body.mainProvince || ''}`.trim() : (address || ''),
      stallId: targetStallId,
      loiUrl: finalLoiUrl,
      validIdUrl: finalIdUrl
    });

    return res.status(201).json({
      success: true,
      id: result.id,
      user_id: result.user_id,
      stakeholderId: result.stakeholder_id,
      message: 'Application submitted successfully. Stall reserved as PENDING.',
      application: result,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function listApplications(req, res, next) {
  try {
    let query = supabase
      .from('stakeholder_applications')
      .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
      .order('submitted_at', { ascending: false });

    // Applicants can only see their own applications
    if (req.user.role === ROLES.APPLICANT || req.user.role === ROLES.VENDOR) {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, applications: data || [] });
  } catch (err) {
    next(err);
  }
}

export async function getApplicationById(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('stakeholder_applications')
      .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
      .eq('id', Number(id))
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    // Authorization check
    if (
      (req.user.role === ROLES.APPLICANT || req.user.role === ROLES.VENDOR) &&
      data.user_id !== req.user.id
    ) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    return res.json({ success: true, application: data });
  } catch (err) {
    next(err);
  }
}

export async function supervisorReview(req, res, next) {
  try {
    const { id } = req.params;
    const { approved, remarks } = req.body;

    const result = await supervisorReviewApplication(id, {
      approved: Boolean(approved),
      remarks: remarks || '',
      supervisorId: req.user.id,
      supervisorName: req.user.profile?.full_name || 'Market Supervisor'
    });

    return res.json({
      success: true,
      message: approved ? 'Application approved by the Market Supervisor.' : 'Application rejected by the Market Supervisor.',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function mayorReview(req, res, next) {
  try {
    const { id } = req.params;
    const { approved, remarks, approvalReference, signedDocumentRef } = req.body;

    const result = await mayorReviewApplication(id, {
      approved: Boolean(approved),
      remarks: remarks || '',
      approvalReference: approvalReference || signedDocumentRef || '',
      mayorId: req.user.id,
      mayorName: req.user.profile?.full_name || 'Hon. Municipal Mayor'
    });

    return res.json({
      success: true,
      message: approved ? 'LOI officially approved by Mayor. Ready for Treasurer fee payment.' : 'LOI rejected by Mayor.',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function inspectorVerify(req, res, next) {
  try {
    const { id } = req.params;
    const {
      electricalClearance,
      structuralClearance,
      fireSafetyClearance,
      sanitationClearance,
      status,
      remarks
    } = req.body;

    const result = await inspectorVerifyStall(id, {
      inspectorId: req.user.id,
      inspectorName: req.user.profile?.full_name || 'Field Inspector',
      electricalClearance: electricalClearance !== undefined ? Boolean(electricalClearance) : true,
      structuralClearance: structuralClearance !== undefined ? Boolean(structuralClearance) : true,
      fireSafetyClearance: fireSafetyClearance !== undefined ? Boolean(fireSafetyClearance) : true,
      sanitationClearance: sanitationClearance !== undefined ? Boolean(sanitationClearance) : true,
      status: status || 'PASSED',
      remarks: remarks || ''
    });

    return res.json({
      success: true,
      message: result.message,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function activateVendor(req, res, next) {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const result = await activateVendorAndCompleteApplication(id, {
      authorizedBy: req.user.id,
      authorizedRole: req.user.role,
      remarks: remarks || ''
    });

    return res.json({
      success: true,
      message: result.message,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function loiGenerate(req, res, next) {
  try {
    const { id } = req.params;
    const nowIso = new Date().toISOString();
    const refNo = req.body?.loi_reference_no || req.body?.loiReferenceNo || `LOI-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
    const snapshot = req.body?.snapshot || req.body?.loi_snapshot_json || null;

    const updateObj = {
      loi_reference_no: refNo,
      loi_status: 'GENERATED',
      loi_generated_at: nowIso,
      document_template_version: 'v1.0',
      loi_updated_at: nowIso
    };
    if (snapshot) updateObj.loi_snapshot_json = snapshot;

    const { data, error } = await supabase
      .from('stakeholder_applications')
      .update(updateObj)
      .eq('id', Number(id))
      .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
      .single();

    if (error) throw error;
    return res.json({ success: true, application: data });
  } catch (err) {
    next(err);
  }
}

export async function loiRecordPrint(req, res, next) {
  try {
    const { id } = req.params;
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('stakeholder_applications')
      .update({
        loi_printed_at: nowIso,
        loi_last_exported_at: nowIso,
        loi_status: 'PRINTED',
        loi_updated_at: nowIso
      })
      .eq('id', Number(id))
      .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
      .single();

    if (error) throw error;
    return res.json({ success: true, application: data });
  } catch (err) {
    next(err);
  }
}

export async function loiRecordReceived(req, res, next) {
  try {
    const { id } = req.params;
    const nowIso = new Date().toISOString();
    const { data: current, error: currentError } = await supabase
      .from('stakeholder_applications')
      .select('id, status, loi_received_at')
      .eq('id', Number(id))
      .maybeSingle();

    if (currentError) throw currentError;
    if (!current) throw new Error('Application not found.');
    if (current.status !== 'SUBMITTED') {
      throw new Error('Only applications endorsed to the Mayor can be received by the Mayor’s Office.');
    }
    if (current.loi_received_at) {
      return res.json({ success: true, application: current });
    }

    const { data, error } = await supabase
      .from('stakeholder_applications')
      .update({
        loi_received_at: nowIso,
        loi_status: 'RECEIVED',
        loi_updated_at: nowIso,
        current_holding_office: 'Office of the Mayor'
      })
      .eq('id', Number(id))
      .eq('status', 'SUBMITTED')
      .is('loi_received_at', null)
      .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
      .single();

    if (error) throw error;
    return res.json({ success: true, application: data });
  } catch (err) {
    next(err);
  }
}

export async function loiApprove(req, res, next) {
  try {
    const { id } = req.params;
    const nowIso = new Date().toISOString();
    const ref = String(req.body?.approval_reference || req.body?.loi_approval_reference || req.body?.signedDocumentRef || '').trim();
    const remarks = String(req.body?.remarks || req.body?.loi_remarks || '').trim();
    const { data: current, error: currentError } = await supabase
      .from('stakeholder_applications')
      .select('id, status, loi_received_at')
      .eq('id', Number(id))
      .maybeSingle();

    if (currentError) throw currentError;
    if (!current) throw new Error('Application not found.');
    if (current.status !== 'SUBMITTED') {
      throw new Error('Only applications endorsed to the Mayor can be approved.');
    }
    if (!current.loi_received_at) throw new Error('Record receipt of the signed LOI before approving.');
    if (!ref) throw new Error('An approval reference is required.');

    const { data, error } = await supabase
      .from('stakeholder_applications')
      .update({
        loi_approval_status: 'APPROVED',
        loi_status: 'APPROVED',
        loi_approved_by: req.user.id,
        loi_approved_at: nowIso,
        loi_approval_reference: ref,
        loi_remarks: remarks,
        loi_updated_at: nowIso,
        status: 'APPROVED_PENDING_ADVANCE_PAYMENT',
        mayor_approval_status: 'APPROVED',
        mayor_reviewed_by: req.user.id,
        mayor_reviewed_at: nowIso,
        current_holding_office: 'Municipal Treasury'
      })
      .eq('id', Number(id))
      .eq('status', 'SUBMITTED')
      .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
      .single();

    if (error) throw error;

    if (data?.stakeholder_id) {
      await supabase.from('stakeholders').update({
        application_status: 'APPROVED_PENDING_ADVANCE_PAYMENT'
      }).eq('id', data.stakeholder_id);

      try {
        await supabase.from('approval_history').insert({
          stakeholder_id: data.stakeholder_id,
          application_id: Number(id),
          stage: 'LOI_APPROVAL',
          status: 'APPROVED',
          action_by: req.user.id,
          actor_name: req.user.profile?.full_name || 'Office of the Municipal Mayor',
          actor_role: 'MAYOR_OFFICE',
          remarks: remarks
        });
      } catch (_) {}
    }

    return res.json({ success: true, application: data });
  } catch (err) {
    next(err);
  }
}

export async function loiReject(req, res, next) {
  try {
    const { id } = req.params;
    const nowIso = new Date().toISOString();
    const remarks = String(req.body?.remarks || req.body?.loi_remarks || '').trim();
    const { data: current, error: currentError } = await supabase
      .from('stakeholder_applications')
      .select('id, status, loi_received_at, stall_id')
      .eq('id', Number(id))
      .maybeSingle();

    if (currentError) throw currentError;
    if (!current) throw new Error('Application not found.');
    if (current.status !== 'SUBMITTED') {
      throw new Error('Only applications endorsed to the Mayor can be rejected.');
    }
    if (!current.loi_received_at) throw new Error('Record receipt of the signed LOI before rejecting.');
    if (!remarks) throw new Error('A reason is required to reject the application.');

    const { data, error } = await supabase
      .from('stakeholder_applications')
      .update({
        loi_approval_status: 'REJECTED',
        loi_status: 'REJECTED',
        loi_approved_by: req.user.id,
        loi_approved_at: nowIso,
        loi_remarks: remarks,
        loi_updated_at: nowIso,
        status: 'MAYOR_REJECTED',
        current_holding_office: 'Office of the Mayor'
      })
      .eq('id', Number(id))
      .eq('status', 'SUBMITTED')
      .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
      .single();

    if (error) throw error;

    if (current.stall_id) {
      await supabase.from('stalls').update({ status: 'AVAILABLE', updated_at: nowIso }).eq('id', current.stall_id);
    }

    if (data?.stakeholder_id) {
      await supabase.from('stakeholders').update({
        application_status: 'MAYOR_REJECTED'
      }).eq('id', data.stakeholder_id);

      try {
        await supabase.from('approval_history').insert({
          stakeholder_id: data.stakeholder_id,
          application_id: Number(id),
          stage: 'LOI_APPROVAL',
          status: 'REJECTED',
          action_by: req.user.id,
          actor_name: req.user.profile?.full_name || 'Office of the Municipal Mayor',
          actor_role: 'MAYOR_OFFICE',
          remarks: remarks
        });
      } catch (_) {}
    }

    return res.json({ success: true, application: data });
  } catch (err) {
    next(err);
  }
}

export async function loiProgress(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('stakeholder_applications')
      .select('id, application_no, loi_reference_no, loi_status, loi_approval_status, loi_generated_at, loi_last_exported_at, loi_printed_at, loi_received_at, loi_approved_at, loi_approval_reference, loi_remarks, loi_snapshot_json, document_template_version')
      .eq('id', Number(id))
      .single();

    if (error) throw error;
    return res.json({ success: true, progress: data });
  } catch (err) {
    next(err);
  }
}


