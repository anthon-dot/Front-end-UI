-- ==============================================================================
-- SUPABASE POSTGRESQL SCHEMA MIGRATION: MANTICAO UNIFIED APPLICATION FORM
-- Automates:
-- 1. Unified Application Form for Stall Rental/Occupancy (Sections I to VI)
-- 2. Official Letter of Intent (LOI) to Municipal Mayor Hon. Stephen S. Tan
-- 3. Multi-Office Evaluation:
--    - Market Office Evaluation (Mr. Edgar Eyana)
--    - Assessment & Treasury Recommendation (Naida Bebeth A. Magdayo)
--    - Final Recommendation & Mayoral Approval (Hon. Stephen S. Tan)
--    - Stall Assignment & Official Receipt Recording
--    - Applicant Undertaking & Acknowledgment
-- Target: Supabase PostgreSQL (Idempotent, non-destructive schema update)
-- ==============================================================================

-- 1. STAKEHOLDERS TABLE ENHANCEMENTS
ALTER TABLE public.stakeholders
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
    ADD COLUMN IF NOT EXISTS applicant_acknowledged_at TIMESTAMPTZ;

-- 2. STAKEHOLDER APPLICATIONS ENHANCEMENTS
ALTER TABLE public.stakeholder_applications
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
    
    -- Section VI.A: Market Office Evaluation
    ADD COLUMN IF NOT EXISTS market_office_status VARCHAR(50) DEFAULT 'Complete', -- 'Complete' | 'Incomplete'
    ADD COLUMN IF NOT EXISTS market_office_recommended_stall VARCHAR(50),
    ADD COLUMN IF NOT EXISTS market_office_section VARCHAR(100),
    ADD COLUMN IF NOT EXISTS market_office_nature VARCHAR(100),
    ADD COLUMN IF NOT EXISTS market_office_remarks TEXT,
    ADD COLUMN IF NOT EXISTS market_supervisor_name VARCHAR(150) DEFAULT 'MR. EDGAR EYANA',
    ADD COLUMN IF NOT EXISTS market_supervisor_evaluated_at TIMESTAMPTZ,
    
    -- Section VI.B: Assessment and Treasury Recommendation
    ADD COLUMN IF NOT EXISTS treasury_monthly_rent NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS treasury_other_fees NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS treasury_security_deposit NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS treasury_total_due NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS treasury_remarks TEXT,
    ADD COLUMN IF NOT EXISTS treasurer_name VARCHAR(150) DEFAULT 'NAIDA BEBETH A. MAGDAYO',
    ADD COLUMN IF NOT EXISTS treasurer_assessed_at TIMESTAMPTZ,
    
    -- Section VI.C: Final Recommendation
    ADD COLUMN IF NOT EXISTS final_recommendation_status VARCHAR(50) DEFAULT 'RECOMMENDED_FOR_APPROVAL', -- 'RECOMMENDED_FOR_APPROVAL' | 'NOT_RECOMMENDED'
    ADD COLUMN IF NOT EXISTS final_recommendation_remarks TEXT,
    ADD COLUMN IF NOT EXISTS final_recommendation_at TIMESTAMPTZ,
    
    -- Section VI.D: Mayoral Approval
    ADD COLUMN IF NOT EXISTS mayor_name VARCHAR(150) DEFAULT 'HON. STEPHEN S. TAN',
    ADD COLUMN IF NOT EXISTS mayor_conditions_remarks TEXT,
    
    -- Section VI.E: Stall Assignment and Payment
    ADD COLUMN IF NOT EXISTS assigned_stall_no VARCHAR(50),
    ADD COLUMN IF NOT EXISTS assigned_market_section VARCHAR(100),
    ADD COLUMN IF NOT EXISTS effectivity_of_occupancy DATE,
    ADD COLUMN IF NOT EXISTS assigned_monthly_rental NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS official_receipt_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS payment_receipt_date DATE,
    ADD COLUMN IF NOT EXISTS receipt_amount_paid NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS treasurer_verified_by VARCHAR(150) DEFAULT 'NAIDA BEBETH A. MAGDAYO',
    ADD COLUMN IF NOT EXISTS treasurer_verified_at TIMESTAMPTZ,
    
    -- Section VI.F: Acknowledgment of Applicant
    ADD COLUMN IF NOT EXISTS applicant_acknowledged BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS applicant_acknowledged_at TIMESTAMPTZ;

-- 3. COMMENTS FOR AUDIT & DOCUMENTATION
COMMENT ON COLUMN public.stakeholder_applications.nature_of_business IS 'Array of nature categories checked: Retail, Wholesale, Food/Cooked Food, Meat, Fish, Fruits & Vegetables, Dry Goods, Grocery, Others';
COMMENT ON COLUMN public.stakeholder_applications.stall_space_type IS 'Regular Stall or Table Space';
COMMENT ON COLUMN public.stakeholder_applications.undertaking_agreed IS 'Digital consent to the 10 statutory market occupant undertakings';

SELECT 'Migration 20261022_unified_application_form applied successfully' AS status;
