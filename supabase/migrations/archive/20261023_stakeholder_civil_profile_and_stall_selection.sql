-- ==============================================================================
-- SUPABASE POSTGRESQL SCHEMA MIGRATION:
-- Decoupled Stakeholder Civil Profile, Stall Map Selection & Unified Application
--
-- Architectural Separation:
-- Phase 0: System User Account Provisioning (users / user_profiles table)
-- Phase 1: Stakeholder Civil Profile (stakeholders table) & Interactive Stall Selection
-- Phase 2: Unified Digital Application & Auto-Compiled LOI (stakeholder_applications)
-- ==============================================================================

-- 1. ENHANCE STAKEHOLDERS TABLE (Phase 1 Citizen / Stakeholder Civil Profile)
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
    ADD COLUMN IF NOT EXISTS base_monthly_rental_rate NUMERIC(12, 2) DEFAULT 1500.00;

-- 2. ENHANCE STAKEHOLDER APPLICATIONS TABLE (Phase 2 Unified Digital Application)
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
    ADD COLUMN IF NOT EXISTS loi_document_upload_required BOOLEAN DEFAULT FALSE;

-- 3. ENSURE STALL STATUS 'HELD_FOR_APPLICATION' IS SUPPORTED OR HANDLED
-- (If stall_status_enum doesn't include HELD_FOR_APPLICATION, we can allow reservation lock)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'stall_status_enum' AND e.enumlabel = 'HELD_FOR_APPLICATION'
    ) THEN
        BEGIN
            ALTER TYPE stall_status_enum ADD VALUE 'HELD_FOR_APPLICATION';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
            WHEN others THEN NULL;
        END;
    END IF;
END $$;

-- 4. INDEXES FOR HIGH-THROUGHPUT SEARCHES
CREATE INDEX IF NOT EXISTS idx_stakeholders_civil_status ON public.stakeholders(civil_status);
CREATE INDEX IF NOT EXISTS idx_stakeholders_dob ON public.stakeholders(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_applications_ref_no ON public.stakeholder_applications(application_reference_no);
