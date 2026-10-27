-- ==============================================================================
-- SUPABASE MIGRATION: 20261023_complete_unified_application_and_rls.sql
-- Municipal Public Market Rental Management System
-- Municipality of Manticao • Misamis Oriental
-- New Applicant Lifecycle (Steps 1 through 8)
-- ==============================================================================

-- 1. ENUM DEFINITIONS (SAFE CREATION)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STAKEHOLDER', 'MAYOR_OFFICE', 'TREASURY', 'MARKET_OFFICE', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE stall_status AS ENUM ('VACANT', 'RESERVED_PENDING', 'ASSIGNED', 'OCCUPIED');
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE app_step_status AS ENUM (
      'APPLICATION_SUBMITTED',     -- Step 1 & 2
      'MAYOR_REVIEW',             -- Step 3 pending
      'MAYOR_APPROVED',           -- Step 3 approved
      'MAYOR_DISAPPROVED',        -- Step 3 rejected
      'TREASURY_ASSESSED',        -- Step 4 ready for payment
      'INITIAL_FEES_PAID',        -- Step 4 payment confirmed
      'STALL_OFFICIALLY_ASSIGNED',-- Step 5 locked by Market Supervisor
      'CONTRACT_GENERATED',       -- Step 6 ready to download/wet-sign
      'LEASE_ACTIVE'              -- Step 7 & 8 verified and operational
    );
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 2. PROFILES TABLE (SYNCED WITH auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  civil_status TEXT CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Separated')),
  citizenship TEXT DEFAULT 'Filipino',
  residential_address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  role user_role DEFAULT 'STAKEHOLDER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STALLS CATALOG
CREATE TABLE IF NOT EXISTS public.stalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_number TEXT UNIQUE NOT NULL,
  section_name TEXT NOT NULL,       -- e.g. "Phase 3 and 4 / Dry Goods Section"
  stall_type TEXT NOT NULL CHECK (stall_type IN ('REGULAR_STALL', 'CORNER_STALL', 'TABLE_SPACE')),
  floor_area_sqm NUMERIC(5,2) DEFAULT 0,
  monthly_rental_rate NUMERIC(10,2) NOT NULL DEFAULT 2300.00,
  stall_rights_fee NUMERIC(10,2) NOT NULL DEFAULT 5000.00, -- 7,000 for Corner, 5,000 for Regular
  status stall_status DEFAULT 'VACANT',
  coordinates JSONB, -- For interactive map SVG
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INCUMBENT OFFICIALS (EDITABLE ACROSS ADMINISTRATIONS)
CREATE TABLE IF NOT EXISTS public.municipal_officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,       -- "HON. STEPHEN S. TAN"
  position_title TEXT NOT NULL,  -- "Municipal Mayor"
  is_incumbent BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. UNIFIED APPLICATIONS
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT UNIQUE NOT NULL, -- e.g. "APP-2026-0012"
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  selected_stall_id UUID NOT NULL REFERENCES public.stalls(id),
  
  -- Business Details
  trade_name TEXT NOT NULL,
  nature_of_business TEXT NOT NULL, -- Retail, Dry Goods, Food, etc.
  commodities_to_sell TEXT NOT NULL,
  estimated_employees INT DEFAULT 0,
  
  -- Identification Upload (One requirement only)
  valid_id_type TEXT NOT NULL,
  valid_id_number TEXT NOT NULL,
  valid_id_storage_path TEXT NOT NULL,
  
  -- Target Mayor at time of submission
  mayor_official_id UUID REFERENCES public.municipal_officials(id),
  statutory_undertaking_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Progress Tracking Status
  current_status app_step_status DEFAULT 'APPLICATION_SUBMITTED',
  
  -- Step 3: Mayoral Decision Fields
  mayor_decision_ref_no TEXT,
  mayor_decision_date DATE,
  mayor_remarks TEXT,
  
  -- Step 4: Treasury Assessment & Payment
  treasury_assessed_at TIMESTAMPTZ,
  treasury_or_number TEXT,
  treasury_payment_date DATE,
  stall_rights_paid NUMERIC(10,2) DEFAULT 0,
  advance_rent_paid NUMERIC(10,2) DEFAULT 0, -- Segregated 2-Month Advance Deposit
  treasury_recorded_by UUID REFERENCES public.profiles(id),
  
  -- Step 5: Market Supervisor Assignment
  market_evaluated_at TIMESTAMPTZ,
  market_supervisor_id UUID REFERENCES public.profiles(id),
  market_remarks TEXT,
  
  -- Step 6: Physical Signing Verification
  contract_number TEXT UNIQUE,
  contract_prepared_at TIMESTAMPTZ,
  physical_contract_verified_at TIMESTAMPTZ,
  contract_start_date DATE,
  contract_end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. APPLICATION NUMBER GENERATOR SEQUENCE & TRIGGER
CREATE SEQUENCE IF NOT EXISTS public.app_number_seq START 1;

CREATE OR REPLACE FUNCTION public.fn_generate_application_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
    NEW.application_number := 'APP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('public.app_number_seq')::TEXT, 4, '0');
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_application_number ON public.applications;
CREATE TRIGGER trg_generate_application_number
  BEFORE INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_generate_application_number();

-- 7. STALL STATUS & LEASE LIFECYCLE STATE MACHINE TRIGGER
CREATE OR REPLACE FUNCTION public.fn_handle_application_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- A. When newly submitted, lock stall to RESERVED_PENDING
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.stalls
    SET status = 'RESERVED_PENDING', updated_at = NOW()
    WHERE id = NEW.selected_stall_id;
  END IF;

  -- B. When updated, handle state transitions
  IF (TG_OP = 'UPDATE') THEN
    -- If Mayor disapproves, release the stall back to VACANT
    IF NEW.current_status = 'MAYOR_DISAPPROVED' AND (OLD.current_status IS DISTINCT FROM 'MAYOR_DISAPPROVED') THEN
      UPDATE public.stalls
      SET status = 'VACANT', updated_at = NOW()
      WHERE id = NEW.selected_stall_id;
    END IF;

    -- If Supervisor officially assigns, mark stall as ASSIGNED
    IF NEW.current_status = 'STALL_OFFICIALLY_ASSIGNED' AND (OLD.current_status IS DISTINCT FROM 'STALL_OFFICIALLY_ASSIGNED') THEN
      UPDATE public.stalls
      SET status = 'ASSIGNED', updated_at = NOW()
      WHERE id = NEW.selected_stall_id;
    END IF;

    -- If contract generated, generate contract number if absent
    IF NEW.current_status = 'CONTRACT_GENERATED' AND (NEW.contract_number IS NULL OR NEW.contract_number = '') THEN
      NEW.contract_number := 'CNT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
      NEW.contract_prepared_at := NOW();
      IF NEW.contract_start_date IS NULL THEN
        NEW.contract_start_date := CURRENT_DATE;
        NEW.contract_end_date := CURRENT_DATE + INTERVAL '5 years';
      END IF;
    END IF;

    -- Step 7 & 8: Automated Activation Check when moving to LEASE_ACTIVE
    IF NEW.current_status = 'LEASE_ACTIVE' AND (OLD.current_status IS DISTINCT FROM 'LEASE_ACTIVE') THEN
      -- Strict compliance validations:
      IF NEW.mayor_decision_ref_no IS NULL OR NEW.mayor_decision_ref_no = '' THEN
        RAISE EXCEPTION 'Cannot activate lease: Mayoral approval reference number is required.';
      END IF;

      IF NEW.treasury_or_number IS NULL OR NEW.treasury_or_number = '' THEN
        RAISE EXCEPTION 'Cannot activate lease: Treasury Official Receipt (OR) is required.';
      END IF;

      IF NEW.advance_rent_paid <= 0 THEN
        RAISE EXCEPTION 'Cannot activate lease: 2-Month advance rent deposit must be recorded.';
      END IF;

      IF NEW.physical_contract_verified_at IS NULL THEN
        RAISE EXCEPTION 'Cannot activate lease: Bilateral wet signature on physical contract must be verified.';
      END IF;

      -- Check no conflicting occupant currently occupying stall
      IF EXISTS (
        SELECT 1 FROM public.stalls
        WHERE id = NEW.selected_stall_id AND status = 'OCCUPIED'
      ) THEN
        RAISE EXCEPTION 'Cannot activate lease: Stall is already marked as OCCUPIED by another active contract.';
      END IF;

      -- Set stall to OCCUPIED
      UPDATE public.stalls
      SET status = 'OCCUPIED', updated_at = NOW()
      WHERE id = NEW.selected_stall_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_application_lifecycle ON public.applications;
CREATE TRIGGER trg_application_lifecycle
  BEFORE INSERT OR UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_handle_application_lifecycle();

-- 8. HELPER FUNCTION TO GET CURRENT USER ROLE
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipal_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- A. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.get_current_user_role() IN ('MAYOR_OFFICE', 'TREASURY', 'MARKET_OFFICE', 'ADMIN'));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- B. STALLS POLICIES
DROP POLICY IF EXISTS "Public and authenticated read for stalls catalog" ON public.stalls;
CREATE POLICY "Public and authenticated read for stalls catalog"
  ON public.stalls FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Market Office and Admin can manage stalls" ON public.stalls;
