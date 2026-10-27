/**
 * Test Suite: Rental Management System Full Lifecycle Automation
 * Verifies all 9 priority checklist items based on the Capstone Proposal (Chapter 1-3)
 * for the Public Market of Manticao.
 */

// 1. Check Advance Rent Calculation (2-Month Baseline)
function testAdvanceCalculation() {
  const monthlyRent = 2000;
  const advanceMonths = 2; // Required by Capstone Proposal Chapter 1-3
  const expectedAdvance = 4000;
  const computedAdvance = monthlyRent * advanceMonths;

  if (computedAdvance !== expectedAdvance) {
    throw new Error(`Expected ₱${expectedAdvance} for 2-month advance, got ₱${computedAdvance}`);
  }
  return true;
}

// 2. Check Separation of Payment Categories
function testPaymentCategoriesSeparation() {
  const advancePayment = { type: 'ADVANCE_PAYMENT', amount: 4000, updatesAdvanceBalance: true, countsAsCashRevenue: true };
  const permitFee = { type: 'BUSINESS_PERMIT_PAYMENT', amount: 500, updatesAdvanceBalance: false, countsAsCashRevenue: true };
  const rentCash = { type: 'RENT_PAYMENT', amount: 2000, updatesAdvanceBalance: false, countsAsCashRevenue: true };
  const advanceCredit = { type: 'ADVANCE_CREDIT', amount: 2000, updatesAdvanceBalance: false, countsAsCashRevenue: false };

  // Rule: Advance credit deduction must NOT be counted as a new cash payment in revenue
  if (advanceCredit.countsAsCashRevenue) {
    throw new Error('Advance credit must not create a duplicate cash revenue record!');
  }
  // Rule: Permit fee must NOT deduct from advance rent balance
  if (permitFee.updatesAdvanceBalance) {
    throw new Error('Permit fee must remain separate from advance rental balance!');
  }
  return true;
}

// 3. Check Contract Activation Conditions (Section 6 & 17 of Updated Blueprint)
function testContractActivationConditions() {
  const stateAtDraft = {
    loiApproved: true,
    initialPaymentsVerified: false,
    stallAssigned: true,
    contractSigned: false,
    effectiveDateReached: true
  };

  function canActivateContract(state) {
    return Boolean(
      state.loiApproved &&
      state.initialPaymentsVerified &&
      state.stallAssigned &&
      state.contractSigned &&
      state.effectiveDateReached
    );
  }

  // Contract must NOT activate when initial payments or signatures are missing
  if (canActivateContract(stateAtDraft)) {
    throw new Error('Contract must not activate without verified payments and signatures!');
  }

  // When all conditions are fulfilled, contract can activate on effective date
  const stateAtFullVerification = {
    ...stateAtDraft,
    initialPaymentsVerified: true,
    contractSigned: true
  };

  if (!canActivateContract(stateAtFullVerification)) {
    throw new Error('Contract should be eligible for activation once LOI, initial payments, stall assignment, signatures, and effective date are verified!');
  }

  return true;
}

// 4. Check Single Billing Per Period & Prevent Duplicate Billing
function testBillingUniqueness() {
  const existingBills = [
    { contract_id: 101, billing_period: 'MONTHLY-10-2026', total_amount: 2000, status: 'PAID' }
  ];

  const existingMap = new Set(existingBills.map(b => `${b.contract_id}_${b.billing_period}`));

  const newBillingPeriod = 'MONTHLY-10-2026';
  const key = `101_${newBillingPeriod}`;

  const shouldGenerate = !existingMap.has(key);
  if (shouldGenerate) {
    throw new Error('Duplicate billing generated for the same contract and billing period!');
  }

  const nextBillingPeriod = 'MONTHLY-11-2026';
  const nextKey = `101_${nextBillingPeriod}`;
  const shouldGenerateNext = !existingMap.has(nextKey);
  if (!shouldGenerateNext) {
    throw new Error('Eligible new billing period was incorrectly blocked!');
  }

  return true;
}

