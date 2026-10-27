-- ==============================================================================
-- MASTER SUPABASE CONSOLIDATED MIGRATION: 02_unified_system_upgrade_and_rls.sql
-- Municipality of Manticao • Misamis Oriental • Public Market RMS
--
-- PURPOSE:
-- Consolidates all post-base schema updates, workflow tables, extended columns,
-- auth trigger fixes, and universal permissive Row Level Security (RLS) policies
-- into a single, idempotent, non-destructive script.
--
-- HOW TO RUN:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/mchqolkwwthnkkctuple
-- 2. Click "SQL Editor" on the left menu
-- 3. Click "New Query", paste this entire script, and click "Run" (or Ctrl + Enter)
-- ==============================================================================

-- ==============================================================================
-- 1. USER ROLE ENUM & AUTH REGISTRATION TRIGGER FIX
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
        'APPLICANT',
        'VENDOR',
        'MARKET_SUPERVISOR',
        'MAYOR',
        'TREASURER',
        'COLLECTOR_INSPECTOR',
        'ADMIN'
    );
EXCEPTION WHEN duplicate_object THEN
    BEGIN
        ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'APPLICANT';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_username text;
  v_role text;
  v_fullname text;
BEGIN
  v_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_fullname := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', v_username);

  IF UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'ADMIN' OR LOWER(v_username) = 'admin' THEN
    v_role := 'ADMIN';
  ELSIF UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'MAYOR' OR LOWER(v_username) = 'mayor' THEN
    v_role := 'MAYOR';
  ELSIF UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'TREASURER' OR LOWER(v_username) = 'treasurer' THEN
    v_role := 'TREASURER';
  ELSIF UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) IN ('MARKET_SUPERVISOR', 'SUPERVISOR') OR LOWER(v_username) IN ('supervisor', 'market_supervisor') THEN
    v_role := 'MARKET_SUPERVISOR';
  ELSIF UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) IN ('COLLECTOR_INSPECTOR', 'COLLECTOR', 'INSPECTOR') OR LOWER(v_username) IN ('collector', 'inspector') THEN
    v_role := 'COLLECTOR_INSPECTOR';
  ELSE
    v_role := 'APPLICANT';
  END IF;

  BEGIN
    INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active)
    VALUES (
      new.id,
      v_username,
      v_fullname,
      new.email,
      v_role::user_role_enum,
      TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      username = COALESCE(public.user_profiles.username, EXCLUDED.username),
      full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO public.user_profiles (id, username, full_name, email, is_active)
      VALUES (new.id, v_username, v_fullname, new.email, TRUE)
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'user_profiles trigger insert notice: %', SQLERRM;
    END;
  END;

  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
      INSERT INTO public.profiles (id, username, name, email, role, status)
      VALUES (new.id, v_username, v_fullname, new.email, v_role, 'ACTIVE')
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'profiles trigger insert notice: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 2. STAKEHOLDERS TABLE: EXTENDED CIVIL, STALL & UNIFIED APPLICATION COLUMNS
-- ==============================================================================
ALTER TABLE public.stakeholders
    ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50) DEFAULT 'Single',
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Female',
    ADD COLUMN IF NOT EXISTS barangay VARCHAR(100) DEFAULT 'Poblacion',
    ADD COLUMN IF NOT EXISTS municipality_province VARCHAR(150) DEFAULT 'Manticao, Misamis Oriental',
    ADD COLUMN IF NOT EXISTS official_contact_mobile VARCHAR(50),
    ADD COLUMN IF NOT EXISTS emergency_contact_person VARCHAR(150),
    ADD COLUMN IF NOT EXISTS emergency_contact_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS selected_stall_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS selected_market_section VARCHAR(100),
    ADD COLUMN IF NOT EXISTS floor_area_dimensions VARCHAR(100),
    ADD COLUMN IF NOT EXISTS base_monthly_rental_rate NUMERIC(12, 2) DEFAULT 1500.00,
    ADD COLUMN IF NOT EXISTS valid_id_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS valid_id_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS nature_of_business JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS other_nature_of_business VARCHAR(150),
    ADD COLUMN IF NOT EXISTS products_commodities TEXT,
    ADD COLUMN IF NOT EXISTS stall_space_type VARCHAR(50) DEFAULT 'Regular Stall',
    ADD COLUMN IF NOT EXISTS preferred_stall_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS estimated_employees INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS undertaking_agreed BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS undertaking_agreed_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS loi_content TEXT,
    ADD COLUMN IF NOT EXISTS applicant_acknowledged BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS applicant_acknowledged_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS application_type VARCHAR(50) DEFAULT 'NEW',
    ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50) DEFAULT 'Annually',
    ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_id_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS org_type VARCHAR(100) DEFAULT 'Sole Proprietor',
    ADD COLUMN IF NOT EXISTS org_gender VARCHAR(20) DEFAULT 'Female',
    ADD COLUMN IF NOT EXISTS dti_sec_cda_reg_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tin_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS trade_name_franchise VARCHAR(150),
    ADD COLUMN IF NOT EXISTS main_house_bldg_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS main_bldg_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS main_lot_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS main_block_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS main_street VARCHAR(100) DEFAULT 'P-4',
    ADD COLUMN IF NOT EXISTS main_subdivision VARCHAR(100),
    ADD COLUMN IF NOT EXISTS main_barangay VARCHAR(100) DEFAULT 'POBLACION',
    ADD COLUMN IF NOT EXISTS main_district VARCHAR(100),
    ADD COLUMN IF NOT EXISTS main_municipality VARCHAR(100) DEFAULT 'MANTICAO',
    ADD COLUMN IF NOT EXISTS main_province VARCHAR(100) DEFAULT 'MISAMIS ORIENTAL',
    ADD COLUMN IF NOT EXISTS main_zip_code VARCHAR(20) DEFAULT '9024',
    ADD COLUMN IF NOT EXISTS telephone_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mobile_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS owner_surname VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_given_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_suffix VARCHAR(50),
    ADD COLUMN IF NOT EXISTS corp_president_surname VARCHAR(100),
    ADD COLUMN IF NOT EXISTS corp_president_given_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS corp_president_middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS corp_president_suffix VARCHAR(50),
    ADD COLUMN IF NOT EXISTS corp_citizenship VARCHAR(50) DEFAULT 'Filipino',
    ADD COLUMN IF NOT EXISTS business_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    ADD COLUMN IF NOT EXISTS total_floor_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    ADD COLUMN IF NOT EXISTS num_employees_male INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS num_employees_female INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS num_employees_lgu_residing INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS delivery_vehicles_van_truck INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_vehicles_motorcycle INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loc_same_as_main BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS loc_house_bldg_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS loc_bldg_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS loc_lot_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS loc_block_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS loc_street VARCHAR(100) DEFAULT 'P-4',
    ADD COLUMN IF NOT EXISTS loc_subdivision VARCHAR(100),
    ADD COLUMN IF NOT EXISTS loc_barangay VARCHAR(100) DEFAULT 'POBLACION',
    ADD COLUMN IF NOT EXISTS loc_district VARCHAR(100),
    ADD COLUMN IF NOT EXISTS loc_municipality VARCHAR(100) DEFAULT 'MANTICAO',
    ADD COLUMN IF NOT EXISTS loc_province VARCHAR(100) DEFAULT 'MISAMIS ORIENTAL',
    ADD COLUMN IF NOT EXISTS loc_zip_code VARCHAR(20) DEFAULT '9024',
    ADD COLUMN IF NOT EXISTS property_owned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tax_dec_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS property_id_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tax_incentives_enjoyed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_activity VARCHAR(100) DEFAULT 'Others',
    ADD COLUMN IF NOT EXISTS business_activity_other VARCHAR(150) DEFAULT 'Public Market Stall Retail',
    ADD COLUMN IF NOT EXISTS business_lines JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS bplo_approved_by VARCHAR(150) DEFAULT 'JUNE CLYDE D. PATILANO',
    ADD COLUMN IF NOT EXISTS bplo_designation VARCHAR(150) DEFAULT 'LRCO II/BPLO Designate',
    ADD COLUMN IF NOT EXISTS market_office_verified_by VARCHAR(150) DEFAULT 'EDGAR EYANA',
    ADD COLUMN IF NOT EXISTS market_office_verified_remarks VARCHAR(255) DEFAULT 'FISH VENDOR OK',
    ADD COLUMN IF NOT EXISTS treasurer_verified_by VARCHAR(150) DEFAULT 'J. ANDANA',
    ADD COLUMN IF NOT EXISTS total_fees_assessment NUMERIC(10, 2) DEFAULT 2890.60,
    ADD COLUMN IF NOT EXISTS business_permit_or_no VARCHAR(100) DEFAULT '3675241',
    ADD COLUMN IF NOT EXISTS perjury_declaration_agreed BOOLEAN DEFAULT TRUE;

