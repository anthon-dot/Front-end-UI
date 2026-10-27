-- ==============================================================================
-- MIGRATION: 20261021_fix_auth_and_profiles_rls.sql
-- Fixes:
-- 1. Adds missing RLS policies on public.user_profiles (SELECT, INSERT, UPDATE)
-- 2. Adds missing RLS policies on public.stakeholders (INSERT, UPDATE)
-- 3. Adds missing RLS policies on public.stakeholder_documents, approval_history, occupants, contracts, notifications
-- 4. Creates on_auth_user_created trigger on auth.users with SECURITY DEFINER
--    to automatically synchronize newly registered Supabase auth users to public.user_profiles
-- ==============================================================================

-- 1. Helper function: check if authenticated user is municipal staff
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

-- 2. User Profiles Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read user_profiles for auth" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Staff manage user_profiles" ON public.user_profiles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Public read user_profiles for auth" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (id = auth.uid() OR public.is_staff() OR auth.uid() IS NULL);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (id = auth.uid() OR public.is_staff());

CREATE POLICY "Staff manage user_profiles" ON public.user_profiles
    FOR ALL USING (public.is_staff());

-- 3. Stakeholder Records Policies
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Stakeholder view own record" ON public.stakeholders;
    DROP POLICY IF EXISTS "Stakeholder insert own record" ON public.stakeholders;
    DROP POLICY IF EXISTS "Stakeholder update own record" ON public.stakeholders;
    DROP POLICY IF EXISTS "Staff manage stakeholders" ON public.stakeholders;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Stakeholder view own record" ON public.stakeholders
    FOR SELECT USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "Stakeholder insert own record" ON public.stakeholders
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_staff() OR auth.uid() IS NULL);

CREATE POLICY "Stakeholder update own record" ON public.stakeholders
    FOR UPDATE USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "Staff manage stakeholders" ON public.stakeholders
    FOR ALL USING (public.is_staff());

-- 4. Stakeholder Documents Policies
ALTER TABLE public.stakeholder_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Stakeholder view own documents" ON public.stakeholder_documents;
    DROP POLICY IF EXISTS "Stakeholder insert documents" ON public.stakeholder_documents;
    DROP POLICY IF EXISTS "Staff manage documents" ON public.stakeholder_documents;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Stakeholder view own documents" ON public.stakeholder_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stakeholder_applications sa 
            WHERE sa.id = stakeholder_documents.application_id AND sa.user_id = auth.uid()
        ) OR public.is_staff()
    );

CREATE POLICY "Stakeholder insert documents" ON public.stakeholder_documents
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR public.is_staff());

CREATE POLICY "Staff manage documents" ON public.stakeholder_documents
    FOR ALL USING (public.is_staff());

-- 5. Approval History Policies
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read approval history" ON public.approval_history;
    DROP POLICY IF EXISTS "Staff manage approval history" ON public.approval_history;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Public read approval history" ON public.approval_history
    FOR SELECT USING (true);

CREATE POLICY "Staff manage approval history" ON public.approval_history
    FOR ALL USING (public.is_staff());

-- 6. Occupants Policies
ALTER TABLE public.occupants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read occupants" ON public.occupants;
    DROP POLICY IF EXISTS "Staff manage occupants" ON public.occupants;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Public read occupants" ON public.occupants
    FOR SELECT USING (true);

CREATE POLICY "Staff manage occupants" ON public.occupants
    FOR ALL USING (public.is_staff());

-- 7. Contracts Policies
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Stakeholder read own contracts" ON public.contracts;
    DROP POLICY IF EXISTS "Staff manage contracts" ON public.contracts;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Stakeholder read own contracts" ON public.contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stakeholders s 
            WHERE s.id = contracts.stakeholder_id AND s.user_id = auth.uid()
        ) OR public.is_staff()
    );

CREATE POLICY "Staff manage contracts" ON public.contracts
    FOR ALL USING (public.is_staff());

-- 8. Notifications Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Staff manage notifications" ON public.notifications;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "Users read own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "Staff manage notifications" ON public.notifications
    FOR ALL USING (public.is_staff());

-- 9. Automatic Trigger: Synchronize auth.users -> public.user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username text;
  v_role user_role_enum;
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

  INSERT INTO public.user_profiles (id, username, full_name, email, role, is_active)
  VALUES (
    new.id,
    v_username,
    v_fullname,
    new.email,
    v_role,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.user_profiles.username, EXCLUDED.username),
    full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Auth, user_profiles, stakeholders, and workflow RLS policies successfully updated' AS status;
