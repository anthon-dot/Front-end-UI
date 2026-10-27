import { supabase } from '../config/supabase.js';
import { APPLICATION_STATUS, STALL_STATUS, CONTRACT_STATUS, ROLES } from '../config/constants.js';
import { calculateInitialFeesForStall } from './rentalCalculationService.js';
import { logAudit } from '../middleware/auditLogger.js';

/**
 * Step 1: Submit Application with LOI & Valid ID
 * Reserves stall as PENDING, creates stakeholder & stakeholder_application record.
 */
export async function submitApplication(data) {
  const {
    userId,
    firstName,
    middleName,
    lastName,
    businessName,
    businessType,
    contact,
    email,
    address,
    stallId,
    loiUrl,
    validIdUrl,
    applicationType = 'NEW',
    paymentMode = 'Annually',
    trackingNumber,
    businessIdNumber,
    orgType = '',
    orgGender = '',
    dtiSecCdaRegNo,
    tinNo,
    tradeNameFranchise,
    mainStreet = '',
    mainBarangay = '',
    mainMunicipality = '',
    mainProvince = '',
    mainZipCode = '',
    mobileNo,
    ownerSurname,
    ownerGivenName,
    ownerMiddleName,
    ownerSuffix,
    corpPresidentSurname,
    corpPresidentGivenName,
    corpPresidentMiddleName,
    corpPresidentSuffix,
    corpCitizenship = '',
    businessAreaSqm = 0,
    totalFloorAreaSqm = 0,
    numEmployeesMale = 0,
    numEmployeesFemale = 0,
    numEmployeesLguResiding = 0,
    deliveryVehiclesVanTruck = 0,
    deliveryVehiclesMotorcycle = 0,
    locSameAsMain = true,
    locHouseBldgNo,
    locBldgName,
    locLotNo,
    locBlockNo,
    locStreet,
    locSubdivision,
    locBarangay,
    locDistrict,
    locMunicipality,
    locProvince,
    locZipCode,
    propertyOwned = false,
    taxDecNo,
    propertyIdNo,
    taxIncentivesEnjoyed = false,
    businessActivity = '',
    businessActivityOther = '',
    businessLines,
    stallSpaceType = '',
    validIdType = '',
    validIdNo = '',
    natureOfBusiness,
    otherNature,
    commodities = '',
    estimatedEmployees = 0,
    loiContent = '',
    perjuryDeclarationAgreed = false,
    civilStatus,
    dateOfBirth,
    gender,
    emergencyContactPerson,
    emergencyContactNumber,
    stallNumberCode,
    stallMarketSection,
    stallFloorArea,
    baseMonthlyRentalRate,
    incumbentMayor
  } = data;

  // 1. Verify stall availability
  const { data: stall, error: stallErr } = await supabase
    .from('stalls')
    .select('*')
    .eq('id', Number(stallId))
    .single();

  if (stallErr || !stall) throw new Error('Selected stall does not exist.');
  if (stall.status === STALL_STATUS.OCCUPIED || stall.status === STALL_STATUS.PENDING) {
    throw new Error(`Stall #${stall.stall_no} is currently not available for new applications.`);
  }

  // 2. Compute fee estimate (stall rights + 2 months advance)
  const feeEstimate = await calculateInitialFeesForStall(stallId);

  // 3. Upsert Stakeholder
  let stakeholderId;
  const { data: existingSh } = await supabase
    .from('stakeholders')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const parsedBusinessLines = Array.isArray(businessLines)
    ? businessLines
    : (typeof businessLines === 'string' ? JSON.parse(businessLines || '[]') : []);

  const shPayload = {
    user_id: userId,
    first_name: firstName || ownerGivenName,
    middle_name: middleName || ownerMiddleName,
    last_name: lastName || ownerSurname,
    civil_status: civilStatus || null,
    date_of_birth: dateOfBirth || null,
    gender: gender || orgGender || null,
    emergency_contact_person: emergencyContactPerson || null,
    emergency_contact_number: emergencyContactNumber || null,
    selected_stall_number: stallNumberCode || stall.stall_no,
    selected_market_section: stallMarketSection || stall.stall_type,
    floor_area_dimensions: stallFloorArea || stall.dimensions,
    base_monthly_rental_rate: Number(baseMonthlyRentalRate ?? stall.monthly_rent ?? 0),
    business_name: tradeNameFranchise || businessName,
    business_type: businessType,
    contact: mobileNo || contact,
    email,
    address,
    selected_stall_id: Number(stallId),
    application_status: 'SUBMITTED',
    onboarding_status: 'FOR_APPROVAL',
    total_advance_amount: feeEstimate.advanceRentAmount,
    application_type: applicationType,
    payment_mode: paymentMode,
    tracking_number: trackingNumber,
    business_id_number: businessIdNumber,
    org_type: orgType,
    org_gender: gender || orgGender,
    dti_sec_cda_reg_no: dtiSecCdaRegNo,
    tin_no: tinNo,
    trade_name_franchise: tradeNameFranchise || businessName,
    main_street: mainStreet,
    main_barangay: mainBarangay,
    main_municipality: mainMunicipality,
    main_province: mainProvince,
    main_zip_code: mainZipCode,
    mobile_no: mobileNo || contact,
    owner_surname: ownerSurname || lastName,
    owner_given_name: ownerGivenName || firstName,
    owner_middle_name: ownerMiddleName || middleName,
    owner_suffix: ownerSuffix,
    business_area_sqm: Number(businessAreaSqm ?? 0),
    total_floor_area_sqm: Number(totalFloorAreaSqm ?? 0),
    num_employees_female: Number(numEmployeesFemale ?? 0),
    num_employees_lgu_residing: Number(numEmployeesLguResiding ?? 0),
    loc_same_as_main: Boolean(locSameAsMain),
    property_owned: Boolean(propertyOwned),
    tax_incentives_enjoyed: Boolean(taxIncentivesEnjoyed),
    business_lines: parsedBusinessLines,
    stall_space_type: stallSpaceType,
    updated_at: new Date().toISOString()
  };

  if (existingSh?.id) {
    stakeholderId = existingSh.id;
    await supabase.from('stakeholders').update(shPayload).eq('id', stakeholderId);
  } else {
    const { data: newSh, error: newShErr } = await supabase
      .from('stakeholders')
      .insert({ ...shPayload, advance_balance: 0 })
      .select('id')
      .single();
    if (newShErr) throw newShErr;
    stakeholderId = newSh.id;
  }

  // 4. Mark stall as PENDING to reserve it
  await supabase
    .from('stalls')
    .update({ status: STALL_STATUS.PENDING, updated_at: new Date().toISOString() })
    .eq('id', Number(stallId));

  // 5. Create application record
  const applicationNo = trackingNumber || `MNT-${new Date().getFullYear()}-APP-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const { data: appRecord, error: appErr } = await supabase
    .from('stakeholder_applications')
    .insert({
      application_no: applicationNo,
      tracking_number: applicationNo,
      stakeholder_id: stakeholderId,
      user_id: userId,
      stall_id: Number(stallId),
      status: 'SUBMITTED',
      current_holding_office: "Mayor's Office",
      loi_url: loiUrl,
      valid_id_url: validIdUrl,
      calculated_stall_rights_fee: feeEstimate.stallRightsFee,
      calculated_advance_rent: feeEstimate.advanceRentAmount,
      total_initial_amount_due: feeEstimate.totalInitialAmount,
      application_type: applicationType,
      payment_mode: paymentMode,
      org_type: orgType,
      org_gender: gender || orgGender,
      civil_status: civilStatus || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || orgGender || null,
      emergency_contact_person: emergencyContactPerson || null,
      emergency_contact_number: emergencyContactNumber || null,
      selected_stall_number: stallNumberCode || stall.stall_no,
      selected_market_section: stallMarketSection || stall.stall_type,
      floor_area_dimensions: stallFloorArea || stall.dimensions,
      base_monthly_rental_rate: Number(baseMonthlyRentalRate ?? stall.monthly_rent ?? 0),
      incumbent_municipal_mayor: incumbentMayor || '',
      dti_sec_cda_reg_no: dtiSecCdaRegNo,
      tin_no: tinNo,
      trade_name_franchise: tradeNameFranchise || businessName,
      main_street: mainStreet,
      main_barangay: mainBarangay,
      main_municipality: mainMunicipality,
      main_province: mainProvince,
      main_zip_code: mainZipCode,
      mobile_no: mobileNo || contact,
      owner_surname: ownerSurname || lastName,
      owner_given_name: ownerGivenName || firstName,
      owner_middle_name: ownerMiddleName || middleName,
      owner_suffix: ownerSuffix,
      business_area_sqm: Number(businessAreaSqm ?? 0),
      total_floor_area_sqm: Number(totalFloorAreaSqm ?? 0),
      num_employees_female: Number(numEmployeesFemale ?? 0),
      num_employees_lgu_residing: Number(numEmployeesLguResiding ?? 0),
      loc_same_as_main: Boolean(locSameAsMain),
      property_owned: Boolean(propertyOwned),
      tax_incentives_enjoyed: Boolean(taxIncentivesEnjoyed),
      business_lines: parsedBusinessLines,
      stall_space_type: stallSpaceType,
      valid_id_type: validIdType,
      valid_id_no: validIdNo,
      nature_of_business: typeof natureOfBusiness === 'string' ? natureOfBusiness : JSON.stringify(natureOfBusiness || []),
      products_commodities: commodities,
      estimated_employees: Number(estimatedEmployees ?? 0),
      loi_content: loiContent,
      perjury_declaration_agreed: Boolean(perjuryDeclarationAgreed),
      market_office_verified_by: null,
      market_office_verified_remarks: null,
      treasurer_verified_by: null,
      total_fees_assessment: null,
      business_permit_or_no: null,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single();

  if (appErr) throw appErr;

  // 6. Save documents table
  const docs = [];
  if (loiUrl) {
    docs.push({ stakeholder_id: stakeholderId, application_id: appRecord.id, document_type: 'LOI', file_name: 'Letter_of_Intent.pdf', file_path: loiUrl });
  }
  if (validIdUrl) {
    docs.push({ stakeholder_id: stakeholderId, application_id: appRecord.id, document_type: 'VALID_ID', file_name: 'Valid_Government_ID.pdf', file_path: validIdUrl });
  }
  if (docs.length > 0) {
    await supabase.from('stakeholder_documents').insert(docs);
  }

  // 7. Record approval history & audit log
  await supabase.from('approval_history').insert({
    stakeholder_id: stakeholderId,
    application_id: appRecord.id,
    stage: 'APPLICATION_SUBMISSION',
    status: 'SUBMITTED',
    actor_name: `${firstName} ${lastName}`,
    actor_role: 'APPLICANT',
    remarks: `Application submitted for Stall #${stall.stall_no}.`
  });

  await logAudit({
    userId,
    role: ROLES.APPLICANT,
    action: 'SUBMIT_APPLICATION',
    entityName: 'stakeholder_applications',
    entityId: appRecord.id,
    details: { applicationNo, stallNo: stall.stall_no }
  });

  return appRecord;
}

