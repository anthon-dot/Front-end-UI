-- ============================================================================
-- DATABASE SCHEMA: RENTAL MANAGEMENT SYSTEM FOR THE PUBLIC MARKET OF MANTICAO
-- Engine: PostgreSQL 14+ / Supabase
-- Note: Excludes COLLECTOR_INSPECTOR role and related operations.
-- Fully aligned with Official Municipal LOI & Unified Application Form (5 Pages).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS, ROLES, AND SESSIONS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    role_id BIGSERIAL PRIMARY KEY,
    role_code VARCHAR(40) UNIQUE NOT NULL, 
    -- Exactly 5 roles (COLLECTOR_INSPECTOR removed per specification):
    -- 'STAKEHOLDER', 'MARKET_SUPERVISOR', 'MAYOR', 'TREASURER', 'ADMIN'
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (role_code, role_name, description) VALUES
('STAKEHOLDER', 'Applicant / Stall Holder', 'Applies for stalls, prints documents, monitors progress, views dues and contracts'),
('MARKET_SUPERVISOR', 'Market Supervisor', 'Evaluates stall availability, recommends spaces, assigns stalls, prepares contracts (Mr. Edgar Eyana)'),
('MAYOR', 'Municipal Mayor', 'Reviews Letters of Intent and application endorsements, grants municipal approval (Hon. Mayor Stephen S. Tan)'),
('TREASURER', 'Municipal Treasurer', 'Assesses rental/fees, collects payments strictly in cash, and issues Official Receipts (Naida Bebeth A. Magdayo)'),
('ADMIN', 'System Administrator', 'Manages system accounts, configurations, and audits system events')
ON CONFLICT (role_code) DO UPDATE SET 
    role_name = EXCLUDED.role_name, 
    description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(role_id),
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE,
    password_hash TEXT NOT NULL,
    account_status VARCHAR(20) DEFAULT 'PENDING' 
        CHECK (account_status IN ('PENDING', 'ACTIVE', 'LOCKED', 'DEACTIVATED')),
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token TEXT UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. STAKEHOLDERS & BUSINESS PROFILES (Section I & II of Unified Application Form)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stakeholders (
    stakeholder_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    civil_status VARCHAR(30) DEFAULT 'SINGLE' 
        CHECK (civil_status IN ('SINGLE', 'MARRIED', 'WIDOWED', 'SEPARATED')),
    citizenship VARCHAR(60) DEFAULT 'FILIPINO',
    residential_address TEXT NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    valid_id_type VARCHAR(60) NOT NULL,
    valid_id_number VARCHAR(80) NOT NULL,
    stakeholder_status VARCHAR(30) DEFAULT 'APPLICANT' 
        CHECK (stakeholder_status IN ('APPLICANT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'FORMER')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_profiles (
    business_profile_id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT NOT NULL REFERENCES stakeholders(stakeholder_id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL, -- Business / Trade Name
    organization_type VARCHAR(50) DEFAULT 'Sole Proprietor' 
        CHECK (organization_type IN ('Sole Proprietor', 'Partnership', 'Corporation', 'Cooperative', 'One Person Corporation')),
    nature_of_business VARCHAR(80) NOT NULL 
        CHECK (nature_of_business IN (
            'Retail', 
            'Wholesale', 
            'Food/Cooked Food', 
            'Meat', 
            'Fish', 
            'Fruits & Vegetables', 
            'Dry Goods', 
            'Grocery', 
            'Others'
        )),
    other_nature_of_business TEXT, -- Used when nature_of_business = 'Others'
    products_to_sell TEXT NOT NULL, -- Products / Commodities to be Sold
    estimated_employees INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. STALL INVENTORY & CATEGORIES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stall_types (
    stall_type_id BIGSERIAL PRIMARY KEY,
    type_name VARCHAR(60) UNIQUE NOT NULL, -- 'Regular Stall', 'Table Space'
    description TEXT,
    default_rate_per_sqm NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO stall_types (type_name, description, default_rate_per_sqm) VALUES
('Regular Stall', 'Enclosed partitioned compartment in the market building', 2300.00),
('Table Space', 'Open counter or designated market bench area', 1500.00)
ON CONFLICT (type_name) DO UPDATE SET 
    description = EXCLUDED.description,
    default_rate_per_sqm = EXCLUDED.default_rate_per_sqm;

CREATE TABLE IF NOT EXISTS stalls (
    stall_id BIGSERIAL PRIMARY KEY,
    stall_number VARCHAR(40) UNIQUE NOT NULL,
    stall_type_id BIGINT NOT NULL REFERENCES stall_types(stall_type_id),
    market_section VARCHAR(80) NOT NULL, 
    -- Dry Goods, Meat, Fish, Cooked Food/Carenderia, Fruits & Vegetables, Grocery
    phase_number VARCHAR(30), -- Phase 1, Phase 2, Phase 3, Phase 4
    floor_area_sqm NUMERIC(8, 2) NOT NULL,
    is_corner_stall BOOLEAN DEFAULT FALSE, -- Governs Stall Rights Fee: ₱7,000 corner vs ₱5,000 standard
    current_status VARCHAR(30) DEFAULT 'VACANT' 
        CHECK (current_status IN ('VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE', 'RESERVED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. APPLICATIONS, LOI & 5-PAGE UNIFIED APPLICATION FORM LIFECYCLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS applications (
    application_id BIGSERIAL PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    date_filed DATE NOT NULL DEFAULT CURRENT_DATE,
    stakeholder_id BIGINT NOT NULL REFERENCES stakeholders(stakeholder_id),
    business_profile_id BIGINT NOT NULL REFERENCES business_profiles(business_profile_id),
    preferred_stall_id BIGINT REFERENCES stalls(stall_id),
    preferred_stall_number VARCHAR(40),
    preferred_stall_type VARCHAR(60) DEFAULT 'Regular Stall'
        CHECK (preferred_stall_type IN ('Regular Stall', 'Table Space')),
    
    -- Structured LOI parameters (Addressed to Hon. Mayor Stephen S. Tan)
    loi_date DATE NOT NULL DEFAULT CURRENT_DATE,
    loi_addressee VARCHAR(150) NOT NULL DEFAULT 'HON. MAYOR STEPHEN S. TAN',
    loi_addressee_title VARCHAR(100) NOT NULL DEFAULT 'MUNICIPAL MAYOR',
    loi_addressee_lgu VARCHAR(100) NOT NULL DEFAULT 'MANTICAO, MISAMIS ORIENTAL',
    loi_target_location VARCHAR(150) NOT NULL, -- Target stall/space location at Manticao Public Market
    loi_business_purpose TEXT NOT NULL,        -- Purpose of establishing and operating
    
    -- Section IV: Documentary Requirements Submitted
    doc_unified_form_submitted BOOLEAN DEFAULT TRUE,
    doc_valid_id_submitted BOOLEAN DEFAULT TRUE,

    -- Section V: Undertaking of Applicant (10 statutory undertakings accepted)
    undertaking_accepted BOOLEAN DEFAULT FALSE,
    undertaking_signed_date DATE,

    -- Section VI.A: Market Office Evaluation (Market Supervisor Edgar Eyana)
    market_evaluation_status VARCHAR(30) DEFAULT 'PENDING'
        CHECK (market_evaluation_status IN ('PENDING', 'COMPLETE', 'INCOMPLETE')),
    recommended_stall_id BIGINT REFERENCES stalls(stall_id),
    recommended_stall_number VARCHAR(40),
    recommended_market_section VARCHAR(80),
    recommended_nature_of_business VARCHAR(80),
    evaluated_by BIGINT REFERENCES users(user_id),
    evaluation_remarks TEXT,
    evaluated_at TIMESTAMPTZ,
    
    -- Section VI.B: Treasury Assessment & Recommendation (Municipal Treasurer Naida Bebeth A. Magdayo)
    assessed_monthly_rental NUMERIC(12, 2) DEFAULT 0.00,
    assessed_other_fees NUMERIC(12, 2) DEFAULT 0.00,
    assessed_security_deposit NUMERIC(12, 2) DEFAULT 0.00,
    assessed_total_due NUMERIC(12, 2) DEFAULT 0.00,
    assessed_by BIGINT REFERENCES users(user_id),
    treasury_remarks TEXT,
    assessed_at TIMESTAMPTZ,

    -- Section VI.C: Final Recommendation
    final_recommendation VARCHAR(40) DEFAULT 'PENDING'
        CHECK (final_recommendation IN ('PENDING', 'RECOMMENDED_FOR_APPROVAL', 'NOT_RECOMMENDED_FOR_APPROVAL')),
    final_recommendation_remarks TEXT,
    treasurer_endorsed BOOLEAN DEFAULT FALSE,
    market_supervisor_endorsed BOOLEAN DEFAULT FALSE,
    
    -- Section VI.D: Mayor's Approval (Hon. Stephen S. Tan)
    mayor_approval_status VARCHAR(30) DEFAULT 'PENDING' 
        CHECK (mayor_approval_status IN ('PENDING', 'APPROVED', 'DISAPPROVED')),
    mayor_approved_by BIGINT REFERENCES users(user_id),
    mayor_conditions_remarks TEXT,
    mayor_acted_at TIMESTAMPTZ,

    -- Section VI.E: Stall Assignment and Payment Record
    assigned_stall_id BIGINT REFERENCES stalls(stall_id),
    assigned_market_section VARCHAR(80),
    occupancy_effectivity_date DATE,
    assigned_monthly_rental NUMERIC(12, 2),
    payment_official_receipt_no VARCHAR(60),
    payment_date DATE,
    payment_amount_paid NUMERIC(12, 2),
    payment_verified_by BIGINT REFERENCES users(user_id),

    -- Section VI.F: Acknowledgment of Applicant
    applicant_acknowledged BOOLEAN DEFAULT FALSE,
    applicant_acknowledged_date DATE,
    
    -- Overall Workflow Lifecycle Status
    application_status VARCHAR(50) DEFAULT 'SUBMITTED' 
        CHECK (application_status IN (
            'SUBMITTED',
            'APPROVED_BY_MAYOR',
            'ADVANCE_PAYMENT_SETTLED',
            'CONTRACT_ASSIGNED',
            'REGULATORY_FEE_PAID',
            'ACTIVE_OCCUPANT',
            'REJECTED'
        )),
    
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Scanned copies of physically signed official paper documents (ZERO digital signatures)
CREATE TABLE IF NOT EXISTS application_documents (
    document_id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    document_type VARCHAR(60) NOT NULL 
        CHECK (document_type IN (
            'SIGNED_LOI', 
            'VALID_GOVT_ID', 
            'SIGNED_UNIFIED_FORM', 
            'SIGNED_LEASE_CONTRACT',
            'DTI_SEC_CERTIFICATE',
            'MAYORS_BUSINESS_PERMIT',
            'SANITARY_PERMIT'
        )),
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    uploaded_by BIGINT NOT NULL REFERENCES users(user_id),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by BIGINT REFERENCES users(user_id),
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_status_history (
    history_id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(user_id),
    remarks TEXT,
    transition_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. CONTRACTS, STALL ASSIGNMENTS & REGISTERED HELPERS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS contracts (
    contract_id BIGSERIAL PRIMARY KEY,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    application_id BIGINT UNIQUE NOT NULL REFERENCES applications(application_id),
    stakeholder_id BIGINT NOT NULL REFERENCES stakeholders(stakeholder_id),
    stall_id BIGINT NOT NULL REFERENCES stalls(stall_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL, -- 5-year lease duration pursuant to Market Code Sec 6G.05
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' 
        CHECK (billing_cycle IN ('MONTHLY')),
    monthly_rental_rate NUMERIC(12, 2) NOT NULL,
    required_advance_rent NUMERIC(12, 2) NOT NULL, -- Equivalent to 2 months rent
    stall_rights_fee NUMERIC(12, 2) NOT NULL,      -- ₱7,000 for corner stall; ₱5,000 for other stalls
    contract_status VARCHAR(30) DEFAULT 'ACTIVE' 
        CHECK (contract_status IN ('ACTIVE', 'PRE_TERMINATED', 'EXPIRED', 'CANCELLED')),
    contract_file_path TEXT, -- Link to scanned physical lease agreement
    prepared_by BIGINT NOT NULL REFERENCES users(user_id), -- Market Supervisor
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stall_assignments (
    assignment_id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT UNIQUE NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
    stakeholder_id BIGINT NOT NULL REFERENCES stakeholders(stakeholder_id),
    stall_id BIGINT NOT NULL REFERENCES stalls(stall_id),
    assigned_by BIGINT NOT NULL REFERENCES users(user_id), -- Market Supervisor
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'RELINQUISHED', 'TERMINATED'))
);

CREATE TABLE IF NOT EXISTS stall_helpers (
    helper_id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    relationship_to_holder VARCHAR(50) NOT NULL, -- 'Spouse', 'Child', 'Parent', 'Hired Worker'
    residential_address TEXT NOT NULL,
    contact_number VARCHAR(30),
    mayor_approval_doc_path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. FINANCE: BILLINGS, STRICTLY CASH PAYMENTS, OFFICIAL RECEIPTS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS billings (
    billing_id BIGSERIAL PRIMARY KEY,
    billing_number VARCHAR(50) UNIQUE NOT NULL,
    stakeholder_id BIGINT NOT NULL REFERENCES stakeholders(stakeholder_id),
    stall_id BIGINT REFERENCES stalls(stall_id),
    contract_id BIGINT REFERENCES contracts(contract_id),
    application_id BIGINT REFERENCES applications(application_id),
    billing_type VARCHAR(50) NOT NULL 
        CHECK (billing_type IN (
            'ADVANCE_RENT', 
            'STALL_RIGHTS_FEE', 
            'MONTHLY_RENT', 
            'REGULATORY_FEE', 
            'PENALTY', 
            'UTILITY'
        )),
    billing_period_start DATE,
    billing_period_end DATE,
    due_date DATE NOT NULL,
    amount_due NUMERIC(12, 2) NOT NULL,
    amount_paid NUMERIC(12, 2) DEFAULT 0.00,
    balance NUMERIC(12, 2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
    billing_status VARCHAR(30) DEFAULT 'UNPAID' 
        CHECK (billing_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGSERIAL PRIMARY KEY,
    payment_reference VARCHAR(50) UNIQUE NOT NULL,
    stakeholder_id BIGINT NOT NULL REFERENCES stakeholders(stakeholder_id),
    contract_id BIGINT REFERENCES contracts(contract_id),
    application_id BIGINT REFERENCES applications(application_id),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH' 
        CHECK (payment_method = 'CASH'), -- STRICTLY CASH ONLY. NO GCASH/BANK/CARD
    amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by BIGINT NOT NULL REFERENCES users(user_id), -- Municipal Treasurer
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_receipts (
    receipt_id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT UNIQUE NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    official_receipt_number VARCHAR(60) UNIQUE NOT NULL, -- LGU Official Receipt (O.R.) Number
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by BIGINT NOT NULL REFERENCES users(user_id), -- Municipal Treasurer
    receipt_file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    allocation_id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    billing_id BIGINT NOT NULL REFERENCES billings(billing_id) ON DELETE CASCADE,
    allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount > 0),
    allocated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. EXTERNAL PERMIT RECORDS, NOTIFICATIONS & AUDIT LOGS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS external_permit_records (
    permit_record_id BIGSERIAL PRIMARY KEY,
    stakeholder_id BIGINT NOT NULL REFERENCES stakeholders(stakeholder_id),
    business_profile_id BIGINT NOT NULL REFERENCES business_profiles(business_profile_id),
    permit_tracking_number VARCHAR(80),
    bplo_status VARCHAR(40) DEFAULT 'EXTERNAL_PROCESSING',
    permit_issue_date DATE,
    permit_expiry_date DATE,
    permit_document_path TEXT,
    recorded_by BIGINT NOT NULL REFERENCES users(user_id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(60) NOT NULL,
    entity_id BIGINT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. INTEGRITY CONSTRAINTS & PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------

-- Enforce Market Code Sec 6H.03: A stallholder cannot hold more than two active stalls
CREATE UNIQUE INDEX IF NOT EXISTS idx_max_stalls_per_holder 
ON contracts (stakeholder_id, stall_id) 
WHERE contract_status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_stalls_status ON stalls(current_status);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(application_status);
CREATE INDEX IF NOT EXISTS idx_billings_status ON billings(billing_status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