CREATE POLICY "Market Office and Admin can manage stalls"
  ON public.stalls FOR ALL
  USING (public.get_current_user_role() IN ('MARKET_OFFICE', 'ADMIN'))
  WITH CHECK (public.get_current_user_role() IN ('MARKET_OFFICE', 'ADMIN'));

-- C. MUNICIPAL OFFICIALS POLICIES
DROP POLICY IF EXISTS "Anyone can view incumbent officials" ON public.municipal_officials;
CREATE POLICY "Anyone can view incumbent officials"
  ON public.municipal_officials FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin and Mayor office manage officials" ON public.municipal_officials;
CREATE POLICY "Admin and Mayor office manage officials"
  ON public.municipal_officials FOR ALL
  USING (public.get_current_user_role() IN ('MAYOR_OFFICE', 'ADMIN'))
  WITH CHECK (public.get_current_user_role() IN ('MAYOR_OFFICE', 'ADMIN'));

-- D. APPLICATIONS POLICIES
DROP POLICY IF EXISTS "Stakeholders view own applications, Staff views all" ON public.applications;
CREATE POLICY "Stakeholders view own applications, Staff views all"
  ON public.applications FOR SELECT
  USING (
    auth.uid() = applicant_id 
    OR public.get_current_user_role() IN ('MAYOR_OFFICE', 'TREASURY', 'MARKET_OFFICE', 'ADMIN')
  );

