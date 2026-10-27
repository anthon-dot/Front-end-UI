-- ==============================================================================
-- MASTER SUPABASE CONSOLIDATED MIGRATION:
-- Complete Unified Stall Rental & Business Permit Application System
-- Republic of the Philippines • Municipality of Manticao • Misamis Oriental
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/mchqolkwwthnkkctuple
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query", paste this entire script, and click "Run" (or Ctrl + Enter)
-- ==============================================================================

-- 1. STAKEHOLDERS TABLE: ALL CIVIL, STALL SELECTION & UNIFIED APPLICATION COLUMNS
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

-- 2. STAKEHOLDER APPLICATIONS TABLE: ALL PROCESS & EVALUATION COLUMNS
ALTER TABLE public.stakeholder_applications
    ADD COLUMN IF NOT EXISTS application_reference_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS incumbent_municipal_mayor VARCHAR(150) DEFAULT 'HON. STEPHEN S. TAN',
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
    ADD COLUMN IF NOT EXISTS perjury_declaration_agreed BOOLEAN DEFAULT TRUE;

-- 3. BUSINESS PERMITS TABLE (IF NOT EXISTS)
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

-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "allow_all_stakeholders" ON public.stakeholders;
    DROP POLICY IF EXISTS "allow_all_stakeholder_applications" ON public.stakeholder_applications;
    DROP POLICY IF EXISTS "allow_all_stakeholder_documents" ON public.stakeholder_documents;
    DROP POLICY IF EXISTS "allow_all_approval_history" ON public.approval_history;
    DROP POLICY IF EXISTS "allow_all_business_permits" ON public.business_permits;
    DROP POLICY IF EXISTS "allow_all_occupants" ON public.occupants;
    DROP POLICY IF EXISTS "allow_all_stalls" ON public.stalls;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "allow_all_stakeholders" ON public.stakeholders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_stakeholder_applications" ON public.stakeholder_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_stakeholder_documents" ON public.stakeholder_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_approval_history" ON public.approval_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_business_permits" ON public.business_permits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_occupants" ON public.occupants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_stalls" ON public.stalls FOR ALL USING (true) WITH CHECK (true);

-- 5. GRANT PERMISSIONS TO ANON, AUTHENTICATED AND SERVICE ROLE
GRANT ALL ON public.stakeholders TO anon, authenticated, service_role;
GRANT ALL ON public.stakeholder_applications TO anon, authenticated, service_role;
GRANT ALL ON public.stakeholder_documents TO anon, authenticated, service_role;
GRANT ALL ON public.approval_history TO anon, authenticated, service_role;
GRANT ALL ON public.business_permits TO anon, authenticated, service_role;
GRANT ALL ON public.occupants TO anon, authenticated, service_role;
GRANT ALL ON public.stalls TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

SELECT 'Unified Application & RLS policies successfully applied to Manticao RMS!' AS status;
