import { supabase } from '../config/supabase.js';
import { CONTRACT_STATUS, APPLICATION_STATUS, STALL_STATUS, ROLES } from '../config/constants.js';
import { generateContractPDF } from '../utils/pdfGenerator.js';
import { logAudit } from '../middleware/auditLogger.js';

export async function prepareContractForApplication(applicationId, { supervisorId, terms }) {
  const { data: app, error: appErr } = await supabase
    .from('stakeholder_applications')
    .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
    .eq('id', Number(applicationId))
    .single();

  if (appErr || !app) throw new Error('Application record not found.');

  const stall = app.stall;
  const stakeholder = app.stakeholder;

  // 1. Ensure occupant record exists in PENDING state
  let occupantId;
  const { data: exOcc } = await supabase
    .from('occupants')
    .select('id')
    .eq('stakeholder_id', stakeholder.id)
    .maybeSingle();

  if (exOcc?.id) {
    occupantId = exOcc.id;
  } else {
    const { data: newOcc, error: occErr } = await supabase
      .from('occupants')
      .insert({
        stakeholder_id: stakeholder.id,
        stall_id: stall.id,
        status: 'PENDING',
        advance_balance: stakeholder.advance_balance || 0
      })
      .select('id')
      .single();
    if (occErr) throw occErr;
    occupantId = newOcc.id;
  }

  // 2. Prepare 5-Year lease duration per Municipal Ordinance No. 01, Series of 2018
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 5);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const contractNo = `CON-${Date.now().toString().slice(-8)}`;

  const snapshot = {
    contractNo,
    templateVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    stakeholder: {
      id: stakeholder.id,
      name: `${stakeholder.first_name} ${stakeholder.last_name}`,
      businessName: stakeholder.business_name,
      address: stakeholder.address,
      contact: stakeholder.contact
    },
    stall: {
      id: stall.id,
      stallNo: stall.stall_no,
      stallType: stall.stall_type,
      monthlyRent: Number(stall.monthly_rent || 1500)
    },
    leaseTerms: {
      durationYears: 5,
      startDate: startDateStr,
      endDate: endDateStr,
      billingFrequency: 'MONTHLY',
      advancePaymentMonths: 2,
      stallRightsFee: (stall.stall_type || '').toUpperCase().includes('CORNER') ? 7000 : 5000
    }
  };

  // 3. Upsert contract record with PENDING_EXECUTION status
  const { data: contract, error: conErr } = await supabase
    .from('contracts')
    .upsert({
      contract_no: contractNo,
      application_id: Number(applicationId),
      occupant_id: occupantId,
      stall_id: stall.id,
      stakeholder_id: stakeholder.id,
      start_date: startDateStr,
      end_date: endDateStr,
      monthly_rent: Number(stall.monthly_rent || 1500),
      billing_frequency: 'MONTHLY',
      terms: terms || 'Standard 5-Year Public Market Commercial Lease Agreement (Ordinance No. 01, S. 2018)',
      status: CONTRACT_STATUS.PENDING_EXECUTION,
      initial_payments_verified: false,
      contract_snapshot_json: snapshot,
      document_template_version: '1.0.0',
      updated_at: new Date().toISOString()
    }, { onConflict: 'contract_no' })
    .select()
    .single();

  if (conErr) throw conErr;

  // 4. Update application & stakeholder
  await supabase
    .from('stakeholder_applications')
    .update({
      contract_prepared_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId);

  await supabase
    .from('stakeholders')
    .update({ contract_id: contract.id })
    .eq('id', stakeholder.id);

  return contract;
}

