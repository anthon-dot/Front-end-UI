-- ==============================================================================
-- DISABLE ROW LEVEL SECURITY (RLS) ON ALL SYSTEM TABLES
-- Use for development, prototyping, and live demonstration without permission blocks
-- ==============================================================================

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_permits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_scan_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stall_inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.billings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_remittances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_remittance_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;

SELECT 'RLS successfully disabled on all 22 public tables' AS status;