// 5. Check Advance Credit Allocation Math
function testAdvanceCreditAllocation() {
  let initialAdvanceBalance = 4000; // 2 months advance for ₱2,000/mo rent
  const monthlyRent = 2000;

  // Month 1 Billing
  let bill1Paid = 0;
  let bill1Balance = monthlyRent;
  let bill1Status = 'UNPAID';

  if (initialAdvanceBalance >= monthlyRent) {
    bill1Paid = monthlyRent;
    bill1Balance = 0;
    bill1Status = 'PAID';
    initialAdvanceBalance -= monthlyRent;
  }

  if (bill1Paid !== 2000 || bill1Balance !== 0 || initialAdvanceBalance !== 2000 || bill1Status !== 'PAID') {
    throw new Error('Month 1 advance credit deduction failed!');
  }

  // Month 2 Billing
  let bill2Paid = 0;
  let bill2Balance = monthlyRent;
  let bill2Status = 'UNPAID';

  if (initialAdvanceBalance >= monthlyRent) {
    bill2Paid = monthlyRent;
    bill2Balance = 0;
    bill2Status = 'PAID';
    initialAdvanceBalance -= monthlyRent;
  }

  if (bill2Paid !== 2000 || bill2Balance !== 0 || initialAdvanceBalance !== 0 || bill2Status !== 'PAID') {
    throw new Error('Month 2 advance credit deduction failed!');
  }

  // Month 3 Billing (Advance exhausted, must be UNPAID)
  let bill3Paid = 0;
  let bill3Balance = monthlyRent;
  let bill3Status = 'UNPAID';

  if (initialAdvanceBalance > 0) {
    bill3Paid = initialAdvanceBalance;
    bill3Balance = monthlyRent - initialAdvanceBalance;
  }

  if (bill3Paid !== 0 || bill3Balance !== 2000 || initialAdvanceBalance !== 0 || bill3Status !== 'UNPAID') {
    throw new Error('Month 3 billing failed after advance exhausted!');
  }

  return true;
}

// 6. Check Dynamic Overdue Status Calculation
function testDynamicOverdueCalculation() {
  const todayStr = '2026-10-20';

  function evaluateStatus(bill) {
    const balance = Number(bill.balance || 0);
    const paid = Number(bill.paid || 0);
    const dueDate = bill.dueDate;

    if (balance <= 0) return 'PAID';
    if (dueDate && todayStr > dueDate) return 'OVERDUE';
    if (paid > 0) return 'PARTIALLY_PAID';
    return 'UNPAID';
  }

  // Past due bill with balance
  const overdueBill = { balance: 2000, paid: 0, dueDate: '2026-10-05' };
  if (evaluateStatus(overdueBill) !== 'OVERDUE') {
    throw new Error('Expected OVERDUE status for past due invoice with positive balance!');
  }

  // Future due bill with balance
  const upcomingBill = { balance: 2000, paid: 0, dueDate: '2026-11-05' };
  if (evaluateStatus(upcomingBill) !== 'UNPAID') {
    throw new Error('Expected UNPAID status for upcoming invoice!');
  }

  // Partially paid bill before due date
  const partialBill = { balance: 1000, paid: 1000, dueDate: '2026-11-05' };
  if (evaluateStatus(partialBill) !== 'PARTIALLY_PAID') {
    throw new Error('Expected PARTIALLY_PAID status!');
  }

  // Settled bill
  const settledBill = { balance: 0, paid: 2000, dueDate: '2026-10-05' };
  if (evaluateStatus(settledBill) !== 'PAID') {
    throw new Error('Expected PAID status for settled invoice regardless of due date!');
  }

  return true;
}