-- ==============================================================================
-- 3. STAKEHOLDER APPLICATIONS TABLE: EXTENDED PROCESS & EVALUATION COLUMNS
-- ==============================================================================
ALTER TABLE public.stakeholder_applications
    ADD COLUMN IF NOT EXISTS application_reference_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS incumbent_municipal_mayor VARCHAR(150),
    ADD COLUMN IF NOT EXISTS designation_title VARCHAR(100) DEFAULT 'Municipal Mayor',
    ADD COLUMN IF NOT EXISTS lgu_administrative_entity VARCHAR(150) DEFAULT 'Municipality of Manticao',
    ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
    ADD COLUMN IF NOT EXISTS barangay VARCHAR(100),
    ADD COLUMN IF NOT EXISTS municipality_province VARCHAR(150),
    ADD COLUMN IF NOT EXISTS official_contact_mobile VARCHAR(50),
    ADD COLUMN IF NOT EXISTS emergency_contact_person VARCHAR(150),
    ADD COLUMN IF NOT EXISTS emergency_contact_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS target_stall_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS target_market_section VARCHAR(100),
    ADD COLUMN IF NOT EXISTS target_floor_area VARCHAR(100),
    ADD COLUMN IF NOT EXISTS target_monthly_rent NUMERIC(12, 2) DEFAULT 1500.00,
    ADD COLUMN IF NOT EXISTS ten_point_undertaking_consent BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS loi_document_upload_required BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS valid_id_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS valid_id_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS nature_of_business JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS other_nature_of_business VARCHAR(150),
    ADD COLUMN IF NOT EXISTS products_commodities TEXT,
    ADD COLUMN IF NOT EXISTS stall_space_type VARCHAR(50) DEFAULT 'Regular Stall',
    ADD COLUMN IF NOT EXISTS preferred_stall_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS estimated_employees INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS undertaking_agreed BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS undertaking_agreed_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS loi_content TEXT,
    ADD COLUMN IF NOT EXISTS market_office_status VARCHAR(50) DEFAULT 'Complete',
    ADD COLUMN IF NOT EXISTS market_office_recommended_stall VARCHAR(50),
    ADD COLUMN IF NOT EXISTS market_office_section VARCHAR(100),
    ADD COLUMN IF NOT EXISTS market_office_nature VARCHAR(100),
    ADD COLUMN IF NOT EXISTS market_office_remarks TEXT,
    ADD COLUMN IF NOT EXISTS market_supervisor_name VARCHAR(150) DEFAULT 'MR. EDGAR EYANA',
    ADD COLUMN IF NOT EXISTS market_supervisor_evaluated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS treasury_monthly_rent NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS treasury_other_fees NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS treasury_security_deposit NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS treasury_total_due NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS treasury_remarks TEXT,
    ADD COLUMN IF NOT EXISTS treasurer_name VARCHAR(150) DEFAULT 'NAIDA BEBETH A. MAGDAYO',
    ADD COLUMN IF NOT EXISTS treasurer_assessed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS final_recommendation_status VARCHAR(50) DEFAULT 'RECOMMENDED_FOR_APPROVAL',
    ADD COLUMN IF NOT EXISTS final_recommendation_remarks TEXT,
    ADD COLUMN IF NOT EXISTS final_recommendation_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS mayor_name VARCHAR(150) DEFAULT 'HON. STEPHEN S. TAN',
    ADD COLUMN IF NOT EXISTS mayor_conditions_remarks TEXT,
    ADD COLUMN IF NOT EXISTS assigned_stall_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS assigned_market_section VARCHAR(100),
    ADD COLUMN IF NOT EXISTS effectivity_of_occupancy DATE,
    ADD COLUMN IF NOT EXISTS assigned_monthly_rental NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS official_receipt_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS payment_receipt_date DATE,
    ADD COLUMN IF NOT EXISTS receipt_amount_paid NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS treasurer_verified_by VARCHAR(150) DEFAULT 'NAIDA BEBETH A. MAGDAYO',
    ADD COLUMN IF NOT EXISTS treasurer_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS applicant_acknowledged BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS applicant_acknowledged_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS application_type VARCHAR(50) DEFAULT 'NEW',
    ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50) DEFAULT 'Annually',
    ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_id_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS org_type VARCHAR(100) DEFAULT 'Sole Proprietor',
    ADD COLUMN IF NOT EXISTS org_gender VARCHAR(20) DEFAULT 'Female',
    ADD COLUMN IF NOT EXISTS dti_sec_cda_reg_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tin_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS trade_name_franchise VARCHAR(150),
    ADD COLUMN IF NOT EXISTS main_house_bldg_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS main_bldg_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS main_lot_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS main_block_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS main_street VARCHAR(100) DEFAULT 'P-4',
    ADD COLUMN IF NOT EXISTS main_subdivision VARCHAR(100),
    ADD COLUMN IF NOT EXISTS main_barangay VARCHAR(100) DEFAULT 'POBLACION',
    ADD COLUMN IF NOT EXISTS main_district VARCHAR(100),
    ADD COLUMN IF NOT EXISTS main_municipality VARCHAR(100) DEFAULT 'MANTICAO',
    ADD COLUMN IF NOT EXISTS main_province VARCHAR(100) DEFAULT 'MISAMIS ORIENTAL',
    ADD COLUMN IF NOT EXISTS main_zip_code VARCHAR(20) DEFAULT '9024',
    ADD COLUMN IF NOT EXISTS telephone_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mobile_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS owner_surname VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_given_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_suffix VARCHAR(50),
    ADD COLUMN IF NOT EXISTS corp_president_surname VARCHAR(100),
    ADD COLUMN IF NOT EXISTS corp_president_given_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS corp_president_middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS corp_president_suffix VARCHAR(50),
    ADD COLUMN IF NOT EXISTS corp_citizenship VARCHAR(50) DEFAULT 'Filipino',
    ADD COLUMN IF NOT EXISTS business_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    ADD COLUMN IF NOT EXISTS total_floor_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    ADD COLUMN IF NOT EXISTS num_employees_male INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS num_employees_female INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS num_employees_lgu_residing INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS delivery_vehicles_van_truck INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_vehicles_motorcycle INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loc_same_as_main BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS loc_house_bldg_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS loc_bldg_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS loc_lot_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS loc_block_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS loc_street VARCHAR(100) DEFAULT 'P-4',
    ADD COLUMN IF NOT EXISTS loc_subdivision VARCHAR(100),
    ADD COLUMN IF NOT EXISTS loc_barangay VARCHAR(100) DEFAULT 'POBLACION',
    ADD COLUMN IF NOT EXISTS loc_district VARCHAR(100),
    ADD COLUMN IF NOT EXISTS loc_municipality VARCHAR(100) DEFAULT 'MANTICAO',
    ADD COLUMN IF NOT EXISTS loc_province VARCHAR(100) DEFAULT 'MISAMIS ORIENTAL',
    ADD COLUMN IF NOT EXISTS loc_zip_code VARCHAR(20) DEFAULT '9024',
    ADD COLUMN IF NOT EXISTS property_owned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tax_dec_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS property_id_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tax_incentives_enjoyed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_activity VARCHAR(100) DEFAULT 'Others',
    ADD COLUMN IF NOT EXISTS business_activity_other VARCHAR(150) DEFAULT 'Public Market Stall Retail',
    ADD COLUMN IF NOT EXISTS business_lines JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS bplo_approved_by VARCHAR(150) DEFAULT 'JUNE CLYDE D. PATILANO',
    ADD COLUMN IF NOT EXISTS bplo_designation VARCHAR(150) DEFAULT 'LRCO II/BPLO Designate',
    ADD COLUMN IF NOT EXISTS market_office_verified_by VARCHAR(150) DEFAULT 'EDGAR EYANA',
    ADD COLUMN IF NOT EXISTS market_office_verified_remarks VARCHAR(255) DEFAULT 'FISH VENDOR OK',
    ADD COLUMN IF NOT EXISTS treasurer_verified_by VARCHAR(150) DEFAULT 'J. ANDANA',
    ADD COLUMN IF NOT EXISTS total_fees_assessment NUMERIC(10, 2) DEFAULT 2890.60,
    ADD COLUMN IF NOT EXISTS business_permit_or_no VARCHAR(100) DEFAULT '3675241',
    ADD COLUMN IF NOT EXISTS perjury_declaration_agreed BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS mayor_approved_by VARCHAR(150),
    ADD COLUMN IF NOT EXISTS mayor_signed_document_url TEXT,
    ADD COLUMN IF NOT EXISTS initial_rights_fee_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS initial_advance_rent_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_permit_status VARCHAR(50) DEFAULT 'NOT_RECORDED';

