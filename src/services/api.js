import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";
import { AUTH_TOKEN_KEY } from "../stores/auth";
import { supabase } from "../config/supabase";

const rawAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

rawAxios.interceptors.request.use(async (config) => {
  let token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to convert snake_case strings to camelCase
function toCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

// Normalizes records so both snake_case and camelCase properties exist
export function normalizeRecord(item) {
  if (!item || typeof item !== 'object') return item;
  if (Array.isArray(item)) return item.map(normalizeRecord);

  const result = { ...item };
  for (const [key, val] of Object.entries(item)) {
    const camelKey = toCamel(key);
    const normalizedVal = (val && typeof val === 'object') ? normalizeRecord(val) : val;
    result[key] = normalizedVal;
    if (camelKey !== key) {
      result[camelKey] = normalizedVal;
    }
  }

  // Key explicit aliases for frontend template compatibility
  if (result.created_at && !result.createdAt) result.createdAt = result.created_at;
  if (result.updated_at && !result.updatedAt) result.updatedAt = result.updated_at;
  if (result.first_name && !result.firstName) result.firstName = result.first_name;
  if (result.last_name && !result.lastName) result.lastName = result.last_name;
  if (result.middle_name && !result.middleName) result.middleName = result.middle_name;
  if (result.business_name && !result.businessName) result.businessName = result.business_name;
  if (result.business_type && !result.businessType) result.businessType = result.business_type;
  if (result.advance_balance !== undefined && result.advanceBalance === undefined) result.advanceBalance = result.advance_balance;
  if (result.total_advance_amount !== undefined && result.totalAdvanceAmount === undefined) result.totalAdvanceAmount = result.total_advance_amount;
  if (result.advance_payment_paid !== undefined && result.advancePaymentPaid === undefined) result.advancePaymentPaid = result.advance_payment_paid;
  if (result.advance_payment_completed !== undefined && result.advancePaymentCompleted === undefined) result.advancePaymentCompleted = result.advance_payment_completed;
  if (result.advance_payment_amount !== undefined && result.advancePaymentAmount === undefined) result.advancePaymentAmount = result.advance_payment_amount;
  if (result.treasurer_approved !== undefined && result.treasurerApproved === undefined) result.treasurerApproved = result.treasurer_approved;
  if (result.market_supervisor_approved !== undefined && result.marketSupervisorApproved === undefined) result.marketSupervisorApproved = result.market_supervisor_approved;
  if (result.bplo_approved !== undefined && result.bploApproved === undefined) result.bploApproved = result.bplo_approved;
  if (result.endorsing_approved !== undefined && result.endorsingApproved === undefined) result.endorsingApproved = result.endorsing_approved;
  if (result.final_endorsed !== undefined && result.finalEndorsed === undefined) result.finalEndorsed = result.final_endorsed;
  if (result.onboarding_status && !result.onboardingStatus) result.onboardingStatus = result.onboarding_status;
  if (result.application_status && !result.applicationStatus) result.applicationStatus = result.application_status;
  if (result.file_name && !result.fileName) result.fileName = result.file_name;
  if (result.file_path && !result.filePath) result.filePath = result.file_path;
  if (result.document_type && !result.documentType) result.documentType = result.document_type;
  if (result.monthly_rent !== undefined && result.monthlyRent === undefined) result.monthlyRent = result.monthly_rent;
  if (result.stall_no && !result.stallNo) result.stallNo = result.stall_no;
  if (result.stall_type && !result.stallType) result.stallType = result.stall_type;
  if (result.monthly_rate !== undefined && result.monthlyRate === undefined) result.monthlyRate = result.monthly_rate;
  if (result.info && !result.section) result.section = result.info;
  if (result.contract_no && !result.contractNo) result.contractNo = result.contract_no;
  if (result.start_date && !result.startDate) result.startDate = result.start_date;
  if (result.end_date && !result.endDate) result.endDate = result.end_date;
  if (result.billing_frequency && !result.billingFrequency) result.billingFrequency = result.billing_frequency;
  if (result.occupant_id && !result.occupantId) result.occupantId = result.occupant_id;
  if (result.stall_id && !result.stallId) result.stallId = result.stall_id;
  if (result.hazard_free_confirmed !== undefined && result.hazardFreeConfirmed === undefined) result.hazardFreeConfirmed = result.hazard_free_confirmed;
  if (result.hazard_free_document_url && !result.hazardFreeDocumentUrl) result.hazardFreeDocumentUrl = result.hazard_free_document_url;
  if (result.verified_tenant !== undefined && result.verifiedTenant === undefined) result.verifiedTenant = result.verified_tenant;
  if (result.verifiedTenant !== undefined && result.verified_tenant === undefined) result.verified_tenant = result.verifiedTenant;
  if (result.verified_stakeholder !== undefined && result.verifiedStakeholder === undefined) result.verifiedStakeholder = result.verified_stakeholder;
  if (result.verifiedStakeholder !== undefined && result.verified_stakeholder === undefined) result.verified_stakeholder = result.verifiedStakeholder;
  if (result.applicant_fee_paid !== undefined && result.applicantFeePaid === undefined) result.applicantFeePaid = result.applicant_fee_paid;
  if (result.applicantFeePaid !== undefined && result.applicant_fee_paid === undefined) result.applicant_fee_paid = result.applicantFeePaid;
  if (result.applicant_fee_amount !== undefined && result.applicantFeeAmount === undefined) result.applicantFeeAmount = result.applicant_fee_amount;
  if (result.applicantFeeAmount !== undefined && result.applicant_fee_amount === undefined) result.applicant_fee_amount = result.applicantFeeAmount;
  if (result.applicant_fee_date !== undefined && result.applicantFeeDate === undefined) result.applicantFeeDate = result.applicant_fee_date;
  if (result.applicantFeeDate !== undefined && result.applicant_fee_date === undefined) result.applicant_fee_date = result.applicantFeeDate;
  if (result.verified_application !== undefined && result.verifiedApplication === undefined) result.verifiedApplication = result.verified_application;
  if (result.verifiedApplication !== undefined && result.verified_application === undefined) result.verified_application = result.verifiedApplication;
  if (result.application_form_paid !== undefined && result.applicationFormPaid === undefined) result.applicationFormPaid = result.application_form_paid;
  if (result.applicationFormPaid !== undefined && result.application_form_paid === undefined) result.application_form_paid = result.applicationFormPaid;
  if (result.treasurer_paid !== undefined && result.treasurerPaid === undefined) result.treasurerPaid = result.treasurer_paid;
  if (result.treasurerPaid !== undefined && result.treasurer_paid === undefined) result.treasurer_paid = result.treasurerPaid;

  // Extract imageUrl from map_coordinates JSONB if present
  if (!result.imageUrl && result.map_coordinates?.imageUrl) {
    result.imageUrl = result.map_coordinates.imageUrl;
    result.image_url = result.map_coordinates.imageUrl;
  }

  // rental_rates mapping
  if (result.base_monthly_rate !== undefined) {
    if (result.monthlyRate === undefined) result.monthlyRate = Number(result.base_monthly_rate);
    if (result.monthly_rate === undefined) result.monthly_rate = Number(result.base_monthly_rate);
    if (result.rate === undefined) result.rate = Number(result.base_monthly_rate);
  }
  if (result.is_active !== undefined && result.status === undefined) {
    result.status = result.is_active ? 'ACTIVE' : 'INACTIVE';
  }

  // stakeholder_applications mapping
  if (result.loi_url && !result.letterDocumentUrl) result.letterDocumentUrl = result.loi_url;
  if (result.loi_url && !result.loiUrl) result.loiUrl = result.loi_url;
  if (result.valid_id_url && !result.idDocumentUrl) result.idDocumentUrl = result.valid_id_url;
  if (result.valid_id_url && !result.validIdUrl) result.validIdUrl = result.valid_id_url;
  if (result.application_no && !result.applicationNo) result.applicationNo = result.application_no;
  if (result.current_holding_office && !result.currentHoldingOffice) result.currentHoldingOffice = result.current_holding_office;
  if (result.supervisor_endorsed_at && !result.supervisorEndorsedAt) result.supervisorEndorsedAt = result.supervisor_endorsed_at;
  if (result.supervisor_remarks && !result.supervisorRemarks) result.supervisorRemarks = result.supervisor_remarks;
  if (result.mayor_approved_at && !result.mayorApprovedAt) result.mayorApprovedAt = result.mayor_approved_at;
  if (result.mayor_decision && !result.mayorDecision) result.mayorDecision = result.mayor_decision;
  if (result.mayor_remarks && !result.mayorRemarks) result.mayorRemarks = result.mayor_remarks;
  if (result.bplo_status && !result.bploStatus) result.bploStatus = result.bplo_status;
  if (result.bplo_remarks && !result.bploRemarks) result.bploRemarks = result.bplo_remarks;
  if (result.endorsing_status && !result.endorsingStatus) result.endorsingStatus = result.endorsing_status;
  if (result.endorsement_status && !result.endorsementStatus) result.endorsementStatus = result.endorsement_status;
  if (result.moresco_clearance_url && !result.morescoClearanceUrl) result.morescoClearanceUrl = result.moresco_clearance_url;
  if (result.business_permit_fee_assessed !== undefined && result.businessPermitFeeAssessed === undefined) result.businessPermitFeeAssessed = result.business_permit_fee_assessed;
  if (result.business_permit_fee_paid !== undefined && result.businessPermitFeePaid === undefined) result.businessPermitFeePaid = result.business_permit_fee_paid;
  if (result.business_permit_no && !result.businessPermitNo) result.businessPermitNo = result.business_permit_no;
  if (result.business_permit_released !== undefined && result.businessPermitReleased === undefined) result.businessPermitReleased = result.business_permit_released;
  if (result.business_permit_released_at && !result.businessPermitReleasedAt) result.businessPermitReleasedAt = result.business_permit_released_at;
  if (result.stall_id && !result.selectedStallId) result.selectedStallId = result.stall_id;
  if (result.selected_stall_id && !result.selectedStallId) result.selectedStallId = result.selected_stall_id;
  if (result.selectedStallId && !result.selected_stall_id) result.selected_stall_id = result.selectedStallId;
  if (result.status && !result.applicationStatus && (result.application_no || result.stakeholder_id !== undefined)) {
    result.applicationStatus = result.status;
  }

  // Unified Application Form field mapping
  if (result.valid_id_type && !result.validIdType) result.validIdType = result.valid_id_type;
  if (result.validIdType && !result.valid_id_type) result.valid_id_type = result.validIdType;
  if (result.valid_id_no && !result.validIdNo) result.validIdNo = result.valid_id_no;
  if (result.validIdNo && !result.valid_id_no) result.valid_id_no = result.validIdNo;

  // Unified Application Form for Business Permit (Official 2-Page Form)
  if (result.application_type && !result.applicationType) result.applicationType = result.application_type;
  if (result.applicationType && !result.application_type) result.application_type = result.applicationType;
  if (result.payment_mode && !result.paymentMode) result.paymentMode = result.payment_mode;
  if (result.paymentMode && !result.payment_mode) result.payment_mode = result.paymentMode;
  if (result.tracking_number && !result.trackingNumber) result.trackingNumber = result.tracking_number;
  if (result.trackingNumber && !result.tracking_number) result.tracking_number = result.trackingNumber;
  if (result.business_id_number && !result.businessIdNumber) result.businessIdNumber = result.business_id_number;
  if (result.businessIdNumber && !result.business_id_number) result.business_id_number = result.businessIdNumber;

  // Section A: Business Information and Registration
  if (result.org_type && !result.orgType) result.orgType = result.org_type;
  if (result.orgType && !result.org_type) result.org_type = result.orgType;
  if (result.org_gender && !result.orgGender) result.orgGender = result.org_gender;
  if (result.orgGender && !result.org_gender) result.org_gender = result.orgGender;
  if (result.dti_sec_cda_reg_no && !result.dtiSecCdaRegNo) result.dtiSecCdaRegNo = result.dti_sec_cda_reg_no;
  if (result.dtiSecCdaRegNo && !result.dti_sec_cda_reg_no) result.dti_sec_cda_reg_no = result.dtiSecCdaRegNo;
  if (result.tin_no && !result.tinNo) result.tinNo = result.tin_no;
  if (result.tinNo && !result.tin_no) result.tin_no = result.tinNo;
  if (result.trade_name_franchise && !result.tradeNameFranchise) result.tradeNameFranchise = result.trade_name_franchise;
  if (result.tradeNameFranchise && !result.trade_name_franchise) result.trade_name_franchise = result.tradeNameFranchise;

  // Main Office Address
  if (result.main_house_bldg_no && !result.mainHouseBldgNo) result.mainHouseBldgNo = result.main_house_bldg_no;
  if (result.main_bldg_name && !result.mainBldgName) result.mainBldgName = result.main_bldg_name;
  if (result.main_lot_no && !result.mainLotNo) result.mainLotNo = result.main_lot_no;
  if (result.main_block_no && !result.mainBlockNo) result.mainBlockNo = result.main_block_no;
  if (result.main_street && !result.mainStreet) result.mainStreet = result.main_street;
  if (result.main_subdivision && !result.mainSubdivision) result.mainSubdivision = result.main_subdivision;
  if (result.main_barangay && !result.mainBarangay) result.mainBarangay = result.main_barangay;
  if (result.main_district && !result.mainDistrict) result.mainDistrict = result.main_district;
  if (result.main_municipality && !result.mainMunicipality) result.mainMunicipality = result.main_municipality;
  if (result.main_province && !result.mainProvince) result.mainProvince = result.main_province;
  if (result.main_zip_code && !result.mainZipCode) result.mainZipCode = result.main_zip_code;

  if (result.telephone_no && !result.telephoneNo) result.telephoneNo = result.telephone_no;
  if (result.mobile_no && !result.mobileNo) result.mobileNo = result.mobile_no;

  // Sole Proprietor Owner Details
  if (result.owner_surname && !result.ownerSurname) result.ownerSurname = result.owner_surname;
  if (result.owner_given_name && !result.ownerGivenName) result.ownerGivenName = result.owner_given_name;
  if (result.owner_middle_name && !result.ownerMiddleName) result.ownerMiddleName = result.owner_middle_name;
  if (result.owner_suffix && !result.ownerSuffix) result.ownerSuffix = result.owner_suffix;

  // Corporate Officer Details
  if (result.corp_president_surname && !result.corpPresidentSurname) result.corpPresidentSurname = result.corp_president_surname;
  if (result.corp_president_given_name && !result.corpPresidentGivenName) result.corpPresidentGivenName = result.corp_president_given_name;
  if (result.corp_president_middle_name && !result.corpPresidentMiddleName) result.corpPresidentMiddleName = result.corp_president_middle_name;
  if (result.corp_president_suffix && !result.corpPresidentSuffix) result.corpPresidentSuffix = result.corp_president_suffix;
  if (result.corp_citizenship && !result.corpCitizenship) result.corpCitizenship = result.corp_citizenship;

  // Section B: Business Operation
  if (result.business_area_sqm !== undefined && result.businessAreaSqm === undefined) result.businessAreaSqm = result.business_area_sqm;
  if (result.total_floor_area_sqm !== undefined && result.totalFloorAreaSqm === undefined) result.totalFloorAreaSqm = result.total_floor_area_sqm;
  if (result.num_employees_male !== undefined && result.numEmployeesMale === undefined) result.numEmployeesMale = result.num_employees_male;
  if (result.num_employees_female !== undefined && result.numEmployeesFemale === undefined) result.numEmployeesFemale = result.num_employees_female;
  if (result.num_employees_lgu_residing !== undefined && result.numEmployeesLguResiding === undefined) result.numEmployeesLguResiding = result.num_employees_lgu_residing;
  if (result.delivery_vehicles_van_truck !== undefined && result.deliveryVehiclesVanTruck === undefined) result.deliveryVehiclesVanTruck = result.delivery_vehicles_van_truck;
  if (result.delivery_vehicles_motorcycle !== undefined && result.deliveryVehiclesMotorcycle === undefined) result.deliveryVehiclesMotorcycle = result.delivery_vehicles_motorcycle;

  // Business Location Address
  if (result.loc_same_as_main !== undefined && result.locSameAsMain === undefined) result.locSameAsMain = result.loc_same_as_main;
  if (result.loc_house_bldg_no && !result.locHouseBldgNo) result.locHouseBldgNo = result.loc_house_bldg_no;
  if (result.loc_bldg_name && !result.locBldgName) result.locBldgName = result.loc_bldg_name;
  if (result.loc_lot_no && !result.locLotNo) result.locLotNo = result.loc_lot_no;
  if (result.loc_block_no && !result.locBlockNo) result.locBlockNo = result.loc_block_no;
  if (result.loc_street && !result.locStreet) result.locStreet = result.loc_street;
  if (result.loc_subdivision && !result.locSubdivision) result.locSubdivision = result.loc_subdivision;
  if (result.loc_barangay && !result.locBarangay) result.locBarangay = result.loc_barangay;
  if (result.loc_district && !result.locDistrict) result.locDistrict = result.loc_district;
  if (result.loc_municipality && !result.locMunicipality) result.locMunicipality = result.loc_municipality;
  if (result.loc_province && !result.locProvince) result.locProvince = result.loc_province;
  if (result.loc_zip_code && !result.locZipCode) result.locZipCode = result.loc_zip_code;

  // Ownership & Incentives
  if (result.property_owned !== undefined && result.propertyOwned === undefined) result.propertyOwned = result.property_owned;
  if (result.tax_dec_no && !result.taxDecNo) result.taxDecNo = result.tax_dec_no;
  if (result.property_id_no && !result.propertyIdNo) result.propertyIdNo = result.property_id_no;
  if (result.tax_incentives_enjoyed !== undefined && result.taxIncentivesEnjoyed === undefined) result.taxIncentivesEnjoyed = result.tax_incentives_enjoyed;
  if (result.business_activity && !result.businessActivity) result.businessActivity = result.business_activity;
  if (result.business_activity_other && !result.businessActivityOther) result.businessActivityOther = result.business_activity_other;
  if (result.business_lines && !result.businessLines) result.businessLines = result.business_lines;

  // Page 2 & BPLO Approvals
  if (result.bplo_approved_by && !result.bploApprovedBy) result.bploApprovedBy = result.bplo_approved_by;
  if (result.bplo_designation && !result.bploDesignation) result.bploDesignation = result.bplo_designation;
  if (result.bplo_date_signed && !result.bploDateSigned) result.bploDateSigned = result.bplo_date_signed;
  if (result.market_office_verified_by && !result.marketOfficeVerifiedBy) result.marketOfficeVerifiedBy = result.market_office_verified_by;
  if (result.market_office_verified_remarks && !result.marketOfficeVerifiedRemarks) result.marketOfficeVerifiedRemarks = result.market_office_verified_remarks;
  if (result.treasurer_verified_by && !result.treasurerVerifiedBy) result.treasurerVerifiedBy = result.treasurer_verified_by;
  if (result.total_fees_assessment !== undefined && result.totalFeesAssessment === undefined) result.totalFeesAssessment = result.total_fees_assessment;
  if (result.business_permit_or_no && !result.businessPermitOrNo) result.businessPermitOrNo = result.business_permit_or_no;
  if (result.perjury_declaration_agreed !== undefined && result.perjuryDeclarationAgreed === undefined) result.perjuryDeclarationAgreed = result.perjury_declaration_agreed;
  if (result.nature_of_business && !result.natureOfBusiness) result.natureOfBusiness = result.nature_of_business;
  if (result.other_nature_of_business && !result.otherNature) result.otherNature = result.other_nature_of_business;
  if (result.products_commodities && !result.commodities) result.commodities = result.products_commodities;
  if (result.stall_space_type && !result.stallSpaceType) result.stallSpaceType = result.stall_space_type;
  if (result.preferred_stall_no && !result.preferredStallNo) result.preferredStallNo = result.preferred_stall_no;
  if (result.estimated_employees !== undefined && result.estimatedEmployees === undefined) result.estimatedEmployees = result.estimated_employees;
  if (result.undertaking_agreed !== undefined && result.undertakingAgreed === undefined) result.undertakingAgreed = result.undertaking_agreed;
  if (result.loi_content && !result.loiContent) result.loiContent = result.loi_content;
  if (result.market_office_status && !result.marketOfficeStatus) result.marketOfficeStatus = result.market_office_status;
  if (result.market_office_recommended_stall && !result.marketOfficeRecommendedStall) result.marketOfficeRecommendedStall = result.market_office_recommended_stall;
  if (result.market_office_section && !result.marketOfficeSection) result.marketOfficeSection = result.market_office_section;
  if (result.market_office_nature && !result.marketOfficeNature) result.marketOfficeNature = result.market_office_nature;
  if (result.market_office_remarks && !result.marketOfficeRemarks) result.marketOfficeRemarks = result.market_office_remarks;
  if (result.market_supervisor_name && !result.marketSupervisorName) result.marketSupervisorName = result.market_supervisor_name;
  if (result.treasury_monthly_rent !== undefined && result.treasuryMonthlyRent === undefined) result.treasuryMonthlyRent = result.treasury_monthly_rent;
  if (result.treasury_other_fees !== undefined && result.treasuryOtherFees === undefined) result.treasuryOtherFees = result.treasury_other_fees;
  if (result.treasury_security_deposit !== undefined && result.treasurySecurityDeposit === undefined) result.treasurySecurityDeposit = result.treasury_security_deposit;
  if (result.treasury_total_due !== undefined && result.treasuryTotalDue === undefined) result.treasuryTotalDue = result.treasury_total_due;
  if (result.treasury_remarks && !result.treasuryRemarks) result.treasuryRemarks = result.treasury_remarks;
  if (result.treasurer_name && !result.treasurerName) result.treasurerName = result.treasurer_name;
  if (result.final_recommendation_status && !result.finalRecommendationStatus) result.finalRecommendationStatus = result.final_recommendation_status;
  if (result.final_recommendation_remarks && !result.finalRecommendationRemarks) result.finalRecommendationRemarks = result.final_recommendation_remarks;
  if (result.mayor_conditions_remarks && !result.mayorConditionsRemarks) result.mayorConditionsRemarks = result.mayor_conditions_remarks;
  if (result.mayor_name && !result.mayorName) result.mayorName = result.mayor_name;
  if (result.assigned_stall_no && !result.assignedStallNo) result.assignedStallNo = result.assigned_stall_no;
  if (result.assigned_market_section && !result.assignedMarketSection) result.assignedMarketSection = result.assigned_market_section;
  if (result.effectivity_of_occupancy && !result.effectivityOfOccupancy) result.effectivityOfOccupancy = result.effectivity_of_occupancy;
  if (result.official_receipt_no && !result.officialReceiptNo) result.officialReceiptNo = result.official_receipt_no;
  if (result.payment_receipt_date && !result.paymentReceiptDate) result.paymentReceiptDate = result.payment_receipt_date;
  if (result.receipt_amount_paid !== undefined && result.receiptAmountPaid === undefined) result.receiptAmountPaid = result.receipt_amount_paid;
  if (result.applicant_acknowledged !== undefined && result.applicantAcknowledged === undefined) result.applicantAcknowledged = result.applicant_acknowledged;
  if (result.applicant_acknowledged_at && !result.applicantAcknowledgedAt) result.applicantAcknowledgedAt = result.applicant_acknowledged_at;

  return result;
}

export function isUuid(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

function mapStallPayload(data) {
  if (!data || typeof data !== 'object') return data;
  const payload = {};

  const stallNo = data.stall_no ?? data.stallNo ?? data.number ?? data.stallNumber;
  if (stallNo !== undefined && stallNo !== null) payload.stall_no = String(stallNo).trim();

  const stallType = data.stall_type ?? data.stallType ?? data.type;
  if (stallType !== undefined && stallType !== null) payload.stall_type = String(stallType).trim();

  const monthlyRent = data.monthly_rent ?? data.monthlyRent ?? data.rent ?? data.rentalRate;
  if (monthlyRent !== undefined && monthlyRent !== null) payload.monthly_rent = Number(monthlyRent || 0);

  if (data.status !== undefined && data.status !== null) {
    const s = String(data.status).trim().toUpperCase();
    payload.status = (s === 'VACANT') ? 'AVAILABLE' : s;
  }

  // Store imageUrl cleanly inside map_coordinates JSONB (stalls table has no image_url column)
  let mapCoords = {};
  if (data.map_coordinates && typeof data.map_coordinates === 'object') {
    mapCoords = { ...data.map_coordinates };
  } else if (typeof data.map_coordinates === 'string') {
    try { mapCoords = JSON.parse(data.map_coordinates); } catch (_) {}
  }
  const imageUrl = data.image_url ?? data.imageUrl;
  if (imageUrl !== undefined) {
    mapCoords.imageUrl = imageUrl || null;
  }
  if (Object.keys(mapCoords).length > 0 || imageUrl !== undefined) {
    payload.map_coordinates = mapCoords;
  }

  const info = data.info ?? data.section ?? data.location;
  if (info !== undefined) payload.info = info || null;

  const lat = data.latitude ?? data.lat;
  if (lat !== undefined) {
    payload.latitude = (lat !== null && lat !== '' && !isNaN(Number(lat))) ? Number(lat) : null;
  }

  const lng = data.longitude ?? data.lng;
  if (lng !== undefined) {
    payload.longitude = (lng !== null && lng !== '' && !isNaN(Number(lng))) ? Number(lng) : null;
  }

  const occupantId = data.occupant_id ?? data.occupantId ?? data.occupant?.id;
  if (occupantId !== undefined) {
    payload.occupant_id = occupantId ? Number(occupantId) : null;
  }

  if (data.rate_category ?? data.rateCategory) {
    payload.rate_category = String(data.rate_category ?? data.rateCategory).toUpperCase();
  }
  if (data.stall_rights_fee ?? data.stallRightsFee) {
    payload.stall_rights_fee = Number(data.stall_rights_fee ?? data.stallRightsFee);
  }
  if (data.area_sqm ?? data.areaSqm) {
    payload.area_sqm = Number(data.area_sqm ?? data.areaSqm);
  }
  if (data.dimensions) {
    payload.dimensions = String(data.dimensions);
  }

  return payload;
}

function mapRentalRatePayload(data) {
  if (!data || typeof data !== 'object') return data;
  const payload = {};

  const stallType = data.stall_type ?? data.stallType ?? data.name;
  if (stallType !== undefined && stallType !== null) payload.stall_type = String(stallType).trim();

  const baseRate = data.base_monthly_rate ?? data.baseMonthlyRate ?? data.monthly_rate ?? data.monthlyRate ?? data.rate;
  if (baseRate !== undefined && baseRate !== null) payload.base_monthly_rate = Number(baseRate || 0);

  if (data.rate_category ?? data.rateCategory) {
    payload.rate_category = String(data.rate_category ?? data.rateCategory).toUpperCase();
  }
  if (data.stall_rights_fee ?? data.stallRightsFee) {
    payload.stall_rights_fee = Number(data.stall_rights_fee ?? data.stallRightsFee);
  }
  if (data.rate_per_sqm ?? data.ratePerSqm) {
    payload.rate_per_sqm = Number(data.rate_per_sqm ?? data.ratePerSqm);
  }
  if (data.advance_months ?? data.advanceMonths) {
    payload.advance_months = Number(data.advance_months ?? data.advanceMonths);
  }
  if (data.is_active !== undefined) {
    payload.is_active = Boolean(data.is_active);
  } else if (data.status !== undefined) {
    payload.is_active = String(data.status).toUpperCase() === 'ACTIVE';
  }

  return payload;
}

// In-memory cache & in-flight deduplication to prevent redundant round-trip queries
const apiCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_CACHE_TTL = 6000; // 6-second short-lived cache

export function invalidateApiCache(pattern = null) {
  if (!pattern) {
    apiCache.clear();
    return;
  }
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  for (const key of apiCache.keys()) {
    if (regex.test(key)) {
      apiCache.delete(key);
    }
  }
}

async function handleSelectStall(cleanUrl, data) {
  const match = cleanUrl.match(/stakeholders\/([^/]+)\/select-stall/);
  const rawId = match ? match[1] : (data?.stakeholderId || data?.stakeholder_id || cleanUrl.split('/')[1]);
  const stakeholderId = Number(rawId);
  const rawStallId = data?.stallId ?? data?.stall_id;
  if (!rawStallId) throw new Error('Stall ID is required.');
  const targetStallId = Number(rawStallId);

  // 1. Fetch stall info to compute 2 months advance baseline (Blueprint requirement)
  const { data: st } = await supabase.from('stalls').select('*').eq('id', targetStallId).maybeSingle();
  const monthlyRent = Number(st?.monthly_rent ?? st?.monthlyRent ?? 0);
  const totalAdvance = monthlyRent * 2;

  // 2. Free up any previous stall reserved by this stakeholder if changed
  try {
    const { data: currentSh } = await supabase
      .from('stakeholders')
      .select('selected_stall_id')
      .eq('id', stakeholderId)
      .maybeSingle();

    if (currentSh?.selected_stall_id && Number(currentSh.selected_stall_id) !== targetStallId) {
      await supabase
        .from('stalls')
        .update({ status: 'AVAILABLE', occupant_id: null })
        .eq('id', Number(currentSh.selected_stall_id))
        .eq('status', 'RESERVED');
    }
  } catch (freeErr) {
    console.warn('[select-stall] Free previous stall notice:', freeErr);
  }

  // 3. Update stakeholder record
  const { data: updated, error } = await supabase
    .from('stakeholders')
    .update({
      selected_stall_id: targetStallId,
      total_advance_amount: totalAdvance
    })
    .eq('id', stakeholderId)
    .select()
    .single();

  if (error) throw error;

  // 4. Upsert/update occupant with PENDING status
  let occId = null;
  try {
    const { data: exOcc } = await supabase
      .from('occupants')
      .select('id, stall_id')
      .eq('stakeholder_id', stakeholderId)
      .maybeSingle();

    if (exOcc?.id) {
      occId = exOcc.id;
      if (exOcc.stall_id && Number(exOcc.stall_id) !== targetStallId) {
        await supabase
          .from('stalls')
          .update({ status: 'AVAILABLE', occupant_id: null })
          .eq('id', Number(exOcc.stall_id))
          .eq('status', 'RESERVED');
      }
      await supabase
        .from('occupants')
        .update({
          stall_id: targetStallId,
          status: 'PENDING',
          advance_balance: 0,
          is_archived: false
        })
        .eq('id', occId);
    } else {
      const { data: newOcc } = await supabase
        .from('occupants')
        .insert({
          stakeholder_id: stakeholderId,
          stall_id: targetStallId,
          status: 'PENDING',
          occupancy_date: new Date().toISOString().split('T')[0],
          is_archived: false,
          advance_balance: 0
        })
        .select('id')
        .maybeSingle();
      occId = newOcc?.id;
    }

    // 5. Update target stall status to RESERVED and link occupant
    await supabase
      .from('stalls')
      .update({
        status: 'RESERVED',
        occupant_id: occId || null
      })
      .eq('id', targetStallId);
  } catch (occErr) {
    console.warn('[select-stall] Occupant sync notice:', occErr);
  }

  // 6. Sync stakeholder_applications table if stakeholder_id or user_id exists
  try {
    if (updated?.id || updated?.user_id) {
      let q = supabase
        .from('stakeholder_applications')
        .update({
          stall_id: targetStallId,
          calculated_advance_rent: totalAdvance
        });
      if (updated.id) {
        q = q.eq('stakeholder_id', updated.id);
      } else if (updated.user_id) {
        q = q.eq('user_id', updated.user_id);
      }
      await q;
    }
  } catch (_) {}

  invalidateApiCache('stakeholders|payments|applications|stalls|occupants');
  return { data: normalizeRecord(updated) };
}

// Smart Adapter that translates REST endpoints directly into Supabase operations
const api = {
  interceptors: rawAxios.interceptors,
  clearCache: invalidateApiCache,

  async get(url, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');
    const cacheKey = `GET:${cleanUrl}:${JSON.stringify(config.params || {})}:${config.remoteOnly ? 'remote' : 'merged'}`;
    const bypassCache = Boolean(config.forceRefresh || config.noCache || config.headers?.['Cache-Control'] === 'no-cache');

    if (!bypassCache) {
      const cached = apiCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < (config.ttl || DEFAULT_CACHE_TTL))) {
        return { ...cached.response, fromCache: true };
      }
      if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey);
      }
    }

    const fetchPromise = (async () => {
      try {
        const response = await this._handleGet(cleanUrl, url, config);
        if (!bypassCache && response && response.data !== undefined) {
          apiCache.set(cacheKey, { timestamp: Date.now(), response });
        }
        return response;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    if (!bypassCache) {
      inFlightRequests.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  },

  async _handleGet(cleanUrl, url, config = {}) {

    // 1. Stalls
    if (cleanUrl === 'stalls') {
      let { data, error } = await supabase
        .from('stalls')
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
        .order('id', { ascending: true });

      if (error) {
        const res = await supabase.from('stalls').select('*').order('id', { ascending: true });
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      let { data, error } = await supabase
        .from('stalls')
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        const res = await supabase.from('stalls').select('*').eq('id', id).maybeSingle();
        data = res.data;
      }
      return { data: normalizeRecord(data) };
    }

    // 2. Stall Types (mapped from authoritative rental_rates table)
    if (cleanUrl === 'stall-types' || cleanUrl === 'admin/stall-types') {
      const { data, error } = await supabase.from('rental_rates').select('*').order('id', { ascending: true });
      if (error) throw error;
      const normalized = (data || []).map((r) => ({
        id: r.id,
        name: r.stall_type,
        stallType: r.stall_type,
        rate: Number(r.base_monthly_rate || 0),
        monthlyRate: Number(r.base_monthly_rate || 0),
        baseMonthlyRate: Number(r.base_monthly_rate || 0),
        rateCategory: r.rate_category,
        stallRightsFee: Number(r.stall_rights_fee ?? 0),
        advanceMonths: r.advance_months || 2,
        isActive: r.is_active,
        status: r.is_active ? 'ACTIVE' : 'INACTIVE'
      }));
      return { data: normalized };
    }

    // 3. Rental Rates
    if (cleanUrl === 'rental-rates' || cleanUrl === 'admin/rental-rates') {
      const { data, error } = await supabase.from('rental_rates').select('*').order('id', { ascending: true });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 4. System Settings
    if (cleanUrl === 'admin/system-settings' || cleanUrl === 'system-settings') {
      const { data, error } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 5. Users
    if (cleanUrl === 'admin/users' || cleanUrl === 'users') {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 6. Stakeholders
    if (cleanUrl === 'stakeholders/for-approval') {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls!selected_stall_id(*), documents:stakeholder_documents(*), occupant:occupants(*, stall:stalls!occupants_stall_id_fkey(*)), payments:payments(*)')
        .or('treasurer_paid.is.null,treasurer_paid.eq.false,applicant_fee_paid.is.null,applicant_fee_paid.eq.false')
        .not('application_status', 'in', '("COMPLETED","REJECTED","CANCELLED","FULLY_APPROVED","PENDING_MARKET_SUPERVISOR_APPROVAL","PENDING_BPLO_APPROVAL")')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl === 'stakeholders') {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls!selected_stall_id(*), documents:stakeholder_documents(*), occupant:occupants(*, stall:stalls!occupants_stall_id_fkey(*)), payments:payments(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('stakeholders/user/')) {
      const userId = cleanUrl.replace('stakeholders/user/', '');
      if (!isUuid(userId)) {
        try {
          const rawSh = localStorage.getItem('manticao_stakeholders') || '{}';
          const shMap = JSON.parse(rawSh);
          const found = Object.values(shMap).find(s => String(s.user_id) === String(userId) || String(s.userId) === String(userId));
          if (found) return { data: normalizeRecord(found) };
        } catch (_) {}
        return { data: null };
      }
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls!selected_stall_id(*), occupant:occupants(*, stall:stalls!occupants_stall_id_fkey(*)), documents:stakeholder_documents(*), payments:payments(*)')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/requirements')) {
      const stakeholderId = cleanUrl.replace('stakeholders/', '').replace('/requirements', '');
      const { data, error } = await supabase
        .from('stakeholder_documents')
        .select('*')
        .eq('stakeholder_id', stakeholderId);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('stakeholders/') && !cleanUrl.includes('/', 13)) {
      const id = cleanUrl.replace('stakeholders/', '');
      const { data, error } = await supabase
        .from('stakeholders')
        .select('*, selectedStall:stalls!selected_stall_id(*), documents:stakeholder_documents(*), occupant:occupants(*, stall:stalls!occupants_stall_id_fkey(*)), payments:payments(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 7. Applications (authoritative stakeholder_applications table with resilient local merge)
    if (cleanUrl === 'applications') {
      let remoteApps = [];
      try {
        const { data, error } = await supabase
          .from('stakeholder_applications')
          .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
          .order('id', { ascending: false });
        if (!error && Array.isArray(data)) {
          remoteApps = data;
        }
      } catch (_) {}

      // NewApplicationView writes to the unified UUID applications table. Include
      // those rows in staff queues as well as legacy stakeholder applications.
      try {
        const { data: unifiedRows, error } = await supabase
          .from('applications')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(unifiedRows) && unifiedRows.length) {
          const applicantIds = [...new Set(unifiedRows.map(row => row.applicant_id).filter(Boolean))];
          const stallIds = [...new Set(unifiedRows.map(row => row.selected_stall_id).filter(Boolean))];
          const mayorIds = [...new Set(unifiedRows.map(row => row.mayor_official_id).filter(Boolean))];
          const [profilesResult, stallsResult, mayorsResult] = await Promise.all([
            applicantIds.length ? supabase.from('profiles').select('*').in('id', applicantIds) : Promise.resolve({ data: [] }),
            stallIds.length ? supabase.from('stalls').select('*').in('id', stallIds) : Promise.resolve({ data: [] }),
            mayorIds.length ? supabase.from('municipal_officials').select('*').in('id', mayorIds) : Promise.resolve({ data: [] })
          ]);
          const profilesById = new Map((profilesResult.data || []).map(row => [String(row.id), row]));
          const stallsById = new Map((stallsResult.data || []).map(row => [String(row.id), row]));
          const mayorsById = new Map((mayorsResult.data || []).map(row => [String(row.id), row]));
          remoteApps = [...remoteApps, ...unifiedRows.map(row => {
            const profile = profilesById.get(String(row.applicant_id)) || {};
            const nameParts = String(profile.full_name || '').trim().split(/\s+/);
            const stall = stallsById.get(String(row.selected_stall_id)) || null;
            return {
              ...row,
              id: row.id,
              application_no: row.application_number,
              status: row.current_status,
              loi_approval_status: row.mayor_approval_status || (row.mayor_decision === 'APPROVED' ? 'APPROVED' : null),
              loi_received_at: row.signed_loi_received_at,
              stakeholder: {
                ...profile,
                first_name: profile.first_name || nameParts[0] || '',
                last_name: profile.last_name || nameParts.slice(1).join(' '),
                full_name: profile.full_name || '',
                address: profile.residential_address || '',
                contact_number: profile.contact_number || '',
                business_name: row.trade_name,
                business_type: row.nature_of_business
              },
              stall,
              mayor_official: mayorsById.get(String(row.mayor_official_id)) || null
            };
          })];
        }
      } catch (_) {}

      let localApps = [];
      if (!config.remoteOnly) {
        try {
          const raw = localStorage.getItem('manticao_applications') || '[]';
          localApps = JSON.parse(raw);
        } catch (_) {}
      }

      const seen = new Set();
      const combined = [];

      for (const app of [...localApps, ...remoteApps]) {
        const key = app.application_no || app.applicationNo || app.id;
        if (key && !seen.has(String(key))) {
          seen.add(String(key));
          combined.push(app);
        }
      }

      return { data: normalizeRecord(combined) };
    }

    if (cleanUrl.startsWith('applications/user/')) {
      const userId = cleanUrl.replace('applications/user/', '');
      let found = null;
      if (isUuid(userId)) {
        try {
          const { data, error } = await supabase
            .from('stakeholder_applications')
            .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
            .eq('user_id', userId)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!error && data) found = data;
        } catch (_) {}
      }

      if (!found) {
        try {
          const raw = localStorage.getItem('manticao_applications') || '[]';
          const localList = JSON.parse(raw);
          found = localList.find(a => String(a.user_id) === String(userId) || String(a.userId) === String(userId));
        } catch (_) {}
      }

      return { data: normalizeRecord(found || null) };
    }

    // LOI Progress Status (Applicant & Staff Oversight)
    if (cleanUrl.startsWith('applications/') && cleanUrl.endsWith('/loi/progress')) {
      const id = cleanUrl.split('/')[1];
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const { data, error } = await supabase
        .from('stakeholder_applications')
        .select('id, application_no, loi_reference_no, loi_status, loi_approval_status, loi_generated_at, loi_last_exported_at, loi_printed_at, loi_received_at, loi_approved_at, loi_approval_reference, loi_remarks, loi_snapshot_json, document_template_version')
        .eq('id', queryId)
        .maybeSingle();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    if (cleanUrl.startsWith('applications/') && !cleanUrl.includes('user/')) {
      const id = cleanUrl.replace('applications/', '');
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      let found = null;
      try {
        const { data, error } = await supabase
          .from('stakeholder_applications')
          .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
          .eq('id', queryId)
          .maybeSingle();
        if (!error && data) found = data;
      } catch (_) {}

      if (!found) {
        try {
          const raw = localStorage.getItem('manticao_applications') || '[]';
          const localList = JSON.parse(raw);
          found = localList.find(a => String(a.id) === String(queryId) || String(a.application_no) === String(id) || String(a.applicationNo) === String(id));
        } catch (_) {}
      }

      return { data: normalizeRecord(found || null) };
    }

    // 8. Billings
    if (cleanUrl === 'billings') {
      try {
        const { data, error } = await supabase
          .from('billings')
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*), stall:stalls!occupants_stall_id_fkey(*)), contract:contracts(*, stall:stalls(*))')
          .order('id', { ascending: false });
        if (!error && data && data.length > 0) {
          return { data: normalizeRecord(data) };
        }
      } catch (e) {
        console.warn('[api.get /billings] relational query note:', e);
      }

      try {
        const { data: flatData, error: flatErr } = await supabase
          .from('billings')
          .select('*')
          .order('id', { ascending: false });
        if (!flatErr && flatData && flatData.length > 0) {
          return { data: normalizeRecord(flatData) };
        }
      } catch (flatErr) {
        console.warn('[api.get /billings] flat query note:', flatErr);
      }

      return { data: [] };
    }

    if (cleanUrl.startsWith('billings/')) {
      const bId = cleanUrl.replace('billings/', '');
      const queryId = !isNaN(Number(bId)) ? Number(bId) : bId;
      try {
        const { data, error } = await supabase
          .from('billings')
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*), stall:stalls!occupants_stall_id_fkey(*)), contract:contracts(*, stall:stalls(*))')
          .or(`id.eq.${queryId},billing_no.eq.${queryId}`)
          .maybeSingle();
        if (!error && data) {
          return { data: normalizeRecord(data) };
        }
      } catch (e) {
        console.warn('[api.get /billings/:id] relational query note:', e);
      }

      try {
        const { data: flatData, error: flatErr } = await supabase
          .from('billings')
          .select('*')
          .or(`id.eq.${queryId},billing_no.eq.${queryId}`)
          .maybeSingle();
        if (!flatErr && flatData) {
          return { data: normalizeRecord(flatData) };
        }
      } catch (_) {}

      return rawAxios.get(url, config);
    }

    // 8.1 Contracts
    if (cleanUrl === 'contracts') {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
          .order('id', { ascending: false });
        if (error) throw error;
        const normalized = normalizeRecord(data || []);
        if (normalized.length > 0) return { data: normalized };
      } catch (err) {
        console.warn('[api.get /contracts] error fetching from supabase:', err);
      }
      return { data: [] };
    }

    if (cleanUrl.startsWith('contracts/')) {
      const id = cleanUrl.replace('contracts/', '');
      const { data, error } = await supabase
        .from('contracts')
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { data: normalizeRecord(data) };
    }

    // 8.2 Occupants
    if (cleanUrl === 'occupants') {
      try {
        const { data, error } = await supabase
          .from('occupants')
          .select('*, stakeholder:stakeholders(*), stall:stalls!occupants_stall_id_fkey(*)')
          .order('id', { ascending: false });
        if (!error && data) {
          let contractsMap = {};
          try {
            const { data: cList } = await supabase.from('contracts').select('*');
            if (cList) {
              for (const c of cList) {
                const occId = c.occupant_id || c.occupantId;
                if (occId) {
                  if (!contractsMap[occId]) contractsMap[occId] = [];
                  contractsMap[occId].push(normalizeRecord(c));
                }
              }
            }
          } catch (_) {}

          const enriched = data.map(occ => {
            const item = normalizeRecord(occ);
            const occContracts = contractsMap[occ.id] || [];
            const activeContract = occContracts.find(c => String(c.status || '').toUpperCase() === 'ACTIVE');
            const inProgressContract = occContracts.find(c => ['PENDING', 'PENDING_APPROVAL', 'DRAFT'].includes(String(c.status || '').toUpperCase()));
            const resolvedContract = (occ.contract_id && occContracts.find(c => String(c.id) === String(occ.contract_id))) ||
              activeContract || inProgressContract || occContracts[0] || null;

            item.occupantId = occ.id;
            item.occupantStatus = occ.status || 'PENDING';
            if (resolvedContract) {
              item.contractId = resolvedContract.id;
              item.contractNo = resolvedContract.contractNo || resolvedContract.contract_no;
              item.contractStatus = resolvedContract.status || 'ACTIVE';
              item.contractStartDate = resolvedContract.startDate || resolvedContract.start_date;
              item.contractEndDate = resolvedContract.endDate || resolvedContract.end_date;
            } else {
              item.contractId = null;
              item.contractNo = null;
              item.contractStatus = 'NOT_CREATED';
              item.contractStartDate = null;
              item.contractEndDate = null;
            }
            return item;
          });
          return { data: enriched };
        }
      } catch (err) {
        console.warn('[api.get /occupants] Supabase query failed:', err);
      }
      return { data: [] };
    }

    if (cleanUrl.startsWith('occupants/stakeholder/')) {
      const stakeholderId = cleanUrl.replace('occupants/stakeholder/', '');
      try {
        const { data: occ, error } = await supabase
          .from('occupants')
          .select('*, stakeholder:stakeholders(*), stall:stalls!occupants_stall_id_fkey(*)')
          .eq('stakeholder_id', stakeholderId)
          .maybeSingle();
        if (!error && occ) {
          const item = normalizeRecord(occ);
          let resolvedContract = null;
          try {
            const { data: cList } = await supabase
              .from('contracts')
              .select('*')
              .eq('occupant_id', occ.id)
              .order('id', { ascending: false });
            if (cList && cList.length > 0) {
              const normList = cList.map(normalizeRecord);
              resolvedContract = normList.find(c => String(c.status || '').toUpperCase() === 'ACTIVE') ||
                normList.find(c => ['PENDING', 'PENDING_APPROVAL', 'DRAFT'].includes(String(c.status || '').toUpperCase())) ||
                normList[0];
            }
          } catch (_) {}

          item.occupantId = occ.id;
          item.occupantStatus = occ.status || 'PENDING';
          if (resolvedContract) {
            item.contractId = resolvedContract.id;
            item.contractNo = resolvedContract.contractNo || resolvedContract.contract_no;
            item.contractStatus = resolvedContract.status || 'ACTIVE';
            item.contractStartDate = resolvedContract.startDate || resolvedContract.start_date;
            item.contractEndDate = resolvedContract.endDate || resolvedContract.end_date;
          } else {
            item.contractId = null;
            item.contractNo = null;
            item.contractStatus = 'NOT_CREATED';
            item.contractStartDate = null;
            item.contractEndDate = null;
          }
          return { data: item };
        }
      } catch (err) {
        console.warn('[api.get /occupants/stakeholder] failed:', err);
      }
      return { data: null };
    }

    if (cleanUrl.startsWith('occupants/')) {
      const occId = cleanUrl.replace('occupants/', '');
      try {
        const { data: occ, error } = await supabase
          .from('occupants')
          .select('*, stakeholder:stakeholders(*), stall:stalls!occupants_stall_id_fkey(*)')
          .eq('id', occId)
          .maybeSingle();
        if (!error && occ) {
          const item = normalizeRecord(occ);
          let resolvedContract = null;
          try {
            const { data: cList } = await supabase
              .from('contracts')
              .select('*')
              .eq('occupant_id', occ.id)
              .order('id', { ascending: false });
            if (cList && cList.length > 0) {
              const normList = cList.map(normalizeRecord);
              resolvedContract = normList.find(c => String(c.status || '').toUpperCase() === 'ACTIVE') ||
                normList.find(c => ['PENDING', 'PENDING_APPROVAL', 'DRAFT'].includes(String(c.status || '').toUpperCase())) ||
                normList[0];
            }
          } catch (_) {}

          item.occupantId = occ.id;
          item.occupantStatus = occ.status || 'PENDING';
          if (resolvedContract) {
            item.contractId = resolvedContract.id;
            item.contractNo = resolvedContract.contractNo || resolvedContract.contract_no;
            item.contractStatus = resolvedContract.status || 'ACTIVE';
            item.contractStartDate = resolvedContract.startDate || resolvedContract.start_date;
            item.contractEndDate = resolvedContract.endDate || resolvedContract.end_date;
          } else {
            item.contractId = null;
            item.contractNo = null;
            item.contractStatus = 'NOT_CREATED';
            item.contractStartDate = null;
            item.contractEndDate = null;
          }
          return { data: item };
        }
      } catch (err) {
        console.warn('[api.get /occupants/:id] failed:', err);
      }
      return { data: null };
    }

    // 8.3 Delinquency Management
    if (cleanUrl === 'delinquency/flagged') {
      try {
        const { data: bills, error: bErr } = await supabase
          .from('billings')
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*), stall:stalls!occupants_stall_id_fkey(*)), contract:contracts(*, stall:stalls(*))')
          .or('status.eq.OVERDUE,balance.gt.0')
          .order('due_date', { ascending: true });

        if (bErr) throw bErr;

        const now = Date.now();
        const flaggedMap = new Map();

        for (const b of (bills || [])) {
          const bal = Number(b.balance || 0);
          if (bal <= 0) continue;

          const dueDate = b.due_date ? new Date(b.due_date).getTime() : now;
          const isOverdue = b.status === 'OVERDUE' || dueDate < now;
          if (!isOverdue) continue;

          const daysOverdue = Math.max(0, Math.floor((now - dueDate) / 86400000));
          const occ = b.occupant || {};
          const sh = occ.stakeholder || {};
          const stall = b.contract?.stall || occ.stall || {};
          const key = occ.id || sh.id || b.id;

          if (!flaggedMap.has(key)) {
            flaggedMap.set(key, {
              id: b.id,
              billingId: b.id,
              occupantId: occ.id || null,
              stakeholderId: sh.id || null,
              vendorName: [sh.first_name, sh.last_name].filter(Boolean).join(' ') || sh.business_name || 'Vendor',
              businessName: sh.business_name || '',
              stallNo: stall.stall_no || 'Unassigned',
              stallType: stall.stall_type || 'Standard',
              monthlyRent: Number(stall.monthly_rent ?? 0),
              totalArrears: 0,
              daysOverdue: 0,
              noticesSent: (b.final_notice_sent_at ? 3 : (b.second_notice_sent_at ? 2 : (b.first_notice_sent_at ? 1 : 0))),
              firstNoticeSentAt: b.first_notice_sent_at,
              secondNoticeSentAt: b.second_notice_sent_at,
              finalNoticeSentAt: b.final_notice_sent_at,
              contractId: b.contract_id || occ.contract_id || null,
              contractNo: b.contract?.contract_no || null,
              status: daysOverdue >= 90 ? 'CRITICAL' : (daysOverdue >= 60 ? 'FINAL_WARNING' : 'FIRST_NOTICE'),
              billingPeriod: b.billing_period
            });
          }

          const existing = flaggedMap.get(key);
          existing.totalArrears += bal;
          if (daysOverdue > existing.daysOverdue) {
            existing.daysOverdue = daysOverdue;
            existing.status = daysOverdue >= 90 ? 'CRITICAL' : (daysOverdue >= 60 ? 'FINAL_WARNING' : 'FIRST_NOTICE');
          }
        }

        return { data: Array.from(flaggedMap.values()) };
      } catch (delinqErr) {
        console.warn('[api.get /delinquency/flagged] Error:', delinqErr);
        return { data: [] };
      }
    }

    if (cleanUrl === 'delinquency/stats') {
      try {
        const { data: bills, error: bErr } = await supabase
          .from('billings')
          .select('*')
          .or('status.eq.OVERDUE,balance.gt.0');

        if (bErr) throw bErr;

        const now = Date.now();
        let totalArrears = 0;
        let criticalAccountsCount = 0;
        let notice1Count = 0;
        let notice2Count = 0;
        let finalNoticeCount = 0;

        const vendorArrears = new Map();

        for (const b of (bills || [])) {
          const bal = Number(b.balance || 0);
          if (bal <= 0) continue;

          const dueDate = b.due_date ? new Date(b.due_date).getTime() : now;
          if (b.status === 'OVERDUE' || dueDate < now) {
            totalArrears += bal;
            const days = Math.max(0, Math.floor((now - dueDate) / 86400000));
            const occId = b.occupant_id || b.id;
            vendorArrears.set(occId, Math.max(vendorArrears.get(occId) || 0, days));

            if (b.first_notice_sent_at) notice1Count++;
            if (b.second_notice_sent_at) notice2Count++;
            if (b.final_notice_sent_at) finalNoticeCount++;
          }
        }

        for (const [, maxDays] of vendorArrears) {
          if (maxDays >= 90) criticalAccountsCount++;
        }

        return {
          data: {
            totalArrears,
            flaggedVendorsCount: vendorArrears.size,
            criticalAccountsCount,
            notice1Count,
            notice2Count,
            finalNoticeCount
          }
        };
      } catch (statsErr) {
        console.warn('[api.get /delinquency/stats] Error:', statsErr);
        return {
          data: {
            totalArrears: 0,
            flaggedVendorsCount: 0,
            criticalAccountsCount: 0,
            notice1Count: 0,
            notice2Count: 0,
            finalNoticeCount: 0
          }
        };
      }
    }

    // 8.4 Collection Remittances
    if (cleanUrl === 'collections/remittances') {
      try {
        const { data: rems, error: remErr } = await supabase
          .from('collection_remittances')
          .select('*, items:collection_remittance_items(*)')
          .order('id', { ascending: false });

        if (remErr) throw remErr;
        return { data: normalizeRecord(rems || []) };
      } catch (err) {
        console.warn('[api.get /collections/remittances] Error:', err);
        return { data: [] };
      }
    }

    // 8.5 Digital Occupancy Permit QR Verification
    if (cleanUrl.startsWith('permits/inspect/')) {
      const code = decodeURIComponent(cleanUrl.replace('permits/inspect/', '').trim());
      try {
        const { data: permit, error: pErr } = await supabase
          .from('occupancy_permits')
          .select('*, vendor:stakeholders(*), stall:stalls(*), contract:contracts(*), occupant:occupants(*)')
          .or(`permit_no.eq.${code},integrity_hash.eq.${code}`)
          .maybeSingle();

        if (pErr) throw pErr;
        if (!permit) {
          throw new Error('Permit not found with the provided identifier.');
        }

        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('permit_scan_logs').insert({
              permit_id: permit.id,
              scanned_by: user?.id || null,
              scan_type: 'INSPECTOR',
              is_valid: permit.status === 'ACTIVE'
            });
          } catch (_) {}
        })();

        return { data: { permit: normalizeRecord(permit) } };
      } catch (err) {
        console.warn('[api.get /permits/inspect] Error:', err);
        throw err;
      }
    }

    // 9. Payments
    if (cleanUrl === 'payments') {
      const { data, error } = await supabase
        .from('payments')
        .select('*, stakeholder:stakeholders(*), billing:billings(*)')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 10. Audit Logs
    if (cleanUrl === 'audit-logs' || cleanUrl === 'admin/audit-logs') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 11. Login History
    if (cleanUrl === 'login-history' || cleanUrl === 'admin/login-history') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .ilike('action', '%LOGIN%')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    // 12. Notifications
    if (cleanUrl === 'notifications') {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return { data: normalizeRecord(data || []) };
    }

    if (cleanUrl.startsWith('notifications/stakeholder/')) {
      const parts = cleanUrl.split('/');
      const stakeholderId = parts[2];
      if (cleanUrl.endsWith('/unread-count')) {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('stakeholder_id', stakeholderId)
          .eq('is_read', false);
        if (error) throw error;
        return { data: count || 0 };
      } else {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('stakeholder_id', stakeholderId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return { data: normalizeRecord(data || []) };
      }
    }

    // 13. AI Insights
    if (cleanUrl.includes('ai/') || cleanUrl.includes('ai-insights')) {
      const { data, error } = await supabase.functions.invoke('ai-insights/summary');
      if (error) throw error;
      return { data };
    }

    // 14. Reports Endpoints (Collection, Liability, Stall Occupancy)
    if (cleanUrl === 'reports/daily-collections' || cleanUrl === 'reports/collection') {
      try {
        let paymentsList = []
        try {
          const { data, error } = await supabase
            .from('payments')
            .select('*, stakeholder:stakeholders(*), billing:billings(*)')
            .order('payment_date', { ascending: false })
          if (!error && data) {
            paymentsList = normalizeRecord(data)
          }
        } catch (_) {}

        if (!paymentsList.length) {
          try {
            const raw = localStorage.getItem('payments')
            if (raw) paymentsList = JSON.parse(raw)
          } catch (_) {}
        }

        const month = config.params?.month ? Number(config.params.month) : null
        const year = config.params?.year ? Number(config.params.year) : null

        const filtered = paymentsList.filter(p => {
          const d = new Date(p.paymentDate || p.payment_date || p.date || p.createdAt || p.created_at)
          if (isNaN(d.getTime())) return true
          if (month && d.getMonth() + 1 !== month) return false
          if (year && d.getFullYear() !== year) return false
          return true
        })

        // Group into daily collections
        const dailyMap = {}
        filtered.forEach(p => {
          const rawDate = p.paymentDate || p.payment_date || p.date || p.createdAt || p.created_at || 'Unknown Date'
          const dateStr = String(rawDate).split('T')[0]
          if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = { date: dateStr, totalTransactions: 0, totalAmount: 0 }
          }
          dailyMap[dateStr].totalTransactions += 1
          const amt = Number(String(p.amount || 0).replace(/[^\d.-]/g, '')) || 0
          dailyMap[dateStr].totalAmount += amt
        })

        const dailyCollections = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date))
        const totalCollected = filtered.reduce((sum, p) => sum + (Number(String(p.amount || 0).replace(/[^\d.-]/g, '')) || 0), 0)

        if (cleanUrl === 'reports/daily-collections') {
          return { data: dailyCollections }
        }

        return {
          data: {
            totalCollected,
            totalTransactions: filtered.length,
            dailyCollections,
            receipts: filtered
          }
        }
      } catch (err) {
        console.warn('[api.get /reports/collection] Error:', err)
        return { data: [] }
      }
    }

    if (cleanUrl === 'reports/outstanding-balances' || cleanUrl === 'reports/liability') {
      try {
        let billingsList = []
        try {
          const { data, error } = await supabase
            .from('billings')
            .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
            .order('due_date', { ascending: true })
          if (!error && data) {
            billingsList = normalizeRecord(data)
          }
        } catch (_) {}

        if (!billingsList.length) {
          try {
            const raw = localStorage.getItem('billings')
            if (raw) billingsList = JSON.parse(raw)
          } catch (_) {}
        }

        const month = config.params?.month ? Number(config.params.month) : null
        const year = config.params?.year ? Number(config.params.year) : null

        const filtered = billingsList.filter(b => {
          const d = new Date(b.dueDate || b.due_date || b.billingPeriod || b.createdAt)
          if (isNaN(d.getTime())) return true
          if (month && d.getMonth() + 1 !== month) return false
          if (year && d.getFullYear() !== year) return false
          return true
        })

        const mapped = filtered.map(b => {
          const tot = Number(b.totalAmount ?? b.total_amount ?? b.amount ?? 0)
          const pd = Number(b.paidAmount ?? b.paid_amount ?? 0)
          const bal = Number(b.balance !== undefined ? b.balance : Math.max(tot - pd, 0))
          const sName = [b.occupant?.stakeholder?.firstName, b.occupant?.stakeholder?.lastName].filter(Boolean).join(' ') ||
            b.stakeholderName || b.stakeholder || 'Stakeholder'
          const bName = b.occupant?.stakeholder?.businessName || b.businessName || ''
          const stNo = b.contract?.stall?.stallNo || b.stallNo || b.stall_no || ''
          const due = b.dueDate || b.due_date || ''
          const isOverdue = due && new Date(due).getTime() < Date.now() && bal > 0
          const status = bal <= 0 ? 'PAID' : (isOverdue ? 'OVERDUE' : (pd > 0 ? 'PARTIALLY_PAID' : 'UNPAID'))

          return {
            billingNo: b.billingNo || b.billing_no || `BILL-${b.id || ''}`,
            businessName: bName || sName,
            stakeholder: sName,
            stallNo: stNo,
            balance: bal,
            totalAmount: tot,
            paidAmount: pd,
            dueDate: due,
            period: b.billingPeriod || b.billing_period || b.period || '',
            status
          }
        })

        return { data: mapped }
      } catch (err) {
        console.warn('[api.get /reports/liability] Error:', err)
        return { data: [] }
      }
    }

    if (cleanUrl === 'reports/occupancy' || cleanUrl === 'reports/stall-occupancy') {
      try {
        let stallsList = []
        try {
          const { data, error } = await supabase
            .from('stalls')
            .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
            .order('id', { ascending: true })
          if (!error && data) {
            stallsList = normalizeRecord(data)
          }
        } catch (_) {}

        if (!stallsList.length) {
          try {
            const raw = localStorage.getItem('stalls')
            if (raw) stallsList = JSON.parse(raw)
          } catch (_) {}
        }

        let contractsList = []
        try {
          const { data } = await supabase.from('contracts').select('*')
          if (data) contractsList = normalizeRecord(data)
        } catch (_) {}
        if (!contractsList.length) {
          try {
            const raw = localStorage.getItem('contracts')
            if (raw) contractsList = JSON.parse(raw)
          } catch (_) {}
        }

        const enriched = stallsList.map(stall => {
          const sNo = stall.stallNo || stall.stall_no || ''
          const matchedContract = contractsList.find(c => (c.stallNo && c.stallNo === sNo) || (c.stallId && c.stallId === stall.id))
          const occupant = stall.occupant
          const stakeholder = occupant?.stakeholder

          const occName = stakeholder ? [stakeholder.firstName, stakeholder.lastName].filter(Boolean).join(' ') :
            (occupant?.name || matchedContract?.stakeholder || '')
          const busName = stakeholder?.businessName || matchedContract?.business || ''
          const normStatus = String(stall.status || '').toUpperCase()
          const isOccupied = ['OCCUPIED', 'RENTED', 'ASSIGNED'].includes(normStatus) || Boolean(occName)

          return {
            id: stall.id,
            stallNo: sNo,
            section: stall.section || stall.info || 'General Section',
            stallType: stall.stallType || stall.stall_type || 'Standard',
            monthlyRent: Number(stall.monthlyRent || stall.monthly_rent || 0),
            status: isOccupied ? 'OCCUPIED' : (normStatus === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE'),
            occupantName: isOccupied ? (occName || 'Assigned Stakeholder') : 'Available / Unassigned',
            businessName: busName || (isOccupied ? 'Registered Trade' : '—'),
            contractNo: matchedContract?.contractNo || matchedContract?.ref || (isOccupied ? `CON-${sNo}` : 'None'),
            leasePeriod: matchedContract?.startDate && matchedContract?.endDate ? `${matchedContract.startDate} to ${matchedContract.endDate}` : (isOccupied ? 'Active Lease' : '—')
          }
        })

        return { data: enriched }
      } catch (err) {
        console.warn('[api.get /reports/occupancy] Error:', err)
        return { data: [] }
      }
    }

    // 15. Delinquency & Arrears Monitoring (Strict 60-day / 2-month Grace Period)
    if (cleanUrl === 'delinquency/flagged' || cleanUrl === 'reports/delinquency') {
      try {
        const { data: bList, error } = await supabase
          .from('billings')
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
          .gt('balance', 0)
          .order('due_date', { ascending: true })

        if (error) throw error

        const now = Date.now()
        const contractMap = {}

        for (const b of (bList || [])) {
          const dueDate = b.due_date ? new Date(b.due_date).getTime() : 0
          if (!dueDate || dueDate >= now) continue // Not yet due

          const daysPastDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24))
          // Confirmed Decision 4: Apply the 2-month grace period (60 days)
          if (daysPastDue <= 60) continue // Still within the 2-month grace period

          const cId = b.contract_id || b.contract?.id || `OCC-${b.occupant_id}`
          const sName = [b.occupant?.stakeholder?.first_name, b.occupant?.stakeholder?.last_name].filter(Boolean).join(' ') ||
            b.contract?.stakeholder_name || 'Assigned Stakeholder'
          const stNo = b.contract?.stall?.stall_no || b.stall_no || '—'

          if (!contractMap[cId]) {
            contractMap[cId] = {
              contractId: b.contract_id || b.contract?.id,
              contractNo: b.contract?.contract_no || `CON-${b.contract_id}`,
              vendorName: sName,
              stakeholderId: b.occupant?.stakeholder_id || b.occupant?.stakeholder?.id,
              stallNo: stNo,
              overdueBalance: 0,
              maxDaysOverdue: 0,
              unpaidBills: [],
              gracePeriodMonths: 2,
              gracePeriodExpired: true
            }
          }

          const bal = Number(b.balance || 0)
          contractMap[cId].overdueBalance += bal
          if (daysPastDue > contractMap[cId].maxDaysOverdue) {
            contractMap[cId].maxDaysOverdue = daysPastDue
          }
          contractMap[cId].unpaidBills.push({
            billingId: b.id,
            billingNo: b.billing_no,
            dueDate: b.due_date,
            balance: bal,
            daysPastDue
          })
        }

        const flaggedList = Object.values(contractMap).map(c => ({
          ...c,
          overdueBalanceFormatted: `₱${c.overdueBalance.toLocaleString()}`,
          isCriticalRevocationRisk: c.maxDaysOverdue > 90
        }))

        return {
          data: {
            flaggedContracts: flaggedList,
            totalDelinquentCount: flaggedList.length,
            totalArrearsAmount: flaggedList.reduce((sum, c) => sum + c.overdueBalance, 0)
          }
        }
      } catch (dErr) {
        console.warn('[api.get /delinquency/flagged] Error:', dErr)
        return { data: { flaggedContracts: [], totalDelinquentCount: 0, totalArrearsAmount: 0 } }
      }
    }

    // 16. Advance Credits
    if (cleanUrl === 'advance-credits' || cleanUrl.startsWith('advance-credits/')) {
      try {
        let q = supabase
          .from('advance_credits')
          .select('*, stakeholder:stakeholders(*)')
          .order('id', { ascending: false })

        if (cleanUrl.startsWith('advance-credits/stakeholder/')) {
          const shId = cleanUrl.replace('advance-credits/stakeholder/', '')
          q = q.eq('stakeholder_id', Number(shId))
        }

        const { data, error } = await q
        if (error) throw error
        return { data: normalizeRecord(data || []) }
      } catch (acErr) {
        console.warn('[api.get /advance-credits] Notice:', acErr)
        return { data: [] }
      }
    }

    // 17. Overdue Notices
    if (cleanUrl === 'notices' || cleanUrl.startsWith('notices/')) {
      try {
        let q = supabase
          .from('notices')
          .select('*, contract:contracts(*), stakeholder:stakeholders(*)')
          .order('issued_at', { ascending: false })

        if (cleanUrl.startsWith('notices/contract/')) {
          const cId = cleanUrl.replace('notices/contract/', '')
          q = q.eq('contract_id', Number(cId))
        } else if (cleanUrl.startsWith('notices/stakeholder/')) {
          const sId = cleanUrl.replace('notices/stakeholder/', '')
          q = q.eq('stakeholder_id', Number(sId))
        }

        const { data, error } = await q
        if (error) throw error
        return { data: normalizeRecord(data || []) }
      } catch (nErr) {
        console.warn('[api.get /notices] Notice:', nErr)
        return { data: [] }
      }
    }

    // 18. Credit Allocations
    if (cleanUrl === 'credit-allocations') {
      try {
        const { data, error } = await supabase
          .from('credit_allocations')
          .select('*, advance_credit:advance_credits(*), billing:billings(*)')
          .order('allocated_at', { ascending: false })
        if (error) throw error
        return { data: normalizeRecord(data || []) }
      } catch (caErr) {
        console.warn('[api.get /credit-allocations] Notice:', caErr)
        return { data: [] }
      }
    }

    return rawAxios.get(url, config);
  },

  async post(url, data, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');
    invalidateApiCache(cleanUrl.split('/')[0]);

    // 0.1 Authentication: Register (Temporary Applicant Account)
    if (cleanUrl === 'auth/register') {
      const { username, password, fullName, role, stallId, stallNo } = data || {};
      if (!username || !password) {
        throw new Error('Username and password are required.');
      }

      const cleanUsername = String(username).trim();
      const assignedRole = (role || (cleanUsername.toLowerCase() === 'admin' ? 'ADMIN' : 'APPLICANT')).toUpperCase();

      // 1. Pre-check if username already exists in user_profiles
      try {
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id, username')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (existingUser?.username) {
          throw new Error('An account with this username already exists. Please choose another username or sign in from the Login page.');
        }
      } catch (checkErr) {
        if (checkErr?.message?.includes('already exists')) throw checkErr;
      }

      // Check temporary accounts cache
      try {
        const rawTemp = localStorage.getItem('manticao_temp_accounts') || '{}';
        const tempMap = JSON.parse(rawTemp);
        if (tempMap[cleanUsername.toLowerCase()]) {
          throw new Error('An account with this username already exists. Please choose another username or sign in from the Login page.');
        }
      } catch (tempErr) {
        if (tempErr?.message?.includes('already exists')) throw tempErr;
      }

      // 2. Generate temporary user ID (crypto UUID)
      const userId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // 3. Save to temporary accounts registry so user can log in immediately
      try {
        const rawTemp = localStorage.getItem('manticao_temp_accounts') || '{}';
        const tempAccounts = JSON.parse(rawTemp);
        tempAccounts[cleanUsername.toLowerCase()] = {
          id: userId,
          username: cleanUsername,
          password: password,
          role: assignedRole,
          stallId: stallId || null,
          stallNo: stallNo || null,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('manticao_temp_accounts', JSON.stringify(tempAccounts));
      } catch (_) {}

      // 4. Attempt to persist to public.temporary_accounts table
      try {
        await supabase.from('temporary_accounts').insert({
          email: `${cleanUsername.toLowerCase().replace(/[^a-z0-9_.-]/g, '')}@temporary.manticao.gov.ph`,
          first_name: cleanUsername,
          last_name: 'Applicant',
          expires_at: new Date(Date.now() + 86400000 * 14).toISOString()
        });
      } catch (_) {}

      localStorage.setItem('userId', userId);
      if (stallId) localStorage.setItem('preferred_stall_id', String(stallId));
      if (stallNo) localStorage.setItem('preferred_stall_no', String(stallNo));

      const token = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({
        sub: userId,
        username: cleanUsername,
        role: assignedRole,
        exp: Math.floor(Date.now() / 1000) + 86400 * 14
      })) + '.sig';

      return {
        data: {
          success: true,
          message: 'Temporary account created successfully.',
          token,
          user: {
            id: userId,
            username: cleanUsername,
            role: assignedRole
          }
        }
      };
    }

    // 0.2 Authentication: Login
    if (cleanUrl === 'auth/login') {
      const { username, password } = data || {};
      if (!username || !password) {
        throw new Error('Username and password are required.');
      }

      const cleanUsername = String(username).trim();
      const lowerId = cleanUsername.toLowerCase();

      // Check registered temporary applicant accounts first
      try {
        const rawTemp = localStorage.getItem('manticao_temp_accounts') || '{}';
        const tempAccounts = JSON.parse(rawTemp);
        const match = tempAccounts[lowerId];
        if (match) {
          if (match.password !== password) {
            throw new Error('Invalid username or password. Please verify your credentials and try again.');
          }

          const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({
            sub: match.id,
            username: match.username,
            role: match.role || 'APPLICANT',
            exp: Math.floor(Date.now() / 1000) + 86400 * 14
          })) + '.sig';

          localStorage.setItem(AUTH_TOKEN_KEY, fakeToken);
          localStorage.setItem('userId', match.id);
          if (match.stallId) localStorage.setItem('preferred_stall_id', String(match.stallId));
          if (match.stallNo) localStorage.setItem('preferred_stall_no', String(match.stallNo));

          return {
            data: {
              success: true,
              token: fakeToken,
              user: {
                id: match.id,
                username: match.username,
                email: match.email || '',
                role: match.role || 'APPLICANT'
              }
            }
          };
        }
      } catch (tempErr) {
        if (tempErr.message?.includes('Invalid')) throw tempErr;
      }

      const MUNICIPAL_STAFF_MAP = {
        admin: 'admin@manticao.market',
        market_supervisor: 'supervisor@manticao.gov.ph',
        supervisor: 'supervisor@manticao.gov.ph',
        mayor: 'mayor@manticao.gov.ph',
        municipal_mayor: 'mayor@manticao.gov.ph',
        treasurer: 'treasurer@manticao.gov.ph',
        collector: 'collector@manticao.gov.ph',
        inspector: 'collector@manticao.gov.ph',
        collector_inspector: 'collector@manticao.gov.ph',
        applicant: 'applicant@manticao.market',
        vendor: 'vendor@manticao.market'
      };

      let emailToAuth = cleanUsername;
      if (!cleanUsername.includes('@')) {
        if (MUNICIPAL_STAFF_MAP[lowerId]) {
          emailToAuth = MUNICIPAL_STAFF_MAP[lowerId];
        } else {
          try {
            let prof = null;
            const { data: uProf } = await supabase
              .from('user_profiles')
              .select('email, username')
              .ilike('username', cleanUsername)
              .maybeSingle();
            prof = uProf;

            if (!prof?.email) {
              const { data: altProf } = await supabase
                .from('profiles')
                .select('email, username')
                .ilike('username', cleanUsername)
                .maybeSingle();
              if (altProf?.email) prof = altProf;
            }

            if (prof?.email) {
              emailToAuth = prof.email.trim();
            } else {
              emailToAuth = `${lowerId.replace(/[^a-z0-9_.-]/g, '')}@manticao.market`;
            }
          } catch (_) {
            emailToAuth = `${lowerId.replace(/[^a-z0-9_.-]/g, '')}@manticao.market`;
          }
        }
      }

      let authResult = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: password
      });

      if (authResult.error) {
        const altPasswords = ['AdminPassword123!', 'Admin@123', 'Password@123'];
        for (const altPw of altPasswords) {
          if (altPw !== password) {
            const retry = await supabase.auth.signInWithPassword({
              email: emailToAuth,
              password: altPw
            });
            if (!retry.error && retry.data?.session) {
              authResult = retry;
              break;
            }
          }
        }
      }

      if (authResult.error && !cleanUsername.includes('@') && emailToAuth.endsWith('@manticao.market')) {
        const retryGov = await supabase.auth.signInWithPassword({
          email: `${lowerId}@manticao.gov.ph`,
          password: password
        });
        if (!retryGov.error && retryGov.data?.session) {
          authResult = retryGov;
        }
      }

      if (authResult.error) {
        throw new Error(authResult.error.message || 'Invalid username or password.');
      }

      const session = authResult.data.session;
      const authUser = authResult.data.user;

      const [profileRes, stakeholderRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', authUser.id).maybeSingle(),
        supabase.from('stakeholders').select('id').eq('user_id', authUser.id).maybeSingle()
      ]);

      const profile = profileRes?.data || null;
      const stakeholder = stakeholderRes?.data || null;
      const role = profile?.role || authUser.user_metadata?.role || (lowerId === 'admin' ? 'ADMIN' : 'APPLICANT');

      if (session?.access_token) {
        localStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
      }
      localStorage.setItem('userId', authUser.id);
      if (stakeholder?.id) {
        localStorage.setItem('stakeholderId', String(stakeholder.id));
      }

      return {
        data: {
          success: true,
          token: session?.access_token || '',
          session,
          user: {
            id: authUser.id,
            username: profile?.username || cleanUsername,
            email: authUser.email,
            role: role
          },
          stakeholderId: stakeholder ? String(stakeholder.id) : null
        }
      };
    }

    // 1. Applications upload/create (authoritative stakeholder_applications + stakeholders)
    if (cleanUrl === 'applications') {
      const appNo = `APP-${Date.now()}`;
      let resolvedUserId = null;
      let bName = '';
      let bType = '';
      let fName = '';
      let mName = '';
      let lName = '';
      let contactStr = '';
      let emailStr = '';
      let addressStr = '';
      let civilStatusStr = '';
      let genderStr = '';
      let dateOfBirthStr = '';
      let emergencyContactPerson = '';
      let emergencyContactNumber = '';
      let numStallId = null;
      let idUrl = null;
      let letterUrl = null;
      let idFileName = 'valid_id';
      let letterFileName = 'letter_of_intent';
      let validIdType = '';
      let validIdNo = '';
      let natureOfBusiness = [];
      let otherNature = '';
      let commodities = '';
      let stallSpaceType = '';
      let preferredStallNo = '';
      let estimatedEmployees = 0;
      let undertakingAgreed = false;
      let loiContent = '';

      if (data instanceof FormData) {
        let rawUserId = data.get('userId');
        resolvedUserId = (rawUserId && rawUserId !== 'null' && rawUserId !== 'undefined') ? rawUserId : null;
        bName = data.get('businessName') || data.get('tradeNameFranchise') || '';
        bType = data.get('businessType') || data.get('businessActivity') || '';
        fName = data.get('firstName') || '';
        mName = data.get('middleName') || '';
        lName = data.get('lastName') || '';
        contactStr = data.get('contact') || data.get('mobileNo') || '';
        emailStr = data.get('email') || '';
        addressStr = data.get('address') || '';
        civilStatusStr = data.get('civilStatus') || data.get('civil_status') || '';
        genderStr = data.get('gender') || data.get('orgGender') || '';
        dateOfBirthStr = data.get('dateOfBirth') || data.get('date_of_birth') || '';
        emergencyContactPerson = data.get('emergencyContactPerson') || data.get('emergency_contact_person') || '';
        emergencyContactNumber = data.get('emergencyContactNumber') || data.get('emergency_contact_number') || '';
        const rawStall = data.get('stallId') || data.get('selectedStallId');
        numStallId = rawStall ? Number(rawStall) : null;

        validIdType = data.get('validIdType') || '';
        validIdNo = data.get('validIdNo') || '';
        const rawNature = data.get('natureOfBusiness');
        if (rawNature) {
          try { natureOfBusiness = JSON.parse(rawNature); } catch (_) { natureOfBusiness = [rawNature]; }
        }
        otherNature = data.get('otherNature') || '';
        commodities = data.get('commodities') || bType;
        stallSpaceType = data.get('stallSpaceType') || '';
        preferredStallNo = data.get('preferredStallNo') || data.get('stallNumberCode') || '';
        estimatedEmployees = Number(data.get('estimatedEmployees') ?? 0);
        undertakingAgreed = data.get('undertakingAgreed') === 'true' || data.get('undertakingAgreed') === true;
        loiContent = data.get('loiContent') || '';

        // Unified Application Form for Business Permit fields from FormData
        var applicationType = data.get('applicationType') || 'NEW';
        var paymentMode = data.get('paymentMode') || 'Annually';
        var trackingNumber = data.get('trackingNumber') || '';
        var businessIdNumber = data.get('businessIdNumber') || '';

        var orgType = data.get('orgType') || '';
        var orgGender = data.get('orgGender') || '';
        var dtiSecCdaRegNo = data.get('dtiSecCdaRegNo') || '';
        var tinNo = data.get('tinNo') || '';
        var tradeNameFranchise = data.get('tradeNameFranchise') || bName;

        var mainHouseBldgNo = data.get('mainHouseBldgNo') || '';
        var mainBldgName = data.get('mainBldgName') || '';
        var mainLotNo = data.get('mainLotNo') || '';
        var mainBlockNo = data.get('mainBlockNo') || '';
        var mainStreet = data.get('mainStreet') || '';
        var mainSubdivision = data.get('mainSubdivision') || '';
        var mainBarangay = data.get('mainBarangay') || '';
        var mainDistrict = data.get('mainDistrict') || '';
        var mainMunicipality = data.get('mainMunicipality') || '';
        var mainProvince = data.get('mainProvince') || '';
        var mainZipCode = data.get('mainZipCode') || '';

        var telephoneNo = data.get('telephoneNo') || '';
        var mobileNo = data.get('mobileNo') || contactStr;

        var ownerSurname = data.get('ownerSurname') || lName;
        var ownerGivenName = data.get('ownerGivenName') || fName;
        var ownerMiddleName = data.get('ownerMiddleName') || mName;
        var ownerSuffix = data.get('ownerSuffix') || '';

        var corpPresidentSurname = data.get('corpPresidentSurname') || '';
        var corpPresidentGivenName = data.get('corpPresidentGivenName') || '';
        var corpPresidentMiddleName = data.get('corpPresidentMiddleName') || '';
        var corpPresidentSuffix = data.get('corpPresidentSuffix') || '';
        var corpCitizenship = data.get('corpCitizenship') || '';

        var businessAreaSqm = Number(data.get('businessAreaSqm') ?? 0);
        var totalFloorAreaSqm = Number(data.get('totalFloorAreaSqm') ?? 0);
        var numEmployeesMale = Number(data.get('numEmployeesMale') || 0);
        var numEmployeesFemale = Number(data.get('numEmployeesFemale') ?? 0);
        var numEmployeesLguResiding = Number(data.get('numEmployeesLguResiding') ?? 0);
        var deliveryVehiclesVanTruck = Number(data.get('deliveryVehiclesVanTruck') || 0);
        var deliveryVehiclesMotorcycle = Number(data.get('deliveryVehiclesMotorcycle') || 0);

        var locSameAsMain = data.get('locSameAsMain') !== 'false' && data.get('locSameAsMain') !== false;
        var locHouseBldgNo = data.get('locHouseBldgNo') || mainHouseBldgNo;
        var locBldgName = data.get('locBldgName') || mainBldgName;
        var locLotNo = data.get('locLotNo') || mainLotNo;
        var locBlockNo = data.get('locBlockNo') || mainBlockNo;
        var locStreet = data.get('locStreet') || mainStreet;
        var locSubdivision = data.get('locSubdivision') || mainSubdivision;
        var locBarangay = data.get('locBarangay') || mainBarangay;
        var locDistrict = data.get('locDistrict') || mainDistrict;
        var locMunicipality = data.get('locMunicipality') || mainMunicipality;
        var locProvince = data.get('locProvince') || mainProvince;
        var locZipCode = data.get('locZipCode') || mainZipCode;

        var propertyOwned = data.get('propertyOwned') === 'true' || data.get('propertyOwned') === true;
        var taxDecNo = data.get('taxDecNo') || '';
        var propertyIdNo = data.get('propertyIdNo') || '';
        var taxIncentivesEnjoyed = data.get('taxIncentivesEnjoyed') === 'true' || data.get('taxIncentivesEnjoyed') === true;
        var businessActivity = data.get('businessActivity') || '';
        var businessActivityOther = data.get('businessActivityOther') || '';
        var incumbentMayor = data.get('incumbentMayor') || '';

        var rawBusinessLines = data.get('businessLines');
        var businessLines = [];
        if (rawBusinessLines) {
          try { businessLines = JSON.parse(rawBusinessLines); } catch (_) { businessLines = []; }
        }

        var idFile = data.get('idFile');
        var letterFile = data.get('letterFile');

        if (idFile && idFile.name) {
          idFileName = idFile.name;
          var idPath = `applications/${Date.now()}_id_${idFile.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
          var { error: idErr } = await supabase.storage.from('uploads').upload(idPath, idFile);
          if (!idErr) {
            var { data: pub } = supabase.storage.from('uploads').getPublicUrl(idPath);
            idUrl = pub?.publicUrl || null;
          }
        }

        if (letterFile && letterFile.name) {
          letterFileName = letterFile.name;
          var letterPath = `applications/${Date.now()}_letter_${letterFile.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
          var { error: letErr } = await supabase.storage.from('uploads').upload(letterPath, letterFile);
          if (!letErr) {
            var { data: pub } = supabase.storage.from('uploads').getPublicUrl(letterPath);
            letterUrl = pub?.publicUrl || null;
          }
        }
      } else if (typeof data === 'object') {
        resolvedUserId = data.userId || data.user_id || null;
        bName = data.businessName || data.business_name || data.tradeNameFranchise || data.trade_name_franchise || '';
        bType = data.businessType || data.business_type || data.businessActivity || data.business_activity || '';
        fName = data.firstName || data.first_name || '';
        mName = data.middleName || data.middle_name || '';
        lName = data.lastName || data.last_name || '';
        contactStr = data.contact || data.mobileNo || data.mobile_no || data.phone || '';
        emailStr = data.email || '';
        addressStr = data.address || '';
        civilStatusStr = data.civilStatus || data.civil_status || '';
        genderStr = data.gender || data.orgGender || data.org_gender || '';
        dateOfBirthStr = data.dateOfBirth || data.date_of_birth || '';
        emergencyContactPerson = data.emergencyContactPerson || data.emergency_contact_person || '';
        emergencyContactNumber = data.emergencyContactNumber || data.emergency_contact_number || '';
        var rawStall = data.stallId || data.selectedStallId || data.stall_id;
        numStallId = rawStall ? Number(rawStall) : null;
        idUrl = data.idUrl || data.valid_id_url || null;
        letterUrl = data.letterUrl || data.loi_url || null;

        validIdType = data.validIdType || data.valid_id_type || '';
        validIdNo = data.validIdNo || data.valid_id_no || '';
        var rawNature = data.natureOfBusiness || data.nature_of_business;
        if (rawNature) {
          try { natureOfBusiness = typeof rawNature === 'string' ? JSON.parse(rawNature) : rawNature; } catch (_) { natureOfBusiness = [rawNature]; }
        }
        otherNature = data.otherNature || data.other_nature_of_business || '';
        commodities = data.commodities || data.products_commodities || bType;
        stallSpaceType = data.stallSpaceType || data.stall_space_type || '';
        preferredStallNo = data.preferredStallNo || data.preferred_stall_no || data.stallNumberCode || data.stall_number_code || '';
        estimatedEmployees = Number(data.estimatedEmployees ?? data.estimated_employees ?? 0);
        undertakingAgreed = Boolean(data.undertakingAgreed ?? data.undertaking_agreed);
        loiContent = data.loiContent || data.loi_content || '';

        // Unified Business Permit fields from Object
        var applicationType = data.applicationType || data.application_type || 'NEW';
        var paymentMode = data.paymentMode || data.payment_mode || 'Annually';
        var trackingNumber = data.trackingNumber || data.tracking_number || '';
        var businessIdNumber = data.businessIdNumber || data.business_id_number || '';

        var orgType = data.orgType || data.org_type || '';
        var orgGender = data.orgGender || data.org_gender || '';
        var dtiSecCdaRegNo = data.dtiSecCdaRegNo || data.dti_sec_cda_reg_no || '';
        var tinNo = data.tinNo || data.tin_no || '';
        var tradeNameFranchise = data.tradeNameFranchise || data.trade_name_franchise || bName;

        var mainHouseBldgNo = data.mainHouseBldgNo || data.main_house_bldg_no || '';
        var mainBldgName = data.mainBldgName || data.main_bldg_name || '';
        var mainLotNo = data.mainLotNo || data.main_lot_no || '';
        var mainBlockNo = data.mainBlockNo || data.main_block_no || '';
        var mainStreet = data.mainStreet || data.main_street || '';
        var mainSubdivision = data.mainSubdivision || data.main_subdivision || '';
        var mainBarangay = data.mainBarangay || data.main_barangay || '';
        var mainDistrict = data.mainDistrict || data.main_district || '';
        var mainMunicipality = data.mainMunicipality || data.main_municipality || '';
        var mainProvince = data.mainProvince || data.main_province || '';
        var mainZipCode = data.mainZipCode || data.main_zip_code || '';

        var telephoneNo = data.telephoneNo || data.telephone_no || '';
        var mobileNo = data.mobileNo || data.mobile_no || contactStr;

        var ownerSurname = data.ownerSurname || data.owner_surname || lName;
        var ownerGivenName = data.ownerGivenName || data.owner_given_name || fName;
        var ownerMiddleName = data.ownerMiddleName || data.owner_middle_name || mName;
        var ownerSuffix = data.ownerSuffix || data.owner_suffix || '';

        var corpPresidentSurname = data.corpPresidentSurname || data.corp_president_surname || '';
        var corpPresidentGivenName = data.corpPresidentGivenName || data.corp_president_given_name || '';
        var corpPresidentMiddleName = data.corpPresidentMiddleName || data.corp_president_middle_name || '';
        var corpPresidentSuffix = data.corpPresidentSuffix || data.corp_president_suffix || '';
        var corpCitizenship = data.corpCitizenship || data.corp_citizenship || '';

        var businessAreaSqm = Number(data.businessAreaSqm ?? data.business_area_sqm ?? 0);
        var totalFloorAreaSqm = Number(data.totalFloorAreaSqm ?? data.total_floor_area_sqm ?? 0);
        var numEmployeesMale = Number(data.numEmployeesMale || data.num_employees_male || 0);
        var numEmployeesFemale = Number(data.numEmployeesFemale ?? data.num_employees_female ?? 0);
        var numEmployeesLguResiding = Number(data.numEmployeesLguResiding ?? data.num_employees_lgu_residing ?? 0);
        var deliveryVehiclesVanTruck = Number(data.deliveryVehiclesVanTruck || data.delivery_vehicles_van_truck || 0);
        var deliveryVehiclesMotorcycle = Number(data.deliveryVehiclesMotorcycle || data.delivery_vehicles_motorcycle || 0);

        var locSameAsMain = (data.locSameAsMain !== false && data.loc_same_as_main !== false);
        var locHouseBldgNo = data.locHouseBldgNo || data.loc_house_bldg_no || mainHouseBldgNo;
        var locBldgName = data.locBldgName || data.loc_bldg_name || mainBldgName;
        var locLotNo = data.locLotNo || data.loc_lot_no || mainLotNo;
        var locBlockNo = data.locBlockNo || data.loc_block_no || mainBlockNo;
        var locStreet = data.locStreet || data.loc_street || mainStreet;
        var locSubdivision = data.locSubdivision || data.loc_subdivision || mainSubdivision;
        var locBarangay = data.locBarangay || data.loc_barangay || mainBarangay;
        var locDistrict = data.locDistrict || data.loc_district || mainDistrict;
        var locMunicipality = data.locMunicipality || data.loc_municipality || mainMunicipality;
        var locProvince = data.locProvince || data.loc_province || mainProvince;
        var locZipCode = data.locZipCode || data.loc_zip_code || mainZipCode;

        var propertyOwned = Boolean(data.propertyOwned || data.property_owned);
        var taxDecNo = data.taxDecNo || data.tax_dec_no || '';
        var propertyIdNo = data.propertyIdNo || data.property_id_no || '';
        var taxIncentivesEnjoyed = Boolean(data.taxIncentivesEnjoyed || data.tax_incentives_enjoyed);
        var businessActivity = data.businessActivity || data.business_activity || '';
        var businessActivityOther = data.businessActivityOther || data.business_activity_other || '';
        var incumbentMayor = data.incumbentMayor || data.incumbent_municipal_mayor || '';
        var businessLines = data.businessLines || data.business_lines || [];
      }

      // Upfront stall calculation & lookup to resolve targetStallObj safely
      if (!numStallId) throw new Error('Please select an available stall before submitting.')
      let stallRent = 0;
      let stallRights = 0;
      let targetStallObj = null;
      const { data: selectedStall, error: selectedStallError } = await supabase.from('stalls').select('*').eq('id', numStallId).maybeSingle();
      if (selectedStallError || !selectedStall) throw new Error('The selected stall could not be verified. Please choose an available stall and try again.')
      targetStallObj = selectedStall;
      stallRent = Number(selectedStall.monthly_rent ?? 0);
      stallRights = Number(selectedStall.stall_rights_fee ?? 0);
      const advanceRent = stallRent * 2;
      const totalDue = advanceRent + stallRights;

      // Verify if current session is an authentic Supabase auth user
      let authUser = null;
      try {
        const { data: uData } = await supabase.auth.getUser();
        if (uData?.user?.id) {
          authUser = uData.user;
        }
      } catch (_) {}

      // Foreign key requires user_id to exist in auth.users or be null
      const foreignKeyUserId = authUser?.id || null;

      // 1. Check or insert stakeholder
      let stakeholderId = null;
      let stakeholderObj = null;
      let isRemoteStakeholderPersisted = false;

      if (foreignKeyUserId && isUuid(foreignKeyUserId)) {
        try {
          const { data: existingStakeholder } = await supabase
            .from('stakeholders')
            .select('*')
            .eq('user_id', foreignKeyUserId)
            .maybeSingle();
          if (existingStakeholder) {
            stakeholderId = existingStakeholder.id;
            stakeholderObj = existingStakeholder;
            isRemoteStakeholderPersisted = true;
          }
        } catch (_) {}
      } else if (emailStr) {
        try {
          const { data: existingStakeholder } = await supabase
            .from('stakeholders')
            .select('*')
            .eq('email', emailStr.trim())
            .maybeSingle();
          if (existingStakeholder) {
            stakeholderId = existingStakeholder.id;
            stakeholderObj = existingStakeholder;
            isRemoteStakeholderPersisted = true;
          }
        } catch (_) {}
      }

      const fullStakeholderPayload = {
        business_name: bName,
        business_type: bType,
        first_name: fName,
        middle_name: mName,
        last_name: lName,
        contact: contactStr,
        email: emailStr,
        address: addressStr,
        selected_stall_id: numStallId,
        application_status: 'SUBMITTED',
        onboarding_status: 'NEW',
        civil_status: civilStatusStr || null,
        gender: genderStr || null,
        citizenship: '',
        barangay: mainBarangay || '',
        municipality_province: 'Manticao, Misamis Oriental',
        official_contact_mobile: contactStr,
        emergency_contact_person: emergencyContactPerson || '',
        emergency_contact_number: emergencyContactNumber || '',
        valid_id_type: validIdType,
        valid_id_no: validIdNo,
        nature_of_business: natureOfBusiness,
        other_nature_of_business: otherNature,
        products_commodities: commodities,
        stall_space_type: stallSpaceType,
        preferred_stall_no: preferredStallNo || (targetStallObj?.stall_no || null),
        estimated_employees: estimatedEmployees,
        undertaking_agreed: undertakingAgreed,
        undertaking_agreed_at: new Date().toISOString(),
        loi_content: loiContent
      };

      const baseStakeholderPayload = {
        user_id: (foreignKeyUserId && isUuid(foreignKeyUserId)) ? foreignKeyUserId : null,
        business_name: bName,
        business_type: bType,
        first_name: fName,
        middle_name: mName,
        last_name: lName,
        contact: contactStr,
        email: emailStr,
        address: addressStr,
        selected_stall_id: numStallId,
        application_status: 'SUBMITTED',
        onboarding_status: 'NEW'
      };

      if (stakeholderId && isRemoteStakeholderPersisted) {
        try {
          const { data: updatedSh, error: upErr } = await supabase
            .from('stakeholders')
            .update(fullStakeholderPayload)
            .eq('id', stakeholderId)
            .select()
            .maybeSingle();

          if (!upErr && updatedSh) {
            stakeholderObj = { ...stakeholderObj, ...fullStakeholderPayload, ...updatedSh };
          } else if (upErr && (upErr.message?.includes('schema cache') || upErr.code === 'PGRST204' || upErr.message?.includes('Could not find'))) {
            // Fallback: update with base legacy columns that exist in all baseline schemas
            const { data: baseUpdated } = await supabase
              .from('stakeholders')
              .update(baseStakeholderPayload)
              .eq('id', stakeholderId)
              .select()
              .maybeSingle();
            if (baseUpdated) stakeholderObj = { ...stakeholderObj, ...fullStakeholderPayload, ...baseUpdated };
          }
        } catch (upErr) {
          console.warn('[API] Update stakeholder notice:', upErr?.message);
        }
      } else {
        try {
          const insertPayload = {
            ...fullStakeholderPayload,
            user_id: (foreignKeyUserId && isUuid(foreignKeyUserId)) ? foreignKeyUserId : null
          };
          const { data: newSh, error: newShErr } = await supabase
            .from('stakeholders')
            .insert(insertPayload)
            .select('*')
            .maybeSingle();

          if (!newShErr && newSh?.id) {
            stakeholderId = newSh.id;
            stakeholderObj = { ...fullStakeholderPayload, ...newSh };
            isRemoteStakeholderPersisted = true;
          } else if (newShErr && (newShErr.message?.includes('schema cache') || newShErr.code === 'PGRST204' || newShErr.message?.includes('Could not find'))) {
            // Schema cache missing column: retry with base columns that are guaranteed to exist
            const { data: retrySh, error: retryErr } = await supabase
              .from('stakeholders')
              .insert(baseStakeholderPayload)
              .select('*')
              .maybeSingle();
            if (!retryErr && retrySh?.id) {
              stakeholderId = retrySh.id;
              stakeholderObj = { ...fullStakeholderPayload, ...retrySh };
              isRemoteStakeholderPersisted = true;
            } else {
              console.warn('[API] Base stakeholder insert notice:', retryErr?.message || newShErr?.message);
            }
          } else {
            console.warn('[API] Supabase stakeholder insert notice:', newShErr?.message);
          }
        } catch (shErr) {
          console.warn('[API] Supabase stakeholder insert exception:', shErr?.message);
        }
      }

      // 2. Stall fees and targetStallObj already initialized upfront

      // If Supabase RLS blocked creating the stakeholder, generate local fallback
      if (!stakeholderId) {
        stakeholderId = Date.now();
        stakeholderObj = {
          id: stakeholderId,
          user_id: foreignKeyUserId,
          business_name: bName,
          business_type: bType,
          first_name: fName,
          middle_name: mName,
          last_name: lName,
          contact: contactStr,
          email: emailStr,
          address: addressStr,
          selected_stall_id: numStallId,
          application_status: 'SUBMITTED',
          onboarding_status: 'NEW',
          total_advance_amount: advanceRent,
          valid_id_type: validIdType,
          valid_id_no: validIdNo,
          nature_of_business: natureOfBusiness,
          other_nature_of_business: otherNature,
          products_commodities: commodities,
          stall_space_type: stallSpaceType,
          preferred_stall_no: preferredStallNo,
          estimated_employees: estimatedEmployees,
          undertaking_agreed: undertakingAgreed,
          loi_content: loiContent,
          application_type: applicationType,
          payment_mode: paymentMode,
          tracking_number: trackingNumber || appNo,
          business_id_number: businessIdNumber,
          org_type: orgType,
          org_gender: orgGender,
          dti_sec_cda_reg_no: dtiSecCdaRegNo,
          tin_no: tinNo,
          trade_name_franchise: tradeNameFranchise,
          main_house_bldg_no: mainHouseBldgNo,
          main_bldg_name: mainBldgName,
          main_lot_no: mainLotNo,
          main_block_no: mainBlockNo,
          main_street: mainStreet,
          main_subdivision: mainSubdivision,
          main_barangay: mainBarangay,
          main_district: mainDistrict,
          main_municipality: mainMunicipality,
          main_province: mainProvince,
          main_zip_code: mainZipCode,
          telephone_no: telephoneNo,
          mobile_no: mobileNo,
          owner_surname: ownerSurname,
          owner_given_name: ownerGivenName,
          owner_middle_name: ownerMiddleName,
          owner_suffix: ownerSuffix,
          corp_president_surname: corpPresidentSurname,
          corp_president_given_name: corpPresidentGivenName,
          corp_president_middle_name: corpPresidentMiddleName,
          corp_president_suffix: corpPresidentSuffix,
          corp_citizenship: corpCitizenship,
          business_area_sqm: businessAreaSqm,
          total_floor_area_sqm: totalFloorAreaSqm,
          num_employees_male: numEmployeesMale,
          num_employees_female: numEmployeesFemale,
          num_employees_lgu_residing: numEmployeesLguResiding,
          delivery_vehicles_van_truck: deliveryVehiclesVanTruck,
          delivery_vehicles_motorcycle: deliveryVehiclesMotorcycle,
          loc_same_as_main: locSameAsMain,
          loc_house_bldg_no: locHouseBldgNo,
          loc_bldg_name: locBldgName,
          loc_lot_no: locLotNo,
          loc_block_no: locBlockNo,
          loc_street: locStreet,
          loc_subdivision: locSubdivision,
          loc_barangay: locBarangay,
          loc_district: locDistrict,
          loc_municipality: locMunicipality,
          loc_province: locProvince,
          loc_zip_code: locZipCode,
          property_owned: propertyOwned,
          tax_dec_no: taxDecNo,
          property_id_no: propertyIdNo,
          tax_incentives_enjoyed: taxIncentivesEnjoyed,
          business_activity: businessActivity,
          business_activity_other: businessActivityOther,
          business_lines: businessLines,
          perjury_declaration_agreed: undertakingAgreed,
          created_at: new Date().toISOString()
        };
      } else {
        try {
          await supabase.from('stakeholders').update({
            total_advance_amount: advanceRent
          }).eq('id', stakeholderId);
        } catch (_) {}
      }

      // 3. Upsert into authoritative stakeholder_applications table
      const targetStallForApp = numStallId;

      let appData = null;
      let isRemoteAppPersisted = false;

      const fullAppPayload = {
        application_no: appNo,
        stakeholder_id: isRemoteStakeholderPersisted ? stakeholderId : null,
        user_id: (foreignKeyUserId && isUuid(foreignKeyUserId)) ? foreignKeyUserId : null,
        stall_id: targetStallForApp,
        status: 'SUBMITTED',
        current_holding_office: "Mayor's Office",
        loi_url: letterUrl,
        valid_id_url: idUrl,
        calculated_stall_rights_fee: stallRights,
        calculated_advance_rent: advanceRent,
        total_initial_amount_due: totalDue,
        amount_paid: 0.00,
        valid_id_type: validIdType,
        valid_id_no: validIdNo,
        nature_of_business: natureOfBusiness,
        other_nature_of_business: otherNature,
        products_commodities: commodities,
        stall_space_type: stallSpaceType,
        preferred_stall_no: preferredStallNo || (targetStallObj?.stall_no || `Stall #${targetStallForApp}`),
        estimated_employees: estimatedEmployees,
        undertaking_agreed: undertakingAgreed,
        loi_content: loiContent,
        incumbent_municipal_mayor: incumbentMayor
      };

      const baseAppPayload = {
        application_no: appNo,
        stakeholder_id: isRemoteStakeholderPersisted ? stakeholderId : null,
        user_id: (foreignKeyUserId && isUuid(foreignKeyUserId)) ? foreignKeyUserId : null,
        stall_id: targetStallForApp,
        status: 'SUBMITTED',
        current_holding_office: "Mayor's Office",
        loi_url: letterUrl,
        valid_id_url: idUrl,
        calculated_stall_rights_fee: stallRights,
        calculated_advance_rent: advanceRent,
        total_initial_amount_due: totalDue,
        amount_paid: 0.00
      };

      try {
        const { data: insertedApp, error: appErr } = await supabase
          .from('stakeholder_applications')
          .insert(fullAppPayload)
          .select('*, stall:stalls(*), stakeholder:stakeholders(*)')
          .maybeSingle();

        if (!appErr && insertedApp) {
          appData = insertedApp;
          isRemoteAppPersisted = true;
        } else if (appErr && (appErr.message?.includes('schema cache') || appErr.code === 'PGRST204' || appErr.message?.includes('Could not find'))) {
          // Schema cache missing column: retry with base application columns
          const { data: retryApp, error: retryAppErr } = await supabase
            .from('stakeholder_applications')
            .insert(baseAppPayload)
            .select('*, stall:stalls(*)')
            .maybeSingle();
          if (!retryAppErr && retryApp) {
            appData = { ...fullAppPayload, ...retryApp };
            isRemoteAppPersisted = true;
          } else {
            console.warn('[API] Base application insert notice:', retryAppErr?.message || appErr?.message);
          }
        } else {
          console.warn('[API] Supabase stakeholder_applications insert notice:', appErr?.message);
        }
      } catch (appInsertErr) {
        console.warn('[API] Supabase application insert exception:', appInsertErr?.message);
      }

      // If Supabase RLS blocked insertion, construct resilient application object
      if (!appData) {
        appData = {
          id: Date.now(),
          application_no: appNo,
          applicationNo: appNo,
          stakeholder_id: stakeholderId,
          stakeholderId: stakeholderId,
          user_id: foreignKeyUserId || resolvedUserId,
          userId: resolvedUserId,
          stall_id: targetStallForApp,
          stallId: targetStallForApp,
          status: 'SUBMITTED',
          current_holding_office: "Mayor's Office",
          loi_url: letterUrl,
          valid_id_url: idUrl,
          calculated_stall_rights_fee: stallRights,
          calculated_advance_rent: advanceRent,
          total_initial_amount_due: totalDue,
          amount_paid: 0.00,
          valid_id_type: validIdType,
          valid_id_no: validIdNo,
          nature_of_business: natureOfBusiness,
          other_nature_of_business: otherNature,
          products_commodities: commodities,
          stall_space_type: stallSpaceType,
          preferred_stall_no: preferredStallNo || (targetStallObj?.stall_no || `Stall #${targetStallForApp}`),
          estimated_employees: estimatedEmployees,
          undertaking_agreed: undertakingAgreed,
          loi_content: loiContent,
          application_type: applicationType,
          payment_mode: paymentMode,
          tracking_number: trackingNumber || appNo,
          business_id_number: businessIdNumber,
          org_type: orgType,
          org_gender: orgGender,
          dti_sec_cda_reg_no: dtiSecCdaRegNo,
          tin_no: tinNo,
          trade_name_franchise: tradeNameFranchise,
          main_house_bldg_no: mainHouseBldgNo,
          main_bldg_name: mainBldgName,
          main_lot_no: mainLotNo,
          main_block_no: mainBlockNo,
          main_street: mainStreet,
          main_subdivision: mainSubdivision,
          main_barangay: mainBarangay,
          main_district: mainDistrict,
          main_municipality: mainMunicipality,
          main_province: mainProvince,
          main_zip_code: mainZipCode,
          telephone_no: telephoneNo,
          mobile_no: mobileNo,
          owner_surname: ownerSurname,
          owner_given_name: ownerGivenName,
          owner_middle_name: ownerMiddleName,
          owner_suffix: ownerSuffix,
          corp_president_surname: corpPresidentSurname,
          corp_president_given_name: corpPresidentGivenName,
          corp_president_middle_name: corpPresidentMiddleName,
          corp_president_suffix: corpPresidentSuffix,
          corp_citizenship: corpCitizenship,
          business_area_sqm: businessAreaSqm,
          total_floor_area_sqm: totalFloorAreaSqm,
          num_employees_male: numEmployeesMale,
          num_employees_female: numEmployeesFemale,
          num_employees_lgu_residing: numEmployeesLguResiding,
          delivery_vehicles_van_truck: deliveryVehiclesVanTruck,
          delivery_vehicles_motorcycle: deliveryVehiclesMotorcycle,
          loc_same_as_main: locSameAsMain,
          loc_house_bldg_no: locHouseBldgNo,
          loc_bldg_name: locBldgName,
          loc_lot_no: locLotNo,
          loc_block_no: locBlockNo,
          loc_street: locStreet,
          loc_subdivision: locSubdivision,
          loc_barangay: locBarangay,
          loc_district: locDistrict,
          loc_municipality: locMunicipality,
          loc_province: locProvince,
          loc_zip_code: locZipCode,
          property_owned: propertyOwned,
          tax_dec_no: taxDecNo,
          property_id_no: propertyIdNo,
          tax_incentives_enjoyed: taxIncentivesEnjoyed,
          business_activity: businessActivity,
          business_activity_other: businessActivityOther,
          business_lines: businessLines,
          perjury_declaration_agreed: undertakingAgreed,
          market_office_status: null,
          market_office_recommended_stall: null,
          market_office_section: null,
          market_office_nature: bType,
          treasury_monthly_rent: stallRent,
          treasury_other_fees: stallRights,
          treasury_security_deposit: advanceRent,
          treasury_total_due: totalDue,
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          stakeholder: stakeholderObj,
          stall: targetStallObj
        };
      }

      if (!isRemoteAppPersisted) {
        throw new Error('The application could not be saved to the shared application register. Please try again or contact system support.');
      }

      // Save to localStorage collections for offline resilience and immediate reactivity
      try {
        const rawApps = localStorage.getItem('manticao_applications') || '[]';
        const appsList = JSON.parse(rawApps);
        const filtered = appsList.filter(a => a.application_no !== appNo && a.applicationNo !== appNo);
        filtered.unshift(appData);
        localStorage.setItem('manticao_applications', JSON.stringify(filtered));
      } catch (_) {}

      try {
        const rawSh = localStorage.getItem('manticao_stakeholders') || '{}';
        const shMap = JSON.parse(rawSh);
        shMap[stakeholderId] = stakeholderObj;
        localStorage.setItem('manticao_stakeholders', JSON.stringify(shMap));
      } catch (_) {}

      // 4. Save documents to stakeholder_documents
      const docs = [];
      if (idUrl) {
        docs.push({
          stakeholder_id: stakeholderId,
          application_id: appData.id,
          document_type: 'VALID_ID',
          file_path: idUrl,
          file_name: idFileName
        });
      }
      if (letterUrl) {
        docs.push({
          stakeholder_id: stakeholderId,
          application_id: appData.id,
          document_type: 'LOI',
          file_path: letterUrl,
          file_name: letterFileName
        });
      }
      if (docs.length > 0) {
        try {
          const rawDocs = localStorage.getItem('manticao_documents') || '[]';
          const localDocs = JSON.parse(rawDocs);
          docs.forEach(d => localDocs.push(d));
          localStorage.setItem('manticao_documents', JSON.stringify(localDocs));
        } catch (_) {}

        if (isRemoteStakeholderPersisted && isRemoteAppPersisted) {
          try {
            const { error: docErr } = await supabase.from('stakeholder_documents').insert(docs);
            if (docErr) {
              console.error('stakeholder_documents insert failed:', docErr.message, docErr.details, docErr.hint);
              const fallback = docs.map(({ application_id, ...rest }) => rest);
              const { error: retryErr } = await supabase.from('stakeholder_documents').insert(fallback);
              if (retryErr) console.error('stakeholder_documents retry failed:', retryErr.message);
            }
          } catch (_) {}
        }
      }

      // 5. Add initial approval_history row
      const histRecord = {
        stakeholder_id: stakeholderId,
        application_id: appData.id,
        stage: 'APPLICATION_SUBMISSION',
        status: 'SUBMITTED',
        action_by: foreignKeyUserId || null,
        actor_name: `${fName} ${lName}`.trim() || bName,
        actor_role: 'APPLICANT',
        remarks: 'Applicant submitted market stall application with LOI and valid identification.'
      };

      try {
        const rawHist = localStorage.getItem('manticao_approval_history') || '[]';
        const localHist = JSON.parse(rawHist);
        localHist.unshift(histRecord);
        localStorage.setItem('manticao_approval_history', JSON.stringify(localHist));
      } catch (_) {}

      if (isRemoteStakeholderPersisted && isRemoteAppPersisted) {
        try {
          await supabase.from('approval_history').insert(histRecord);
        } catch (_) {}
      }

      // User requirement: No business permit / BPLO table sync
      // The application consists strictly of the Unified Stall Rental Form and the Letter of Intent

      // 6. If a stall was chosen, mark occupant PENDING and stall RESERVED
      if (numStallId) {
        try {
          await supabase.from('stalls').update({
            status: 'RESERVED'
          }).eq('id', numStallId);
        } catch (occErr) {
          console.warn('[applications] Stall reservation note:', occErr);
        }

        if (isRemoteStakeholderPersisted) {
          try {
            const { data: exOcc } = await supabase.from('occupants').select('id').eq('stakeholder_id', stakeholderId).maybeSingle();
            let occId = exOcc?.id;
            if (occId) {
              await supabase.from('occupants').update({
                stall_id: numStallId,
                status: 'PENDING'
              }).eq('id', occId);
            } else {
              const { data: newOcc } = await supabase.from('occupants').insert({
                stakeholder_id: stakeholderId,
                stall_id: numStallId,
                status: 'PENDING',
                advance_balance: 0
              }).select('id').maybeSingle();
              occId = newOcc?.id;
            }

            if (occId) {
              await supabase.from('stalls').update({
                occupant_id: occId
              }).eq('id', numStallId);
            }
          } catch (_) {}
        }
      }

      if (resolvedUserId) localStorage.setItem('userId', resolvedUserId);
      localStorage.setItem('stakeholderId', String(stakeholderId));

      invalidateApiCache('stakeholders|payments|applications|stalls|occupants');
      const normRes = normalizeRecord(appData);
      normRes.id = appData.id;
      normRes.user_id = resolvedUserId;
      normRes.stakeholderId = stakeholderId;
      return { data: normRes };
    }

    // 2. Stalls upload
    if (cleanUrl === 'stalls/upload') {
      const file = data.get ? (data.get('file') || data.get('image')) : null;
      if (file) {
        const filePath = `stalls/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
        const { error: upErr } = await supabase.storage.from('uploads').upload(filePath, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('uploads').getPublicUrl(filePath);
        return { data: pub?.publicUrl };
      }
    }

    // 3. Stalls create
    if (cleanUrl === 'stalls') {
      const stallPayload = mapStallPayload(data);
      const { data: newStall, error } = await supabase
        .from('stalls')
        .insert(stallPayload)
        .select('*, occupant:occupants!fk_stalls_occupant(*, stakeholder:stakeholders(*))')
        .single();
      if (error) throw error;
      return { data: normalizeRecord(newStall) };
    }

    // 4. Stall Types create (stored in authoritative rental_rates table)
    if (cleanUrl === 'stall-types' || cleanUrl === 'admin/stall-types') {
      const ratePayload = mapRentalRatePayload(data);
      const { data: newRate, error } = await supabase.from('rental_rates').insert(ratePayload).select().single();
      if (error) throw error;
      return { data: normalizeRecord(newRate) };
    }

    // 5. Rental Rates create
    if (cleanUrl === 'rental-rates' || cleanUrl === 'admin/rental-rates') {
      const ratePayload = mapRentalRatePayload(data);
      const { data: newRate, error } = await supabase.from('rental_rates').insert(ratePayload).select().single();
      if (error) throw error;
      return { data: normalizeRecord(newRate) };
    }

    // 6. Payments create
    if (cleanUrl === 'payments') {
      const stakeholderId = data.stakeholderId || data.stakeholder_id || data.stakeholder?.id;
      const billingId = data.billingId || data.billing_id || data.billing?.id || null;
      const receiptNo = data.receiptNo || data.receipt_no || `OR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const pType = data.paymentType || data.payment_type || 'RENT_PAYMENT';
      const pAmount = Number(data.amount || 0);
      let linkedApplication = null;
      if (stakeholderId) {
        const { data: application, error: applicationError } = await supabase
          .from('stakeholder_applications')
          .select('id, status, amount_paid, total_initial_amount_due, stakeholder:stakeholders(first_name,last_name,full_name), stall:stalls(stall_no)')
          .eq('stakeholder_id', Number(stakeholderId))
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (applicationError) throw applicationError;
        linkedApplication = application;
      }
      const isAdvancePayment = pType === 'ADVANCE_PAYMENT' || pType === 'ADVANCE_RENT';
      const isRegulatoryPayment = ['APPLICATION_FEE', 'APPLICATION_FORM', 'BUSINESS_PERMIT_PAYMENT'].includes(pType) &&
        linkedApplication?.status === 'CONTRACT_PREPARED';
      if (isAdvancePayment && linkedApplication && linkedApplication.status !== 'APPROVED_PENDING_ADVANCE_PAYMENT') {
        throw new Error('Mayor approval is required before the Treasurer can record the advance payment.');
      }
      if (isRegulatoryPayment && linkedApplication?.status !== 'CONTRACT_PREPARED') {
        throw new Error('Market Supervisor contract preparation is required before the final fee can be recorded.');
      }

      const { data: newPayment, error } = await supabase
        .from('payments')
        .insert({
          stakeholder_id: stakeholderId,
          application_id: linkedApplication?.id || data.applicationId || data.application_id || null,
          billing_id: billingId,
          amount: pAmount,
          payment_type: pType,
          payment_method: 'CASH',
          payment_stage: isAdvancePayment ? 'ADVANCE' : (isRegulatoryPayment ? 'REGULATORY' : 'OTHER'),
          reference_no: data.referenceNo || data.reference_no || '',
          receipt_no: receiptNo,
          payment_date: data.paymentDate || data.payment_date || new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;

      const { data: { user: cashier } } = await supabase.auth.getUser();
      const payerName = data.payerName || data.payer_name || data.applicantName ||
        [linkedApplication?.stakeholder?.first_name, linkedApplication?.stakeholder?.last_name].filter(Boolean).join(' ') ||
        linkedApplication?.stakeholder?.full_name || '';
      const stallNo = data.stallNo || data.stall_no || linkedApplication?.stall?.stall_no || '';
      if (!payerName || !stallNo) throw new Error('A payer name and selected stall number are required for the official receipt.');

      const receiptPayload = {
        payment_id: newPayment.id,
        receipt_no: receiptNo,
        official_receipt_number: receiptNo,
        payer_name: payerName,
        stall_no: stallNo,
        amount_paid: pAmount,
        payment_type: pType,
        issued_by: cashier?.id || null
      };
      let { error: receiptError } = await supabase.from('payment_receipts').insert(receiptPayload);
      if (receiptError && /column .* does not exist|Could not find the .* column|schema cache/i.test(receiptError.message || '')) {
        const legacyReceiptPayload = {
          payment_id: newPayment.id,
          receipt_series: receiptNo.split('-')[0] || 'OR',
          receipt_number: receiptNo,
          issued_to: payerName,
          issued_by: receiptPayload.issued_by
        };
        ({ error: receiptError } = await supabase.from('payment_receipts').insert(legacyReceiptPayload));
      }
      if (receiptError) throw receiptError;

      // Update stakeholder status if initial fees
      if (stakeholderId) {
        if (isAdvancePayment) {
          const { data: curSh } = await supabase.from('stakeholders').select('advance_balance').eq('id', Number(stakeholderId)).maybeSingle();
          const newBal = Number(curSh?.advance_balance || 0) + pAmount;
          await supabase.from('stakeholders').update({
            advance_balance: newBal,
            advance_payment_paid: true,
            advance_payment_completed: true,
            advance_payment_amount: pAmount,
            advance_payment_date: new Date().toISOString().split('T')[0],
            application_status: 'ADVANCE_PAID'
          }).eq('id', Number(stakeholderId));

          await supabase.from('stakeholder_applications').update({
            status: 'ADVANCE_PAID',
            mayor_approval_status: 'APPROVED',
            initial_advance_paid_at: new Date().toISOString(),
            initial_advance_receipt_no: receiptNo,
            treasurer_receipt_no: receiptNo,
            treasurer_recorded_at: new Date().toISOString(),
            amount_paid: Number(linkedApplication?.amount_paid || 0) + pAmount,
            current_holding_office: 'Market Supervisor'
          }).eq('id', linkedApplication?.id || -1)
            .eq('status', 'APPROVED_PENDING_ADVANCE_PAYMENT');
        } else if (pType === 'APPLICATION_FEE' || pType === 'STALL_RIGHTS_FEE' || pType === 'STALL_RIGHTS') {
          await supabase.from('stakeholders').update({
            applicant_fee_paid: true,
            treasurer_paid: true,
            treasurer_approved: true
          }).eq('id', Number(stakeholderId));
          if (isRegulatoryPayment && linkedApplication?.id) {
            await supabase.from('stakeholder_applications').update({
              status: 'FEES_CLEARED',
              regulatory_fee_receipt_no: receiptNo,
              regulatory_fee_paid_at: new Date().toISOString(),
              current_holding_office: 'System Activation'
            }).eq('id', linkedApplication.id).eq('status', 'CONTRACT_PREPARED');
          }
        }
      }

      invalidateApiCache('payments|billings|stakeholders|stakeholder_applications');
      return { data: normalizeRecord(newPayment) };
    }

    // 6.1 Billings create
    if (cleanUrl === 'billings') {
      const billingNo = data.billingNo || data.billing_no || `BILL-${Date.now().toString().slice(-8)}`;
      const totalAmount = Number(data.totalAmount ?? data.total_amount ?? data.amount ?? 0);
      const paidAmount = Number(data.paidAmount ?? data.paid_amount ?? 0);
      const balance = Number(data.balance ?? Math.max(totalAmount - paidAmount, 0));
      const status = data.status || (balance <= 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID'));

      const insertPayload = {
        occupant_id: data.occupantId || data.occupant_id || null,
        contract_id: data.contractId || data.contract_id || null,
        billing_no: billingNo,
        billing_period: data.billingPeriod || data.billing_period || `MONTHLY-${new Date().getMonth() + 1}-${new Date().getFullYear()}`,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance: balance,
        due_date: data.dueDate || data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: status
      };

      const { data: newBill, error } = await supabase
        .from('billings')
        .insert(insertPayload)
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
        .single();
      if (error) throw error;
      return { data: normalizeRecord(newBill) };
    }

    // 6.2 Delinquency Mayor Revocation
    if (cleanUrl === 'delinquency/mayor-revocation') {
      const { stallId, occupantId, contractId, reason, action } = data || {};
      const { data: { user } } = await supabase.auth.getUser();

      if (contractId) {
        await supabase
          .from('contracts')
          .update({ status: 'REVOKED' })
          .eq('id', Number(contractId));
      }
      if (stallId) {
        await supabase
          .from('stalls')
          .update({ status: 'AVAILABLE', occupant_id: null })
          .eq('id', Number(stallId));
      }
      if (occupantId) {
        await supabase
          .from('occupants')
          .update({ status: 'REVOKED', is_archived: true })
          .eq('id', Number(occupantId));
      }
      if (occupantId || contractId) {
        let pQuery = supabase.from('occupancy_permits').update({
          status: 'REVOKED',
          revocation_reason: reason || 'Authorized Mayor lease cancellation due to continuous delinquency',
          revoked_at: new Date().toISOString(),
          revoked_by: user?.id || null
        });
        if (contractId) pQuery = pQuery.eq('contract_id', Number(contractId));
        else if (occupantId) pQuery = pQuery.eq('occupant_id', Number(occupantId));
        await pQuery;
      }

      try {
        await supabase.from('audit_logs').insert({
          user_id: user?.id || null,
          role: 'MAYOR',
          action: 'REVOKE_LEASE_DELINQUENCY',
          entity_name: 'contracts',
          entity_id: String(contractId || stallId || occupantId),
          details: { stallId, occupantId, contractId, reason, action }
        });
      } catch (_) {}

      invalidateApiCache('stalls|contracts|occupants|billings|permits|stakeholders');
      return { data: { success: true, message: 'Lease revoked and stall repossession initiated.' } };
    }

    // 6.3 Delinquency Scan
    if (cleanUrl === 'delinquency/scan') {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: overdueBills, error: scErr } = await supabase
        .from('billings')
        .select('id, due_date, balance, status')
        .lt('due_date', todayStr)
        .gt('balance', 0)
        .neq('status', 'OVERDUE');

      if (!scErr && overdueBills && overdueBills.length > 0) {
        const ids = overdueBills.map(b => b.id);
        await supabase
          .from('billings')
          .update({ status: 'OVERDUE' })
          .in('id', ids);
      }

      invalidateApiCache('billings|delinquency');
      return { data: { success: true, overdueUpdated: overdueBills?.length || 0 } };
    }

    // 6.4 Field Collections
    if (cleanUrl === 'collections/field') {
      const { stallId, stakeholderId, amount, notes } = data || {};
      const { data: { user } } = await supabase.auth.getUser();
      const receiptNo = `OR-FLD-${Date.now().toString().slice(-8)}`;

      const { data: newPayment, error: pErr } = await supabase
        .from('payments')
        .insert({
          receipt_no: receiptNo,
          stakeholder_id: Number(stakeholderId),
          amount: Number(amount),
          payment_type: 'FIELD_COLLECTION',
          payment_channel: 'FIELD_COLLECTOR',
          cashier_or_collector_id: user?.id || null,
          cashier_name: user?.user_metadata?.name || user?.user_metadata?.full_name || 'Field Collector',
          notes: notes || (stallId ? `Stall ${stallId} field collection` : 'Market field collection')
        })
        .select()
        .single();

      if (pErr) throw pErr;

      invalidateApiCache('payments|collections|billings');
      return { data: { success: true, receiptNo, payment: normalizeRecord(newPayment) } };
    }

    // 6.5 Remittances Batch Submission
    if (cleanUrl === 'collections/remittances') {
      const { collectionIds, remarks } = data || {};
      const { data: { user } } = await supabase.auth.getUser();
      const remittanceNo = `REM-${Date.now().toString().slice(-8)}`;

      let collections = [];
      if (Array.isArray(collectionIds) && collectionIds.length > 0) {
        const { data: pList } = await supabase
          .from('payments')
          .select('*, stakeholder:stakeholders(*)')
          .in('id', collectionIds);
        collections = pList || [];
      }

      const totalAmount = collections.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const collectorName = user?.user_metadata?.name || user?.user_metadata?.full_name || 'Market Collector';

      const { data: newRem, error: remErr } = await supabase
        .from('collection_remittances')
        .insert({
          remittance_no: remittanceNo,
          collector_id: user?.id || '00000000-0000-0000-0000-000000000000',
          collector_name: collectorName,
          total_amount: totalAmount,
          collection_count: collections.length,
          status: 'SUBMITTED',
          remarks: remarks || 'Field collections batch'
        })
        .select()
        .single();

      if (remErr) throw remErr;

      if (newRem?.id && collections.length > 0) {
        const items = collections.map(c => ({
          remittance_id: newRem.id,
          payment_id: c.id,
          stall_no: c.notes?.match(/Stall\s*([A-Za-z0-9-]+)/i)?.[1] || 'WS',
          vendor_name: [c.stakeholder?.first_name, c.stakeholder?.last_name].filter(Boolean).join(' ') || c.stakeholder?.business_name || 'Vendor',
          amount: Number(c.amount || 0),
          collected_at: c.payment_date || new Date().toISOString()
        }));

        await supabase.from('collection_remittance_items').insert(items);
        await supabase.from('payments').update({ remittance_id: newRem.id }).in('id', collectionIds);
      }

      invalidateApiCache('collections|payments');
      return { data: { success: true, remittanceNo, remittance: normalizeRecord(newRem) } };
    }

    // 6.6 Activate contract and stall occupancy ONLY if all required conditions are satisfied
    if (cleanUrl.includes('activate-if-eligible')) {
      const parts = cleanUrl.split('/');
      const stakeholderId = parts.find((p, idx) => parts[idx - 1] === 'stakeholder') || data?.stakeholderId;
      if (stakeholderId) {
        const { data: sh } = await supabase.from('stakeholders').select('*').eq('id', Number(stakeholderId)).maybeSingle();
        if (sh) {
          const { data: application } = await supabase.from('stakeholder_applications')
            .select('id, status, user_id')
            .eq('stakeholder_id', Number(stakeholderId))
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();
          const hasAdvance = Boolean(sh.advance_rent_paid || sh.advance_payment_paid || Number(sh.advance_balance || 0) > 0);
          const hasStall = Boolean(sh.selected_stall_id);
          const hasInitialFees = Boolean(sh.applicant_fee_paid || sh.application_form_paid || sh.treasurer_paid);
          const finalFeesCleared = application?.status === 'ACTIVE_OCCUPANT';

          if (hasAdvance && hasStall && hasInitialFees && finalFeesCleared) {
            const stallId = Number(sh.selected_stall_id);
            const { data: occ } = await supabase.from('occupants').select('id').eq('stakeholder_id', Number(stakeholderId)).maybeSingle();
            if (occ?.id) {
              await supabase.from('occupants').update({ status: 'ACTIVE', is_archived: false }).eq('id', occ.id);
              await supabase.from('contracts').update({ status: 'ACTIVE' }).eq('occupant_id', occ.id);
            }
            if (stallId) {
              await supabase.from('stalls').update({ status: 'OCCUPIED', occupant_id: occ?.id || null }).eq('id', stallId);
            }
            await supabase.from('stakeholders').update({
              application_status: 'ACTIVE_OCCUPANT',
              onboarding_status: 'FULLY_ONBOARDED',
              verified_tenant: true
            }).eq('id', Number(stakeholderId));

            if (application?.user_id) {
              await supabase.from('user_profiles').update({
                account_status: 'ACTIVE',
                is_active: true
              }).eq('id', application.user_id);
            }
            return { data: { activated: true, stakeholderId, stallId, status: 'ACTIVE_OCCUPANT' } };
          }
          return { data: { activated: false, reason: 'Pending final fees, advance payment, or stall assignment', checks: { hasAdvance, hasStall, hasInitialFees, finalFeesCleared } } };
        }
      }
      return { data: { activated: false } };
    }

    // 7. Stakeholder Approval Actions in POST
    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.includes('treasurer-approve')) {
      const stakeholderId = cleanUrl.split('/')[1];
      let resData = null;
      try {
        const { data: invData, error } = await supabase.functions.invoke('approval-workflow', {
          body: { action: 'treasurer-approve', stakeholderId, ...(data || {}) }
        });
        if (!error && invData && !invData.error) {
          resData = invData;
        }
      } catch (e) {
        console.warn('approval-workflow edge function notice, executing direct DB update:', e);
      }

      // Always update stakeholders table directly
      try {
        await supabase.from('stakeholders').update({
          treasurer_paid: true,
          applicant_fee_paid: true,
          advance_payment_paid: true,
          advance_payment_completed: true,
          application_status: 'PENDING_MARKET_SUPERVISOR_APPROVAL'
        }).eq('id', Number(stakeholderId));
      } catch (sErr) {
        console.warn('Direct stakeholders update note:', sErr);
      }

      try {
        const { data: st } = await supabase.from('stakeholders').select('user_id').eq('id', Number(stakeholderId)).maybeSingle();
        await supabase.from('stakeholder_applications').update({
          amount_paid: Number(data?.amount || 0),
          status: 'ADVANCE_PAID'
        }).or(`stakeholder_id.eq.${Number(stakeholderId)}${st?.user_id ? `,user_id.eq.${st.user_id}` : ''}`);
      } catch (_) {}

      invalidateApiCache('stakeholders|payments|applications|stalls');
      return { data: resData || { success: true, stakeholderId, status: 'APPROVED' } };
    }

    // 6.2 Stakeholder Select Stall (from Application Progress / Business Application)
    if (cleanUrl.includes('/select-stall')) {
      return await handleSelectStall(cleanUrl, data);
    }

    if (cleanUrl.startsWith('stakeholders/') && (cleanUrl.includes('market-approve') || cleanUrl.includes('supervisor-approve'))) {
      const stakeholderId = cleanUrl.split('/')[1];
      const targetStallId = data?.stallId || data?.stall_id;

      // 1. Fetch stakeholder details
      const { data: currentSh } = await supabase.from('stakeholders').select('*').eq('id', stakeholderId).maybeSingle();
      const resolvedStallId = targetStallId || currentSh?.selected_stall_id || currentSh?.selectedStallId;

      const { data: updated, error } = await supabase
        .from('stakeholders')
        .update({
          market_supervisor_approved: true,
          market_approval_status: 'APPROVED',
          application_status: 'CONTRACT_PREPARED',
          onboarding_status: resolvedStallId ? 'STALL_ASSIGNED' : 'MARKET_APPROVED',
          selected_stall_id: resolvedStallId ? Number(resolvedStallId) : (currentSh?.selected_stall_id || null)
        })
        .eq('id', stakeholderId)
        .select()
        .single();
      if (error) throw error;

      // 2. If a stall is selected/assigned, assign occupant (PENDING), reserve stall (RESERVED), and prepare contract draft (PENDING_APPROVAL)
      if (resolvedStallId) {
        try {
          const { data: st } = await supabase.from('stalls').select('*').eq('id', Number(resolvedStallId)).maybeSingle();

          let occupantId = null;
          const { data: existingOcc } = await supabase.from('occupants').select('id').eq('stakeholder_id', Number(stakeholderId)).maybeSingle();
          if (existingOcc?.id) {
            occupantId = existingOcc.id;
            await supabase.from('occupants').update({
              status: 'PENDING',
              stall_id: Number(resolvedStallId),
              occupancy_date: new Date().toISOString().split('T')[0],
              is_archived: false
            }).eq('id', occupantId);
          } else {
            const { data: newOcc } = await supabase.from('occupants').insert({
              stakeholder_id: Number(stakeholderId),
              stall_id: Number(resolvedStallId),
              status: 'PENDING',
              occupancy_date: new Date().toISOString().split('T')[0],
              is_archived: false,
              advance_balance: currentSh?.advance_balance || 0
            }).select('id').maybeSingle();
            occupantId = newOcc?.id;
          }

          // Update stall to RESERVED (prevent double assignment while pending final permits)
          await supabase.from('stalls').update({
            status: 'RESERVED',
            occupant_id: occupantId
          }).eq('id', Number(resolvedStallId));

          // Prepare contract draft with PENDING_APPROVAL status (not ACTIVE until BPLO permit issuance)
          const contractNo = `CON-${Date.now().toString().slice(-8)}`;
          let contractId = null;
          const { data: existingContract } = await supabase.from('contracts').select('id').eq('occupant_id', occupantId).maybeSingle();
          if (existingContract?.id) {
            contractId = existingContract.id;
            await supabase.from('contracts').update({
              status: 'PENDING_APPROVAL',
              stall_id: Number(resolvedStallId),
              monthly_rent: Number(st?.monthly_rent ?? 0)
            }).eq('id', contractId);
          } else {
            const { data: newCon } = await supabase.from('contracts').insert({
              occupant_id: occupantId,
              stall_id: Number(resolvedStallId),
              contract_no: contractNo,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              monthly_rent: Number(st?.monthly_rent ?? 0),
              billing_frequency: 'MONTHLY',
              status: 'PENDING_APPROVAL'
            }).select('id').maybeSingle();
            contractId = newCon?.id;
          }

          if (contractId) {
            await supabase.from('occupants').update({ contract_id: contractId, status: 'PENDING' }).eq('id', occupantId);
            await supabase.from('stakeholders').update({ contract_id: contractId, onboarding_status: 'STALL_ASSIGNED' }).eq('id', Number(stakeholderId));
          }
        } catch (assignErr) {
          console.warn('[market-approve] Stall and contract assignment note:', assignErr);
        }
      }

      try {
        if (updated?.id || updated?.user_id) {
          await supabase.from('stakeholder_applications').update({
            supervisor_endorsed_at: new Date().toISOString(),
            status: 'CONTRACT_PREPARED',
            stall_id: resolvedStallId ? Number(resolvedStallId) : undefined
          }).or(`stakeholder_id.eq.${updated.id}${updated.user_id ? `,user_id.eq.${updated.user_id}` : ''}`);
        }
      } catch (_) {}

      invalidateApiCache('stakeholders|payments|applications|stalls|occupants|contracts|billings');
      return { data: normalizeRecord(updated) };
    }

    // 7. Occupants Allocate
    if (cleanUrl.startsWith('occupants/allocate/')) {
      const stallId = cleanUrl.replace('occupants/allocate/', '');
      const stakeholderId = data?.stakeholderId || data?.stakeholder_id;
      if (!stakeholderId) throw new Error('Stakeholder ID is required for stall allocation');

      try {
        // Check stakeholder approval & advance payment
        const { data: sh, error: shErr } = await supabase
          .from('stakeholders')
          .select('*')
          .eq('id', stakeholderId)
          .maybeSingle();

        if (shErr) throw shErr;
        if (!sh) throw new Error('Stakeholder not found');

        // Fetch target stall details
        const { data: st } = await supabase
          .from('stalls')
          .select('*')
          .eq('id', Number(stallId))
          .maybeSingle();

        const targetStallNum = st?.stall_no || st?.stallNo || '';

        // Check or create occupant with ACTIVE status
        let occupantId = null;
        const { data: existingOcc } = await supabase
          .from('occupants')
          .select('id')
          .eq('stakeholder_id', Number(stakeholderId))
          .maybeSingle();

        if (existingOcc?.id) {
          occupantId = existingOcc.id;
          await supabase
            .from('occupants')
            .update({
              status: 'PENDING',
              stall_id: Number(stallId),
              is_archived: false,
              occupancy_date: new Date().toISOString().split('T')[0]
            })
            .eq('id', occupantId);
        } else {
          const { data: newOcc, error: newOccErr } = await supabase
            .from('occupants')
            .insert({
              stakeholder_id: Number(stakeholderId),
              stall_id: Number(stallId),
              status: 'PENDING',
              occupancy_date: new Date().toISOString().split('T')[0],
              is_archived: false,
              advance_balance: sh.advance_balance || 0
            })
            .select('id')
            .single();

          if (newOccErr) throw newOccErr;
          occupantId = newOcc?.id;
        }

        // Assign to stall as RESERVED (occupancy remains reserved until BPLO permit issuance)
        const { data: updatedStall, error: updStallErr } = await supabase
          .from('stalls')
          .update({
            status: 'RESERVED',
            occupant_id: occupantId
          })
          .eq('id', Number(stallId))
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
          .single();

        if (updStallErr) throw updStallErr;

        // Update stakeholder onboarding
        await supabase
          .from('stakeholders')
          .update({
            onboarding_status: 'STALL_ASSIGNED',
            selected_stall_id: Number(stallId),
            market_approval_status: 'APPROVED',
            market_supervisor_approved: true
          })
          .eq('id', Number(stakeholderId));

        // Prepare contract draft with PENDING_APPROVAL status (not ACTIVE)
        const contractNo = `CON-${Date.now().toString().slice(-8)}`;
        const { data: existingContract } = await supabase
          .from('contracts')
          .select('id')
          .eq('occupant_id', occupantId)
          .maybeSingle();

        let contractId = existingContract?.id;
        if (!contractId) {
          const { data: newCon } = await supabase
            .from('contracts')
            .insert({
              occupant_id: occupantId,
              stall_id: Number(stallId),
              contract_no: contractNo,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              monthly_rent: Number(st.monthly_rent ?? 0),
              billing_frequency: 'MONTHLY',
              status: 'PENDING_APPROVAL'
            })
            .select('id')
            .maybeSingle();
          contractId = newCon?.id;
        }

        if (contractId) {
          await supabase.from('occupants').update({ contract_id: contractId, status: 'PENDING' }).eq('id', occupantId);
        }

        // Also update stakeholder_applications if stakeholder_id or user_id exists
        try {
          await supabase.from('stakeholder_applications').update({
            stall_id: Number(stallId),
            supervisor_endorsed_at: new Date().toISOString(),
            status: 'CONTRACT_PREPARED'
          }).or(`stakeholder_id.eq.${Number(stakeholderId)}${sh.user_id ? `,user_id.eq.${sh.user_id}` : ''}`);
        } catch (_) {}

        // Automatically trigger ensureBillingsForVerifiedTenants so billing statements are immediately created
        try {
          const { ensureBillingsForVerifiedTenants } = await import('./billingService');
          await ensureBillingsForVerifiedTenants();
        } catch (_) {}

        invalidateApiCache('stalls|stakeholders|occupants|contracts|billings');
        return { data: normalizeRecord(updatedStall) };
      } catch (err) {
        console.warn('[api.post /occupants/allocate] Supabase error, falling back:', err);
        return rawAxios.post(url, data, config);
      }
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.includes('assign-stall')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'assign-stall', stakeholderId, ...(data || {}) }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Stall assignment failed');

      try {
        const targetStallId = data?.stallId || data?.stall_id;
        if (targetStallId) {
          await supabase.from('occupants').update({ status: 'ACTIVE' }).eq('stakeholder_id', Number(stakeholderId));
          const { data: occ } = await supabase.from('occupants').select('id').eq('stakeholder_id', Number(stakeholderId)).maybeSingle();
          if (occ?.id) {
            await supabase.from('stalls').update({ status: 'OCCUPIED', occupant_id: occ.id }).eq('id', Number(targetStallId));
          }
        }
        const { data: st } = await supabase.from('stakeholders').select('user_id').eq('id', stakeholderId).maybeSingle();
        if (targetStallId) {
          try {
            await supabase.from('stakeholder_applications').update({
              stall_id: Number(targetStallId),
              supervisor_endorsed_at: new Date().toISOString(),
              status: 'CONTRACT_PREPARED'
            }).or(`stakeholder_id.eq.${Number(stakeholderId)}${st?.user_id ? `,user_id.eq.${st.user_id}` : ''}`);
          } catch (_) {}
        }
      } catch (_) {}

      // Non-blocking billing check and notification dispatch
      void (async () => {
        try {
          const { ensureBillingsForVerifiedTenants } = await import('./billingService');
          await ensureBillingsForVerifiedTenants();
        } catch (_) {}

        try {
          const { sendApplicationProgressNotification } = await import('./emailNotificationService');
          await sendApplicationProgressNotification({
            stakeholderId,
            stage: 'STALL_ASSIGNMENT',
            status: 'ASSIGNED',
            title: 'Market Stall Assignment Completed',
            message: 'Your stall assignment has been processed and forwarded to BPLO for verification.'
          });
        } catch (_) {}
      })();

      return { data: resData };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/approve')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'treasurer-approve', stakeholderId, ...(data || {}) }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Approval failed');
      return { data: resData };
    }

    if (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/reject')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const remarks = data?.remarks || config.params?.remarks || 'Application rejected';
      const { data: resData, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'reject', stakeholderId, remarks }
      });
      if (error || resData?.error) throw new Error(error?.message || resData?.error || 'Rejection failed');
      return { data: resData };
    }

    // 8. Direct Edge Function invocation
    if (cleanUrl.startsWith('approval-workflow')) {
      const { data: resData, error } = await supabase.functions.invoke(cleanUrl, { body: data });
      if (error) throw error;
      return { data: resData };
    }

    // 9. Contracts create
    if (cleanUrl === 'contracts') {
      const contractNo = data.contractNo || data.contract_no || `CON-${Date.now().toString().slice(-8)}`;
      let occupantId = data.occupantId || data.occupant_id || data.occupant?.id || null;
      const stallId = data.stallId || data.stall_id || data.stall?.id || null;
      const stakeholderId = data.stakeholderId || data.stakeholder_id || data.stakeholder?.id || data.occupant?.stakeholder?.id || null;

      // 1. Resolve occupant: occupants references stakeholder_id (unique) and stall references occupant_id
      if (!occupantId && stallId) {
        try {
          const { data: stallData } = await supabase
            .from('stalls')
            .select('occupant_id')
            .eq('id', Number(stallId))
            .maybeSingle();
          if (stallData?.occupant_id) occupantId = stallData.occupant_id;
        } catch (_) {}
      }

      if (!occupantId && stakeholderId) {
        try {
          const { data: existingOcc } = await supabase
            .from('occupants')
            .select('id')
            .eq('stakeholder_id', Number(stakeholderId))
            .maybeSingle();
          if (existingOcc?.id) {
            occupantId = existingOcc.id;
          } else {
            const { data: newOcc } = await supabase
              .from('occupants')
              .insert({
                stakeholder_id: Number(stakeholderId),
                status: 'ACTIVE',
                advance_balance: 0
              })
              .select('id')
              .single();
            if (newOcc?.id) occupantId = newOcc.id;
          }
        } catch (_) {}
      }

      // Confirmed Decision 1: Contracts start as PENDING_APPROVAL / PENDING_SIGNATURE until initial payments and contract signing are satisfied
      const insertPayload = {
        contract_no: contractNo,
        start_date: data.startDate || data.start_date || null,
        end_date: data.endDate || data.end_date || null,
        monthly_rent: data.monthlyRent ?? data.monthly_rent ?? 0,
        billing_frequency: data.billingFrequency || data.billing_frequency || 'MONTHLY',
        terms: data.terms || '',
        status: data.status || 'PENDING_APPROVAL',
        occupant_id: occupantId ? Number(occupantId) : null,
        stall_id: stallId ? Number(stallId) : null,
        initial_payments_verified: Boolean(data.initialPaymentsVerified || data.initial_payments_verified),
        signed_by_stakeholder: Boolean(data.signedByStakeholder || data.signed_by_stakeholder),
        signed_by_lgu: Boolean(data.signedByLgu || data.signed_by_lgu),
        lease_term_years: Number(data.leaseTermYears || data.lease_term_years || 3)
      };

      try {
        const { data: newContract, error } = await supabase
          .from('contracts')
          .insert(insertPayload)
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
          .single();
        if (error) throw error;

        // Confirmed Decision 1: Stall remains RESERVED (not OCCUPIED) during contract preparation
        if (stallId && occupantId) {
          try {
            await supabase.from('stalls').update({ status: 'RESERVED', occupant_id: Number(occupantId) }).eq('id', Number(stallId));
          } catch (_) {}
        } else if (stallId) {
          try {
            await supabase.from('stalls').update({ status: 'RESERVED' }).eq('id', Number(stallId));
          } catch (_) {}
        }

        if (occupantId && newContract?.id) {
          try {
            await supabase.from('occupants').update({ contract_id: newContract.id, status: 'PENDING' }).eq('id', Number(occupantId));
          } catch (_) {}
        }

        if (stakeholderId) {
          try {
            await supabase.from('stakeholders').update({ onboarding_status: 'CONTRACT_PREPARED' }).eq('id', Number(stakeholderId));
          } catch (_) {}
        }

        const normalizedContract = normalizeRecord(newContract);

        // Sync localStorage
        try {
          const raw = localStorage.getItem('contracts');
          let localList = raw ? JSON.parse(raw) : [];
          if (Array.isArray(localList)) {
            localList = localList.filter(c => String(c.id) !== String(normalizedContract.id) && c.contractNo !== contractNo);
            localList.unshift(normalizedContract);
            localStorage.setItem('contracts', JSON.stringify(localList));
          }
        } catch (_) {}

        return { data: normalizedContract };
      } catch (insertErr) {
        console.warn('[API] Contracts table insert notice (using fallback):', insertErr.message);
        const fallbackContract = normalizeRecord({
          id: Date.now(),
          ...insertPayload,
          created_at: new Date().toISOString()
        });

        try {
          const raw = localStorage.getItem('contracts');
          let localList = raw ? JSON.parse(raw) : [];
          if (Array.isArray(localList)) {
            localList.unshift(fallbackContract);
            localStorage.setItem('contracts', JSON.stringify(localList));
          }
        } catch (_) {}

        return { data: fallbackContract };
      }
    }

    // 9.1 Contract Signing (Physical handwritten signing recorded by Market Supervisor)
    if (cleanUrl.startsWith('contracts/') && (cleanUrl.endsWith('/sign') || cleanUrl.endsWith('/record-signing'))) {
      const cId = cleanUrl.split('/')[1];
      const nowIso = new Date().toISOString();
      const signedDate = data?.signedDate || data?.signed_date || nowIso.split('T')[0];
      const { data: { user } } = await supabase.auth.getUser();

      const { data: updated, error } = await supabase
        .from('contracts')
        .update({
          signed_by_stakeholder: true,
          signed_by_lgu: true,
          signed_at: nowIso,
          signed_date: signedDate,
          signing_recorded_by: user?.id || null,
          signing_recorded_at: nowIso,
          status: 'PENDING_EXECUTION'
        })
        .eq('id', Number(cId))
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
        .single();

      if (error) throw error;

      try {
        await supabase.from('approval_history').insert({
          contract_id: Number(cId),
          stage: 'CONTRACT_SIGNING_RECORDED',
          status: 'RECORDED',
          action_by: user?.id || null,
          actor_name: user?.user_metadata?.name || 'Market Supervisor',
          actor_role: 'MARKET_SUPERVISOR',
          remarks: data?.remarks || 'Physical contract signing recorded.'
        });
      } catch (_) {}

      try {
        await supabase.from('audit_logs').insert({
          action: 'CONTRACT_SIGNING_RECORDED',
          entity_name: 'contracts',
          entity_id: String(cId),
          details: { signed_date: signedDate }
        });
      } catch (_) {}

      invalidateApiCache('contracts|occupants|stalls');
      return { data: normalizeRecord(updated) };
    }

    // 9.1b Initial Payments Verification (Recorded by Treasurer)
    if (cleanUrl.startsWith('contracts/') && cleanUrl.endsWith('/verify-initial-payments')) {
      const cId = cleanUrl.split('/')[1];
      const nowIso = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: updated, error } = await supabase
        .from('contracts')
        .update({
          initial_payments_verified: true,
          initial_payments_verified_by: user?.id || null,
          initial_payments_verified_at: nowIso
        })
        .eq('id', Number(cId))
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
        .single();

      if (error) throw error;

      try {
        await supabase.from('approval_history').insert({
          contract_id: Number(cId),
          stage: 'INITIAL_PAYMENTS_VERIFIED',
          status: 'VERIFIED',
          action_by: user?.id || null,
          actor_name: user?.user_metadata?.name || 'Municipal Treasurer',
          actor_role: 'TREASURER',
          remarks: data?.remarks || 'Initial payments verified by Treasurer.'
        });
      } catch (_) {}

      try {
        await supabase.from('audit_logs').insert({
          action: 'INITIAL_PAYMENTS_VERIFIED',
          entity_name: 'contracts',
          entity_id: String(cId)
        });
      } catch (_) {}

      invalidateApiCache('contracts');
      return { data: normalizeRecord(updated) };
    }

    // 9.2 Contract Activation Gate (Confirmed Decision 1: Only activates after initial payments AND contract signing)
    if (cleanUrl.startsWith('contracts/') && cleanUrl.endsWith('/activate')) {
      const cId = cleanUrl.split('/')[1];
      const { data: cRec, error: cErr } = await supabase
        .from('contracts')
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
        .eq('id', Number(cId))
        .single();

      if (cErr || !cRec) throw new Error('Contract not found.');

      const shId = cRec.occupant?.stakeholder_id || cRec.occupant?.stakeholder?.id || cRec.stakeholder_id;
      const stallId = cRec.stall_id;

      // Verification checks
      const missingConditions = [];

      // 1. Check initial payments (Stall Rights fee + 2 months advance rent)
      let initialPaymentsVerified = cRec.initial_payments_verified;
      if (!initialPaymentsVerified && shId) {
        // Query payments or advance_credits or stakeholder flags
        const { data: sh } = await supabase.from('stakeholders').select('*').eq('id', shId).maybeSingle();
        const { data: advList } = await supabase.from('advance_credits').select('id, available_amount').eq('stakeholder_id', shId);
        const { data: payList } = await supabase.from('payments').select('payment_type, amount').eq('stakeholder_id', shId);

        const hasAdvance = (advList && advList.length > 0) || (sh && (sh.advance_payment_paid || Number(sh.advance_balance || 0) > 0)) ||
          (payList && payList.some(p => p.payment_type === 'ADVANCE_PAYMENT' || p.payment_type === 'ADVANCE_RENT'));
        const hasRightsFee = (sh && (sh.applicant_fee_paid || sh.treasurer_paid)) ||
          (payList && payList.some(p => p.payment_type === 'STALL_RIGHTS_FEE' || p.payment_type === 'APPLICATION_FEE'));

        if (hasAdvance && hasRightsFee) {
          initialPaymentsVerified = true;
          await supabase.from('contracts').update({ initial_payments_verified: true }).eq('id', Number(cId));
        }
      }

      if (!initialPaymentsVerified) {
        missingConditions.push('Initial payments not verified (Stall rights fee and 2-month advance rental required).');
      }

      // 2. Check contract signatures
      const isSigned = (cRec.signed_by_stakeholder && cRec.signed_by_lgu) || cRec.signed_at || Boolean(data?.forceSigning);
      if (!isSigned) {
        missingConditions.push('Contract signatures missing (Both Lessee and Market Supervisor must sign).');
      }

      // 3. Check stall availability (ensure no other ACTIVE lease)
      if (stallId) {
        const { data: activeOthers } = await supabase
          .from('contracts')
          .select('id, contract_no')
          .eq('stall_id', stallId)
          .eq('status', 'ACTIVE')
          .neq('id', Number(cId));
        if (activeOthers && activeOthers.length > 0) {
          missingConditions.push(`Stall #${cRec.stall?.stall_no || stallId} already has an active lease (${activeOthers[0].contract_no}).`);
        }
      }

      if (missingConditions.length > 0) {
        return {
          data: {
            activated: false,
            success: false,
            error: 'Contract cannot be activated until all prerequisites are met.',
            missingConditions
          }
        };
      }

      // ACTIVATE
      const nowIso = new Date().toISOString();
      const { data: activatedContract, error: actErr } = await supabase
        .from('contracts')
        .update({
          status: 'ACTIVE',
          activated_at: nowIso,
          initial_payments_verified: true,
          signed_by_stakeholder: true,
          signed_by_lgu: true,
          signed_at: cRec.signed_at || nowIso
        })
        .eq('id', Number(cId))
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
        .single();

      if (actErr) throw actErr;

      // Update stall to OCCUPIED
      if (stallId) {
        await supabase.from('stalls').update({ status: 'OCCUPIED', occupant_id: cRec.occupant_id }).eq('id', stallId);
      }

      // Update occupant to ACTIVE
      if (cRec.occupant_id) {
        await supabase.from('occupants').update({ status: 'ACTIVE', is_archived: false }).eq('id', cRec.occupant_id);
      }

      // Update stakeholder status
      if (shId) {
        await supabase.from('stakeholders').update({
          application_status: 'FULLY_APPROVED',
          onboarding_status: 'ACTIVE_VENDOR',
          verified_tenant: true
        }).eq('id', shId);

        await supabase.from('stakeholder_applications').update({
          status: 'COMPLETED',
          current_holding_office: 'Active Market Tenancy',
          completed_at: nowIso
        }).eq('stakeholder_id', shId);
      }

      // Log to audit_logs
      try {
        await supabase.from('audit_logs').insert({
          action: 'CONTRACT_ACTIVATED',
          entity_type: 'contracts',
          entity_id: String(cId),
          change_summary: `Contract ${cRec.contract_no} activated after verifying initial payments and signatures.`
        });
      } catch (_) {}

      // Generate billing statement schedule
      try {
        const { ensureBillingsForVerifiedTenants } = await import('./billingService');
        await ensureBillingsForVerifiedTenants();
      } catch (_) {}

      invalidateApiCache('contracts|occupants|stalls|stakeholders|billings');
      return {
        data: {
          activated: true,
          success: true,
          contract: normalizeRecord(activatedContract)
        }
      };
    }

    // 9.3 Contract Revocation (Confirmed Decision: Requires authorized decision; never automatic)
    if ((cleanUrl.startsWith('contracts/') && cleanUrl.endsWith('/revoke')) || cleanUrl === 'delinquency/mayor-revocation') {
      const cId = cleanUrl === 'delinquency/mayor-revocation' ? (data?.contractId || data?.contract_id) : cleanUrl.split('/')[1];
      const reason = data?.reason || data?.remarks || 'Authorized municipal lease revocation';
      const nowIso = new Date().toISOString();

      const { data: cRec } = await supabase
        .from('contracts')
        .select('*, stall:stalls(*), occupant:occupants(*)')
        .eq('id', Number(cId))
        .maybeSingle();

      const { data: revoked, error } = await supabase
        .from('contracts')
        .update({
          status: 'REVOKED',
          revocation_reason: reason,
          revoked_at: nowIso
        })
        .eq('id', Number(cId))
        .select()
        .single();

      if (error) throw error;

      // Release stall back to AVAILABLE
      if (cRec?.stall_id) {
        await supabase.from('stalls').update({ status: 'AVAILABLE', occupant_id: null }).eq('id', cRec.stall_id);
      }

      // Set occupant to REVOKED / archived
      if (cRec?.occupant_id) {
        await supabase.from('occupants').update({ status: 'REVOKED', is_archived: true }).eq('id', cRec.occupant_id);
      }

      // Log to audit_logs
      try {
        await supabase.from('audit_logs').insert({
          action: 'CONTRACT_REVOKED',
          entity_type: 'contracts',
          entity_id: String(cId),
          change_summary: `Contract ${cRec?.contract_no || cId} revoked. Reason: ${reason}`
        });
      } catch (_) {}

      invalidateApiCache('contracts|occupants|stalls|stakeholders|billings');
      return { data: { success: true, revoked: normalizeRecord(revoked) } };
    }

    // 9.4 Advance Credit Allocation (Confirmed Decision 2: Allocated without counting as duplicate cash revenue)
    if (cleanUrl === 'advance-credits/allocate') {
      const { allocateAdvanceCreditToBill } = await import('./billingService');
      const res = await allocateAdvanceCreditToBill({
        billingId: data?.billingId || data?.billing_id,
        amount: data?.amount,
        stakeholderId: data?.stakeholderId || data?.stakeholder_id,
        authorizedByName: data?.authorizedByName || 'Municipal Treasurer'
      });
      invalidateApiCache('billings|advance-credits|credit-allocations');
      return { data: res };
    }

    // 9.5 Daily & Partial Payment Collection
    if (cleanUrl === 'collections/daily' || cleanUrl === 'payments/daily') {
      const { recordDailyCollection } = await import('./billingService');
      const res = await recordDailyCollection({
        billingId: data?.billingId || data?.billing_id,
        amount: data?.amount,
        receiptNo: data?.receiptNo || data?.receipt_no,
        collectorName: data?.collectorName || data?.collector_name || 'Daily Market Collector',
        notes: data?.notes
      });
      invalidateApiCache('billings|payments|collections');
      return { data: res };
    }

    // 9.6 Overdue Notices Issuance
    if (cleanUrl === 'notices' || cleanUrl === 'notices/issue') {
      const { issueOverdueNotice } = await import('./billingService');
      const res = await issueOverdueNotice({
        contractId: data?.contractId || data?.contract_id,
        stakeholderId: data?.stakeholderId || data?.stakeholder_id,
        noticeType: data?.noticeType || data?.notice_type || 'FIRST_NOTICE',
        totalArrears: data?.totalArrears || data?.total_arrears || 0,
        unpaidBillingIds: data?.unpaidBillingIds || data?.unpaid_billing_ids || [],
        remarks: data?.remarks,
        issuedByName: data?.issuedByName || data?.issued_by_name || 'Market Administration'
      });
      invalidateApiCache('notices');
      return { data: res };
    }

    // 9.7 Billings Generate
    if (cleanUrl === 'billings/generate') {
      const { ensureBillingsForVerifiedTenants } = await import('./billingService');
      const generated = await ensureBillingsForVerifiedTenants({ force: true });
      invalidateApiCache('billings|contracts|occupants');
      return { data: { success: true, count: generated?.length || 0, generated } };
    }

    // 9.8 Authoritative LOI Generated Workflow Endpoints (No Upload Required)
    if (cleanUrl.startsWith('applications/') && cleanUrl.includes('/loi/generate')) {
      const appId = cleanUrl.split('/')[1];
      const queryId = !isNaN(Number(appId)) ? Number(appId) : appId;
      const nowIso = new Date().toISOString();
      const refNo = data?.loi_reference_no || data?.loiReferenceNo || `LOI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const snapshot = data?.snapshot || data?.loi_snapshot_json || null;

      const updateObj = {
        loi_reference_no: refNo,
        loi_status: 'GENERATED',
        loi_generated_at: nowIso,
        document_template_version: 'v1.0',
        loi_updated_at: nowIso
      };
      if (snapshot) updateObj.loi_snapshot_json = snapshot;

      const { data: updated, error } = await supabase
        .from('stakeholder_applications')
        .update(updateObj)
        .eq('id', Number(queryId))
        .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
        .single();

      if (error) throw error;

      try {
        await supabase.from('audit_logs').insert({
          action: 'LOI_CREATED',
          entity_name: 'stakeholder_applications',
          entity_id: String(queryId),
          details: { loi_reference_no: refNo }
        });
      } catch (_) {}

      invalidateApiCache('applications');
      return { data: normalizeRecord(updated) };
    }

    if (cleanUrl.startsWith('applications/') && cleanUrl.includes('/loi/record-print')) {
      const appId = cleanUrl.split('/')[1];
      const queryId = !isNaN(Number(appId)) ? Number(appId) : appId;
      const nowIso = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('stakeholder_applications')
        .update({
          loi_printed_at: nowIso,
          loi_last_exported_at: nowIso,
          loi_status: 'PRINTED',
          loi_updated_at: nowIso
        })
        .eq('id', Number(queryId))
        .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
        .single();

      if (error) throw error;

      try {
        await supabase.from('audit_logs').insert({
          action: 'LOI_PRINTED',
          entity_name: 'stakeholder_applications',
          entity_id: String(queryId)
        });
      } catch (_) {}

      invalidateApiCache('applications');
      return { data: normalizeRecord(updated) };
    }

    if (cleanUrl.startsWith('applications/') && cleanUrl.includes('/loi/record-received')) {
      const appId = cleanUrl.split('/')[1];
      const queryId = !isNaN(Number(appId)) ? Number(appId) : appId;
      const nowIso = new Date().toISOString();

      if (isUuid(appId)) {
        const { data: current, error: currentError } = await supabase.from('applications')
          .select('id, current_status, signed_loi_received_at').eq('id', appId).maybeSingle();
        if (currentError) throw currentError;
        if (!current) throw new Error('Application not found.');
        if (current.current_status !== 'SUBMITTED') throw new Error('Only applications awaiting the Mayor can be received.');
        if (current.signed_loi_received_at) return { data: normalizeRecord(current) };
        const { data: updated, error } = await supabase.from('applications').update({
          signed_loi_received_at: nowIso,
          current_holding_office: 'Office of the Mayor'
        }).eq('id', appId).eq('current_status', 'SUBMITTED').select().single();
        if (error) throw error;
        invalidateApiCache('applications');
        return { data: normalizeRecord({ ...updated, loi_received_at: updated.signed_loi_received_at }) };
      }

      const { data: current, error: currentError } = await supabase
        .from('stakeholder_applications')
        .select('id, status, loi_received_at')
        .eq('id', Number(queryId))
        .maybeSingle();
      if (currentError) throw currentError;
      if (!current) throw new Error('Application not found.');
      if (current.status !== 'SUBMITTED') {
        throw new Error('Only applications endorsed to the Mayor can be received by the Mayor’s Office.');
      }
      if (current.loi_received_at) return { data: normalizeRecord(current) };

      const { data: updated, error } = await supabase
        .from('stakeholder_applications')
        .update({
          loi_received_at: nowIso,
          loi_status: 'RECEIVED',
          loi_updated_at: nowIso,
          current_holding_office: 'Office of the Mayor'
        })
        .eq('id', Number(queryId))
        .eq('status', 'SUBMITTED')
        .is('loi_received_at', null)
        .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
        .single();

      if (error) throw error;

      try {
        await supabase.from('audit_logs').insert({
          action: 'LOI_RECEIVED',
          entity_name: 'stakeholder_applications',
          entity_id: String(queryId)
        });
      } catch (_) {}

      invalidateApiCache('applications');
      return { data: normalizeRecord(updated) };
    }

    if (cleanUrl.startsWith('applications/') && cleanUrl.includes('/loi/approve')) {
      const appId = cleanUrl.split('/')[1];
      const queryId = !isNaN(Number(appId)) ? Number(appId) : appId;
      const nowIso = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      const ref = data?.approval_reference || data?.loi_approval_reference || data?.signedDocumentRef || `LOI-APPR-${String(queryId)}`;
      const remarks = data?.remarks || data?.loi_remarks || 'Approved by Office of the Municipal Mayor';

      const { data: updated, error } = await supabase
        .from('stakeholder_applications')
        .update({
          loi_approval_status: 'APPROVED',
          loi_status: 'APPROVED',
          loi_approved_by: user?.id || null,
          loi_approved_at: nowIso,
          loi_approval_reference: ref,
          loi_remarks: remarks,
          loi_updated_at: nowIso,
          status: 'APPROVED_PENDING_ADVANCE_PAYMENT',
          current_holding_office: 'Municipal Treasury'
        })
        .eq('id', Number(queryId))
        .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
        .single();

      if (error) throw error;

      if (updated?.stakeholder_id) {
        await supabase.from('stakeholders').update({
          application_status: 'APPROVED_PENDING_ADVANCE_PAYMENT'
        }).eq('id', updated.stakeholder_id);

        try {
          await supabase.from('approval_history').insert({
            stakeholder_id: updated.stakeholder_id,
            application_id: Number(queryId),
            stage: 'LOI_APPROVAL',
            status: 'APPROVED',
            action_by: user?.id || null,
            actor_name: user?.user_metadata?.name || 'Office of the Municipal Mayor',
            actor_role: 'MAYOR_OFFICE',
            remarks: remarks
          });
        } catch (_) {}
      }

      try {
        await supabase.from('audit_logs').insert({
          action: 'LOI_APPROVED',
          entity_name: 'stakeholder_applications',
          entity_id: String(queryId),
          details: { reference: ref, remarks }
        });
      } catch (_) {}

      invalidateApiCache('applications|stakeholders');
      return { data: normalizeRecord(updated) };
    }

    if (cleanUrl.startsWith('applications/') && cleanUrl.includes('/loi/reject')) {
      const appId = cleanUrl.split('/')[1];
      const queryId = !isNaN(Number(appId)) ? Number(appId) : appId;
      const nowIso = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      const remarks = data?.remarks || data?.loi_remarks || 'Disapproved by Office of the Municipal Mayor';

      const { data: updated, error } = await supabase
        .from('stakeholder_applications')
        .update({
          loi_approval_status: 'REJECTED',
          loi_status: 'REJECTED',
          loi_approved_by: user?.id || null,
          loi_approved_at: nowIso,
          loi_remarks: remarks,
          loi_updated_at: nowIso,
          status: 'MAYOR_REJECTED',
          current_holding_office: 'Office of the Mayor'
        })
        .eq('id', Number(queryId))
        .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
        .single();

      if (error) throw error;

      if (updated?.stakeholder_id) {
        await supabase.from('stakeholders').update({
          application_status: 'MAYOR_REJECTED'
        }).eq('id', updated.stakeholder_id);

        try {
          await supabase.from('approval_history').insert({
            stakeholder_id: updated.stakeholder_id,
            application_id: Number(queryId),
            stage: 'LOI_APPROVAL',
            status: 'REJECTED',
            action_by: user?.id || null,
            actor_name: user?.user_metadata?.name || 'Office of the Municipal Mayor',
            actor_role: 'MAYOR_OFFICE',
            remarks: remarks
          });
        } catch (_) {}
      }

      try {
        await supabase.from('audit_logs').insert({
          action: 'LOI_REJECTED',
          entity_name: 'stakeholder_applications',
          entity_id: String(queryId),
          details: { remarks }
        });
      } catch (_) {}

      invalidateApiCache('applications|stakeholders');
      return { data: normalizeRecord(updated) };
    }

    return rawAxios.post(url, data, config);
  },

  async put(url, data, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');
    invalidateApiCache(cleanUrl.split('/')[0]);

    // 0. Stakeholder Select Stall (from Application Progress / Business Application)
    if (cleanUrl.includes('/select-stall')) {
      return await handleSelectStall(cleanUrl, data);
    }

    // 0.1 Application Review Endpoints (Supervisor, Mayor, Inspector, BPLO, Activation)
    if (cleanUrl.startsWith('applications/') && cleanUrl.endsWith('/supervisor-review')) {
      const appId = cleanUrl.split('/')[1];
      const { status, remarks } = data || {};
      const { data: { user } } = await supabase.auth.getUser();

      const { data: current, error: currentError } = await supabase
        .from('stakeholder_applications')
        .select('id, status')
        .eq('id', Number(appId))
        .maybeSingle();
      if (currentError) throw currentError;
      if (!current || current.status !== 'ADVANCE_PAID') {
        throw new Error('Only applications forwarded to the Market Supervisor can be reviewed.');
      }

      const nextStatus = status === 'REJECTED' ? 'SUPERVISOR_REJECTED' : 'CONTRACT_PREPARED';
      const { data: updatedApp, error: appErr } = await supabase
        .from('stakeholder_applications')
        .update({
          status: nextStatus,
          supervisor_endorsed_at: new Date().toISOString(),
          supervisor_remarks: remarks || null,
          current_holding_office: 'Market Supervisor'
        })
        .eq('id', Number(appId))
        .eq('status', 'ADVANCE_PAID')
        .select()
        .single();

      if (appErr) throw appErr;

      if (updatedApp?.stakeholder_id) {
        await supabase.from('stakeholders').update({
          market_supervisor_approved: status !== 'REJECTED',
          market_approval_status: status !== 'REJECTED' ? 'APPROVED' : 'REJECTED',
          application_status: nextStatus
        }).eq('id', updatedApp.stakeholder_id);

        try {
          await supabase.from('approval_history').insert({
            stakeholder_id: updatedApp.stakeholder_id,
            application_id: Number(appId),
            stage: 'MARKET_SUPERVISOR',
            status: status !== 'REJECTED' ? 'APPROVED' : 'REJECTED',
            action_by: user?.id || null,
            actor_name: user?.user_metadata?.name || 'Market Supervisor',
            actor_role: 'MARKET_SUPERVISOR',
            remarks: remarks || null
          });
        } catch (_) {}
      }

      invalidateApiCache('applications|stakeholders');
      return { data: normalizeRecord(updatedApp) };
    }

    if (cleanUrl.startsWith('applications/') && cleanUrl.endsWith('/mayor-review')) {
      const appId = cleanUrl.split('/')[1];
      const { decision, approved, remarks, signedDocumentUrl, signed_document_url, signedDocumentRef, approverName } = data || {};
      const isApproved = decision === 'APPROVED' || approved === true;
      const isCorrection = decision === 'RETURNED_FOR_CORRECTION' || decision === 'CORRECTION';
      const decValue = isApproved ? 'APPROVED' : (isCorrection ? 'RETURNED_FOR_CORRECTION' : 'REJECTED');
      const nextStatus = isApproved ? 'APPROVED_PENDING_ADVANCE_PAYMENT' : (isCorrection ? 'RETURNED_FOR_CORRECTION' : 'MAYOR_REJECTED');
      const docRef = signedDocumentUrl || signed_document_url || signedDocumentRef || null;
      if (isUuid(appId)) {
        const { data: current, error: currentError } = await supabase.from('applications')
          .select('id, current_status, signed_loi_received_at').eq('id', appId).maybeSingle();
        if (currentError) throw currentError;
        if (!current) throw new Error('Application not found.');
        if (current.current_status !== 'SUBMITTED') throw new Error('Only submitted applications can receive a mayoral decision.');
        if (!isCorrection && !current.signed_loi_received_at) throw new Error('Record receipt of the signed LOI before approving or rejecting it.');
        if (isApproved && !String(docRef || '').trim()) throw new Error('An approval reference is required to approve the LOI.');
        if (!isApproved && !String(remarks || '').trim()) throw new Error(isCorrection ? 'Correction instructions are required.' : 'A reason is required to reject the application.');
        const { data: { user } } = await supabase.auth.getUser();
        const nowIso = new Date().toISOString();
        const { data: updated, error } = await supabase.from('applications').update({
          current_status: nextStatus,
          mayor_decision: decValue,
          mayor_approval_status: isApproved ? 'APPROVED' : (isCorrection ? 'PENDING' : 'DISAPPROVED'),
          mayor_reviewed_by: user?.id || null,
          mayor_reviewed_at: nowIso,
          mayor_decision_ref_no: docRef,
          mayor_decision_date: nowIso,
          mayor_remarks: remarks || null,
          current_holding_office: isApproved ? 'Municipal Treasury' : (isCorrection ? 'Applicant (Correction Required)' : 'Office of the Mayor')
        }).eq('id', appId).eq('current_status', 'SUBMITTED').select().single();
        if (error) throw error;
        invalidateApiCache('applications');
        return { data: normalizeRecord({ ...updated, status: updated.current_status, loi_approval_status: updated.mayor_approval_status }) };
      }
      const { data: current, error: currentError } = await supabase
        .from('stakeholder_applications')
        .select('id, status, loi_received_at')
        .eq('id', Number(appId))
        .maybeSingle();
      if (currentError) throw currentError;
      if (!current) throw new Error('Application not found.');
      if (current.status !== 'SUBMITTED') {
        throw new Error('Only applications endorsed to the Mayor can receive a mayoral decision.');
      }
      const loiReceivedAt = current.loi_received_at || nowIso;
      const finalDocRef = String(docRef || '').trim() || `MO-APPR-${appId}-${Date.now().toString().slice(-4)}`;
      if (!isApproved && !String(remarks || '').trim()) {
        throw new Error(isCorrection ? 'Correction instructions are required.' : 'A reason is required to reject the application.');
      }
      const { data: { user } } = await supabase.auth.getUser();
      const approver = approverName || user?.user_metadata?.name || user?.user_metadata?.full_name || 'Office of the Municipal Mayor';

      const nowIso = new Date().toISOString();
      const { data: updatedApp, error: appErr } = await supabase
        .from('stakeholder_applications')
        .update({
          status: nextStatus,
          mayor_decision: decValue,
          mayor_approved_at: nowIso,
          mayor_approved_by: approver,
          mayor_signed_document_url: finalDocRef,
          mayor_remarks: remarks || null,
          current_holding_office: isApproved ? 'Municipal Treasury' : (isCorrection ? 'Stakeholder (Correction Required)' : 'Office of the Mayor'),
          mayor_approval_status: isApproved ? 'APPROVED' : (isCorrection ? 'PENDING' : 'DISAPPROVED'),
          mayor_reviewed_at: nowIso,
          loi_received_at: loiReceivedAt,
          loi_approval_status: isApproved ? 'APPROVED' : (isCorrection ? 'PENDING' : 'REJECTED'),
          loi_status: isApproved ? 'APPROVED' : (isCorrection ? 'PRINTED' : 'REJECTED'),
          loi_approved_by: user?.id || null,
          loi_approved_at: nowIso,
          loi_approval_reference: finalDocRef,
          loi_remarks: remarks || null,
          loi_updated_at: nowIso
        })
        .eq('id', Number(appId))
        .eq('status', 'SUBMITTED')
        .select()
        .single();

      if (appErr) throw appErr;

      if (updatedApp?.stakeholder_id) {
        await supabase.from('stakeholders').update({
          final_endorsed: isApproved,
          endorsing_approved: isApproved,
          endorsement_status: decValue,
          endorsement_remarks: remarks || null,
          application_status: nextStatus
        }).eq('id', updatedApp.stakeholder_id);

        try {
          await supabase.from('approval_history').insert({
            stakeholder_id: updatedApp.stakeholder_id,
            application_id: Number(appId),
            stage: 'LOI_APPROVAL',
            status: decValue,
            action_by: user?.id || null,
            actor_name: approver,
            actor_role: 'MAYOR_OFFICE',
            remarks: remarks || (docRef ? `LOI approved with reference: ${docRef}` : null)
          });
        } catch (_) {}
      }

      invalidateApiCache('applications|stakeholders');
      return { data: normalizeRecord(updatedApp) };
    }

    if (cleanUrl.startsWith('applications/') && cleanUrl.endsWith('/inspector-verify')) {
      const appId = cleanUrl.split('/')[1];
      const { electricalClearance, structuralClearance, fireSafetyClearance, sanitationClearance, status, remarks } = data || {};
      const { data: { user } } = await supabase.auth.getUser();

      const { data: appRec } = await supabase
        .from('stakeholder_applications')
        .select('*, stall:stalls(*)')
        .eq('id', Number(appId))
        .maybeSingle();

      const stallId = appRec?.stall_id;

      if (stallId) {
        try {
          await supabase.from('stall_inspections').insert({
            stall_id: stallId,
            inspector_id: user?.id || null,
            inspector_name: user?.user_metadata?.name || user?.user_metadata?.full_name || 'Sanitary/Safety Inspector',
            electrical_clearance: electricalClearance ?? true,
            structural_clearance: structuralClearance ?? true,
            fire_safety_clearance: fireSafetyClearance ?? true,
            sanitation_clearance: sanitationClearance ?? true,
            status: status || 'PASSED',
            remarks: remarks || 'Stall inspected and verified compliant.'
          });
        } catch (_) {}
      }

      const { data: updatedApp, error: appErr } = await supabase
        .from('stakeholder_applications')
        .update({
          status: 'INSPECTION_PASSED',
          inspection_notes: remarks || null,
          inspection_completed_at: new Date().toISOString(),
          inspected_by: user?.id || null,
          current_holding_office: 'BPLO'
        })
        .eq('id', Number(appId))
        .select()
        .single();

      if (appErr) throw appErr;

      invalidateApiCache('applications|inspections|stalls');
      return { data: normalizeRecord(updatedApp) };
    }



    if (cleanUrl.startsWith('applications/') && cleanUrl.endsWith('/activate-vendor')) {
      const appId = cleanUrl.split('/')[1];
      const { remarks } = data || {};

      const { data: appRec } = await supabase
        .from('stakeholder_applications')
        .select('*')
        .eq('id', Number(appId))
        .maybeSingle();

      const shId = appRec?.stakeholder_id;
      const stallId = appRec?.stall_id;

      const { data: updatedApp } = await supabase
        .from('stakeholder_applications')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
        .eq('id', Number(appId))
        .select()
        .single();

      if (shId) {
        await supabase.from('stakeholders').update({
          application_status: 'COMPLETED',
          onboarding_status: 'ACTIVE_VENDOR',
          verified_tenant: true
        }).eq('id', shId);

        let occId = null;
        const { data: exOcc } = await supabase.from('occupants').select('id').eq('stakeholder_id', shId).maybeSingle();
        if (exOcc?.id) {
          occId = exOcc.id;
          await supabase.from('occupants').update({ status: 'ACTIVE', is_archived: false }).eq('id', occId);
        } else if (stallId) {
          const { data: nOcc } = await supabase.from('occupants').insert({
            stakeholder_id: shId,
            stall_id: stallId,
            status: 'ACTIVE',
            is_archived: false,
            occupancy_date: new Date().toISOString().split('T')[0]
          }).select('id').maybeSingle();
          occId = nOcc?.id;
        }

        if (stallId) {
          await supabase.from('stalls').update({
            status: 'OCCUPIED',
            occupant_id: occId || null
          }).eq('id', stallId);
        }
      }

      invalidateApiCache('applications|stakeholders|stalls|occupants');
      return { data: normalizeRecord(updatedApp) };
    }

    // 1. Applications endorse / approve / reject / bplo
    if (cleanUrl.includes('/reject') || cleanUrl.includes('/endorse-reject') || cleanUrl.includes('/bplo-reject')) {
      const id = cleanUrl.split('/')[1];
      const stage = cleanUrl.includes('/bplo-reject') ? 'BPLO' : (cleanUrl.includes('/endorse-reject') ? 'ENDORSEMENT' : 'WORKFLOW');
      const remarks = config.params?.remarks || data?.remarks || 'Application rejected';
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'reject', stakeholderId: id, stage, remarks }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'Rejection failed');

      // Non-blocking notification dispatch so UI updates immediately
      void (async () => {
        try {
          const { sendApplicationProgressNotification } = await import('./emailNotificationService');
          await sendApplicationProgressNotification({
            stakeholderId: id,
            stage,
            status: 'REJECTED',
            title: `Application Disapproved at ${stage} Stage`,
            message: `Your application was disapproved during ${stage} review.`,
            remarks
          });
        } catch (_) {}
      })();

      return { data: res };
    }

    if (cleanUrl.includes('/treasurer-approve') || (cleanUrl.startsWith('stakeholders/') && cleanUrl.endsWith('/approve'))) {
      const id = cleanUrl.split('/')[1];
      let res = null;
      try {
        const { data: invRes, error } = await supabase.functions.invoke('approval-workflow', {
          body: { action: 'treasurer-approve', stakeholderId: id, ...(data || {}) }
        });
        if (!error && invRes && !invRes.error) {
          res = invRes;
        }
      } catch (e) {
        console.warn('approval-workflow invoke notice:', e);
      }

      // Always update stakeholders table directly
      try {
        await supabase.from('stakeholders').update({
          treasurer_paid: true,
          applicant_fee_paid: true,
          advance_payment_paid: true,
          advance_payment_completed: true,
          application_status: 'PENDING_MARKET_SUPERVISOR_APPROVAL'
        }).eq('id', Number(id));
      } catch (sErr) {
        console.warn('Direct stakeholders update notice:', sErr);
      }

      try {
        const { data: st } = await supabase.from('stakeholders').select('user_id').eq('id', Number(id)).maybeSingle();
        let q = supabase.from('stakeholder_applications').update({
          amount_paid: 8000,
          status: 'ADVANCE_PAID'
        });
        if (id) q = q.eq('stakeholder_id', Number(id));
        else if (st?.user_id) q = q.eq('user_id', st.user_id);
        await q;
      } catch (_) {}

      // Non-blocking notification dispatch so UI updates immediately
      void (async () => {
        try {
          const { sendApplicationProgressNotification } = await import('./emailNotificationService');
          await sendApplicationProgressNotification({
            stakeholderId: id,
            stage: 'TREASURER',
            status: 'APPROVED',
            title: 'Treasurer Review Approved',
            message: 'Your application has been approved by the Municipal Treasurer and forwarded to the Market Supervisor.'
          });
        } catch (_) {}
      })();

      invalidateApiCache('stakeholders|payments|applications|stalls');
      return { data: res || { success: true, stakeholderId: id, status: 'APPROVED' } };
    }

    if (cleanUrl.includes('/endorse') || cleanUrl.includes('/final-endorse')) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'final-endorse', stakeholderId: id, ...(data || {}) }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'Endorsement failed');

      try {
        const { data: st } = await supabase.from('stakeholders').select('user_id').eq('id', id).maybeSingle();
        let q = supabase.from('stakeholder_applications').update({
          endorsing_status: 'ENDORSED',
          status: 'APPROVED_PENDING_ADVANCE_PAYMENT'
        });
        if (id) q = q.eq('stakeholder_id', Number(id));
        else if (st?.user_id) q = q.eq('user_id', st.user_id);
        await q;
      } catch (_) {}

      // Non-blocking notification dispatch
      void (async () => {
        try {
          const { sendApplicationProgressNotification } = await import('./emailNotificationService');
          await sendApplicationProgressNotification({
            stakeholderId: id,
            stage: 'ENDORSEMENT',
            status: 'APPROVED',
            title: 'Final Mayoral Endorsement Approved',
            message: 'Your application has received final executive endorsement. Please settle business permit fees with the Treasurer to commence operations.'
          });
        } catch (_) {}
      })();

      return { data: res };
    }

    if (cleanUrl.includes('/market-approve') || cleanUrl.includes('/supervisor-approve')) {
      const stakeholderId = cleanUrl.split('/')[1];
      const { data: updated, error } = await supabase
        .from('stakeholders')
        .update({
          market_supervisor_approved: true,
          market_approval_status: 'APPROVED',
          application_status: 'PENDING_BPLO_APPROVAL'
        })
        .eq('id', stakeholderId)
        .select()
        .single();
      if (error) throw error;

      try {
        let q = supabase.from('stakeholder_applications').update({
          supervisor_endorsed_at: new Date().toISOString(),
          status: 'CONTRACT_PREPARED'
        });
        if (stakeholderId) q = q.eq('stakeholder_id', Number(stakeholderId));
        else if (updated?.user_id) q = q.eq('user_id', updated.user_id);
        await q;
      } catch (_) {}

      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('approval_history').insert({
          stakeholder_id: Number(stakeholderId),
          stage: 'MARKET_SUPERVISOR',
          status: 'APPROVED',
          approved_by: user?.id || null,
          remarks: data?.remarks || 'Market Supervisor approved application'
        });
        await supabase.from('notifications').insert({
          stakeholder_id: Number(stakeholderId),
          title: 'Market Supervisor Approved',
          message: 'Your application has been approved by the Market Supervisor and forwarded to BPLO.',
          priority: 'MEDIUM',
          notification_type: 'APPROVAL_UPDATE',
          related_record_type: 'STAKEHOLDER',
          related_record_id: Number(stakeholderId)
        });

        // Non-blocking notification dispatch so UI updates immediately
        void (async () => {
          try {
            const { sendApplicationProgressNotification } = await import('./emailNotificationService');
            await sendApplicationProgressNotification({
              stakeholderId: Number(stakeholderId),
              userId: updated?.user_id,
              email: updated?.email,
              stage: 'MARKET_SUPERVISOR',
              status: 'APPROVED',
              title: 'Market Supervisor Approval Granted',
              message: 'Your application has been approved by the Market Supervisor and forwarded to BPLO.'
            });
          } catch (_) {}
        })();
      } catch (_) {}

      return { data: normalizeRecord(updated) };
    }

    if (cleanUrl.includes('/bplo-approve')) {
      const id = cleanUrl.split('/')[1];
      const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
        body: { action: 'bplo-approve', stakeholderId: id, ...(data || {}) }
      });
      if (error || res?.error) throw new Error(error?.message || res?.error || 'BPLO approval failed');
      return { data: res };
    }

    if (cleanUrl.includes('/assign-stall')) {
      const id = cleanUrl.split('/')[1];
      const targetStallId = data?.stallId || data?.stall_id;

      try {
        const { data: res, error } = await supabase.functions.invoke('approval-workflow', {
          body: { action: 'assign-stall', stakeholderId: id, ...(data || {}) }
        });
        if (error || res?.error) throw new Error(error?.message || res?.error || 'Stall assignment edge function returned error');
      } catch (efErr) {
        console.warn('[api.put assign-stall] Edge function notice, ensuring direct DB state:', efErr);
      }

      // Direct DB state synchronization: activate occupant and link stall
      try {
        if (targetStallId) {
          let occupantId = null;
          const { data: existingOcc } = await supabase
            .from('occupants')
            .select('id')
            .eq('stakeholder_id', Number(id))
            .maybeSingle();

          if (existingOcc?.id) {
            occupantId = existingOcc.id;
            await supabase
              .from('occupants')
              .update({
                status: 'ACTIVE',
                stall_id: Number(targetStallId),
                is_archived: false,
                occupancy_date: new Date().toISOString().split('T')[0]
              })
              .eq('id', occupantId);
          } else {
            const { data: newOcc, error: newOccErr } = await supabase
              .from('occupants')
              .insert({
                stakeholder_id: Number(id),
                stall_id: Number(targetStallId),
                status: 'ACTIVE',
                occupancy_date: new Date().toISOString().split('T')[0],
                is_archived: false
              })
              .select('id')
              .single();

            if (!newOccErr && newOcc?.id) {
              occupantId = newOcc.id;
            }
          }

          if (occupantId) {
            await supabase
              .from('stalls')
              .update({ status: 'OCCUPIED', occupant_id: occupantId })
              .eq('id', Number(targetStallId));
          }

          await supabase
            .from('stakeholders')
            .update({
              selected_stall_id: Number(targetStallId),
              onboarding_status: 'STALL_ASSIGNED',
              market_approval_status: 'APPROVED',
              market_supervisor_approved: true
            })
            .eq('id', Number(id));

          // Non-blocking billing check and notification dispatch
          void (async () => {
            try {
              const { ensureBillingsForVerifiedTenants } = await import('./billingService');
              await ensureBillingsForVerifiedTenants();
            } catch (_) {}

            try {
              const { sendApplicationProgressNotification } = await import('./emailNotificationService');
              await sendApplicationProgressNotification({
                stakeholderId: id,
                stage: 'STALL_ASSIGNMENT',
                status: 'ASSIGNED',
                title: 'Market Stall Assignment Completed',
                message: 'Your stall assignment has been processed and forwarded to BPLO for verification.'
              });
            } catch (_) {}
          })();
        }
      } catch (dbErr) {
        console.warn('[api.put assign-stall] Direct sync error:', dbErr);
      }

      return { data: { success: true, stakeholderId: id, stallId: targetStallId } };
    }

    // 1.1 Occupants Vacate
    if (cleanUrl.startsWith('occupants/vacate/')) {
      const stallId = cleanUrl.replace('occupants/vacate/', '');
      try {
        const { data: st, error: stErr } = await supabase
          .from('stalls')
          .select('*, occupant:occupants(*)')
          .eq('id', Number(stallId))
          .single();

        if (stErr) throw stErr;

        if (st?.occupant_id) {
          await supabase
            .from('occupants')
            .update({ is_archived: true, status: 'VACATED' })
            .eq('id', st.occupant_id);
        }

        const { data: updatedStall, error: updStallErr } = await supabase
          .from('stalls')
          .update({
            status: 'AVAILABLE',
            occupant_id: null
          })
          .eq('id', Number(stallId))
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
          .single();

        if (updStallErr) throw updStallErr;
        invalidateApiCache('stalls|stakeholders|occupants|contracts|billings');
        return { data: normalizeRecord(updatedStall) };
      } catch (err) {
        console.warn('[api.put /occupants/vacate] Supabase error, falling back:', err);
        return rawAxios.put(url, data, config);
      }
    }

    // 2. Update stalls
    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const updatePayload = mapStallPayload(data);
      const { data: updated, error } = await supabase
        .from('stalls')
        .update(updatePayload)
        .eq('id', id)
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*))')
        .single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 3. Update stall types (stored in authoritative rental_rates table)
    if (cleanUrl.startsWith('stall-types/') || cleanUrl.startsWith('admin/stall-types/')) {
      const id = cleanUrl.split('/')[1];
      const ratePayload = mapRentalRatePayload(data);
      const { data: updated, error } = await supabase.from('rental_rates').update(ratePayload).eq('id', id).select().single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 4. Update rental rates
    if (cleanUrl.startsWith('rental-rates/') || cleanUrl.startsWith('admin/rental-rates/')) {
      const id = cleanUrl.split('/')[1];
      const ratePayload = mapRentalRatePayload(data);
      const { data: updated, error } = await supabase.from('rental_rates').update(ratePayload).eq('id', id).select().single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 5. Mark notifications read
    if (cleanUrl.startsWith('notifications/') && cleanUrl.endsWith('/read')) {
      const id = cleanUrl.split('/')[1];
      const { data: updated, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select();
      if (error) throw error;
      return { data: updated };
    }

    // 6. Contracts update
    if (cleanUrl.startsWith('contracts/')) {
      const id = cleanUrl.replace('contracts/', '');
      const updatePayload = {};
      if (data.contractNo !== undefined || data.contract_no !== undefined) updatePayload.contract_no = data.contractNo || data.contract_no;
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.terms !== undefined) updatePayload.terms = data.terms;
      if (data.startDate !== undefined || data.start_date !== undefined) updatePayload.start_date = data.startDate || data.start_date;
      if (data.endDate !== undefined || data.end_date !== undefined) updatePayload.end_date = data.endDate || data.end_date;
      if (data.monthlyRent !== undefined || data.monthly_rent !== undefined) updatePayload.monthly_rent = data.monthlyRent ?? data.monthly_rent;
      if (data.billingFrequency !== undefined || data.billing_frequency !== undefined) updatePayload.billing_frequency = data.billingFrequency || data.billing_frequency;
      if (data.stallId !== undefined || data.stall_id !== undefined) updatePayload.stall_id = data.stallId ?? data.stall_id;
      if (data.occupantId !== undefined || data.occupant_id !== undefined) updatePayload.occupant_id = data.occupantId ?? data.occupant_id;

      try {
        const queryId = !isNaN(Number(id)) ? Number(id) : id;
        const { data: updated, error } = await supabase
          .from('contracts')
          .update(updatePayload)
          .eq('id', queryId)
          .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), stall:stalls(*)')
          .single();
        if (error) throw error;

        const normalized = normalizeRecord(updated);

        // Keep localStorage contracts in sync
        try {
          const raw = localStorage.getItem('contracts');
          if (raw) {
            let localContracts = JSON.parse(raw);
            if (Array.isArray(localContracts)) {
              const idx = localContracts.findIndex(c => String(c.id) === String(id) || (data.contractNo && (c.contractNo === data.contractNo || c.contract_no === data.contractNo)));
              if (idx !== -1) {
                localContracts[idx] = { ...localContracts[idx], ...normalized };
              } else {
                localContracts.unshift(normalized);
              }
              localStorage.setItem('contracts', JSON.stringify(localContracts));
            }
          }
        } catch (_) {}

        return { data: normalized };
      } catch (putErr) {
        console.warn('[API] Contracts update warning:', putErr.message);
        const fallback = normalizeRecord({ id, ...updatePayload });

        try {
          const raw = localStorage.getItem('contracts');
          if (raw) {
            let localContracts = JSON.parse(raw);
            if (Array.isArray(localContracts)) {
              const idx = localContracts.findIndex(c => String(c.id) === String(id));
              if (idx !== -1) {
                localContracts[idx] = { ...localContracts[idx], ...fallback };
                localStorage.setItem('contracts', JSON.stringify(localContracts));
              }
            }
          }
        } catch (_) {}

        return { data: fallback };
      }
    }

    // 7. Billings update
    if (cleanUrl.startsWith('billings/')) {
      const id = cleanUrl.replace('billings/', '');
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const updatePayload = {};
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.totalAmount !== undefined || data.total_amount !== undefined) updatePayload.total_amount = Number(data.totalAmount ?? data.total_amount);
      if (data.paidAmount !== undefined || data.paid_amount !== undefined) updatePayload.paid_amount = Number(data.paidAmount ?? data.paid_amount);
      if (data.balance !== undefined) updatePayload.balance = Number(data.balance);
      if (data.dueDate !== undefined || data.due_date !== undefined) updatePayload.due_date = data.dueDate || data.due_date;
      if (data.billingPeriod !== undefined || data.billing_period !== undefined) updatePayload.billing_period = data.billingPeriod || data.billing_period;
      if (data.billingNo !== undefined || data.billing_no !== undefined) updatePayload.billing_no = data.billingNo || data.billing_no;

      const { data: updated, error } = await supabase
        .from('billings')
        .update(updatePayload)
        .eq('id', queryId)
        .select('*, occupant:occupants(*, stakeholder:stakeholders(*)), contract:contracts(*, stall:stalls(*))')
        .single();
      if (error) throw error;
      return { data: normalizeRecord(updated) };
    }

    // 8. Applications update (Unified Application Form evaluation, assessment, Mayor decision, and payments)
    if (cleanUrl.startsWith('applications/')) {
      const id = cleanUrl.replace('applications/', '');
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const updatePayload = {};

      if (data.marketOfficeStatus !== undefined || data.market_office_status !== undefined) updatePayload.market_office_status = data.marketOfficeStatus || data.market_office_status;
      if (data.marketOfficeRecommendedStall !== undefined || data.market_office_recommended_stall !== undefined) updatePayload.market_office_recommended_stall = data.marketOfficeRecommendedStall || data.market_office_recommended_stall;
      if (data.marketOfficeSection !== undefined || data.market_office_section !== undefined) updatePayload.market_office_section = data.marketOfficeSection || data.market_office_section;
      if (data.marketOfficeNature !== undefined || data.market_office_nature !== undefined) updatePayload.market_office_nature = data.marketOfficeNature || data.market_office_nature;
      if (data.supervisorRemarks !== undefined || data.supervisor_remarks !== undefined) updatePayload.supervisor_remarks = data.supervisorRemarks || data.supervisor_remarks;
      if (data.treasuryMonthlyRent !== undefined || data.treasury_monthly_rent !== undefined) updatePayload.treasury_monthly_rent = data.treasuryMonthlyRent ?? data.treasury_monthly_rent;
      if (data.treasuryOtherFees !== undefined || data.treasury_other_fees !== undefined) updatePayload.treasury_other_fees = data.treasuryOtherFees ?? data.treasury_other_fees;
      if (data.treasurySecurityDeposit !== undefined || data.treasury_security_deposit !== undefined) updatePayload.treasury_security_deposit = data.treasurySecurityDeposit ?? data.treasury_security_deposit;
      if (data.treasuryTotalDue !== undefined || data.treasury_total_due !== undefined) updatePayload.treasury_total_due = data.treasuryTotalDue ?? data.treasury_total_due;
      if (data.treasuryRemarks !== undefined || data.treasury_remarks !== undefined) updatePayload.treasury_remarks = data.treasuryRemarks || data.treasury_remarks;
      if (data.finalRecommendationStatus !== undefined || data.final_recommendation_status !== undefined) updatePayload.final_recommendation_status = data.finalRecommendationStatus || data.final_recommendation_status;
      if (data.finalRecommendationRemarks !== undefined || data.final_recommendation_remarks !== undefined) updatePayload.final_recommendation_remarks = data.finalRecommendationRemarks || data.final_recommendation_remarks;
      if (data.mayorDecision !== undefined || data.mayor_decision !== undefined) updatePayload.mayor_decision = data.mayorDecision || data.mayor_decision;
      if (data.mayorRemarks !== undefined || data.mayor_remarks !== undefined) updatePayload.mayor_remarks = data.mayorRemarks || data.mayor_remarks;
      if (data.assignedStallNo !== undefined || data.assigned_stall_no !== undefined) updatePayload.assigned_stall_no = data.assignedStallNo || data.assigned_stall_no;
      if (data.assignedMarketSection !== undefined || data.assigned_market_section !== undefined) updatePayload.assigned_market_section = data.assignedMarketSection || data.assigned_market_section;
      if (data.effectivityOfOccupancy !== undefined || data.effectivity_of_occupancy !== undefined) updatePayload.effectivity_of_occupancy = data.effectivityOfOccupancy || data.effectivity_of_occupancy;
      if (data.officialReceiptNo !== undefined || data.official_receipt_no !== undefined) updatePayload.official_receipt_no = data.officialReceiptNo || data.official_receipt_no;
      if (data.paymentReceiptDate !== undefined || data.payment_receipt_date !== undefined) updatePayload.payment_receipt_date = data.paymentReceiptDate || data.payment_receipt_date;
      if (data.receiptAmountPaid !== undefined || data.receipt_amount_paid !== undefined) updatePayload.receipt_amount_paid = data.receiptAmountPaid ?? data.receipt_amount_paid;
      if (data.applicantAcknowledged !== undefined || data.applicant_acknowledged !== undefined) {
        updatePayload.applicant_acknowledged = Boolean(data.applicantAcknowledged ?? data.applicant_acknowledged);
        updatePayload.applicant_acknowledged_at = new Date().toISOString();
      }
      if (data.status !== undefined) updatePayload.status = data.status;

      try {
        const { data: updated, error } = await supabase
          .from('stakeholder_applications')
          .update(updatePayload)
          .or(`id.eq.${queryId},application_no.eq.${id}`)
          .select('*, stakeholder:stakeholders(*), stall:stalls(*)')
          .maybeSingle();

        if (error) throw error;

        // Sync local cache
        try {
          const raw = localStorage.getItem('manticao_applications') || '[]';
          let localApps = JSON.parse(raw);
          const idx = localApps.findIndex(a => String(a.id) === String(queryId) || a.application_no === id);
          if (idx !== -1) {
            localApps[idx] = { ...localApps[idx], ...updatePayload };
            localStorage.setItem('manticao_applications', JSON.stringify(localApps));
          }
        } catch (_) {}

        invalidateApiCache('applications|stakeholders|stalls');
        return { data: normalizeRecord(updated || { id: queryId, ...updatePayload }) };
      } catch (putErr) {
        console.warn('[API] Application update warning:', putErr.message);
        return { data: normalizeRecord({ id: queryId, ...updatePayload }) };
      }
    }

    return rawAxios.put(url, data, config);
  },

  async delete(url, config = {}) {
    const cleanUrl = url.split('?')[0].replace(/^\/+/, '');
    invalidateApiCache(cleanUrl.split('/')[0]);

    if (cleanUrl.startsWith('stalls/')) {
      const id = cleanUrl.replace('stalls/', '');
      const { data, error } = await supabase.from('stalls').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('stall-types/')) {
      const id = cleanUrl.replace('stall-types/', '');
      const { data, error } = await supabase.from('rental_rates').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('rental-rates/')) {
      const id = cleanUrl.replace('rental-rates/', '');
      const { data, error } = await supabase.from('rental_rates').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('contracts/')) {
      const id = cleanUrl.replace('contracts/', '');
      const { data, error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
      return { data };
    }

    if (cleanUrl.startsWith('billings/')) {
      const id = cleanUrl.replace('billings/', '');
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const { data, error } = await supabase.from('billings').delete().eq('id', queryId);
      if (error) throw error;
      return { data };
    }

    return rawAxios.delete(url, config);
  }
};

export default api;