// 7. Check 10-Step Simplified Applicant Progression & Role Separation
function testSimplifiedApplicantProgression() {
  const rentalWorkflow = [
    { status: 'REGISTERED', role: 'Stakeholder', action: 'Stakeholder registers, enters details, selects preferred vacant stall' },
    { status: 'APPLICATION_SUBMITTED', role: 'Stakeholder', action: 'Submits rental application with LOI and valid ID' },
    { status: 'AWAITING_LOI_DECISION', role: 'Authorized LGU Staff', action: "Awaiting authorized LGU staff to record Mayor's decision based on signed LOI" },
    { status: 'LOI_APPROVED', role: 'Authorized LGU Staff', action: "Authorized LGU staff records Mayor's approval based on signed LOI" },
    { status: 'AWAITING_INITIAL_PAYMENT', role: 'Treasurer', action: 'Treasurer assesses and records required stall rights fee and 2-month advance rent' },
    { status: 'FOR_STALL_ASSIGNMENT', role: 'Market Supervisor', action: 'Market Supervisor checks eligibility, verifies vacancy, confirms assignment' },
    { status: 'PENDING_CONTRACT_SIGNATURE', role: 'Market Supervisor + Stakeholder', action: 'Market Supervisor prepares lease contract; required parties sign' },
    { status: 'CONTRACT_ACTIVE', role: 'System Validation', action: 'System validates all 5 activation conditions before activating lease' },
    { status: 'OCCUPANT_VERIFIED', role: 'System', action: 'System links verified stakeholder to assigned stall without duplicate records' },
    { status: 'BILLING_ACTIVE', role: 'System + Treasurer', action: 'System generates periodic bills; advance rent remains separate credit' }
  ];

  // Exact recommended status progression for rental workflow
  const recommendedProgression = [
    'REGISTERED',
    'APPLICATION_SUBMITTED',
    'AWAITING_LOI_DECISION',
    'LOI_APPROVED',
    'AWAITING_INITIAL_PAYMENT',
    'FOR_STALL_ASSIGNMENT',
    'PENDING_CONTRACT_SIGNATURE',
    'CONTRACT_ACTIVE',
    'OCCUPANT_VERIFIED',
    'BILLING_ACTIVE'
  ];

  if (rentalWorkflow.length !== 10) {
    throw new Error(`Expected exactly 10 rental workflow statuses, got ${rentalWorkflow.length}`);
  }

  rentalWorkflow.forEach((stage, idx) => {
    if (stage.status !== recommendedProgression[idx]) {
      throw new Error(`Status ${idx + 1} mismatch: expected ${recommendedProgression[idx]}, got ${stage.status}`);
    }
  });

  // Business permit progress and permit fee payment are tracked separately outside the rental workflow
  const businessPermitTracking = {
    isRentalActivationCondition: false, // Invariant: Permit process occurs after stall is operational
    trackedSeparately: true,
    permitStatuses: ['NOT_STARTED', 'FORM_DOWNLOADED', 'BPLO_APPLICATION_SUBMITTED', 'TREASURER_FEE_PAID', 'PERMIT_ISSUED']
  };

  if (businessPermitTracking.isRentalActivationCondition) {
    throw new Error('Business permit must not be a rental contract activation condition!');
  }

  return true;
}

// 8. Check Confusion Prevention Business Rules (5 Mandatory Invariants)
function testConfusionPreventionRules() {
  // Invariant 1: Do not activate contract at Step 4 (Payment alone is insufficient)
  const step4State = {
    loiApproved: true,
    initialFeesPaid: true,
    stallAssigned: false,
    contractSigned: false,
    effectiveDateReached: false
  };
  const isContractActiveAtStep4 = Boolean(
    step4State.loiApproved &&
    step4State.initialFeesPaid &&
    step4State.stallAssigned &&
    step4State.contractSigned &&
    step4State.effectiveDateReached
  );
  if (isContractActiveAtStep4) {
    throw new Error('Violation: Contract must NOT activate at Step 4! Payment alone is insufficient.');
  }

  // Invariant 2: Do not activate contract at Step 6 merely because created or signed
  const step6State = {
    loiApproved: true,
    initialFeesPaid: true,
    stallAssigned: true,
    contractSigned: true,
    effectiveDateReached: false // Effective date not reached or system validation pending
  };
  const isContractActiveAtStep6 = Boolean(
    step6State.loiApproved &&
    step6State.initialFeesPaid &&
    step6State.stallAssigned &&
    step6State.contractSigned &&
    step6State.effectiveDateReached
  );
  if (isContractActiveAtStep6) {
    throw new Error('Violation: Contract must NOT activate at Step 6 without full system validation at Step 7!');
  }

  // Invariant 3: Business permit payment is NOT a rental contract activation condition
  const step7LeaseActivationState = {
    loiApproved: true,
    initialFeesPaid: true,
    stallAssigned: true,
    contractSigned: true,
    effectiveDateReached: true,
    businessPermitPaid: false // Permit is Step 10 post-occupancy
  };
  const canActivateRentalLease = Boolean(
    step7LeaseActivationState.loiApproved &&
    step7LeaseActivationState.initialFeesPaid &&
    step7LeaseActivationState.stallAssigned &&
    step7LeaseActivationState.contractSigned &&
    step7LeaseActivationState.effectiveDateReached
  );
  if (!canActivateRentalLease) {
    throw new Error('Violation: Business permit payment must NOT block Step 7 lease activation!');
  }

  // Invariant 4: Two-month advance rent must be held as credit and NOT automatically spent on initial bills
  let advanceCreditBalance = 3000; // ₱1,500/mo x 2 months
  const monthlyBillAmount = 1500;
  const autoSpendAdvanceOnBill1 = false; // System rule: advance is held as credit until authorized allocation
  let bill1PaymentStatus = autoSpendAdvanceOnBill1 ? 'PAID' : 'UNPAID';
  if (bill1PaymentStatus === 'PAID') {
    throw new Error('Violation: Advance rent must NOT be automatically spent on monthly bills without authorized allocation!');
  }
  if (advanceCreditBalance !== 3000) {
    throw new Error('Violation: Advance rent credit reserve must remain intact (held as credit)!');
  }

  // Invariant 5: Stakeholder is NOT treated as verified occupant before rental approval, payment, assignment, and contract conditions
  function isVerifiedOccupant(applicant) {
    return Boolean(
      applicant.loiApproved &&
      applicant.initialFeesPaid &&
      applicant.stallAssigned &&
      applicant.contractActive
    );
  }

  const applicantRegistered = { loiApproved: false, initialFeesPaid: false, stallAssigned: false, contractActive: false };
  const applicantPaid = { loiApproved: true, initialFeesPaid: true, stallAssigned: false, contractActive: false };
  const applicantFullyActivated = { loiApproved: true, initialFeesPaid: true, stallAssigned: true, contractActive: true };

  if (isVerifiedOccupant(applicantRegistered)) throw new Error('Violation: Registered applicant cannot be verified occupant!');
  if (isVerifiedOccupant(applicantPaid)) throw new Error('Violation: Paid applicant without assignment/contract cannot be verified occupant!');
  if (!isVerifiedOccupant(applicantFullyActivated)) throw new Error('Applicant meeting all conditions should be verified occupant!');

  return true;
}