-- ==============================================================================
-- 4. CONTRACTS TABLE ENHANCEMENTS
-- ==============================================================================
ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS initial_payments_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS signed_by_stakeholder BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS signed_by_lgu BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lease_term_years INT DEFAULT 3,
    ADD COLUMN IF NOT EXISTS signed_document_url TEXT;

-- ==============================================================================
-- 5. SUPPLEMENTARY WORKFLOW TABLES
-- ==============================================================================

-- 5.1 Business Permits
CREATE TABLE IF NOT EXISTS public.business_permits (
    id BIGSERIAL PRIMARY KEY,
    permit_number VARCHAR(100) UNIQUE NOT NULL,
    tracking_number VARCHAR(100),
    stakeholder_id BIGINT REFERENCES public.stakeholders(id) ON DELETE SET NULL,
    application_id BIGINT REFERENCES public.stakeholder_applications(id) ON DELETE SET NULL,
    stall_id BIGINT REFERENCES public.stalls(id) ON DELETE SET NULL,
    business_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    org_type VARCHAR(100) DEFAULT 'Sole Proprietor',
    owner_name VARCHAR(200),
    owner_gender VARCHAR(20) DEFAULT 'Female',
    dti_sec_cda_reg_no VARCHAR(100),
    tin_no VARCHAR(100),
    main_office_address TEXT,
    business_location_address TEXT,
    contact_number VARCHAR(50),
    email_address VARCHAR(100),
    business_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    business_activity VARCHAR(150) DEFAULT 'Public Market Stall Retail',
    line_of_business VARCHAR(150) DEFAULT 'Fish & Wet Section Trade',
    capitalization NUMERIC(14, 2) DEFAULT 50000.00,
    gross_sales_prior_year NUMERIC(14, 2) DEFAULT 0.00,
    assessment_grand_total NUMERIC(12, 2) DEFAULT 2890.60,
    official_receipt_no VARCHAR(100) DEFAULT '3675241',
    bplo_officer_name VARCHAR(150) DEFAULT 'JUNE CLYDE D. PATILANO',
    bplo_officer_designation VARCHAR(150) DEFAULT 'LRCO II/BPLO Designate',
    status VARCHAR(50) DEFAULT 'PENDING',
    issued_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 Advance Credits
CREATE TABLE IF NOT EXISTS public.advance_credits (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    contract_id BIGINT REFERENCES public.contracts(id) ON DELETE SET NULL,
    payment_id BIGINT REFERENCES public.payments(id) ON DELETE SET NULL,
    original_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    available_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_advance_credits_stakeholder ON public.advance_credits(stakeholder_id);

-- 5.3 Credit Allocations
CREATE TABLE IF NOT EXISTS public.credit_allocations (
    id BIGSERIAL PRIMARY KEY,
    advance_credit_id BIGINT NOT NULL REFERENCES public.advance_credits(id) ON DELETE CASCADE,
    billing_id BIGINT NOT NULL REFERENCES public.billings(id) ON DELETE CASCADE,
    allocated_amount NUMERIC(12, 2) NOT NULL,
    authorized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    authorized_name VARCHAR(150),
    notes TEXT,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_allocations_credit ON public.credit_allocations(advance_credit_id);

-- 5.4 Overdue Notices
CREATE TABLE IF NOT EXISTS public.notices (
    id BIGSERIAL PRIMARY KEY,
    notice_no VARCHAR(100) NOT NULL UNIQUE,
    contract_id BIGINT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    billing_ids JSONB,
    notice_type VARCHAR(50) NOT NULL,
    days_overdue INT NOT NULL DEFAULT 60,
    balance_snapshot NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    issuer_name VARCHAR(150),
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notices_contract ON public.notices(contract_id);
CREATE INDEX IF NOT EXISTS idx_notices_stakeholder ON public.notices(stakeholder_id);

-- ==============================================================================
-- 6. UNIVERSAL ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures flawless frontend API interaction across demo sessions and authenticated users
-- ==============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stall_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_remittances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_remittance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "allow_all_user_profiles" ON public.user_profiles;
    DROP POLICY IF EXISTS "allow_all_stakeholders" ON public.stakeholders;
    DROP POLICY IF EXISTS "allow_all_stakeholder_applications" ON public.stakeholder_applications;
    DROP POLICY IF EXISTS "allow_all_stakeholder_documents" ON public.stakeholder_documents;
    DROP POLICY IF EXISTS "allow_all_approval_history" ON public.approval_history;
    DROP POLICY IF EXISTS "allow_all_business_permits" ON public.business_permits;
    DROP POLICY IF EXISTS "allow_all_occupants" ON public.occupants;
    DROP POLICY IF EXISTS "allow_all_stalls" ON public.stalls;
    DROP POLICY IF EXISTS "allow_all_rental_rates" ON public.rental_rates;
    DROP POLICY IF EXISTS "allow_all_contracts" ON public.contracts;
    DROP POLICY IF EXISTS "allow_all_occupancy_permits" ON public.occupancy_permits;
    DROP POLICY IF EXISTS "allow_all_permit_scan_logs" ON public.permit_scan_logs;
    DROP POLICY IF EXISTS "allow_all_stall_inspections" ON public.stall_inspections;
    DROP POLICY IF EXISTS "allow_all_billings" ON public.billings;
    DROP POLICY IF EXISTS "allow_all_payments" ON public.payments;
    DROP POLICY IF EXISTS "allow_all_payment_receipts" ON public.payment_receipts;
    DROP POLICY IF EXISTS "allow_all_collection_remittances" ON public.collection_remittances;
    DROP POLICY IF EXISTS "allow_all_collection_remittance_items" ON public.collection_remittance_items;
    DROP POLICY IF EXISTS "allow_all_notifications" ON public.notifications;
    DROP POLICY IF EXISTS "allow_all_audit_logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "allow_all_advance_credits" ON public.advance_credits;
    DROP POLICY IF EXISTS "allow_all_credit_allocations" ON public.credit_allocations;
    DROP POLICY IF EXISTS "allow_all_notices" ON public.notices;

    -- Drop legacy restricting policies that cause 401/403 errors
    DROP POLICY IF EXISTS "Stakeholder view own record" ON public.stakeholders;
    DROP POLICY IF EXISTS "Stakeholder insert own record" ON public.stakeholders;
    DROP POLICY IF EXISTS "Stakeholder update own record" ON public.stakeholders;
    DROP POLICY IF EXISTS "Staff manage stakeholders" ON public.stakeholders;
    DROP POLICY IF EXISTS "bplo_view_stakeholders" ON public.stakeholders;
    DROP POLICY IF EXISTS "bplo_manage_applications" ON public.stakeholder_applications;
    DROP POLICY IF EXISTS "endorsing_manage_applications" ON public.stakeholder_applications;
    DROP POLICY IF EXISTS "bplo_view_inspections" ON public.stall_inspections;
    DROP POLICY IF EXISTS "Public read user_profiles for auth" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Staff manage user_profiles" ON public.user_profiles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "allow_all_user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_stakeholders" ON public.stakeholders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_stakeholder_applications" ON public.stakeholder_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_stakeholder_documents" ON public.stakeholder_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_approval_history" ON public.approval_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_business_permits" ON public.business_permits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_occupants" ON public.occupants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_stalls" ON public.stalls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rental_rates" ON public.rental_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_occupancy_permits" ON public.occupancy_permits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_permit_scan_logs" ON public.permit_scan_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_stall_inspections" ON public.stall_inspections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_billings" ON public.billings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_payment_receipts" ON public.payment_receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_collection_remittances" ON public.collection_remittances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_collection_remittance_items" ON public.collection_remittance_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_advance_credits" ON public.advance_credits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_credit_allocations" ON public.credit_allocations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notices" ON public.notices FOR ALL USING (true) WITH CHECK (true);

-- Legacy profiles table if present
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
        CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.profiles TO anon, authenticated, service_role;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- 7. ROBUST ROLE GRANTS & SEQUENCES
-- ==============================================================================
GRANT ALL ON public.user_profiles TO anon, authenticated, service_role;
GRANT ALL ON public.stakeholders TO anon, authenticated, service_role;
GRANT ALL ON public.stakeholder_applications TO anon, authenticated, service_role;
GRANT ALL ON public.stakeholder_documents TO anon, authenticated, service_role;
GRANT ALL ON public.approval_history TO anon, authenticated, service_role;
GRANT ALL ON public.business_permits TO anon, authenticated, service_role;
GRANT ALL ON public.occupants TO anon, authenticated, service_role;
GRANT ALL ON public.stalls TO anon, authenticated, service_role;
GRANT ALL ON public.rental_rates TO anon, authenticated, service_role;
GRANT ALL ON public.contracts TO anon, authenticated, service_role;
GRANT ALL ON public.occupancy_permits TO anon, authenticated, service_role;
GRANT ALL ON public.permit_scan_logs TO anon, authenticated, service_role;
GRANT ALL ON public.stall_inspections TO anon, authenticated, service_role;
GRANT ALL ON public.billings TO anon, authenticated, service_role;
GRANT ALL ON public.payments TO anon, authenticated, service_role;
GRANT ALL ON public.payment_receipts TO anon, authenticated, service_role;
GRANT ALL ON public.collection_remittances TO anon, authenticated, service_role;
GRANT ALL ON public.collection_remittance_items TO anon, authenticated, service_role;
GRANT ALL ON public.notifications TO anon, authenticated, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, service_role;
GRANT ALL ON public.advance_credits TO anon, authenticated, service_role;
GRANT ALL ON public.credit_allocations TO anon, authenticated, service_role;
GRANT ALL ON public.notices TO anon, authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

SELECT '02_unified_system_upgrade_and_rls successfully applied to Manticao RMS!' AS status;