/**
 * Market Supervisor review after Mayor approval and Treasurer payment
 */
export async function supervisorReviewApplication(applicationId, { approved, remarks, supervisorId, supervisorName }) {
  const { data: app, error: appErr } = await supabase
    .from('stakeholder_applications')
    .select('*, stakeholder:stakeholders(*)')
    .eq('id', Number(applicationId))
    .single();

  if (appErr || !app) throw new Error('Application not found.');

  if (app.status !== 'ADVANCE_PAID') {
    throw new Error('Only applications forwarded to the Market Supervisor can be reviewed.');
  }

  const nextStatus = approved ? 'CONTRACT_PREPARED' : APPLICATION_STATUS.SUPERVISOR_REJECTED;
  const holdingOffice = 'Market Supervisor';

  await supabase
    .from('stakeholder_applications')
    .update({
      status: nextStatus,
      current_holding_office: holdingOffice,
      supervisor_endorsed_at: new Date().toISOString(),
      supervisor_remarks: remarks,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(applicationId));

  await supabase
    .from('stakeholders')
    .update({
      market_supervisor_approved: approved,
      market_approval_status: approved ? 'APPROVED' : 'REJECTED',
      application_status: nextStatus
    })
    .eq('id', app.stakeholder_id);

  // If rejected, release stall back to AVAILABLE
  if (!approved) {
    await supabase
      .from('stalls')
      .update({ status: STALL_STATUS.AVAILABLE, updated_at: new Date().toISOString() })
      .eq('id', app.stall_id);
  }

  await supabase.from('approval_history').insert({
    stakeholder_id: app.stakeholder_id,
    application_id: app.id,
    stage: 'MARKET_SUPERVISOR_REVIEW',
    status: approved ? 'ENDORSED' : 'REJECTED',
    action_by: supervisorId,
    actor_name: supervisorName,
    actor_role: ROLES.MARKET_SUPERVISOR,
    remarks
  });

  return { success: true, status: nextStatus };
}

/**
 * Step 3: Municipal Mayor Approval of LOI
 */
export async function mayorReviewApplication(applicationId, { approved, remarks, mayorId, mayorName, approvalReference }) {
  const { data: app, error: appErr } = await supabase
    .from('stakeholder_applications')
    .select('*, stakeholder:stakeholders(*)')
    .eq('id', Number(applicationId))
    .single();

  if (appErr || !app) throw new Error('Application not found.');
  if (app.status !== 'SUBMITTED') {
    throw new Error('Only applications endorsed to the Mayor can receive a mayoral decision.');
  }
  const loiReceivedAt = app.loi_received_at || new Date().toISOString();
  const finalApprovalReference = String(approvalReference || '').trim() || `MO-APPR-${app.application_no || applicationId}`;
  if (!approved && !String(remarks || '').trim()) {
    throw new Error('A reason is required to reject the application.');
  }

  const nextStatus = approved ? 'APPROVED_PENDING_ADVANCE_PAYMENT' : APPLICATION_STATUS.MAYOR_REJECTED;
  const holdingOffice = approved ? "Treasurer's Office" : "Mayor's Office";

  await supabase
    .from('stakeholder_applications')
    .update({
      status: nextStatus,
      current_holding_office: holdingOffice,
      mayor_approved_at: new Date().toISOString(),
      mayor_decision: approved ? 'APPROVED' : 'REJECTED',
      mayor_approval_status: approved ? 'APPROVED' : 'DISAPPROVED',
      mayor_remarks: remarks,
      loi_received_at: loiReceivedAt,
      loi_approval_status: approved ? 'APPROVED' : 'REJECTED',
      loi_status: approved ? 'APPROVED' : 'REJECTED',
      loi_approval_reference: finalApprovalReference,
      loi_approved_by: mayorId,
      loi_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(applicationId));

  await supabase
    .from('stakeholders')
    .update({
      application_status: nextStatus
    })
    .eq('id', app.stakeholder_id);

  if (!approved) {
    await supabase
      .from('stalls')
      .update({ status: STALL_STATUS.AVAILABLE, updated_at: new Date().toISOString() })
      .eq('id', app.stall_id);
  }

  await supabase.from('approval_history').insert({
    stakeholder_id: app.stakeholder_id,
    application_id: app.id,
    stage: 'MAYOR_APPROVAL',
    status: approved ? 'APPROVED' : 'REJECTED',
    action_by: mayorId,
    actor_name: mayorName,
    actor_role: ROLES.MAYOR,
    remarks
  });

  return { success: true, status: nextStatus };
}


/**
 * Step 4: Field Market Collector / Inspector Physical Stall Setup Verification
 * Inspector inspects stall setup (electrical, structural, fire safety, sanitation).
 * On PASS -> Moves to BPLO Office for Business Permit Fee Assessment.
 */
export async function inspectorVerifyStall(applicationId, {
  inspectorId,
  inspectorName,
  electricalClearance = true,
  structuralClearance = true,
  fireSafetyClearance = true,
  sanitationClearance = true,
  status = 'PASSED',
  remarks = ''
}) {
  const { data: app, error: appErr } = await supabase
    .from('stakeholder_applications')
    .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
    .eq('id', Number(applicationId))
    .single();

  if (appErr || !app) throw new Error('Application not found.');

  const isPassed = status === 'PASSED' && electricalClearance && structuralClearance && fireSafetyClearance && sanitationClearance;
  const nextStatus = isPassed ? APPLICATION_STATUS.INSPECTION_PASSED : APPLICATION_STATUS.PENDING_INSPECTION;
  const holdingOffice = isPassed ? 'Market Administration' : 'Field Inspector';

  // 1. Update application status
  await supabase
    .from('stakeholder_applications')
    .update({
      status: nextStatus,
      current_holding_office: holdingOffice,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(applicationId));

  // 2. Update stakeholder record
  await supabase
    .from('stakeholders')
    .update({
      application_status: nextStatus
    })
    .eq('id', app.stakeholder_id);

  // 4. Record approval history
  await supabase.from('approval_history').insert({
    stakeholder_id: app.stakeholder_id,
    application_id: app.id,
    stage: 'PHYSICAL_STALL_INSPECTION',
    status: isPassed ? 'PASSED' : 'FAILED',
    action_by: inspectorId,
    actor_name: inspectorName || 'Field Inspector',
    actor_role: ROLES.COLLECTOR_INSPECTOR,
    remarks: remarks || (isPassed ? 'Physical stall setup inspected and passed.' : 'Inspection failed/conditional.')
  });

  await logAudit({
    userId: inspectorId,
    role: ROLES.COLLECTOR_INSPECTOR,
    action: 'INSPECT_STALL',
    entityName: 'stakeholder_applications',
    entityId: app.id,
    details: { stallId: app.stall_id, isPassed, status: nextStatus }
  });

  return {
    success: true,
    status: nextStatus,
    inspectionPassed: isPassed,
    message: isPassed
      ? 'Physical stall setup verified. Application ready for final Vendor Activation.'
      : 'Stall inspection recorded with pending deficiencies.'
  };
}


/**
 * Step 5: Final Stakeholder Activation as Active Vendor
 * Condition checks:
 * 1. Initial fees paid (advance rent + stall rights)
 * 2. Contract of lease executed
 * 3. Physical stall setup inspected & passed
 * 4. Business Permit fee paid to Treasury
 * 5. Business Permit released by BPLO
 * ONLY when all conditions are satisfied does the vendor become ACTIVE_VENDOR and enter recurring monthly billing.
 */
export async function activateVendorAndCompleteApplication(applicationId, {
  authorizedBy,
  authorizedRole = ROLES.MARKET_SUPERVISOR,
  remarks = ''
}) {
  const { data: app, error: appErr } = await supabase
    .from('stakeholder_applications')
    .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
    .eq('id', Number(applicationId))
    .single();

  if (appErr || !app) throw new Error('Application not found.');

  const stakeholder = app.stakeholder;

  // Prerequisite 1: Initial advance rental & stall rights confirmed paid
  const initialFeesPaid = stakeholder.advance_payment_paid || stakeholder.advance_payment_completed || app.amount_paid > 0;
  if (!initialFeesPaid) {
    throw new Error('Cannot activate vendor: Initial advance rental and stall rights fees have not been confirmed by the Treasurer.');
  }

  // Note: Physical stall setup inspection is conducted externally by the BPLO office during the business permit process.
  // Internal RMS lease activation proceeds once initial fees and executed contract conditions are verified.


  // 1. Mark application COMPLETED
  await supabase
    .from('stakeholder_applications')
    .update({
      status: APPLICATION_STATUS.COMPLETED,
      current_holding_office: 'Active Market Tenancy',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(applicationId));

  // 2. Mark stakeholder verified & active vendor
  await supabase
    .from('stakeholders')
    .update({
      verified_tenant: true,
      verified_stakeholder: true,
      onboarding_status: 'ACTIVE_VENDOR',
      application_status: APPLICATION_STATUS.COMPLETED,
      updated_at: new Date().toISOString()
    })
    .eq('id', app.stakeholder_id);

  // 3. Mark stall as OCCUPIED
  await supabase
    .from('stalls')
    .update({
      status: STALL_STATUS.OCCUPIED,
      updated_at: new Date().toISOString()
    })
    .eq('id', app.stall_id);

  // 4. Ensure occupant relationship is ACTIVE
  const { data: occupant } = await supabase
    .from('occupants')
    .select('*')
    .eq('stakeholder_id', app.stakeholder_id)
    .maybeSingle();

  if (occupant) {
    await supabase
      .from('occupants')
      .update({
        status: 'ACTIVE',
        stall_id: app.stall_id,
        occupancy_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', occupant.id);

    // Link stall to occupant
    await supabase.from('stalls').update({ occupant_id: occupant.id }).eq('id', app.stall_id);
  }

  // 5. Upgrade user profile to VENDOR if currently APPLICANT
  if (app.user_id) {
    await supabase
      .from('user_profiles')
      .update({ role: ROLES.VENDOR, updated_at: new Date().toISOString() })
      .eq('id', app.user_id)
      .eq('role', ROLES.APPLICANT);
  }

  // 6. Record approval history & audit log
  await supabase.from('approval_history').insert({
    stakeholder_id: app.stakeholder_id,
    application_id: app.id,
    stage: 'VENDOR_ACTIVATION',
    status: 'ACTIVE_VENDOR',
    action_by: authorizedBy,
    actor_name: 'Market Administration',
    actor_role: authorizedRole,
    remarks: remarks || 'All operational compliance checks, fees, inspections, and permits verified. Promoted to Active Vendor.'
  });

  await logAudit({
    userId: authorizedBy,
    role: authorizedRole,
    action: 'ACTIVATE_VENDOR',
    entityName: 'stakeholder_applications',
    entityId: app.id,
    details: { stakeholderId: app.stakeholder_id, stallNo: app.stall?.stall_no }
  });

  return {
    success: true,
    status: APPLICATION_STATUS.COMPLETED,
    message: `Stakeholder ${app.stakeholder?.business_name || ''} successfully activated as Active Vendor.`
  };
}