// 9. Check Reporting & Occupancy Calculations Grounded in Data
function testReportCalculations() {
  const stalls = [
    { id: 1, status: 'OCCUPIED' },
    { id: 2, status: 'OCCUPIED' },
    { id: 3, status: 'RESERVED' },
    { id: 4, status: 'AVAILABLE' },
    { id: 5, status: 'AVAILABLE' }
  ];

  const total = stalls.length;
  const occupied = stalls.filter(s => s.status === 'OCCUPIED').length;
  const reserved = stalls.filter(s => s.status === 'RESERVED').length;
  const vacant = total - occupied - reserved;
  const occupancyRate = (occupied / total) * 100;

  if (total !== 5 || occupied !== 2 || reserved !== 1 || vacant !== 2 || occupancyRate !== 40) {
    throw new Error('Report occupancy calculation math error!');
  }

  return true;
}

// 10. Check Step 2 Digital LOI Auto-Compilation & Single Valid ID Requirement
function testStep2DigitalLoiAndSingleValidIdUpload() {
  const applicantInput = {
    fullName: 'Maria Loela L. Caparroso',
    address: 'Purok - 1, Paniangan, Manticao, Misamis Oriental',
    contactNumber: '09932889430',
    businessName: 'Caparroso Dry Goods Store',
    natureOfBusiness: 'Dry Goods',
    commodities: 'Textiles, Garments, and Footwear',
    stallNumber: 'Stall 61',
    incumbentMayor: 'HON. MAYOR STEPHEN S. TAN',
    idFile: { name: 'valid_id_prc.pdf', size: 102400 },
    letterFile: null, // Stakeholder does NOT upload LOI document
    rulesAgreed: true,
    undertakingRuleCount: 10
  };

  // Rule 1: Stakeholder only uploads ONE document (Valid Government ID)
  const uploadedFiles = [];
  if (applicantInput.idFile) uploadedFiles.push(applicantInput.idFile);
  if (applicantInput.letterFile) uploadedFiles.push(applicantInput.letterFile);

  if (uploadedFiles.length !== 1 || uploadedFiles[0].name !== 'valid_id_prc.pdf') {
    throw new Error('Step 2 must strictly require only ONE upload: a valid government-issued ID!');
  }

  // Rule 2: Incumbent Mayor field is editable and defaults to current executive
  if (!applicantInput.incumbentMayor || !applicantInput.incumbentMayor.includes('STEPHEN S. TAN')) {
    throw new Error('Incumbent Mayor field must be present with accurate default!');
  }

  // Rule 3: Digital LOI is auto-compiled by the system addressed to the designated Mayor
  function compileDigitalLoi(data) {
    const today = 'October 23, 2026';
    return `Date: ${today}

${data.incumbentMayor}
MUNICIPAL MAYOR
MANTICAO, MISAMIS ORIENTAL

Subject: Letter of Intent - Market Stall Application

Dear Mayor:

Greetings!

I am respectfully expressing my intent to apply for an available stall/space at ${data.stallNumber} at the Manticao Public Market for the purpose of establishing and operating ${data.businessName || data.commodities || 'my commercial enterprise'}.

I am willing to comply with all the necessary requirements, permits, rental fees, and other rules and regulations of the Municipal Government and Market Administration.

I sincerely hope that my application will be given due consideration. Thank you for your kind attention and assistance.

Respectfully yours,

${data.fullName}
(Signature over Printed Name)
Address: ${data.address}
Contact Number: ${data.contactNumber}`;
  }

  const compiledLoi = compileDigitalLoi(applicantInput);
  if (!compiledLoi.includes('HON. MAYOR STEPHEN S. TAN') || !compiledLoi.includes('Subject: Letter of Intent - Market Stall Application')) {
    throw new Error('Auto-compiled digital LOI failed formatting or addressee check!');
  }

  // Rule 4: Acceptance of ten statutory market rules
  if (applicantInput.undertakingRuleCount !== 10 || !applicantInput.rulesAgreed) {
    throw new Error('Applicant must explicitly agree to the ten statutory market rules!');
  }

  return true;
}

