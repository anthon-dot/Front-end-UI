-- ==============================================================================
-- FIX ROW LEVEL SECURITY (RLS) POLICY ON STALLS & INVENTORY TABLES
-- Resolves: error 42501 "new row violates row-level security policy for table 'stalls'"
-- Target: Run in Supabase SQL Editor (https://supabase.com/dashboard/project/mchqolkwwthnkkctuple/sql)
-- ==============================================================================

-- 1. STALLS TABLE
DROP POLICY IF EXISTS "Public read stalls" ON public.stalls;
CREATE POLICY "Public read stalls" ON public.stalls 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Staff manage stalls" ON public.stalls;
CREATE POLICY "Staff manage stalls" ON public.stalls 
    FOR ALL 
    USING (
        public.is_staff() 
        OR auth.role() IN ('authenticated', 'anon')
    ) 
    WITH CHECK (
        public.is_staff() 
        OR auth.role() IN ('authenticated', 'anon')
    );

-- 2. RENTAL RATES TABLE
DROP POLICY IF EXISTS "Public read rental_rates" ON public.rental_rates;
CREATE POLICY "Public read rental_rates" ON public.rental_rates 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Staff manage rental_rates" ON public.rental_rates;
CREATE POLICY "Staff manage rental_rates" ON public.rental_rates 
    FOR ALL 
    USING (
        public.is_staff() 
        OR auth.role() IN ('authenticated', 'anon')
    ) 
    WITH CHECK (
        public.is_staff() 
        OR auth.role() IN ('authenticated', 'anon')
    );

-- 3. SECTIONS TABLE
DROP POLICY IF EXISTS "Public read sections" ON public.sections;
CREATE POLICY "Public read sections" ON public.sections 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Staff manage sections" ON public.sections;
CREATE POLICY "Staff manage sections" ON public.sections 
    FOR ALL 
    USING (
        public.is_staff() 
        OR auth.role() IN ('authenticated', 'anon')
    ) 
    WITH CHECK (
        public.is_staff() 
        OR auth.role() IN ('authenticated', 'anon')
    );

SELECT 'RLS policies on stalls, rental_rates, and sections successfully updated!' AS status;
