-- ==============================================================================
-- SUPABASE MIGRATION: UNIFIED APPLICATION FORM FOR BUSINESS PERMIT
-- Republic of the Philippines • Province of Misamis Oriental • Municipality of Manticao
-- Adds all official fields from the Unified Application Form for Business Permit (Pages 1 & 2)
-- ==============================================================================

-- 1. ADD BUSINESS PERMIT FIELDS TO STAKEHOLDERS TABLE
ALTER TABLE public.stakeholders
    ADD COLUMN IF NOT EXISTS application_type VARCHAR(50) DEFAULT 'NEW', -- 'NEW', 'RENEWAL', 'ADDITIONAL'
    ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50) DEFAULT 'Annually', -- 'Annually', 'Bi-Annually', 'Quarterly'
    ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_id_number VARCHAR(100),
    
    -- Section A: Business Information and Registration
    ADD COLUMN IF NOT EXISTS org_type VARCHAR(100) DEFAULT 'Sole Proprietor', -- 'Sole Proprietor', 'One Person Corporation', 'Partnership', 'Corporation', 'Cooperative'
    ADD COLUMN IF NOT EXISTS org_gender VARCHAR(20) DEFAULT 'Female', -- 'Male', 'Female'
    ADD COLUMN IF NOT EXISTS dti_sec_cda_reg_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tin_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS trade_name_franchise VARCHAR(150),
    
    -- Main Office Address components
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
    
    -- Contact details
    ADD COLUMN IF NOT EXISTS telephone_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mobile_no VARCHAR(50),
    
    -- Sole Proprietorship Owner Details
    ADD COLUMN IF NOT EXISTS owner_surname VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_given_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_suffix VARCHAR(50),
    
    -- Corporate President / Officer Details
    ADD COLUMN IF NOT EXISTS corp_president_surname VARCHAR(100),
    ADD COLUMN IF NOT EXISTS corp_president_given_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS corp_president_middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS corp_president_suffix VARCHAR(50),
    ADD COLUMN IF NOT EXISTS corp_citizenship VARCHAR(50) DEFAULT 'Filipino', -- 'Filipino', 'Foreign'
    
    -- Section B: Business Operation
    ADD COLUMN IF NOT EXISTS business_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    ADD COLUMN IF NOT EXISTS total_floor_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    ADD COLUMN IF NOT EXISTS num_employees_male INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS num_employees_female INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS num_employees_lgu_residing INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS delivery_vehicles_van_truck INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_vehicles_motorcycle INTEGER DEFAULT 0,
    
    -- Business Location Address components
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
    
    -- Property Ownership & Incentives
    ADD COLUMN IF NOT EXISTS property_owned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tax_dec_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS property_id_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tax_incentives_enjoyed BOOLEAN DEFAULT FALSE,
    
    -- Business Activity
    ADD COLUMN IF NOT EXISTS business_activity VARCHAR(100) DEFAULT 'Others', -- 'Main Office', 'Branch Office', 'Admin Office Only', 'Warehouse', 'Others'
    ADD COLUMN IF NOT EXISTS business_activity_other VARCHAR(150) DEFAULT 'Public Market Stall Retail',
    
    -- Line of Business JSON Array: [{ lineOfBusiness, psicCode, productsServices, numUnits, capitalization, grossSales }]
    ADD COLUMN IF NOT EXISTS business_lines JSONB DEFAULT '[]'::jsonb,
    
    -- Stall Space Type (Page 1 of PDF)
    ADD COLUMN IF NOT EXISTS stall_space_type VARCHAR(50) DEFAULT 'Regular Stall', -- 'Regular Stall', 'Table Space'
    
    -- Granular Assessment of Fees and Local Taxes (Page 9 of PDF)
    ADD COLUMN IF NOT EXISTS fee_gross_sales_tax NUMERIC(10, 2) DEFAULT 1080.00,
    ADD COLUMN IF NOT EXISTS fee_penalty_surcharge NUMERIC(10, 2) DEFAULT 210.60,
    ADD COLUMN IF NOT EXISTS fee_mayors_permit NUMERIC(10, 2) DEFAULT 500.00,
    ADD COLUMN IF NOT EXISTS fee_mayors_clearance NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_police_clearance NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_tax_clearance NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_registration NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_sanitary_permit NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_health_certificate NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_garbage_charges NUMERIC(10, 2) DEFAULT 600.00,
    ADD COLUMN IF NOT EXISTS fee_barangay_clearance NUMERIC(10, 2) DEFAULT 100.00,
    
    -- Verification of Documentary Requirements (9 Endorsing Offices - Pages 10-11 of PDF)
    ADD COLUMN IF NOT EXISTS endorsing_offices JSONB DEFAULT '[]'::jsonb,
    
    -- Sworn Statement of Monthly Average Gross Sales (Pages 11-12 of PDF)
    ADD COLUMN IF NOT EXISTS monthly_gross_sales JSONB DEFAULT '[]'::jsonb,
    
    -- Assessment & Clearance Sign-offs
    ADD COLUMN IF NOT EXISTS bplo_approved_by VARCHAR(150) DEFAULT 'JUNE CLYDE D. PATILANO',
    ADD COLUMN IF NOT EXISTS bplo_designation VARCHAR(150) DEFAULT 'LRCO II/BPLO Designate',
    ADD COLUMN IF NOT EXISTS bplo_date_signed DATE,
    ADD COLUMN IF NOT EXISTS market_office_verified_by VARCHAR(150) DEFAULT 'EDGAR EYANA',
    ADD COLUMN IF NOT EXISTS market_office_verified_date DATE,
    ADD COLUMN IF NOT EXISTS market_office_verified_remarks VARCHAR(255) DEFAULT 'FISH VENDOR OK',
    ADD COLUMN IF NOT EXISTS treasurer_verified_by VARCHAR(150) DEFAULT 'J. ANDANA',
    ADD COLUMN IF NOT EXISTS treasurer_verified_date DATE,
    ADD COLUMN IF NOT EXISTS total_fees_assessment NUMERIC(12, 2) DEFAULT 2890.60,
    ADD COLUMN IF NOT EXISTS business_permit_or_no VARCHAR(100) DEFAULT '3675241',
    ADD COLUMN IF NOT EXISTS perjury_declaration_agreed BOOLEAN DEFAULT TRUE;