DROP POLICY IF EXISTS "Stakeholders create own application" ON public.applications;
CREATE POLICY "Stakeholders create own application"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Stakeholders and Staff update applications based on role" ON public.applications;
CREATE POLICY "Stakeholders and Staff update applications based on role"
  ON public.applications FOR UPDATE
  USING (
    auth.uid() = applicant_id 
    OR public.get_current_user_role() IN ('MAYOR_OFFICE', 'TREASURY', 'MARKET_OFFICE', 'ADMIN')
  );

-- 10. STORAGE BUCKET CONFIGURATION ('application-documents')
-- Setup storage bucket for Single ID Upload
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents', 
  'application-documents', 
  false, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 10485760;

-- Storage RLS
DROP POLICY IF EXISTS "Applicants can upload application documents" ON storage.objects;
CREATE POLICY "Applicants can upload application documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'application-documents'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Applicants and Staff can view application documents" ON storage.objects;
CREATE POLICY "Applicants and Staff can view application documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'application-documents'
    AND (
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR public.get_current_user_role() IN ('MAYOR_OFFICE', 'TREASURY', 'MARKET_OFFICE', 'ADMIN')
    )
  );

-- 11. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    civil_status,
    citizenship,
    residential_address,
    contact_number,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'civil_status', 'Single'),
    COALESCE(NEW.raw_user_meta_data->>'citizenship', 'Filipino'),
    COALESCE(NEW.raw_user_meta_data->>'residential_address', NEW.raw_user_meta_data->>'address', 'Manticao, Misamis Oriental'),
    COALESCE(NEW.raw_user_meta_data->>'contact_number', NEW.raw_user_meta_data->>'phone', '09000000000'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'STAKEHOLDER'::public.user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 12. SEED OFFICIALS AND INITIAL STALLS DATA
INSERT INTO public.municipal_officials (full_name, position_title, is_incumbent)
VALUES 
  ('HON. STEPHEN S. TAN', 'Municipal Mayor', true),
  ('MR. EDGAR EYANA', 'Market Supervisor', true),
  ('NAIDA BEBETH A. MAGDAYO', 'Municipal Treasurer', true)
ON CONFLICT DO NOTHING;

-- Populate stalls across sections
INSERT INTO public.stalls (stall_number, section_name, stall_type, floor_area_sqm, monthly_rental_rate, stall_rights_fee, status, coordinates)
VALUES
  ('S-101', 'Phase 3 & 4 / Dry Goods Section', 'REGULAR_STALL', 12.00, 2300.00, 5000.00, 'VACANT', '{"x": 40, "y": 60, "width": 80, "height": 60, "zone": "Zone A"}'),
  ('S-102', 'Phase 3 & 4 / Dry Goods Section', 'REGULAR_STALL', 12.00, 2300.00, 5000.00, 'VACANT', '{"x": 130, "y": 60, "width": 80, "height": 60, "zone": "Zone A"}'),
  ('S-103', 'Phase 3 & 4 / Dry Goods Section', 'CORNER_STALL', 15.00, 2800.00, 7000.00, 'VACANT', '{"x": 220, "y": 60, "width": 90, "height": 60, "zone": "Zone A"}'),
  ('S-104', 'Phase 3 & 4 / Dry Goods Section', 'REGULAR_STALL', 12.00, 2300.00, 5000.00, 'VACANT', '{"x": 320, "y": 60, "width": 80, "height": 60, "zone": "Zone A"}'),
  ('S-201', 'Phase 1 / Wet Section (Fish & Meat)', 'REGULAR_STALL', 9.00, 2100.00, 5000.00, 'VACANT', '{"x": 40, "y": 140, "width": 80, "height": 60, "zone": "Zone B"}'),
  ('S-202', 'Phase 1 / Wet Section (Fish & Meat)', 'CORNER_STALL', 12.00, 2500.00, 7000.00, 'VACANT', '{"x": 130, "y": 140, "width": 80, "height": 60, "zone": "Zone B"}'),
  ('S-203', 'Phase 1 / Wet Section (Fish & Meat)', 'REGULAR_STALL', 9.00, 2100.00, 5000.00, 'VACANT', '{"x": 220, "y": 140, "width": 80, "height": 60, "zone": "Zone B"}'),
  ('S-301', 'Phase 2 / Commercial & Grocery', 'REGULAR_STALL', 14.00, 2600.00, 5000.00, 'VACANT', '{"x": 40, "y": 220, "width": 80, "height": 60, "zone": "Zone C"}'),
  ('S-302', 'Phase 2 / Commercial & Grocery', 'CORNER_STALL', 18.00, 3200.00, 7000.00, 'VACANT', '{"x": 130, "y": 220, "width": 90, "height": 60, "zone": "Zone C"}'),
  ('T-401', 'Open Court / Farmers Table Space', 'TABLE_SPACE', 6.00, 1200.00, 3000.00, 'VACANT', '{"x": 40, "y": 300, "width": 70, "height": 50, "zone": "Zone D"}'),
  ('T-402', 'Open Court / Farmers Table Space', 'TABLE_SPACE', 6.00, 1200.00, 3000.00, 'VACANT', '{"x": 120, "y": 300, "width": 70, "height": 50, "zone": "Zone D"}')
ON CONFLICT (stall_number) DO UPDATE SET
  section_name = EXCLUDED.section_name,
  monthly_rental_rate = EXCLUDED.monthly_rental_rate,
  stall_rights_fee = EXCLUDED.stall_rights_fee,
  status = EXCLUDED.status;