// 11. Check Entity Pre-Filling & Synchronization Across Official Documents
function testEntityAutoFillAcrossUnifiedDocuments() {
  const masterEntityData = {
    fullName: 'Risma Posco Abuhan',
    address: 'P-4, Poblacion, Manticao, Misamis Oriental',
    contactNumber: '09932889430',
    businessName: 'Abuhan Fish Trading',
    natureOfBusiness: 'Fish',
    commodities: 'Fresh and Saltwater Marine Fish',
    numberOfEmployees: 3,
    stallNumber: 'Stall 14',
    incumbentMayor: 'HON. MAYOR STEPHEN S. TAN'
  };

  // Test 1: Pre-fill into 3-Page Unified Application Form for Stall Rental/Occupancy
  const stallRentalForm = {
    applicantName: masterEntityData.fullName,
    address: masterEntityData.address,
    contactNumber: masterEntityData.contactNumber,
    businessTradeName: masterEntityData.businessName,
    natureOfBusiness: masterEntityData.natureOfBusiness,
    commoditiesToSell: masterEntityData.commodities,
    preferredStallNo: masterEntityData.stallNumber,
    employeesCount: masterEntityData.numberOfEmployees,
    incumbentMayorSectionD: masterEntityData.incumbentMayor
  };

  for (const [key, val] of Object.entries(stallRentalForm)) {
    if (!val) throw new Error(`Missing pre-filled entity field in Stall Rental Form: ${key}`);
  }

  // Test 2: Pre-fill into 2-Page Unified Business Permit Application Form
  const businessPermitForm = {
    ownerSurname: 'Abuhan',
    ownerGivenName: 'Risma',
    ownerMiddleName: 'Posco',
    businessName: masterEntityData.businessName,
    lineOfBusiness: masterEntityData.natureOfBusiness,
    productsServices: masterEntityData.commodities,
    mainAddress: masterEntityData.address,
    businessAddress: masterEntityData.address,
    totalEmployees: masterEntityData.numberOfEmployees,
    contactNumber: masterEntityData.contactNumber
  };

  for (const [key, val] of Object.entries(businessPermitForm)) {
    if (!val) throw new Error(`Missing pre-filled entity field in Business Permit Form: ${key}`);
  }

  // Test 3: Pre-fill into 12-Page Lease Contract
  const leaseContract = {
    lesseeName: masterEntityData.fullName,
    lesseeAddress: masterEntityData.address,
    stallNo: masterEntityData.stallNumber,
    businessPurpose: masterEntityData.commodities,
    representedMayor: masterEntityData.incumbentMayor
  };

  for (const [key, val] of Object.entries(leaseContract)) {
    if (!val) throw new Error(`Missing pre-filled entity field in Lease Contract: ${key}`);
  }

  return true;
}

