-- ==============================================================================
-- SUPABASE POSTGRESQL SCHEMA MIGRATION: BPLO, ENDORSING OFFICE, AND MORESCO INTEGRATION
-- Target: Supabase PostgreSQL (Idempotent, non-destructive schema update)
-- ==============================================================================

-- 1. EXTEND ENUM TYPES (PostgreSQL 12+ supports ALTER TYPE ... ADD VALUE IF NOT EXISTS)
DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'BPLO';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'ENDORSING_OFFICE';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'COLLECTOR';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE stall_status_enum ADD VALUE IF NOT EXISTS 'OCCUPIED_PENDING_VERIFICATION';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE application_status_enum ADD VALUE IF NOT EXISTS 'CONTRACT_EXECUTED';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE application_status_enum ADD VALUE IF NOT EXISTS 'OCCUPIED_PENDING_VERIFICATION';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE application_status_enum ADD VALUE IF NOT EXISTS 'PENDING_BPLO_ASSESSMENT';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE application_status_enum ADD VALUE IF NOT EXISTS 'PENDING_BPLO_PAYMENT';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE application_status_enum ADD VALUE IF NOT EXISTS 'PENDING_BPLO_RELEASE';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE application_status_enum ADD VALUE IF NOT EXISTS 'BUSINESS_PERMIT_RELEASED';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE application_status_enum ADD VALUE IF NOT EXISTS 'PENDING_ENDORSING_REVIEW';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE application_status_enum ADD VALUE IF NOT EXISTS 'ENDORSING_REJECTED';
EXCEPTION WHEN others THEN NULL; END $$;

-- 2. ADD MORESCO AND BPLO COLUMNS TO stakeholder_applications
ALTER TABLE public.stakeholder_applications
    ADD COLUMN IF NOT EXISTS moresco_clearance_url TEXT,
    ADD COLUMN IF NOT EXISTS business_permit_fee_assessed NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS business_permit_fee_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_permit_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_permit_released BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_permit_released_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS business_permit_receipt_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS inspection_notes TEXT,
    ADD COLUMN IF NOT EXISTS inspection_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS inspected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. ADD MORESCO AND BPLO COLUMNS TO stakeholders
ALTER TABLE public.stakeholders
    ADD COLUMN IF NOT EXISTS moresco_clearance_url TEXT,
    ADD COLUMN IF NOT EXISTS business_permit_fee_assessed NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS business_permit_fee_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_permit_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS business_permit_released BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS business_permit_released_at TIMESTAMPTZ;

-- 4. ADD MORESCO COLUMN TO occupancy_permits
ALTER TABLE public.occupancy_permits
    ADD COLUMN IF NOT EXISTS moresco_clearance_url TEXT;

-- 5. RLS POLICIES FOR BPLO AND ENDORSING_OFFICE ROLES
-- Applications
DO $$ BEGIN
    CREATE POLICY "bplo_manage_applications" ON public.stakeholder_applications
        FOR ALL USING (
            auth.jwt() ->> 'role' IN ('ADMIN', 'BPLO', 'BPLO_STAFF')
        ) WITH CHECK (
            auth.jwt() ->> 'role' IN ('ADMIN', 'BPLO', 'BPLO_STAFF')
        );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "endorsing_manage_applications" ON public.stakeholder_applications
        FOR ALL USING (
            auth.jwt() ->> 'role' IN ('ADMIN', 'ENDORSING_OFFICE')
        ) WITH CHECK (
            auth.jwt() ->> 'role' IN ('ADMIN', 'ENDORSING_OFFICE')
        );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Stakeholders
DO $$ BEGIN
    CREATE POLICY "bplo_view_stakeholders" ON public.stakeholders
        FOR SELECT USING (
            auth.jwt() ->> 'role' IN ('ADMIN', 'BPLO', 'BPLO_STAFF', 'ENDORSING_OFFICE')
        );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Stall Inspections
DO $$ BEGIN
    CREATE POLICY "bplo_view_inspections" ON public.stall_inspections
        FOR SELECT USING (
            auth.jwt() ->> 'role' IN ('ADMIN', 'BPLO', 'BPLO_STAFF')
        );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create index on application status for faster workflow queries
CREATE INDEX IF NOT EXISTS idx_stakeholder_applications_bplo_status
    ON public.stakeholder_applications(status);
