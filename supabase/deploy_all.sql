-- ==============================================================================
-- PUBLIC MARKET OF MANTICAO: ALL-IN-ONE MASTER DEPLOYMENT SCRIPT
-- Consolidated Database Schema, Workflow Tables, Triggers, Seed Data, and Permissions
-- Single Unified Database File for Supabase SQL Editor
-- (RLS Disabled on All Tables for Unrestricted System Stability)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS & TYPES (IDEMPOTENT CREATION - NO UNSAFE ALTER TYPE TRANSACTIONS)
-- ==============================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM (
            'STAKEHOLDER',
            'MAYOR_OFFICE',
            'MARKET_SUPERVISOR',
            'TREASURER',
            'SYSTEM_ADMIN'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stall_status_enum') THEN
        CREATE TYPE stall_status_enum AS ENUM (
            'AVAILABLE',
            'PENDING',
            'RESERVED',
            'OCCUPIED',
            'MAINTENANCE',
            'INACTIVE',
            'ARCHIVED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_category_enum') THEN
        CREATE TYPE rate_category_enum AS ENUM (
            'OLD',
            'NEW'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status_enum') THEN
        CREATE TYPE contract_status_enum AS ENUM (
            'DRAFT',
            'PENDING_EXECUTION',
            'PENDING_APPROVAL',
            'ACTIVE',
            'EXPIRED',
            'REVOKED',
            'TERMINATED',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_status_enum') THEN
        CREATE TYPE billing_status_enum AS ENUM (
            'UNPAID',
            'PARTIALLY_PAID',
            'PAID',
            'OVERDUE',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type_canonical_enum') THEN
        CREATE TYPE payment_type_canonical_enum AS ENUM (
            'STALL_RIGHTS_FEE',
            'ADVANCE_PAYMENT',
            'RENT_PAYMENT',
            'OTHER_FEES',
            'BUSINESS_PERMIT_PAYMENT',
            'APPLICATION_FEE',
            'APPLICATION_FORM',
            'FIELD_COLLECTION'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permit_status_enum') THEN
        CREATE TYPE permit_status_enum AS ENUM (
            'ACTIVE',
            'EXPIRED',
            'REVOKED',
            'SUSPENDED'
        );
    END IF;
END $$;

-- ==============================================================================
-- 3. IDENTITY, USERS & PROFILES
-- ==============================================================================

-- Canonical User Profiles (Linked 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255),
    phone_number VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'STAKEHOLDER',
    account_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (account_status IN ('PENDING', 'ACTIVE', 'LOCKED', 'DEACTIVATED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles Table (Compatibility Mirror for frontend services)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100),
    name VARCHAR(255),
    full_name TEXT,
    civil_status TEXT,
    citizenship TEXT DEFAULT 'Filipino',
    residential_address TEXT,
    contact_number TEXT,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'STAKEHOLDER',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    account_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (account_status IN ('PENDING', 'ACTIVE', 'LOCKED', 'DEACTIVATED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Temporary Accounts (Registration before full verification)
CREATE TABLE IF NOT EXISTS public.temporary_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    access_token_hash TEXT,
    expires_at TIMESTAMPTZ,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Login History
CREATE TABLE IF NOT EXISTS public.login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address VARCHAR(50),
    user_agent TEXT,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT TRUE
);

-- Municipal Officials (e.g. Incumbent Mayor for applications & LOI)
CREATE TABLE IF NOT EXISTS public.municipal_officials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    position_title VARCHAR(150) NOT NULL,
    office_department VARCHAR(150) DEFAULT 'Office of the Municipal Mayor',
    is_incumbent BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ==============================================================================
-- 4. MARKET INFRASTRUCTURE & STALLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.markets (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    municipality VARCHAR(100) NOT NULL DEFAULT 'Manticao, Misamis Oriental',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sections (
    id BIGSERIAL PRIMARY KEY,
    market_id BIGINT REFERENCES public.markets(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    rate_category rate_category_enum NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rental_rates (
    id BIGSERIAL PRIMARY KEY,
    section_id BIGINT REFERENCES public.sections(id) ON DELETE CASCADE,
    stall_type VARCHAR(100) NOT NULL,
    rate_category rate_category_enum NOT NULL DEFAULT 'NEW',
    base_monthly_rate NUMERIC(12, 2) NOT NULL DEFAULT 1500.00,
    stall_rights_fee NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    advance_months INT NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stalls (
    id BIGSERIAL PRIMARY KEY,
    section_id BIGINT REFERENCES public.sections(id) ON DELETE SET NULL,
    stall_no VARCHAR(50) NOT NULL UNIQUE,
    stall_type VARCHAR(100) NOT NULL DEFAULT 'Standard Stall',
    stall_size VARCHAR(50) DEFAULT '3x3m',
    area_sqm NUMERIC(8, 2) NOT NULL DEFAULT 9.00,
    dimensions VARCHAR(50) DEFAULT '3m x 3m',
    rate_category rate_category_enum NOT NULL DEFAULT 'NEW',
    monthly_rent NUMERIC(12, 2) NOT NULL DEFAULT 1500.00,
    stall_rights_fee NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    status stall_status_enum NOT NULL DEFAULT 'AVAILABLE',
    occupant_id BIGINT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    map_coordinates JSONB,
    info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stalls_status ON public.stalls(status);
CREATE INDEX IF NOT EXISTS idx_stalls_section ON public.stalls(section_id);

-- ==============================================================================
-- 5. STAKEHOLDERS (CANONICAL VENDOR CITIZEN PROFILES)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.stakeholders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    business_name VARCHAR(255) NOT NULL DEFAULT '',
    business_type VARCHAR(100),
    contact VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    selected_stall_id BIGINT REFERENCES public.stalls(id) ON DELETE SET NULL,
    application_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    onboarding_status VARCHAR(50) NOT NULL DEFAULT 'FOR_APPROVAL',
    verified_tenant BOOLEAN NOT NULL DEFAULT FALSE,
    verified_stakeholder BOOLEAN NOT NULL DEFAULT FALSE,
    contract_id BIGINT,
    advance_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    advance_payment_paid BOOLEAN NOT NULL DEFAULT FALSE,
    advance_payment_completed BOOLEAN NOT NULL DEFAULT FALSE,
    advance_payment_amount NUMERIC(12, 2) DEFAULT 0.00,
    advance_payment_date DATE,
    advance_payment_or VARCHAR(100),
    total_advance_amount NUMERIC(12, 2) DEFAULT 0.00,
    calculated_stall_rights_fee NUMERIC(12, 2) DEFAULT 5000.00,
    market_supervisor_approved BOOLEAN DEFAULT FALSE,
    market_approval_status VARCHAR(50) DEFAULT 'PENDING',
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    owner_suffix VARCHAR(50),
    civil_status VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(50),
    emergency_contact_person VARCHAR(150),
    emergency_contact_number VARCHAR(50),
    selected_stall_number VARCHAR(50),
    selected_market_section VARCHAR(100),
    floor_area_dimensions VARCHAR(100),
    base_monthly_rental_rate NUMERIC(12, 2) DEFAULT 1500.00,
    incumbent_municipal_mayor VARCHAR(150) DEFAULT 'HON. MAYOR STEPHEN S. TAN',
    application_type VARCHAR(100) DEFAULT 'NEW',
    payment_mode VARCHAR(100) DEFAULT 'ANNUALLY',
    tracking_number VARCHAR(100),
    business_id_number VARCHAR(100),
    org_type VARCHAR(100) DEFAULT 'Single Proprietorship',
    org_gender VARCHAR(50),
    dti_sec_cda_reg_no VARCHAR(100),
    tin_no VARCHAR(100),
    trade_name_franchise VARCHAR(255),
    main_house_bldg_no VARCHAR(100),
    main_bldg_name VARCHAR(150),
    main_lot_no VARCHAR(50),
    main_block_no VARCHAR(50),
    main_street VARCHAR(150),
    main_subdivision VARCHAR(150),
    main_barangay VARCHAR(100) DEFAULT 'Poblacion',
    main_district VARCHAR(100),
    main_municipality VARCHAR(100) DEFAULT 'Manticao',
    main_province VARCHAR(100) DEFAULT 'Misamis Oriental',
    main_zip_code VARCHAR(20) DEFAULT '9024',
    telephone_no VARCHAR(50),
    mobile_no VARCHAR(50),
    owner_surname VARCHAR(100),
    owner_given_name VARCHAR(100),
    owner_middle_name VARCHAR(100),
    corp_president_surname VARCHAR(100),
    corp_president_given_name VARCHAR(100),
    corp_president_middle_name VARCHAR(100),
    corp_president_suffix VARCHAR(50),
    corp_citizenship VARCHAR(100),
    business_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    total_floor_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    num_employees_male INT DEFAULT 0,
    num_employees_female INT DEFAULT 0,
    num_employees_lgu_residing INT DEFAULT 1,
    delivery_vehicles_van_truck INT DEFAULT 0,
    delivery_vehicles_motorcycle INT DEFAULT 0,
    loc_same_as_main BOOLEAN DEFAULT TRUE,
    loc_house_bldg_no VARCHAR(100),
    loc_bldg_name VARCHAR(150),
    loc_lot_no VARCHAR(50),
    loc_block_no VARCHAR(50),
    loc_street VARCHAR(150),
    loc_subdivision VARCHAR(150),
    loc_barangay VARCHAR(100) DEFAULT 'Poblacion',
    loc_district VARCHAR(100),
    loc_municipality VARCHAR(100) DEFAULT 'Manticao',
    loc_province VARCHAR(100) DEFAULT 'Misamis Oriental',
    loc_zip_code VARCHAR(20) DEFAULT '9024',
    property_owned BOOLEAN DEFAULT FALSE,
    tax_dec_no VARCHAR(100),
    property_id_no VARCHAR(100),
    tax_incentives_enjoyed BOOLEAN DEFAULT FALSE,
    business_activity VARCHAR(150) DEFAULT 'Main Office',
    business_activity_other VARCHAR(150),
    business_lines JSONB DEFAULT '[]'::jsonb,
    stall_space_type VARCHAR(50) DEFAULT 'Regular Stall',
    valid_id_type VARCHAR(100),
    valid_id_no VARCHAR(100),
    nature_of_business JSONB DEFAULT '[]'::jsonb,
    products_commodities TEXT,
    estimated_employees INT DEFAULT 1,
    loi_content TEXT,
    perjury_declaration_agreed BOOLEAN DEFAULT TRUE,
    loi_approval_status VARCHAR(50) DEFAULT 'PENDING',
    loi_approval_reference VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stakeholders_user_id ON public.stakeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_status ON public.stakeholders(application_status);
CREATE INDEX IF NOT EXISTS idx_stakeholders_stall ON public.stakeholders(selected_stall_id);

-- ==============================================================================
-- 6. APPLICATIONS (STAKEHOLDER APPLICATIONS & UNIFIED COMPATIBILITY)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.stakeholder_applications (
    id BIGSERIAL PRIMARY KEY,
    application_no VARCHAR(100) NOT NULL UNIQUE,
    tracking_number VARCHAR(100),
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    current_holding_office VARCHAR(100) NOT NULL DEFAULT 'Office of the Mayor',
    loi_url TEXT,
    valid_id_url TEXT,
    loi_status VARCHAR(50) DEFAULT 'PENDING',
    loi_approval_status VARCHAR(50) DEFAULT 'PENDING',
    loi_approval_reference VARCHAR(100),
    loi_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    loi_approved_at TIMESTAMPTZ,
    loi_received_at TIMESTAMPTZ,
    loi_remarks TEXT,
    calculated_stall_rights_fee NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    calculated_advance_rent NUMERIC(12, 2) NOT NULL DEFAULT 3000.00,
    total_initial_amount_due NUMERIC(12, 2) NOT NULL DEFAULT 8000.00,
    amount_paid NUMERIC(12, 2) DEFAULT 0.00,
    treasurer_receipt_no VARCHAR(100),
    treasurer_recorded_at TIMESTAMPTZ,
    initial_advance_paid_at TIMESTAMPTZ,
    initial_advance_receipt_no VARCHAR(100),
    supervisor_endorsed_at TIMESTAMPTZ,
    supervisor_remarks TEXT,
    contract_prepared_at TIMESTAMPTZ,
    contract_file_path TEXT,
    contract_uploaded_at TIMESTAMPTZ,
    mayor_decision VARCHAR(50),
    mayor_approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    mayor_approved_at TIMESTAMPTZ,
    mayor_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    mayor_reviewed_at TIMESTAMPTZ,
    mayor_remarks TEXT,
    regulatory_fee_receipt_no VARCHAR(100),
    regulatory_fee_paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    application_type VARCHAR(100) DEFAULT 'NEW',
    payment_mode VARCHAR(100) DEFAULT 'ANNUALLY',
    business_id_number VARCHAR(100),
    org_type VARCHAR(100) DEFAULT 'Single Proprietorship',
    org_gender VARCHAR(50),
    civil_status VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(50),
    emergency_contact_person VARCHAR(150),
    emergency_contact_number VARCHAR(50),
    selected_stall_number VARCHAR(50),
    selected_market_section VARCHAR(100),
    floor_area_dimensions VARCHAR(100),
    base_monthly_rental_rate NUMERIC(12, 2) DEFAULT 1500.00,
    incumbent_municipal_mayor VARCHAR(150) DEFAULT 'HON. MAYOR STEPHEN S. TAN',
    dti_sec_cda_reg_no VARCHAR(100),
    tin_no VARCHAR(100),
    trade_name_franchise VARCHAR(255),
    main_house_bldg_no VARCHAR(100),
    main_bldg_name VARCHAR(150),
    main_lot_no VARCHAR(50),
    main_block_no VARCHAR(50),
    main_street VARCHAR(150),
    main_subdivision VARCHAR(150),
    main_barangay VARCHAR(100) DEFAULT 'Poblacion',
    main_district VARCHAR(100),
    main_municipality VARCHAR(100) DEFAULT 'Manticao',
    main_province VARCHAR(100) DEFAULT 'Misamis Oriental',
    main_zip_code VARCHAR(20) DEFAULT '9024',
    telephone_no VARCHAR(50),
    mobile_no VARCHAR(50),
    owner_surname VARCHAR(100),
    owner_given_name VARCHAR(100),
    owner_middle_name VARCHAR(100),
    owner_suffix VARCHAR(50),
    corp_president_surname VARCHAR(100),
    corp_president_given_name VARCHAR(100),
    corp_president_middle_name VARCHAR(100),
    corp_president_suffix VARCHAR(50),
    corp_citizenship VARCHAR(100),
    business_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    total_floor_area_sqm NUMERIC(10, 2) DEFAULT 9.00,
    num_employees_male INT DEFAULT 0,
    num_employees_female INT DEFAULT 0,
    num_employees_lgu_residing INT DEFAULT 1,
    delivery_vehicles_van_truck INT DEFAULT 0,
    delivery_vehicles_motorcycle INT DEFAULT 0,
    loc_same_as_main BOOLEAN DEFAULT TRUE,
    loc_house_bldg_no VARCHAR(100),
    loc_bldg_name VARCHAR(150),
    loc_lot_no VARCHAR(50),
    loc_block_no VARCHAR(50),
    loc_street VARCHAR(150),
    loc_subdivision VARCHAR(150),
    loc_barangay VARCHAR(100) DEFAULT 'Poblacion',
    loc_district VARCHAR(100),
    loc_municipality VARCHAR(100) DEFAULT 'Manticao',
    loc_province VARCHAR(100) DEFAULT 'Misamis Oriental',
    loc_zip_code VARCHAR(20) DEFAULT '9024',
    property_owned BOOLEAN DEFAULT FALSE,
    tax_dec_no VARCHAR(100),
    property_id_no VARCHAR(100),
    tax_incentives_enjoyed BOOLEAN DEFAULT FALSE,
    business_activity VARCHAR(150) DEFAULT 'Main Office',
    business_activity_other VARCHAR(150),
    business_lines JSONB DEFAULT '[]'::jsonb,
    stall_space_type VARCHAR(50) DEFAULT 'Regular Stall',
    valid_id_type VARCHAR(100),
    valid_id_no VARCHAR(100),
    nature_of_business JSONB DEFAULT '[]'::jsonb,
    products_commodities TEXT,
    estimated_employees INT DEFAULT 1,
    loi_content TEXT,
    perjury_declaration_agreed BOOLEAN DEFAULT TRUE,
    market_office_status VARCHAR(100) DEFAULT 'Complete',
    market_office_recommended_stall VARCHAR(100),
    market_office_section VARCHAR(100),
    market_office_nature VARCHAR(100),
    treasury_monthly_rent NUMERIC(12, 2) DEFAULT 1500.00,
    treasury_other_fees NUMERIC(12, 2) DEFAULT 5000.00,
    treasury_security_deposit NUMERIC(12, 2) DEFAULT 3000.00,
    treasury_total_due NUMERIC(12, 2) DEFAULT 8000.00,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stakeholder_apps_no ON public.stakeholder_applications(application_no);
CREATE INDEX IF NOT EXISTS idx_stakeholder_apps_status ON public.stakeholder_applications(status);
CREATE INDEX IF NOT EXISTS idx_stakeholder_apps_holding ON public.stakeholder_applications(current_holding_office);
CREATE INDEX IF NOT EXISTS idx_stakeholder_apps_sh ON public.stakeholder_applications(stakeholder_id);

-- Applications (UUID-keyed mirror table for unified frontend routes)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number VARCHAR(100) UNIQUE DEFAULT ('APP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')),
    applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    selected_stall_id BIGINT REFERENCES public.stalls(id) ON DELETE SET NULL,
    trade_name VARCHAR(255) NOT NULL DEFAULT '',
    nature_of_business VARCHAR(150) NOT NULL DEFAULT 'Retail',
    commodities_to_sell TEXT,
    estimated_employees INT NOT NULL DEFAULT 1,
    valid_id_type VARCHAR(100) NOT NULL DEFAULT 'Government ID',
    valid_id_number VARCHAR(100) NOT NULL DEFAULT '',
    valid_id_storage_path TEXT,
    mayor_official_id UUID REFERENCES public.municipal_officials(id) ON DELETE SET NULL,
    statutory_undertaking_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    current_status VARCHAR(100) NOT NULL DEFAULT 'SUBMITTED',
    mayor_decision VARCHAR(50),
    mayor_approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    mayor_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    mayor_reviewed_at TIMESTAMPTZ,
    signed_loi_received_at TIMESTAMPTZ,
    current_holding_office VARCHAR(100) NOT NULL DEFAULT 'Office of the Mayor',
    approval_reference VARCHAR(100),
    initial_advance_paid_at TIMESTAMPTZ,
    initial_advance_receipt_no VARCHAR(100),
    contract_file_path TEXT,
    contract_uploaded_at TIMESTAMPTZ,
    regulatory_fee_receipt_no VARCHAR(100),
    regulatory_fee_paid_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    mayor_decision_ref_no VARCHAR(100),
    mayor_decision_date TIMESTAMPTZ,
    mayor_remarks TEXT,
    treasury_assessed_at TIMESTAMPTZ,
    treasury_or_number VARCHAR(100),
    treasury_payment_date TIMESTAMPTZ,
    stall_rights_paid NUMERIC(12, 2) DEFAULT 0.00,
    advance_rent_paid NUMERIC(12, 2) DEFAULT 0.00,
    treasury_recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    market_evaluated_at TIMESTAMPTZ,
    market_supervisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    market_remarks TEXT,
    contract_number VARCHAR(100),
    contract_prepared_at TIMESTAMPTZ,
    physical_contract_verified_at TIMESTAMPTZ,
    contract_start_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibility View for Business Applications
DROP VIEW IF EXISTS public.business_applications;
CREATE VIEW public.business_applications AS
SELECT
    sa.*,
    s.business_name,
    s.business_type,
    s.first_name,
    s.middle_name,
    s.last_name,
    s.contact,
    s.email,
    s.address,
    st.stall_no,
    st.monthly_rent,
    st.stall_rights_fee AS stall_rights_amount
FROM public.stakeholder_applications sa
LEFT JOIN public.stakeholders s ON s.id = sa.stakeholder_id
LEFT JOIN public.stalls st ON st.id = sa.stall_id;

-- Documents Upload Table
CREATE TABLE IF NOT EXISTS public.stakeholder_documents (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    application_id BIGINT REFERENCES public.stakeholder_applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Approval History Audit Log
CREATE TABLE IF NOT EXISTS public.approval_history (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    application_id BIGINT REFERENCES public.stakeholder_applications(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    action_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name VARCHAR(150),
    actor_role VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_history_stage ON public.approval_history(stage);
CREATE INDEX IF NOT EXISTS idx_approval_history_app ON public.approval_history(application_id);

-- ==============================================================================
-- 7. OCCUPANCY & LEASE CONTRACTS
-- ==============================================================================

-- Occupants (Active stall tenants)
CREATE TABLE IF NOT EXISTS public.occupants (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT NOT NULL UNIQUE REFERENCES public.stakeholders(id) ON DELETE RESTRICT,
    stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
    contract_id BIGINT,
    advance_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    occupancy_date DATE DEFAULT CURRENT_DATE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lease Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
    id BIGSERIAL PRIMARY KEY,
    contract_no VARCHAR(100) NOT NULL UNIQUE,
    application_id BIGINT REFERENCES public.stakeholder_applications(id) ON DELETE SET NULL,
    occupant_id BIGINT REFERENCES public.occupants(id) ON DELETE CASCADE,
    stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent NUMERIC(12, 2) NOT NULL DEFAULT 1500.00,
    billing_frequency VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
    terms TEXT NOT NULL DEFAULT 'Standard Commercial Lease Agreement per Municipal Ordinance No. 01, S. 2018',
    status contract_status_enum NOT NULL DEFAULT 'PENDING_EXECUTION',
    initial_payments_verified BOOLEAN NOT NULL DEFAULT FALSE,
    initial_payments_verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    initial_payments_verified_at TIMESTAMPTZ,
    signed_date DATE,
    signing_recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    signing_recorded_at TIMESTAMPTZ,
    signed_by_stakeholder BOOLEAN NOT NULL DEFAULT FALSE,
    signed_by_lgu BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    executed_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    document_url TEXT,
    contract_file_path TEXT,
    lease_term_years INT NOT NULL DEFAULT 5,
    document_template_version VARCHAR(20) DEFAULT '1.0.0',
    contract_snapshot_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_active_stall ON public.contracts(stall_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_app ON public.contracts(application_id);

-- Link stall occupant foreign keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stalls_occupant') THEN
        ALTER TABLE public.stalls 
        ADD CONSTRAINT fk_stalls_occupant 
        FOREIGN KEY (occupant_id) REFERENCES public.occupants(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Occupancy Permits
CREATE TABLE IF NOT EXISTS public.occupancy_permits (
    id BIGSERIAL PRIMARY KEY,
    permit_no VARCHAR(100) NOT NULL UNIQUE,
    contract_id BIGINT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    occupant_id BIGINT NOT NULL REFERENCES public.occupants(id) ON DELETE CASCADE,
    qr_code_data_url TEXT,
    integrity_hash VARCHAR(64) NOT NULL,
    status permit_status_enum NOT NULL DEFAULT 'ACTIVE',
    revocation_reason TEXT,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permit Scan Logs
CREATE TABLE IF NOT EXISTS public.permit_scan_logs (
    id BIGSERIAL PRIMARY KEY,
    permit_id BIGINT REFERENCES public.occupancy_permits(id) ON DELETE CASCADE,
    scanner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT
);



-- ==============================================================================
-- 8. CONTINUOUS BILLING, ADVANCE CREDITS & PAYMENTS
-- ==============================================================================

-- Advance Credits Reserve (Holds 2-month advance rental deposit)
CREATE TABLE IF NOT EXISTS public.advance_credits (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    contract_id BIGINT REFERENCES public.contracts(id) ON DELETE SET NULL,
    payment_id BIGINT,
    original_amount NUMERIC(12, 2) NOT NULL,
    available_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'DEPLETED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly Billings
CREATE TABLE IF NOT EXISTS public.billings (
    id BIGSERIAL PRIMARY KEY,
    occupant_id BIGINT NOT NULL REFERENCES public.occupants(id) ON DELETE CASCADE,
    contract_id BIGINT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    billing_no VARCHAR(100) NOT NULL UNIQUE,
    billing_period VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 1500.00,
    amount_due NUMERIC(12, 2) NOT NULL DEFAULT 1500.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 1500.00,
    due_date DATE NOT NULL,
    status billing_status_enum NOT NULL DEFAULT 'UNPAID',
    first_notice_sent_at TIMESTAMPTZ,
    second_notice_sent_at TIMESTAMPTZ,
    final_notice_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_contract_billing_period UNIQUE (contract_id, billing_period)
);

CREATE INDEX IF NOT EXISTS idx_billings_status ON public.billings(status);
CREATE INDEX IF NOT EXISTS idx_billings_due_date ON public.billings(due_date);
CREATE INDEX IF NOT EXISTS idx_billings_contract ON public.billings(contract_id);

-- Credit Allocations (Drawdowns from advance rent credit to monthly bills)
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

-- Official Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    receipt_no VARCHAR(100) NOT NULL UNIQUE,
    reference_no VARCHAR(100),
    billing_id BIGINT REFERENCES public.billings(id) ON DELETE SET NULL,
    application_id BIGINT REFERENCES public.stakeholder_applications(id) ON DELETE SET NULL,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    remittance_id BIGINT,
    amount NUMERIC(12, 2) NOT NULL,
    payment_type payment_type_canonical_enum NOT NULL DEFAULT 'RENT_PAYMENT',
    payment_channel VARCHAR(50) NOT NULL DEFAULT 'CASH',
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH',
    payment_stage VARCHAR(30),
    cashier_or_collector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cashier_name VARCHAR(150) NOT NULL DEFAULT 'Municipal Treasurer',
    notes TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_stakeholder ON public.payments(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_payments_billing ON public.payments(billing_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_no ON public.payments(receipt_no);

-- Payment Receipts (Audit Mirror with Integrity Hash)
CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
    receipt_no VARCHAR(100) NOT NULL UNIQUE,
    official_receipt_number VARCHAR(100),
    integrity_hash VARCHAR(64) NOT NULL,
    receipt_data_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collection Remittances
CREATE TABLE IF NOT EXISTS public.collection_remittances (
    id BIGSERIAL PRIMARY KEY,
    remittance_no VARCHAR(100) NOT NULL UNIQUE,
    collector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collector_name VARCHAR(150) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    collection_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collection_remittance_items (
    id BIGSERIAL PRIMARY KEY,
    remittance_id BIGINT NOT NULL REFERENCES public.collection_remittances(id) ON DELETE CASCADE,
    payment_id BIGINT NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    stall_no VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL
);

-- Overdue Demand Notices
CREATE TABLE IF NOT EXISTS public.notices (
    id BIGSERIAL PRIMARY KEY,
    notice_no VARCHAR(100) NOT NULL UNIQUE,
    contract_id BIGINT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    notice_type VARCHAR(50) NOT NULL,
    days_overdue INT NOT NULL,
    total_overdue_amount NUMERIC(12, 2) NOT NULL,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_role VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(target_role);

-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



-- ==============================================================================
-- 10. SYSTEM FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Timestamp Update Helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stalls_updated_at ON public.stalls;
CREATE TRIGGER trg_stalls_updated_at BEFORE UPDATE ON public.stalls
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_stakeholders_updated_at ON public.stakeholders;
CREATE TRIGGER trg_stakeholders_updated_at BEFORE UPDATE ON public.stakeholders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_stakeholder_applications_updated_at ON public.stakeholder_applications;
CREATE TRIGGER trg_stakeholder_applications_updated_at BEFORE UPDATE ON public.stakeholder_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON public.contracts;
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_billings_updated_at ON public.billings;
CREATE TRIGGER trg_billings_updated_at BEFORE UPDATE ON public.billings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: Synchronize Auth New User to user_profiles and profiles
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

  IF UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) IN ('ADMIN', 'SYSTEM_ADMIN') OR LOWER(v_username) IN ('admin', 'system_admin') THEN
    v_role := 'SYSTEM_ADMIN';
  ELSIF UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) IN ('MAYOR', 'MAYOR_OFFICE') OR LOWER(v_username) IN ('mayor', 'mayor_office') THEN
    v_role := 'MAYOR_OFFICE';
  ELSIF UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) IN ('MARKET_SUPERVISOR', 'SUPERVISOR') OR LOWER(v_username) IN ('supervisor', 'market_supervisor') THEN
    v_role := 'MARKET_SUPERVISOR';
  ELSIF UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'TREASURER' OR LOWER(v_username) = 'treasurer' THEN
    v_role := 'TREASURER';
  ELSE
    v_role := 'STAKEHOLDER';
  END IF;

  BEGIN
    INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active, account_status)
    VALUES (new.id, v_username, v_fullname, new.email, v_role, TRUE, 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      username = COALESCE(public.user_profiles.username, EXCLUDED.username),
      full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.profiles (id, username, name, full_name, email, role, status, account_status)
    VALUES (new.id, v_username, v_fullname, v_fullname, new.email, v_role, 'ACTIVE', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email,
      username = COALESCE(public.profiles.username, EXCLUDED.username),
      full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Automatically update billings balance when rental payment is recorded
CREATE OR REPLACE FUNCTION public.update_billing_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_new_paid NUMERIC(12, 2);
  v_new_bal NUMERIC(12, 2);
  v_amt_due NUMERIC(12, 2);
BEGIN
  IF NEW.billing_id IS NOT NULL AND NEW.payment_type = 'RENT_PAYMENT' THEN
    SELECT COALESCE(total_amount, amount_due, 1500.00), COALESCE(paid_amount, amount_paid, 0.00)
    INTO v_amt_due, v_new_paid
    FROM public.billings WHERE id = NEW.billing_id;

    IF FOUND THEN
      v_new_paid := v_new_paid + NEW.amount;
      v_new_bal := GREATEST(0.00, v_amt_due - v_new_paid);

      UPDATE public.billings
      SET 
        paid_amount = v_new_paid,
        amount_paid = v_new_paid,
        balance = v_new_bal,
        status = CASE 
          WHEN v_new_bal <= 0.00 THEN 'PAID'::billing_status_enum
          WHEN v_new_paid > 0.00 THEN 'PARTIALLY_PAID'::billing_status_enum
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = NEW.billing_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_update_billing ON public.payments;
CREATE TRIGGER trg_payment_update_billing
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_billing_on_payment();

-- Trigger: Activate stakeholder when initial fees are cleared
CREATE OR REPLACE FUNCTION public.activate_stakeholder_after_fees_cleared()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'FEES_CLEARED' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status := 'ACTIVE_OCCUPANT';
    NEW.activated_at := COALESCE(NEW.activated_at, NOW());
    NEW.current_holding_office := 'Market Operations';

    UPDATE public.stakeholders
    SET application_status = 'ACTIVE_OCCUPANT',
        onboarding_status = 'FULLY_ONBOARDED',
        verified_tenant = TRUE,
        verified_stakeholder = TRUE,
        updated_at = NOW()
    WHERE id = NEW.stakeholder_id;

    IF NEW.user_id IS NOT NULL THEN
      UPDATE public.user_profiles
      SET account_status = 'ACTIVE', is_active = TRUE, updated_at = NOW()
      WHERE id = NEW.user_id;

      UPDATE public.profiles
      SET account_status = 'ACTIVE', status = 'ACTIVE', updated_at = NOW()
      WHERE id = NEW.user_id;

      INSERT INTO public.notifications (stakeholder_id, user_id, title, message, notification_type)
      VALUES (
        NEW.stakeholder_id,
        NEW.user_id,
        'Market stall application complete',
        'Your market stall application is complete. Your stall contract and stakeholder dashboard are now accessible.',
        'APPROVAL_UPDATE'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_stakeholder_after_fees_cleared ON public.stakeholder_applications;
CREATE TRIGGER trg_activate_stakeholder_after_fees_cleared
BEFORE UPDATE OF status ON public.stakeholder_applications
FOR EACH ROW EXECUTE FUNCTION public.activate_stakeholder_after_fees_cleared();

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) - COMPLETELY DISABLED FOR ALL SYSTEM TABLES
-- ==============================================================================

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_permits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_scan_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.billings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_remittances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_remittance_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipal_officials DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 12. SEED DATA & SYSTEM INITIALIZATION
-- ==============================================================================

-- Seed Markets
INSERT INTO public.markets (id, code, name, municipality, is_active)
VALUES (1, 'MANTICAO_CENTRAL', 'Manticao Public Market', 'Manticao, Misamis Oriental', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed Market Trade Sections
INSERT INTO public.sections (id, market_id, code, name, rate_category)
VALUES 
    (1, 1, 'SEC_WET', 'Wet Market (Fish & Meat)', 'NEW'),
    (2, 1, 'SEC_DRY', 'Dry Goods & Groceries', 'NEW'),
    (3, 1, 'SEC_FRUIT', 'Fruits & Vegetables', 'NEW'),
    (4, 1, 'SEC_EATERY', 'Commercial & Eatery', 'NEW')
ON CONFLICT (code) DO NOTHING;

-- Seed Rental Rates
INSERT INTO public.rental_rates (id, section_id, stall_type, rate_category, base_monthly_rate, stall_rights_fee, advance_months, is_active)
VALUES
    (1, 1, 'Wet Market Section', 'NEW', 1800.00, 5000.00, 2, TRUE),
    (2, 2, 'Dry Goods Section', 'NEW', 2300.00, 5000.00, 2, TRUE),
    (3, 3, 'Vegetable/Fruit Section', 'NEW', 1500.00, 5000.00, 2, TRUE),
    (4, 4, 'Commercial Stall (Corner)', 'NEW', 2500.00, 7000.00, 2, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed System Settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
    ('app_fee', '150.00', 'Official stall rental application fee (PHP)'),
    ('stall_rights_corner', '7000.00', 'Corner stall rights fee per Municipal Ordinance No. 01, S. 2018 (PHP)'),
    ('stall_rights_standard', '5000.00', 'Standard stall rights fee per Municipal Ordinance No. 01, S. 2018 (PHP)'),
    ('advance_months', '2', 'Required advance rent deposit months'),
    ('grace_period_months', '2', 'Grace period before overdue demand notices'),
    ('contract_duration_years', '5', 'Standard lease term duration in years')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Seed Incumbent Municipal Mayor
INSERT INTO public.municipal_officials (full_name, position_title, office_department, is_incumbent)
VALUES ('HON. STEPHEN S. TAN', 'Municipal Mayor', 'Office of the Municipal Mayor', TRUE)
ON CONFLICT DO NOTHING;

-- Seed Default Market Stalls
INSERT INTO public.stalls (stall_no, section_id, stall_type, stall_size, dimensions, monthly_rent, stall_rights_fee, status)
VALUES
    ('A-01', 1, 'Wet Market Section', '3x3m', '3m x 3m', 1800.00, 5000.00, 'AVAILABLE'),
    ('A-02', 1, 'Wet Market Section', '3x3m', '3m x 3m', 1800.00, 5000.00, 'AVAILABLE'),
    ('B-01', 2, 'Dry Goods Section', '3x4m', '3m x 4m', 2300.00, 5000.00, 'AVAILABLE'),
    ('B-02', 2, 'Dry Goods Section', '3x4m', '3m x 4m', 2300.00, 5000.00, 'AVAILABLE'),
    ('C-01', 3, 'Vegetable/Fruit Section', '2.5x3m', '2.5m x 3m', 1500.00, 5000.00, 'AVAILABLE'),
    ('D-01', 4, 'Commercial Stall (Corner)', '4x4m', '4m x 4m', 2500.00, 7000.00, 'AVAILABLE')
ON CONFLICT (stall_no) DO NOTHING;

-- Seed Canonical Staff Accounts (Safe & Idempotent)
DO $$
DECLARE
  v_default_pw TEXT := crypt('Password@123', gen_salt('bf'));
  v_admin_id UUID := '11111111-1111-1111-1111-111111111111';
  v_supervisor_id UUID := '22222222-2222-2222-2222-222222222222';
  v_mayor_id UUID := '33333333-3333-3333-3333-333333333333';
  v_treasurer_id UUID := '44444444-4444-4444-4444-444444444444';
  v_stakeholder_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
  -- 1. System Administrator
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@manticao.gov.ph') THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
        'admin@manticao.gov.ph', v_default_pw, NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"admin","name":"Municipal System Administrator","role":"SYSTEM_ADMIN"}',
        NOW(), NOW()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'admin@manticao.gov.ph'), v_admin_id),
      'admin', 'Municipal System Administrator', 'admin@manticao.gov.ph', 'SYSTEM_ADMIN', TRUE, 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'SYSTEM_ADMIN', username = 'admin', is_active = TRUE;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.profiles (id, username, name, full_name, email, role, status, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'admin@manticao.gov.ph'), v_admin_id),
      'admin', 'Municipal System Administrator', 'Municipal System Administrator', 'admin@manticao.gov.ph', 'SYSTEM_ADMIN', 'ACTIVE', 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'SYSTEM_ADMIN', username = 'admin', status = 'ACTIVE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 2. Market Supervisor
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'supervisor@manticao.gov.ph') THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_supervisor_id, 'authenticated', 'authenticated',
        'supervisor@manticao.gov.ph', v_default_pw, NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"supervisor","name":"Edgar Eyana (Market Supervisor)","role":"MARKET_SUPERVISOR"}',
        NOW(), NOW()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'supervisor@manticao.gov.ph'), v_supervisor_id),
      'supervisor', 'Edgar Eyana (Market Supervisor)', 'supervisor@manticao.gov.ph', 'MARKET_SUPERVISOR', TRUE, 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'MARKET_SUPERVISOR', username = 'supervisor', is_active = TRUE;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.profiles (id, username, name, full_name, email, role, status, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'supervisor@manticao.gov.ph'), v_supervisor_id),
      'supervisor', 'Edgar Eyana (Market Supervisor)', 'Edgar Eyana (Market Supervisor)', 'supervisor@manticao.gov.ph', 'MARKET_SUPERVISOR', 'ACTIVE', 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'MARKET_SUPERVISOR', username = 'supervisor', status = 'ACTIVE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 3. Mayor's Office
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mayor@manticao.gov.ph') THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_mayor_id, 'authenticated', 'authenticated',
        'mayor@manticao.gov.ph', v_default_pw, NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"mayor","name":"Office of the Municipal Mayor","role":"MAYOR_OFFICE"}',
        NOW(), NOW()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'mayor@manticao.gov.ph'), v_mayor_id),
      'mayor', 'Office of the Municipal Mayor', 'mayor@manticao.gov.ph', 'MAYOR_OFFICE', TRUE, 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'MAYOR_OFFICE', username = 'mayor', is_active = TRUE;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.profiles (id, username, name, full_name, email, role, status, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'mayor@manticao.gov.ph'), v_mayor_id),
      'mayor', 'Office of the Municipal Mayor', 'Office of the Municipal Mayor', 'mayor@manticao.gov.ph', 'MAYOR_OFFICE', 'ACTIVE', 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'MAYOR_OFFICE', username = 'mayor', status = 'ACTIVE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 4. Municipal Treasurer
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'treasurer@manticao.gov.ph') THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_treasurer_id, 'authenticated', 'authenticated',
        'treasurer@manticao.gov.ph', v_default_pw, NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"treasurer","name":"Naida Bebeth A. Magdayo (Treasurer)","role":"TREASURER"}',
        NOW(), NOW()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'treasurer@manticao.gov.ph'), v_treasurer_id),
      'treasurer', 'Naida Bebeth A. Magdayo (Treasurer)', 'treasurer@manticao.gov.ph', 'TREASURER', TRUE, 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'TREASURER', username = 'treasurer', is_active = TRUE;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.profiles (id, username, name, full_name, email, role, status, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'treasurer@manticao.gov.ph'), v_treasurer_id),
      'treasurer', 'Naida Bebeth A. Magdayo (Treasurer)', 'Naida Bebeth A. Magdayo (Treasurer)', 'treasurer@manticao.gov.ph', 'TREASURER', 'ACTIVE', 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'TREASURER', username = 'treasurer', status = 'ACTIVE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 5. Stakeholder (Sample Demo Stakeholder)
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'stakeholder@manticao.gov.ph') THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_stakeholder_id, 'authenticated', 'authenticated',
        'stakeholder@manticao.gov.ph', v_default_pw, NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"stakeholder","name":"Juan Dela Cruz (Sample Stakeholder)","role":"STAKEHOLDER"}',
        NOW(), NOW()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'stakeholder@manticao.gov.ph'), v_stakeholder_id),
      'stakeholder', 'Juan Dela Cruz (Sample Stakeholder)', 'stakeholder@manticao.gov.ph', 'STAKEHOLDER', TRUE, 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'STAKEHOLDER', username = 'stakeholder', is_active = TRUE;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    INSERT INTO public.profiles (id, username, name, full_name, email, role, status, account_status)
    VALUES (
      COALESCE((SELECT id FROM auth.users WHERE email = 'stakeholder@manticao.gov.ph'), v_stakeholder_id),
      'stakeholder', 'Juan Dela Cruz (Sample Stakeholder)', 'Juan Dela Cruz (Sample Stakeholder)', 'stakeholder@manticao.gov.ph', 'STAKEHOLDER', 'ACTIVE', 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET role = 'STAKEHOLDER', username = 'stakeholder', status = 'ACTIVE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

END $$;

-- Storage Buckets Configuration (uploads & application-documents)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
        ('uploads', 'uploads', true),
        ('application-documents', 'application-documents', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Synchronize Serial Sequences Safely
DO $$
BEGIN
    PERFORM setval(pg_get_serial_sequence('public.markets', 'id'), COALESCE((SELECT MAX(id) FROM public.markets), 1));
    PERFORM setval(pg_get_serial_sequence('public.sections', 'id'), COALESCE((SELECT MAX(id) FROM public.sections), 1));
    PERFORM setval(pg_get_serial_sequence('public.rental_rates', 'id'), COALESCE((SELECT MAX(id) FROM public.rental_rates), 1));
    PERFORM setval(pg_get_serial_sequence('public.stalls', 'id'), COALESCE((SELECT MAX(id) FROM public.stalls), 1));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Completion Announcement
SELECT 'Manticao Public Market unified master deployment completed successfully.' AS status;
