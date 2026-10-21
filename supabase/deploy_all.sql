-- ==============================================================================
-- PUBLIC MARKET OF MANTICAO: ALL-IN-ONE MASTER DEPLOYMENT SCRIPT
-- Target: Supabase PostgreSQL (mchqolkwwthnkkctuple.supabase.co)
-- Executes Schema, Migrations, Storage Buckets, Seed Data, and Auth Users
-- ==============================================================================

-- ==============================================================================
-- SUPABASE POSTGRESQL SCHEMA MIGRATION: MANTICAO PUBLIC MARKET RENTAL MANAGEMENT SYSTEM
-- Target: Supabase PostgreSQL (Fully normalized, RLS-protected, idempotent)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS & DOMAINS
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
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE stall_status_enum AS ENUM (
        'AVAILABLE',
        'PENDING',
        'RESERVED',
        'OCCUPIED',
        'MAINTENANCE',
        'ARCHIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE rate_category_enum AS ENUM (
        'OLD',
        'NEW'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE application_status_enum AS ENUM (
        'DRAFT',
        'PENDING_SUPERVISOR_REVIEW',
        'SUPERVISOR_REJECTED',
        'PENDING_MAYOR_APPROVAL',
        'MAYOR_REJECTED',
        'PENDING_TREASURER_PAYMENT',
        'PAID_READY_FOR_CONTRACT',
        'PENDING_INSPECTION',
        'INSPECTION_PASSED',
        'BUSINESS_PERMIT_ELIGIBLE',
        'COMPLETED',
        'REVOKED',
        'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE contract_status_enum AS ENUM (
        'DRAFT',
        'PENDING_APPROVAL',
        'ACTIVE',
        'EXPIRED',
        'REVOKED',
        'TERMINATED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE billing_status_enum AS ENUM (
        'UNPAID',
        'PARTIALLY_PAID',
        'PAID',
        'OVERDUE',
        'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_type_canonical_enum AS ENUM (
        'ADVANCE_PAYMENT',
        'STALL_RIGHTS_FEE',
        'APPLICATION_FEE',
        'RENT_PAYMENT',
        'FIELD_COLLECTION',
        'BUSINESS_PERMIT_PAYMENT'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE permit_status_enum AS ENUM (
        'ACTIVE',
        'EXPIRED',
        'REVOKED',
        'SUSPENDED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 3. IDENTITY AND ACCESS
-- ==============================================================================

-- User Profiles (Linked 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    role user_role_enum NOT NULL DEFAULT 'APPLICANT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Temporary Accounts (for applicants registering before full verification)
CREATE TABLE IF NOT EXISTS public.temporary_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    access_token_hash TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
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

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- ==============================================================================
-- 4. MARKET AND STALL INVENTORY
-- ==============================================================================

-- Markets
CREATE TABLE IF NOT EXISTS public.markets (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE DEFAULT 'MANTICAT_PUBLIC_MARKET',
    name VARCHAR(255) NOT NULL DEFAULT 'Public Market of Manticao',
    municipality VARCHAR(100) NOT NULL DEFAULT 'Manticao, Misamis Oriental',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Market Sections (Wet Section, Dry Goods, Food Court, Commercial Block, etc.)
CREATE TABLE IF NOT EXISTS public.sections (
    id BIGSERIAL PRIMARY KEY,
    market_id BIGINT REFERENCES public.markets(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rate_category rate_category_enum NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rental Rates (Configurable rental rate formulas)
CREATE TABLE IF NOT EXISTS public.rental_rates (
    id BIGSERIAL PRIMARY KEY,
    section_id BIGINT REFERENCES public.sections(id) ON DELETE CASCADE,
    stall_type VARCHAR(100) NOT NULL,
    rate_category rate_category_enum NOT NULL DEFAULT 'NEW',
    base_monthly_rate NUMERIC(12, 2) NOT NULL,
    rate_per_sqm NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stall_rights_fee NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    advance_months INT NOT NULL DEFAULT 2, -- Blueprint requirement: 2 months advance
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stalls
CREATE TABLE IF NOT EXISTS public.stalls (
    id BIGSERIAL PRIMARY KEY,
    market_id BIGINT REFERENCES public.markets(id) ON DELETE SET NULL,
    section_id BIGINT REFERENCES public.sections(id) ON DELETE SET NULL,
    stall_no VARCHAR(100) NOT NULL UNIQUE,
    stall_type VARCHAR(100) NOT NULL,
    rate_category rate_category_enum NOT NULL DEFAULT 'NEW',
    dimensions VARCHAR(50) DEFAULT '3m x 3m',
    area_sqm NUMERIC(8, 2) DEFAULT 9.00,
    monthly_rent NUMERIC(12, 2) NOT NULL DEFAULT 1500.00,
    stall_rights_fee NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    status stall_status_enum NOT NULL DEFAULT 'AVAILABLE',
    map_coordinates JSONB, -- { x: number, y: number, lat?: number, lng?: number, polygon?: [] }
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    info VARCHAR(500),
    occupant_id BIGINT, -- Linked after occupancy creation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stalls_status ON public.stalls(status);
CREATE INDEX IF NOT EXISTS idx_stalls_section ON public.stalls(section_id);

-- ==============================================================================
-- 5. STAKEHOLDER AND APPLICATION MANAGEMENT
-- ==============================================================================

-- Stakeholders (Master Vendor profile)
CREATE TABLE IF NOT EXISTS public.stakeholders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    address TEXT NOT NULL,
    selected_stall_id BIGINT REFERENCES public.stalls(id) ON DELETE SET NULL,
    application_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    onboarding_status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    verified_tenant BOOLEAN NOT NULL DEFAULT FALSE,
    verified_stakeholder BOOLEAN NOT NULL DEFAULT FALSE,
    total_advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    advance_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    advance_payment_paid BOOLEAN NOT NULL DEFAULT FALSE,
    advance_payment_completed BOOLEAN NOT NULL DEFAULT FALSE,
    advance_payment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    advance_payment_date DATE,
    applicant_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
    treasurer_paid BOOLEAN NOT NULL DEFAULT FALSE,
    applicant_fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    applicant_fee_date DATE,
    market_supervisor_approved BOOLEAN NOT NULL DEFAULT FALSE,
    market_approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    bplo_approved BOOLEAN NOT NULL DEFAULT FALSE,
    bplo_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    endorsing_approved BOOLEAN NOT NULL DEFAULT FALSE,
    final_endorsed BOOLEAN NOT NULL DEFAULT FALSE,
    endorsement_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    endorsement_remarks TEXT,
    hazard_free_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    hazard_free_document_url TEXT,
    contract_id BIGINT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_on DATE,
    archived_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stakeholders_user ON public.stakeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_status ON public.stakeholders(application_status);
CREATE INDEX IF NOT EXISTS idx_stakeholders_stall ON public.stakeholders(selected_stall_id);

-- Formal Stakeholder Applications table
CREATE TABLE IF NOT EXISTS public.stakeholder_applications (
    id BIGSERIAL PRIMARY KEY,
    application_no VARCHAR(100) NOT NULL UNIQUE,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
    status application_status_enum NOT NULL DEFAULT 'PENDING_SUPERVISOR_REVIEW',
    current_holding_office VARCHAR(100) NOT NULL DEFAULT 'Market Supervisor',
    loi_url TEXT,
    valid_id_url TEXT,
    calculated_stall_rights_fee NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    calculated_advance_rent NUMERIC(12, 2) NOT NULL DEFAULT 3000.00, -- 2 months rent
    total_initial_amount_due NUMERIC(12, 2) NOT NULL DEFAULT 8000.00,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    supervisor_endorsed_at TIMESTAMPTZ,
    supervisor_remarks TEXT,
    mayor_approved_at TIMESTAMPTZ,
    mayor_decision VARCHAR(50),
    mayor_remarks TEXT,
    treasurer_receipt_no VARCHAR(100),
    treasurer_recorded_at TIMESTAMPTZ,
    contract_prepared_at TIMESTAMPTZ,
    contract_executed_at TIMESTAMPTZ,
    bplo_status VARCHAR(50) DEFAULT 'PENDING',
    bplo_approved_at TIMESTAMPTZ,
    bplo_remarks TEXT,
    endorsing_status VARCHAR(50) DEFAULT 'PENDING',
    endorsing_approved_at TIMESTAMPTZ,
    endorsing_remarks TEXT,
    hazard_free_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    hazard_free_document_url TEXT,
    permit_issued_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stakeholder Documents
CREATE TABLE IF NOT EXISTS public.stakeholder_documents (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    application_id BIGINT REFERENCES public.stakeholder_applications(id) ON DELETE SET NULL,
    document_type VARCHAR(100) NOT NULL, -- 'LOI', 'VALID_ID', 'HAZARD_FREE_CONFIRMATION', 'CONTRACT_PDF', 'PERMIT_PDF'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Approval History & Tracking
CREATE TABLE IF NOT EXISTS public.approval_history (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    application_id BIGINT REFERENCES public.stakeholder_applications(id) ON DELETE SET NULL,
    stage VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    action_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name VARCHAR(150),
    actor_role VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. LEGAL AND OCCUPANCY
-- ==============================================================================

-- Occupants (Active physical leaseholders)
CREATE TABLE IF NOT EXISTS public.occupants (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT UNIQUE NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    stall_id BIGINT REFERENCES public.stalls(id) ON DELETE RESTRICT,
    advance_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    contract_id BIGINT,
    occupancy_date DATE,
    occupied_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- Link stall to occupant
ALTER TABLE public.stalls 
    DROP CONSTRAINT IF EXISTS fk_stalls_occupant;
ALTER TABLE public.stalls
    ADD CONSTRAINT fk_stalls_occupant 
    FOREIGN KEY (occupant_id) REFERENCES public.occupants(id) ON DELETE SET NULL;

-- Contracts (Authoritative 3-Year Contract of Lease)
CREATE TABLE IF NOT EXISTS public.contracts (
    id BIGSERIAL PRIMARY KEY,
    contract_no VARCHAR(100) NOT NULL UNIQUE,
    occupant_id BIGINT NOT NULL REFERENCES public.occupants(id) ON DELETE RESTRICT,
    stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
    stakeholder_id BIGINT REFERENCES public.stakeholders(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL, -- Exactly 3 years from start date
    monthly_rent NUMERIC(12, 2) NOT NULL,
    billing_frequency VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
    terms TEXT,
    document_url TEXT,
    status contract_status_enum NOT NULL DEFAULT 'PENDING_APPROVAL',
    executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Occupancy Permits (Digital Permit with QR Verification)
CREATE TABLE IF NOT EXISTS public.occupancy_permits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permit_no VARCHAR(100) NOT NULL UNIQUE,
    vendor_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE RESTRICT,
    occupant_id BIGINT NOT NULL REFERENCES public.occupants(id) ON DELETE RESTRICT,
    stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
    contract_id BIGINT NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiration_date DATE NOT NULL,
    status permit_status_enum NOT NULL DEFAULT 'ACTIVE',
    qr_code_data TEXT NOT NULL,
    integrity_hash VARCHAR(128) NOT NULL, -- SHA-256 integrity hash of verified permit fields
    pdf_storage_path TEXT,
    revocation_reason TEXT,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permits_hash ON public.occupancy_permits(integrity_hash);
CREATE INDEX IF NOT EXISTS idx_permits_vendor ON public.occupancy_permits(vendor_id);
CREATE INDEX IF NOT EXISTS idx_permits_status ON public.occupancy_permits(status);

-- Permit Scan Logs
CREATE TABLE IF NOT EXISTS public.permit_scan_logs (
    id BIGSERIAL PRIMARY KEY,
    permit_id UUID REFERENCES public.occupancy_permits(id) ON DELETE CASCADE,
    scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scanner_role VARCHAR(50),
    scanner_ip VARCHAR(50),
    scan_type VARCHAR(50) NOT NULL DEFAULT 'PUBLIC', -- 'PUBLIC' or 'INSPECTOR'
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stall Inspections
CREATE TABLE IF NOT EXISTS public.stall_inspections (
    id BIGSERIAL PRIMARY KEY,
    stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    inspector_name VARCHAR(150),
    electrical_clearance BOOLEAN NOT NULL DEFAULT TRUE,
    structural_clearance BOOLEAN NOT NULL DEFAULT TRUE,
    fire_safety_clearance BOOLEAN NOT NULL DEFAULT TRUE,
    sanitation_clearance BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'PASSED', -- 'PASSED', 'FAILED', 'CONDITIONAL'
    remarks TEXT,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. FINANCIAL MANAGEMENT
-- ==============================================================================

-- Billings (Monthly Recurring Statements)
CREATE TABLE IF NOT EXISTS public.billings (
    id BIGSERIAL PRIMARY KEY,
    billing_no VARCHAR(100) NOT NULL UNIQUE,
    occupant_id BIGINT NOT NULL REFERENCES public.occupants(id) ON DELETE RESTRICT,
    contract_id BIGINT REFERENCES public.contracts(id) ON DELETE SET NULL,
    billing_period VARCHAR(50) NOT NULL, -- 'MONTHLY-10-2026'
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status billing_status_enum NOT NULL DEFAULT 'UNPAID',
    first_notice_sent_at TIMESTAMPTZ, -- 30-day delinquency notice
    second_notice_sent_at TIMESTAMPTZ, -- 60-day delinquency notice
    final_notice_sent_at TIMESTAMPTZ, -- 90-day final demand notice
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_billings_contract_period 
    ON public.billings(contract_id, billing_period) WHERE contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billings_status ON public.billings(status);
CREATE INDEX IF NOT EXISTS idx_billings_due ON public.billings(due_date);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    receipt_no VARCHAR(100) NOT NULL UNIQUE,
    reference_no VARCHAR(120),
    billing_id BIGINT REFERENCES public.billings(id) ON DELETE SET NULL,
    stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    payment_type payment_type_canonical_enum NOT NULL,
    payment_channel VARCHAR(50) NOT NULL DEFAULT 'CASH', -- 'CASH' (Treasury Window), 'FIELD_COLLECTOR' (Daily Micro-Collections)
    cashier_or_collector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cashier_name VARCHAR(150),
    remittance_id BIGINT,
    notes TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_stakeholder ON public.payments(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_payments_billing ON public.payments(billing_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments(receipt_no);

-- Official Receipts Table
CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id BIGSERIAL PRIMARY KEY,
    receipt_no VARCHAR(100) NOT NULL UNIQUE,
    payment_id BIGINT NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    payer_name VARCHAR(200) NOT NULL,
    stall_no VARCHAR(100) NOT NULL,
    amount_paid NUMERIC(12, 2) NOT NULL,
    payment_type VARCHAR(100) NOT NULL,
    issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pdf_url TEXT
);

-- Field Collection Remittances (Reconciliation of field collections to Treasury)
CREATE TABLE IF NOT EXISTS public.collection_remittances (
    id BIGSERIAL PRIMARY KEY,
    remittance_no VARCHAR(100) NOT NULL UNIQUE,
    collector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    collector_name VARCHAR(150) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    collection_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'RECONCILED', 'REJECTED'
    treasurer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reconciled_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Remittance Items (Individual field collections linked to a remittance batch)
CREATE TABLE IF NOT EXISTS public.collection_remittance_items (
    id BIGSERIAL PRIMARY KEY,
    remittance_id BIGINT NOT NULL REFERENCES public.collection_remittances(id) ON DELETE CASCADE,
    payment_id BIGINT NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    stall_no VARCHAR(100) NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL
);

-- ==============================================================================
-- 8. COMMUNICATIONS, BACKGROUND JOBS & SYSTEM SETTINGS
-- ==============================================================================

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_role VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(100),
    related_entity_type VARCHAR(100),
    related_entity_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Delivery Logs (Email & SMS tracking)
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT REFERENCES public.notifications(id) ON DELETE CASCADE,
    channel VARCHAR(30) NOT NULL, -- 'IN_APP', 'EMAIL', 'SMS'
    recipient VARCHAR(255) NOT NULL,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'DELIVERED', 'FAILED', 'PENDING'
    error_message TEXT,
    attempts INT NOT NULL DEFAULT 1,
    sent_at TIMESTAMPTZ
);

-- Background Jobs (Idempotent durable queue)
CREATE TABLE IF NOT EXISTS public.background_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_type VARCHAR(100) NOT NULL, -- 'MONTHLY_BILLING', 'DELINQUENCY_SCAN', 'EMAIL_DISPATCH'
    payload JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    last_error TEXT,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    system_name VARCHAR(255) DEFAULT 'Public Market of Manticao Rental Management System',
    municipality VARCHAR(100) DEFAULT 'Manticao, Misamis Oriental',
    office_name VARCHAR(100) DEFAULT 'Office of the Market Supervisor',
    treasury_office VARCHAR(100) DEFAULT 'Municipal Treasury Office',
    contact_phone VARCHAR(50) DEFAULT '+63 900 000 0000',
    contact_email VARCHAR(120) DEFAULT 'market.manticao@gov.ph',
    stall_rights_fee_old NUMERIC(12, 2) DEFAULT 3000.00,
    stall_rights_fee_new NUMERIC(12, 2) DEFAULT 5000.00,
    advance_rent_months INT DEFAULT 2,
    delinquency_grace_period_days INT DEFAULT 60,
    auto_generate_billing BOOLEAN DEFAULT TRUE,
    CONSTRAINT single_row_settings CHECK (id = 1)
);

INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupants ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user has role
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role_enum)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = required_role AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: check if authenticated user is municipal staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() 
        AND role::text IN ('MARKET_SUPERVISOR', 'MAYOR', 'TREASURER', 'COLLECTOR_INSPECTOR', 'ADMIN')
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Compatibility View for existing frontend code querying public.profiles
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    id,
    username,
    full_name AS name,
    email,
    role::text AS role,
    CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status,
    created_at,
    updated_at
FROM public.user_profiles;

-- Stalls & Sections are publicly readable, modifiable only by Market Supervisor & Admin
CREATE POLICY "Public read stalls" ON public.stalls FOR SELECT USING (true);
CREATE POLICY "Public read sections" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Public read markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Public read rental_rates" ON public.rental_rates FOR SELECT USING (true);
CREATE POLICY "Staff manage stalls" ON public.stalls FOR ALL USING (public.is_staff());
CREATE POLICY "Staff manage sections" ON public.sections FOR ALL USING (public.is_staff());
CREATE POLICY "Staff manage rental_rates" ON public.rental_rates FOR ALL USING (public.is_staff());

-- Stakeholder records
CREATE POLICY "Stakeholder view own record" ON public.stakeholders
    FOR SELECT USING (user_id = auth.uid() OR public.is_staff());
CREATE POLICY "Staff manage stakeholders" ON public.stakeholders
    FOR ALL USING (public.is_staff());

-- Applications
CREATE POLICY "Applicant view own applications" ON public.stakeholder_applications
    FOR SELECT USING (user_id = auth.uid() OR public.is_staff());
CREATE POLICY "Applicant submit application" ON public.stakeholder_applications
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff manage applications" ON public.stakeholder_applications
    FOR ALL USING (public.is_staff());

-- Occupancy Permits: Public can verify read-only via integrity hash or permit_no
CREATE POLICY "Public verify permit" ON public.occupancy_permits
    FOR SELECT USING (status = 'ACTIVE' OR public.is_staff());
CREATE POLICY "Staff manage permits" ON public.occupancy_permits
    FOR ALL USING (public.is_staff());

-- Billings: Tenant views own, Staff manages
CREATE POLICY "Tenant read own billings" ON public.billings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.occupants o
            JOIN public.stakeholders s ON s.id = o.stakeholder_id
            WHERE o.id = billings.occupant_id AND s.user_id = auth.uid()
        ) OR public.is_staff()
    );
CREATE POLICY "Staff manage billings" ON public.billings
    FOR ALL USING (public.is_staff());

-- Payments: Tenant views own, Treasurer & Staff manage
CREATE POLICY "Tenant read own payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stakeholders s
            WHERE s.id = payments.stakeholder_id AND s.user_id = auth.uid()
        ) OR public.is_staff()
    );
CREATE POLICY "Staff manage payments" ON public.payments
    FOR ALL USING (public.is_staff());

-- Audit logs: Read by Admin only, writable by authenticated
CREATE POLICY "Admin view audit logs" ON public.audit_logs
    FOR SELECT USING (public.has_role('ADMIN'));
CREATE POLICY "Authenticated create audit log" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- System Settings
CREATE POLICY "Public read system settings" ON public.system_settings
    FOR SELECT USING (true);
CREATE POLICY "Admin manage system settings" ON public.system_settings
    FOR ALL USING (public.has_role('ADMIN'));


-- ==============================================================================
-- STAGE 2: STORAGE BUCKET CONFIGURATION (for ID and Letter of Intent Uploads)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('uploads', 'uploads', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
    CREATE POLICY "Public read uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff manage uploads" ON storage.objects FOR ALL USING (bucket_id = 'uploads');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ==============================================================================
-- STAGE 4: MARKET & STALL SEED DATA
-- ==============================================================================

-- ==============================================================================
-- SEED DATA: PUBLIC MARKET OF MANTICAO
-- ==============================================================================

-- 1. Initialize Market
INSERT INTO public.markets (id, code, name, municipality, description)
VALUES (1, 'MANTICAO_CENTRAL', 'Public Market of Manticao', 'Manticao, Misamis Oriental', 'Central Municipal Public Market of Manticao')
ON CONFLICT (id) DO NOTHING;

-- 2. Initialize Market Sections
INSERT INTO public.sections (id, market_id, code, name, description, rate_category)
VALUES 
    (1, 1, 'SEC_WET', 'Wet Section (Fish & Meat)', 'Fresh seafood, pork, beef, and poultry stalls', 'NEW'),
    (2, 1, 'SEC_DRY', 'Dry Goods & Groceries', 'General merchandise, grains, canned goods, and textiles', 'OLD'),
    (3, 1, 'SEC_FOOD', 'Food Court & Eatery', 'Cooked meals, snacks, refreshments, and dining areas', 'NEW'),
    (4, 1, 'SEC_VEG', 'Vegetables & Fruits', 'Fresh agricultural produce and farm goods', 'OLD'),
    (5, 1, 'SEC_COMM', 'Commercial Perimeter Block', 'High-traffic road frontage stalls', 'NEW')
ON CONFLICT (id) DO NOTHING;

-- 3. Initialize Rental Rates
INSERT INTO public.rental_rates (id, section_id, stall_type, rate_category, base_monthly_rate, rate_per_sqm, stall_rights_fee, advance_months)
VALUES
    (1, 1, 'Wet Section Stall', 'NEW', 3500.00, 388.88, 5000.00, 2),
    (2, 2, 'Dry Goods Stall', 'OLD', 2000.00, 222.22, 3000.00, 2),
    (3, 3, 'Food Court Eatery', 'NEW', 4000.00, 444.44, 5000.00, 2),
    (4, 4, 'Vegetable & Fruit Stall', 'OLD', 1500.00, 166.66, 3000.00, 2),
    (5, 5, 'Commercial Perimeter Stall', 'NEW', 5000.00, 555.55, 6000.00, 2)
ON CONFLICT (id) DO NOTHING;

-- 4. Initialize Stalls with Visual Map Placement Coordinates
INSERT INTO public.stalls (id, market_id, section_id, stall_no, stall_type, rate_category, dimensions, area_sqm, monthly_rent, stall_rights_fee, status, map_coordinates)
VALUES
    (1, 1, 1, 'WS-01', 'Wet Section Stall', 'NEW', '3m x 3m', 9.00, 3500.00, 5000.00, 'AVAILABLE', '{"x": 120, "y": 80, "lat": 8.5291, "lng": 124.2882}'),
    (2, 1, 1, 'WS-02', 'Wet Section Stall', 'NEW', '3m x 3m', 9.00, 3500.00, 5000.00, 'AVAILABLE', '{"x": 180, "y": 80, "lat": 8.5292, "lng": 124.2883}'),
    (3, 1, 2, 'DG-01', 'Dry Goods Stall', 'OLD', '3m x 3m', 9.00, 2000.00, 3000.00, 'AVAILABLE', '{"x": 120, "y": 180, "lat": 8.5293, "lng": 124.2884}'),
    (4, 1, 2, 'DG-02', 'Dry Goods Stall', 'OLD', '3m x 3m', 9.00, 2000.00, 3000.00, 'AVAILABLE', '{"x": 180, "y": 180, "lat": 8.5294, "lng": 124.2885}'),
    (5, 1, 3, 'FC-01', 'Food Court Eatery', 'NEW', '4m x 3m', 12.00, 4000.00, 5000.00, 'AVAILABLE', '{"x": 280, "y": 100, "lat": 8.5295, "lng": 124.2886}'),
    (6, 1, 4, 'VG-01', 'Vegetable & Fruit Stall', 'OLD', '3m x 2m', 6.00, 1500.00, 3000.00, 'AVAILABLE', '{"x": 120, "y": 280, "lat": 8.5296, "lng": 124.2887}'),
    (7, 1, 5, 'CP-01', 'Commercial Perimeter Stall', 'NEW', '4m x 4m', 16.00, 5000.00, 6000.00, 'AVAILABLE', '{"x": 380, "y": 150, "lat": 8.5297, "lng": 124.2888}')
ON CONFLICT (id) DO NOTHING;

-- 5. System Settings Baseline
UPDATE public.system_settings
SET 
    system_name = 'Public Market of Manticao Rental Management System',
    municipality = 'Manticao, Misamis Oriental',
    office_name = 'Office of the Market Supervisor',
    treasury_office = 'Municipal Treasury Office',
    stall_rights_fee_old = 3000.00,
    stall_rights_fee_new = 5000.00,
    advance_rent_months = 2,
    delinquency_grace_period_days = 60,
    auto_generate_billing = TRUE
WHERE id = 1;


-- ==============================================================================
-- STAGE 5: MUNICIPAL STAFF AND ACTORS SEED ACCOUNTS
-- ==============================================================================

-- ==============================================================================
-- MUNICIPAL STAFF AND ACTORS SEED SCRIPT: PUBLIC MARKET OF MANTICAO
-- Seeds the 6 principal actors into auth.users and public.user_profiles
-- ==============================================================================

DO $$
DECLARE
  v_admin_id UUID := '8387ef47-c07f-4c2e-a952-51c3dd2789b4';
  v_supervisor_id UUID := 'a1111111-c07f-4c2e-a952-51c3dd2789b1';
  v_mayor_id UUID := 'c3333333-c07f-4c2e-a952-51c3dd2789b3';
  v_treasurer_id UUID := 'd4444444-c07f-4c2e-a952-51c3dd2789b4';
  v_collector_id UUID := 'e5555555-c07f-4c2e-a952-51c3dd2789b5';
  v_vendor_id UUID := 'f6666666-c07f-4c2e-a952-51c3dd2789b6';
  v_applicant_id UUID := 'b7777777-c07f-4c2e-a952-51c3dd2789b7';
  v_default_pw TEXT := extensions.crypt('AdminPassword123!', extensions.gen_salt('bf'));
BEGIN

  -- 1. System Administrator
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@manticao.market') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
      'admin@manticao.market', v_default_pw, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"admin","name":"System Administrator","role":"ADMIN"}',
      NOW(), NOW()
    );
  END IF;

  INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@manticao.market'),
    'admin', 'System Administrator', 'admin@manticao.market', 'ADMIN', TRUE
  ) ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', username = 'admin', is_active = TRUE;

  -- 2. Market Supervisor
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'supervisor@manticao.gov.ph') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_supervisor_id, 'authenticated', 'authenticated',
      'supervisor@manticao.gov.ph', v_default_pw, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"supervisor","name":"Office of the Market Supervisor","role":"MARKET_SUPERVISOR"}',
      NOW(), NOW()
    );
  END IF;

  INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'supervisor@manticao.gov.ph'),
    'supervisor', 'Office of the Market Supervisor', 'supervisor@manticao.gov.ph', 'MARKET_SUPERVISOR', TRUE
  ) ON CONFLICT (id) DO UPDATE SET role = 'MARKET_SUPERVISOR', username = 'supervisor', is_active = TRUE;

  -- 3. Municipal Mayor
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mayor@manticao.gov.ph') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_mayor_id, 'authenticated', 'authenticated',
      'mayor@manticao.gov.ph', v_default_pw, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"mayor","name":"Office of the Municipal Mayor","role":"MAYOR"}',
      NOW(), NOW()
    );
  END IF;

  INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'mayor@manticao.gov.ph'),
    'mayor', 'Office of the Municipal Mayor', 'mayor@manticao.gov.ph', 'MAYOR', TRUE
  ) ON CONFLICT (id) DO UPDATE SET role = 'MAYOR', username = 'mayor', is_active = TRUE;

  -- 4. Municipal Treasurer
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'treasurer@manticao.gov.ph') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_treasurer_id, 'authenticated', 'authenticated',
      'treasurer@manticao.gov.ph', v_default_pw, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"treasurer","name":"Municipal Treasury Office","role":"TREASURER"}',
      NOW(), NOW()
    );
  END IF;

  INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'treasurer@manticao.gov.ph'),
    'treasurer', 'Municipal Treasury Office', 'treasurer@manticao.gov.ph', 'TREASURER', TRUE
  ) ON CONFLICT (id) DO UPDATE SET role = 'TREASURER', username = 'treasurer', is_active = TRUE;

  -- 5. Field Market Collector / Inspector
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'collector@manticao.gov.ph') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_collector_id, 'authenticated', 'authenticated',
      'collector@manticao.gov.ph', v_default_pw, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"collector","name":"Field Market Collector & Inspector","role":"COLLECTOR_INSPECTOR"}',
      NOW(), NOW()
    );
  END IF;

  INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'collector@manticao.gov.ph'),
    'collector', 'Field Market Collector & Inspector', 'collector@manticao.gov.ph', 'COLLECTOR_INSPECTOR', TRUE
  ) ON CONFLICT (id) DO UPDATE SET role = 'COLLECTOR_INSPECTOR', username = 'collector', is_active = TRUE;

  -- 6. Active Vendor (Stakeholder)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vendor@manticao.market') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_vendor_id, 'authenticated', 'authenticated',
      'vendor@manticao.market', v_default_pw, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"vendor","name":"Maria Santos (Active Vendor)","role":"VENDOR"}',
      NOW(), NOW()
    );
  END IF;

  INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'vendor@manticao.market'),
    'vendor', 'Maria Santos (Active Vendor)', 'vendor@manticao.market', 'VENDOR', TRUE
  ) ON CONFLICT (id) DO UPDATE SET role = 'VENDOR', username = 'vendor', is_active = TRUE;

  -- 7. Prospective Applicant (Stakeholder)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'applicant@manticao.market') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_applicant_id, 'authenticated', 'authenticated',
      'applicant@manticao.market', v_default_pw, NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"applicant","name":"Juan Dela Cruz (Applicant)","role":"APPLICANT"}',
      NOW(), NOW()
    );
  END IF;

  INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'applicant@manticao.market'),
    'applicant', 'Juan Dela Cruz (Applicant)', 'applicant@manticao.market', 'APPLICANT', TRUE
  ) ON CONFLICT (id) DO UPDATE SET role = 'APPLICANT', username = 'applicant', is_active = TRUE;