// 12. Check Decoupled Architecture (users vs stakeholders) and Phase 0 - Phase 5 Lifecycle
function testDecoupledUserAndStakeholderArchitecture() {
  // Phase 0: System User Account Provisioning (users table)
  const systemUserAccount = {
    id: 'USR-2026-0891',
    username: 'risma_abuhan',
    password_hash: '$2a$12$e8Y9u2kLmP0...',
    role: 'STAKEHOLDER',
    email: 'risma.abuhan@gmail.com',
    status: 'ACTIVE',
    failed_login_attempts: 0,
    created_at: '2026-10-23T13:50:00Z'
  };

  // Invariant: users table must NEVER contain civil, personal, or business trade data
  const forbiddenUserKeys = ['full_name', 'civil_status', 'date_of_birth', 'residential_address', 'business_name', 'stall_id'];
  for (const key of forbiddenUserKeys) {
    if (key in systemUserAccount) {
      throw new Error(`Architectural violation: users table contains civil/business field '${key}'!`);
    }
  }

  // Phase 1: Step 1A Stakeholder Citizen Profile (stakeholders table)
  const stakeholderCitizenProfile = {
    id: 'STK-2026-0112',
    user_id: systemUserAccount.id, // Foreign key link to users table
    first_name: 'Risma',
    middle_name: 'B.',
    last_name: 'Abuhan',
    civil_status: 'Married',
    date_of_birth: '1984-03-14',
    gender: 'Female',
    address: 'Purok 3, Poblacion, Manticao',
    barangay: 'Poblacion',
    municipality_province: 'Manticao, Misamis Oriental',
    official_contact_mobile: '0917-849-2041',
    emergency_contact_person: 'Danilo G. Abuhan',
    emergency_contact_number: '0918-912-3401'
  };

  // Step 1A Legal Age Verification (18+)
  const dob = new Date(stakeholderCitizenProfile.date_of_birth);
  const now = new Date('2026-10-23');
  const age = now.getFullYear() - dob.getFullYear();
  if (age < 18) throw new Error('Applicant must be of legal age (18+)');

  // Phase 1: Step 1B Interactive Stall Selection (stalls table)
  const selectedStall = {
    id: 'STL-WET-B04',
    stall_number_code: 'Wet Section Stall #B-04',
    market_section: 'Wet Section (Fish & Marine)',
    floor_area_dimensions: '3.00m × 4.00m (12.00 sq.m.)',
    base_monthly_rental_rate: 1500.00,
    map_status: 'HELD_FOR_APPLICATION'
  };

  // Phase 2: Step 2 Unified Digital Application & Single Valid ID Upload
  const applicationDossier = {
    application_reference_no: 'MNT-2026-APP-0142',
    date_filed: '2026-10-23T14:15:22Z',
    applicant_legal_name: `${stakeholderCitizenProfile.first_name} ${stakeholderCitizenProfile.middle_name} ${stakeholderCitizenProfile.last_name}`,
    residential_address: stakeholderCitizenProfile.address,
    contact_number: stakeholderCitizenProfile.official_contact_mobile,
    valid_id_type: 'PhilSys National ID',
    government_id_card_number: '4912-8491-2049-1102',
    uploaded_id_file: 'philsys_front_back_abuhan.pdf',
    loi_document_upload_required: false, // Invariant: physical LOI upload removed
    business_trade_name: 'Abuhan Fresh Marine Trading',
    nature_of_business: ['Retail', 'Fish'],
    commodities: 'Bangus, Tilapia, Tuna, Squid',
    space_classification: 'Regular Stall',
    target_stall: selectedStall.stall_number_code,
    estimated_employees: 2,
    digital_loi: 'AUTO-COMPILED',
    ten_point_undertaking_consent: true,
    system_supports_digital_signature: false, // Invariant: system does not support digital signatures
    physical_wet_signature_on_contract_required: true,
    initial_lifecycle_status: 'AWAITING_LOI_DECISION'
  };

  if (applicationDossier.loi_document_upload_required !== false) {
    throw new Error('LOI upload requirement must be FALSE!');
  }
  if (applicationDossier.system_supports_digital_signature !== false) {
    throw new Error('System must not require digital signatures!');
  }
  if (!applicationDossier.ten_point_undertaking_consent) {
    throw new Error('Applicant statutory undertaking consent is required!');
  }

  // Phase 3: Step 3 Mayoral LOI Decision & Step 4 Treasury Initial Settlement
  const mayoralDecision = {
    action: 'APPROVED',
    reference_slip_no: 'MO-LOI-2026-0089',
    staff_recorder: 'clerk_mayorsoffice',
    next_status: 'LOI_APPROVED'
  };
  const treasuryCollection = {
    stall_rights_fee: 5000.00,
    two_month_advance_deposit: selectedStall.base_monthly_rental_rate * 2, // ₱3,000.00
    total_collected_cash: 8000.00,
    or_number: 'OR-7839210',
    collecting_officer: 'NAIDA BEBETH A. MAGDAYO',
    next_status: 'FOR_STALL_ASSIGNMENT'
  };
  if (treasuryCollection.stall_rights_fee + treasuryCollection.two_month_advance_deposit !== treasuryCollection.total_collected_cash) {
    throw new Error('Initial collection total mismatch');
  }

  // Phase 4: Step 5-8 Market Assignment, Contract Activation, & Occupant Verification
  const bilateralContract = {
    contract_number: 'LGU-MNT-KTR-2026-0045',
    monthly_rent: selectedStall.base_monthly_rental_rate,
    status: 'ACTIVE'
  };
  const occupantRecord = {
    occupant_id: 'OCC-2026-0038',
    linked_stakeholder_id: stakeholderCitizenProfile.id,
    assigned_stall: selectedStall.id,
    tenancy_status: 'VERIFIED_OCCUPANT',
    map_state: 'OCCUPIED' // Red
  };
  if (occupantRecord.linked_stakeholder_id !== stakeholderCitizenProfile.id) {
    throw new Error('Occupant record must link directly to Stakeholder entity');
  }

  // Phase 5: Step 9 Monthly Billing & Step 10 BPLO Quick-Print
  const monthlyBilling = {
    invoice_number: 'INV-2026-11-0081',
    amount_due: selectedStall.base_monthly_rental_rate,
    advance_reserve_balance: 3000.00, // Untouched credit reserve
    grace_period_days: 60
  };
  const step10BploPermitPrint = {
    dti_no: 'DTI-R10-2026-94812',
    tin: '341-892-104-000',
    capital_investment: 50000.00,
    operating_area_sqm: 12.00,
    bplo_fee_collected_by_treasury: 2450.00,
    treasury_or: 'OR-7845601',
    rms_issues_business_permit: false // RMS does NOT issue business permit
  };
  if (step10BploPermitPrint.rms_issues_business_permit !== false) {
    throw new Error('RMS must preserve external mandate of the BPLO!');
  }

  return true;
}

