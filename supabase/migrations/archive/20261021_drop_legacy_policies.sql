DROP POLICY IF EXISTS "bplo_manage_applications" ON public.stakeholder_applications;
DROP POLICY IF EXISTS "endorsing_manage_applications" ON public.stakeholder_applications;
DROP POLICY IF EXISTS "bplo_view_stakeholders" ON public.stakeholders;
DROP POLICY IF EXISTS "bplo_view_inspections" ON public.stall_inspections;
SELECT 'Legacy policies dropped' AS result;