END $$;

-- ==============================================================================
-- 9. COMPLETE SYSTEM WORKFLOW SCHEMA ENHANCEMENTS & RLS POLICIES
-- ==============================================================================

-- 9.1 CONTRACTS TABLE ENHANCEMENTS
ALTER TABLE public.contracts
    ADD COLUMN IF NOT EXISTS initial_payments_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS signed_by_stakeholder BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS signed_by_lgu BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lease_term_years INT DEFAULT 3,
    ADD COLUMN IF NOT EXISTS signed_document_url TEXT;

-- 9.2 STAKEHOLDER APPLICATIONS ENHANCEMENTS
ALTER TABLE public.stakeholder_applications
    ADD COLUMN IF NOT EXISTS mayor_approved_by VARCHAR(150),
    ADD COLUMN IF NOT EXISTS mayor_signed_document_url TEXT,
    ADD COLUMN IF NOT EXISTS initial_rights_fee_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS initial_advance_rent_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_permit_status VARCHAR(50) DEFAULT 'NOT_RECORDED';

-- 9.3 ADVANCE CREDITS TABLE (Held as credit until authorized allocation)
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
CREATE INDEX IF NOT EXISTS idx_advance_credits_status ON public.advance_credits(status);

-- 9.4 CREDIT ALLOCATIONS TABLE (Deductions from advance credit applied to specific bills)
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
CREATE INDEX IF NOT EXISTS idx_credit_allocations_billing ON public.credit_allocations(billing_id);

-- 9.5 NOTICES TABLE (Consecutive overdue notices after 2-month grace period)
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
CREATE INDEX IF NOT EXISTS idx_notices_type ON public.notices(notice_type);

-- 9.6 PERMISSIVE RLS POLICIES FOR STALLS & NEW TABLES
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "allow_all_stalls" ON public.stalls;
    CREATE POLICY "allow_all_stalls" ON public.stalls FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "allow_all_rental_rates" ON public.rental_rates;
    CREATE POLICY "allow_all_rental_rates" ON public.rental_rates FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "allow_all_advance_credits" ON public.advance_credits;
    CREATE POLICY "allow_all_advance_credits" ON public.advance_credits FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "allow_all_credit_allocations" ON public.credit_allocations;
    CREATE POLICY "allow_all_credit_allocations" ON public.credit_allocations FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "allow_all_notices" ON public.notices;
    CREATE POLICY "allow_all_notices" ON public.notices FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN NULL; END $$;

SELECT 'Master deploy_all script executed successfully with all workflow tables & RLS policies!' AS status;