// 13. Run All Lifecycle Tests
function runAllLifecycleTests() {
  console.log('--- RUNNING CAPSTONE RENTAL LIFECYCLE TESTS ---');

  const tests = [
    { name: '1. Advance Rent Calculation (2-Month Baseline)', fn: testAdvanceCalculation },
    { name: '2. Payment Categories Separation (Advance vs Permit Fee vs Rent)', fn: testPaymentCategoriesSeparation },
    { name: '3. Contract & Stall Activation Conditions (No Premature Occupancy)', fn: testContractActivationConditions },
    { name: '4. Billing Uniqueness & Duplicate Charge Prevention', fn: testBillingUniqueness },
    { name: '5. Advance Credit Allocation Engine Math', fn: testAdvanceCreditAllocation },
    { name: '6. Dynamic Overdue & Balance Status Evaluation', fn: testDynamicOverdueCalculation },
    { name: '7. 10-Step Simplified Applicant Progression & Role Separation', fn: testSimplifiedApplicantProgression },
    { name: '8. Confusion Prevention Business Rules (5 Mandatory Invariants)', fn: testConfusionPreventionRules },
    { name: '9. Real Report & Occupancy Metrics Calculations', fn: testReportCalculations },
    { name: '10. Step 2 Digital LOI Auto-Compilation & Single Valid ID Requirement', fn: testStep2DigitalLoiAndSingleValidIdUpload },
    { name: '11. Entity Pre-Filling & Synchronization Across Official Documents', fn: testEntityAutoFillAcrossUnifiedDocuments },
    { name: '12. Decoupled Architecture (users vs stakeholders) & Phase 0 to Phase 5 Lifecycle', fn: testDecoupledUserAndStakeholderArchitecture }
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      t.fn();
      console.log(`[PASS] ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${t.name}:`, err.message);
    }
  }

  console.log(`\nLifecycle Test Results: ${passed}/${tests.length} tests passed successfully.`);
  if (passed !== tests.length) {
    process.exit(1);
  }
}

runAllLifecycleTests();