-- 2. ADD SAME FIELDS TO STAKEHOLDER_APPLICATIONS TABLE
ALTER TABLE public.stakeholder_applications
    ADD COLUMN IF NOT EXISTS application_type VARCHAR(50) DEFAULT 'NEW',
    ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50) DEFAULT 'Annually',
    ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_id_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS org_type VARCHAR(100) DEFAULT 'Sole Proprietor',
    ADD COLUMN IF NOT EXISTS org_gender VARCHAR(20) DEFAULT 'Female',
    ADD COLUMN IF NOT EXISTS dti_sec_cda_reg_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tin_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS trade_name_franchise VARCHAR(150),
    ADD COLUMN IF NOT EXISTS main_street VARCHAR(100) DEFAULT 'P-4',
    ADD COLUMN IF NOT EXISTS main_barangay VARCHAR(100) DEFAULT 'POBLACION',
    ADD COLUMN IF NOT EXISTS main_municipality VARCHAR(100) DEFAULT 'MANTICAO',
    ADD COLUMN IF NOT EXISTS main_province VARCHAR(100) DEFAULT 'MISAMIS ORIENTAL',
    ADD COLUMN IF NOT EXISTS main_zip_code VARCHAR(20) DEFAULT '9024',
    ADD COLUMN IF NOT EXISTS mobile_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS owner_surname VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_given_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_suffix VARCHAR(50),
    ADD COLUMN IF NOT EXISTS business_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    ADD COLUMN IF NOT EXISTS total_floor_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    ADD COLUMN IF NOT EXISTS num_employees_male INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS num_employees_female INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS num_employees_lgu_residing INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS loc_same_as_main BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS loc_street VARCHAR(100) DEFAULT 'P-4',
    ADD COLUMN IF NOT EXISTS loc_barangay VARCHAR(100) DEFAULT 'POBLACION',
    ADD COLUMN IF NOT EXISTS loc_municipality VARCHAR(100) DEFAULT 'MANTICAO',
    ADD COLUMN IF NOT EXISTS loc_province VARCHAR(100) DEFAULT 'MISAMIS ORIENTAL',
    ADD COLUMN IF NOT EXISTS loc_zip_code VARCHAR(20) DEFAULT '9024',
    ADD COLUMN IF NOT EXISTS property_owned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tax_incentives_enjoyed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_activity VARCHAR(100) DEFAULT 'Others',
    ADD COLUMN IF NOT EXISTS business_activity_other VARCHAR(150) DEFAULT 'Public Market Stall Retail',
    ADD COLUMN IF NOT EXISTS business_lines JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS stall_space_type VARCHAR(50) DEFAULT 'Regular Stall',
    ADD COLUMN IF NOT EXISTS fee_gross_sales_tax NUMERIC(10, 2) DEFAULT 1080.00,
    ADD COLUMN IF NOT EXISTS fee_penalty_surcharge NUMERIC(10, 2) DEFAULT 210.60,
    ADD COLUMN IF NOT EXISTS fee_mayors_permit NUMERIC(10, 2) DEFAULT 500.00,
    ADD COLUMN IF NOT EXISTS fee_mayors_clearance NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_police_clearance NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_tax_clearance NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_registration NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_sanitary_permit NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_health_certificate NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS fee_garbage_charges NUMERIC(10, 2) DEFAULT 600.00,
    ADD COLUMN IF NOT EXISTS fee_barangay_clearance NUMERIC(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS endorsing_offices JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS monthly_gross_sales JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS bplo_approved_by VARCHAR(150) DEFAULT 'JUNE CLYDE D. PATILANO',
    ADD COLUMN IF NOT EXISTS bplo_designation VARCHAR(150) DEFAULT 'LRCO II/BPLO Designate',
    ADD COLUMN IF NOT EXISTS bplo_date_signed DATE,
    ADD COLUMN IF NOT EXISTS market_office_verified_by VARCHAR(150) DEFAULT 'EDGAR EYANA',
    ADD COLUMN IF NOT EXISTS market_office_verified_remarks VARCHAR(255) DEFAULT 'FISH VENDOR OK',
    ADD COLUMN IF NOT EXISTS treasurer_verified_by VARCHAR(150) DEFAULT 'J. ANDANA',
    ADD COLUMN IF NOT EXISTS total_fees_assessment NUMERIC(12, 2) DEFAULT 2890.60,
    ADD COLUMN IF NOT EXISTS business_permit_or_no VARCHAR(100) DEFAULT '3675241',
    ADD COLUMN IF NOT EXISTS perjury_declaration_agreed BOOLEAN DEFAULT TRUE;

-- 3. CREATE DEDICATED BUSINESS_PERMITS TABLE FOR ARCHIVAL & TRACKING
CREATE TABLE IF NOT EXISTS public.business_permits (
    id BIGSERIAL PRIMARY KEY,
    permit_number VARCHAR(100) UNIQUE NOT NULL,
    tracking_number VARCHAR(100),
    stakeholder_id BIGINT REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    application_id BIGINT REFERENCES public.stakeholder_applications(id) ON DELETE SET NULL,
    stall_id BIGINT REFERENCES public.stalls(id) ON DELETE SET NULL,
    business_name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150),
    org_type VARCHAR(100) DEFAULT 'Sole Proprietor',
    owner_name VARCHAR(150) NOT NULL,
    owner_gender VARCHAR(20) DEFAULT 'Female',
    dti_sec_cda_reg_no VARCHAR(100),
    tin_no VARCHAR(100),
    main_office_address TEXT,
    business_location_address TEXT,
    contact_number VARCHAR(50),
    email_address VARCHAR(150),
    business_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    business_activity VARCHAR(100) DEFAULT 'Public Market Stall Retail',
    line_of_business VARCHAR(150) DEFAULT 'Fish & Wet Section Trade',
    capitalization NUMERIC(12, 2) DEFAULT 50000.00,
    gross_sales_prior_year NUMERIC(12, 2) DEFAULT 0.00,
    assessment_grand_total NUMERIC(12, 2) DEFAULT 2890.60,
    official_receipt_no VARCHAR(100) DEFAULT '3675241',
    bplo_officer_name VARCHAR(150) DEFAULT 'JUNE CLYDE D. PATILANO',
    bplo_officer_designation VARCHAR(150) DEFAULT 'LRCO II/BPLO Designate',
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'PENDING', 'ACTIVE', 'RENEWAL_REQUIRED', 'EXPIRED', 'REVOKED'
    issued_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_permits_stakeholder ON public.business_permits(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_business_permits_status ON public.business_permits(status);
CREATE INDEX IF NOT EXISTS idx_business_permits_stall ON public.business_permits(stall_id);

-- 4. ENABLE ROW LEVEL SECURITY AND PERMISSIVE POLICIES
ALTER TABLE public.business_permits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'business_permits' AND policyname = 'Allow public and authenticated access to business_permits'
    ) THEN
        CREATE POLICY "Allow public and authenticated access to business_permits"
            ON public.business_permits
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

GRANT ALL ON public.business_permits TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.business_permits_id_seq TO anon, authenticated, service_role;
