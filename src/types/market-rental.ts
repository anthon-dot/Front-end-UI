/**
 * Market Rental Management System - New Applicant Workflow Types
 * Step 1 through Step 8 of the Municipal Market Leasing Lifecycle
 */

export type UserRole = 
  | 'STAKEHOLDER'
  | 'MAYOR_OFFICE'
  | 'TREASURY'
  | 'MARKET_OFFICE'
  | 'ADMIN';

export type StallStatus = 
  | 'VACANT'
  | 'RESERVED_PENDING'
  | 'ASSIGNED'
  | 'OCCUPIED';

export type StallType = 
  | 'REGULAR_STALL'
  | 'CORNER_STALL'
  | 'TABLE_SPACE';

export type CivilStatus = 
  | 'Single'
  | 'Married'
  | 'Widowed'
  | 'Separated';

export type AppStepStatus = 
  | 'APPLICATION_SUBMITTED'      // Step 1 & 2
  | 'MAYOR_REVIEW'              // Step 3 pending
  | 'MAYOR_APPROVED'            // Step 3 approved
  | 'MAYOR_DISAPPROVED'         // Step 3 rejected
  | 'TREASURY_ASSESSED'         // Step 4 ready for payment
  | 'INITIAL_FEES_PAID'         // Step 4 payment confirmed
  | 'STALL_OFFICIALLY_ASSIGNED' // Step 5 locked by Market Supervisor
  | 'CONTRACT_GENERATED'        // Step 6 ready to download/wet-sign
  | 'LEASE_ACTIVE';             // Step 7 & 8 verified and operational

export interface Profile {
  id: string;
  full_name: string;
  civil_status: CivilStatus;
  citizenship: string;
  residential_address: string;
  contact_number: string;
  role: UserRole;
  created_at: string;
}

export interface StallCoordinates {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  section?: string;
  zone?: string;
  svgPath?: string;
}

export interface Stall {
  id: string;
  stall_number: string;
  section_name: string;
  stall_type: StallType;
  floor_area_sqm: number;
  monthly_rental_rate: number;
  stall_rights_fee: number; // 7,000 for Corner, 5,000 for Regular
  status: StallStatus;
  coordinates?: StallCoordinates | null;
  created_at: string;
}

export interface MunicipalOfficial {
  id: string;
  full_name: string;
  position_title: string;
  is_incumbent: boolean;
  updated_at: string;
}

export interface Application {
  id: string;
  application_number: string; // e.g. "APP-2026-0012"
  applicant_id: string;
  selected_stall_id: string;
  
  // Business Details
  trade_name: string;
  nature_of_business: string; // Retail, Dry Goods, Food, etc.
  commodities_to_sell: string;
  estimated_employees: number;
  
  // Identification Upload (One requirement only)
  valid_id_type: string;
  valid_id_number: string;
  valid_id_storage_path: string;
  
  // Target Mayor at time of submission
  mayor_official_id?: string | null;
  statutory_undertaking_accepted: boolean;
  
  // Progress Tracking Status
  current_status: AppStepStatus;
  
  // Step 3: Mayoral Decision Fields
  mayor_decision_ref_no?: string | null;
  mayor_decision_date?: string | null;
  mayor_remarks?: string | null;
  
  // Step 4: Treasury Assessment & Payment
  treasury_assessed_at?: string | null;
  treasury_or_number?: string | null;
  treasury_payment_date?: string | null;
  stall_rights_paid: number;
  advance_rent_paid: number; // Segregated 2-month deposit
  treasury_recorded_by?: string | null;
  
  // Step 5: Market Supervisor Assignment
  market_evaluated_at?: string | null;
  market_supervisor_id?: string | null;
  market_remarks?: string | null;
  
  // Step 6: Physical Signing Verification
  contract_number?: string | null;
  contract_prepared_at?: string | null;
  physical_contract_verified_at?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  
  created_at: string;
  updated_at: string;

  // Joined Relational Objects
  applicant?: Profile;
  selected_stall?: Stall;
  mayor_official?: MunicipalOfficial;
  treasury_recorder?: Profile;
  market_supervisor?: Profile;
}

export interface ApplicationFormData {
  // Applicant info
  full_name: string;
  civil_status: CivilStatus;
  citizenship: string;
  residential_address: string;
  contact_number: string;

  // Stall Selection
  selected_stall_id: string;
  selected_stall?: Stall | null;

  // Business info
  trade_name: string;
  nature_of_business: string;
  other_nature?: string;
  commodities_to_sell: string;
  estimated_employees: number;

  // Single ID Upload
  valid_id_type: string;
  valid_id_number: string;
  valid_id_file?: File | null;
  valid_id_storage_path?: string;

  // Mayor & Statutory
  mayor_official_id?: string;
  incumbent_mayor_name?: string;
  statutory_undertaking_accepted: boolean;
}

export interface TreasuryAssessmentCalculation {
  stall_type: StallType;
  stall_rights_fee: number;
  monthly_rate: number;
  advance_rent_deposit: number; // 2 months
  total_due_at_treasury: number;
}

export const STATUTORY_RULES_10: string[] = [
  "Use the assigned stall/space exclusively for the approved business activity and authorized commodities.",
  "Comply strictly with all existing municipal market rules, operational guidelines, and local tax ordinances.",
  "Maintain absolute cleanliness, sanitation, and proper segregated waste disposal within and around the leased stall at all times.",
  "Pay monthly rentals, utility fees, market assessments, and other lawful municipal charges on or before the due date.",
  "Zero Subleasing: Do NOT sublease, assign, transfer, mortgage, or allow another person to use the stall without prior written authorization.",
  "Maintain the stall, electrical fixtures, and structural elements in good, secure, and sanitary condition without unauthorized extensions.",
  "Comply with all health, safety, fire, food safety (BFAD/Sanitary), and building inspection requirements.",
  "Vacate and turn over the stall/space immediately upon lawful termination, expiration, or revocation of the lease contract.",
  "Submit updated licenses, health certificates, and business permits annually whenever required by the Municipal Government.",
  "Accept and abide by all administrative sanctions, closure orders, penalty surcharges, and lawful remedies for violations."
];

export const MUNICIPAL_CONFIG = {
  lgu_name: "Municipality of Manticao",
  province: "Province of Misamis Oriental",
  office_title: "Manticao Public Market Administration",
  default_term_years: 5,
  stall_rights_regular: 5000.00,
  stall_rights_corner: 7000.00,
  default_monthly_rate: 2300.00,
  advance_rent_months: 2
};