export async function recordContractSigning(contractId, { userId, signedDate, remarks }) {
  const nowIso = new Date().toISOString();
  const effectiveSignedDate = signedDate || nowIso.split('T')[0];

  const { data: contract, error: conErr } = await supabase
    .from('contracts')
    .update({
      signed_date: effectiveSignedDate,
      signing_recorded_by: userId,
      signing_recorded_at: nowIso,
      signed_by_stakeholder: true,
      signed_by_lgu: true,
      signed_at: nowIso,
      updated_at: nowIso
    })
    .eq('id', Number(contractId))
    .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
    .single();

  if (conErr || !contract) throw new Error('Failed to record contract physical signing: ' + (conErr?.message || 'Contract not found'));

  await logAudit({
    userId,
    role: ROLES.MARKET_SUPERVISOR,
    action: 'CONTRACT_SIGNING_RECORDED',
    entityName: 'contracts',
    entityId: contractId,
    details: { signedDate: effectiveSignedDate, remarks }
  });

  return contract;
}

export async function verifyContractInitialPayments(contractId, { userId, remarks }) {
  const nowIso = new Date().toISOString();

  const { data: contract, error: conErr } = await supabase
    .from('contracts')
    .update({
      initial_payments_verified: true,
      initial_payments_verified_by: userId,
      initial_payments_verified_at: nowIso,
      updated_at: nowIso
    })
    .eq('id', Number(contractId))
    .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
    .single();

  if (conErr || !contract) throw new Error('Failed to verify initial payments: ' + (conErr?.message || 'Contract not found'));

  await logAudit({
    userId,
    role: ROLES.TREASURER,
    action: 'INITIAL_PAYMENTS_VERIFIED',
    entityName: 'contracts',
    entityId: contractId,
    details: { remarks }
  });

  return contract;
}

export async function executeContract(contractId, { userId, supervisorName }) {
  const { data: contract, error: conErr } = await supabase
    .from('contracts')
    .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
    .eq('id', Number(contractId))
    .single();

  if (conErr || !contract) throw new Error('Contract not found.');

  // Precondition gate: Physical signing must be recorded
  if (!contract.signed_date) {
    throw new Error('Cannot activate contract: Physical contract signing has not been recorded.');
  }

  // Precondition gate: Initial payments must be verified by Treasurer
  if (!contract.initial_payments_verified) {
    throw new Error('Cannot activate contract: Initial payments (advance rent and stall rights fee) have not been verified by the Treasurer.');
  }

  // Generate official PDF
  const pdfBuffer = await generateContractPDF({
    contractNo: contract.contract_no,
    vendorName: `${contract.occupant.stakeholder.first_name} ${contract.occupant.stakeholder.last_name}`,
    businessName: contract.occupant.stakeholder.business_name,
    stallNo: contract.stall.stall_no,
    stallType: contract.stall.stall_type,
    monthlyRent: contract.monthly_rent,
    startDate: contract.start_date,
    endDate: contract.end_date,
    supervisorName
  });

  // Store in Supabase Storage or document path
  const storagePath = `contracts/${contract.contract_no}.pdf`;
  try {
    await supabase.storage.from('uploads').upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });
  } catch (_) {}

  // Update contract status to ACTIVE
  const nowIso = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from('contracts')
    .update({
      status: CONTRACT_STATUS.ACTIVE,
      executed_by: userId,
      executed_at: nowIso,
      activated_at: nowIso,
      document_url: storagePath
    })
    .eq('id', Number(contractId))
    .select()
    .single();

  if (updErr) throw updErr;

  // Transition stall to OCCUPIED and occupant to ACTIVE
  if (contract.stall_id) {
    try {
      await supabase.from('stalls').update({ status: 'OCCUPIED', occupant_id: contract.occupant_id }).eq('id', contract.stall_id);
    } catch (_) {}
  }
  if (contract.occupant_id) {
    try {
      await supabase.from('occupants').update({ status: 'ACTIVE', is_archived: false }).eq('id', contract.occupant_id);
    } catch (_) {}
  }

  await logAudit({
    userId,
    role: ROLES.MARKET_SUPERVISOR,
    action: 'CONTRACT_ACTIVATED',
    entityName: 'contracts',
    entityId: contractId,
    details: { contractNo: contract.contract_no }
  });

  return updated;
}
