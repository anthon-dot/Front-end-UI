-- Align the existing Supabase model with the current Mayor-first rental workflow.
-- The legacy stakeholder_applications path and the unified UUID applications
-- path are both still used by the frontend, so both must share the same states.

-- This compatibility view depends on stakeholder_applications.status. Recreate
-- it around the type conversion to avoid PostgreSQL dependency errors.
DROP VIEW IF EXISTS public.business_applications;

ALTER TABLE public.stakeholder_applications ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.stakeholder_applications
  ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
ALTER TABLE public.stakeholder_applications
  ALTER COLUMN status SET DEFAULT 'SUBMITTED',
  ALTER COLUMN current_holding_office SET DEFAULT 'Office of the Mayor';

CREATE VIEW public.business_applications AS
SELECT
    sa.*,
    s.business_name,
    s.business_type,
    s.first_name,
    s.middle_name,
    s.last_name,
    s.contact,
    s.email,
    s.address,
    st.stall_no,
    st.monthly_rent,
    st.stall_rights_fee AS stall_rights_amount
FROM public.stakeholder_applications sa
LEFT JOIN public.stakeholders s ON s.id = sa.stakeholder_id
LEFT JOIN public.stalls st ON st.id = sa.stall_id;

-- NewApplicationView writes unified UUID records here. Keep this table on the
-- same workflow so Mayor queue decisions and applicant tracking agree.
ALTER TABLE public.applications ALTER COLUMN current_status DROP DEFAULT;
ALTER TABLE public.applications
  ALTER COLUMN current_status TYPE VARCHAR(100) USING current_status::text;
ALTER TABLE public.applications ALTER COLUMN current_status SET DEFAULT 'SUBMITTED';
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS mayor_decision VARCHAR(30),
  ADD COLUMN IF NOT EXISTS mayor_approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS mayor_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mayor_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_loi_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_holding_office VARCHAR(100) NOT NULL DEFAULT 'Office of the Mayor',
  ADD COLUMN IF NOT EXISTS approval_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS initial_advance_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS initial_advance_receipt_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contract_file_path TEXT,
  ADD COLUMN IF NOT EXISTS contract_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS regulatory_fee_receipt_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS regulatory_fee_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

UPDATE public.applications
SET current_status = 'SUBMITTED', current_holding_office = 'Office of the Mayor'
WHERE current_status IN ('APPLICATION_SUBMITTED', 'MAYOR_REVIEW');

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

ALTER TABLE public.stakeholder_applications
  ADD COLUMN IF NOT EXISTS mayor_approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS mayor_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mayor_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS initial_advance_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS initial_advance_receipt_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contract_file_path TEXT,
  ADD COLUMN IF NOT EXISTS contract_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS regulatory_fee_receipt_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS regulatory_fee_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS application_id BIGINT REFERENCES public.stakeholder_applications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH',
  ADD COLUMN IF NOT EXISTS payment_stage VARCHAR(30);

ALTER TABLE public.payment_receipts
  ADD COLUMN IF NOT EXISTS official_receipt_number VARCHAR(100);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_receipts' AND column_name = 'receipt_no'
  ) THEN
    EXECUTE 'UPDATE public.payment_receipts SET official_receipt_number = receipt_no WHERE official_receipt_number IS NULL';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_receipts' AND column_name = 'receipt_number'
  ) THEN
    EXECUTE 'UPDATE public.payment_receipts SET official_receipt_number = receipt_number WHERE official_receipt_number IS NULL';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_receipts_official_number
  ON public.payment_receipts(official_receipt_number)
  WHERE official_receipt_number IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_cash_only_method') THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_cash_only_method
      CHECK (payment_method = 'CASH') NOT VALID;
  END IF;
END $$;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS lease_term_years INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS contract_file_path TEXT;

CREATE OR REPLACE FUNCTION public.activate_profile_after_application_fees_cleared()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.current_status = 'FEES_CLEARED' AND OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    NEW.current_status := 'ACTIVE_OCCUPANT';
    NEW.activated_at := COALESCE(NEW.activated_at, NOW());
    NEW.current_holding_office := 'Market Operations';
    UPDATE public.profiles
      SET account_status = 'ACTIVE', updated_at = NOW()
      WHERE id = NEW.applicant_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_profile_after_application_fees_cleared ON public.applications;
CREATE TRIGGER trg_activate_profile_after_application_fees_cleared
BEFORE UPDATE OF current_status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.activate_profile_after_application_fees_cleared();

CREATE TABLE IF NOT EXISTS public.stall_assignments (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL UNIQUE REFERENCES public.stakeholder_applications(id) ON DELETE CASCADE,
  stakeholder_id BIGINT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  stall_id BIGINT NOT NULL REFERENCES public.stalls(id) ON DELETE RESTRICT,
  contract_id BIGINT UNIQUE REFERENCES public.contracts(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effectivity_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'RELINQUISHED', 'TERMINATED'))
);

-- Current stage values from the approved process. Legacy values remain readable while
-- older records and integrations are migrated.
UPDATE public.stakeholder_applications
SET status = CASE
      WHEN status = 'PENDING_MAYOR_APPROVAL' AND mayor_decision IS NULL THEN 'SUBMITTED'
      WHEN status = 'PENDING_TREASURER_PAYMENT' THEN 'APPROVED_PENDING_ADVANCE_PAYMENT'
      WHEN status = 'PENDING_SUPERVISOR_REVIEW' AND COALESCE(amount_paid, 0) > 0 THEN 'ADVANCE_PAID'
      WHEN status = 'PENDING_SUPERVISOR_REVIEW' AND COALESCE(amount_paid, 0) = 0 AND mayor_decision IS NULL THEN 'SUBMITTED'
      WHEN status = 'PAID_READY_FOR_CONTRACT' AND supervisor_endorsed_at IS NOT NULL THEN 'CONTRACT_PREPARED'
      WHEN status = 'COMPLETED' THEN 'ACTIVE_OCCUPANT'
      ELSE status
    END,
    current_holding_office = CASE
      WHEN status = 'PENDING_MAYOR_APPROVAL' AND mayor_decision IS NULL THEN 'Office of the Mayor'
      WHEN status = 'PENDING_TREASURER_PAYMENT' THEN 'Municipal Treasury'
      WHEN status = 'PENDING_SUPERVISOR_REVIEW' AND COALESCE(amount_paid, 0) > 0 THEN 'Market Supervisor'
      ELSE current_holding_office
    END,
    updated_at = NOW()
WHERE status IN ('PENDING_MAYOR_APPROVAL', 'PENDING_TREASURER_PAYMENT', 'PENDING_SUPERVISOR_REVIEW', 'PAID_READY_FOR_CONTRACT', 'COMPLETED');

UPDATE public.stakeholder_applications
SET mayor_approval_status = CASE
  WHEN mayor_decision = 'APPROVED' OR loi_approval_status = 'APPROVED' THEN 'APPROVED'
  WHEN mayor_decision = 'REJECTED' OR loi_approval_status = 'REJECTED' THEN 'DISAPPROVED'
  ELSE 'PENDING'
END;

UPDATE public.stakeholders AS stakeholder
SET application_status = application.status
FROM public.stakeholder_applications AS application
WHERE application.stakeholder_id = stakeholder.id
  AND application.status IN ('SUBMITTED', 'APPROVED_PENDING_ADVANCE_PAYMENT', 'ADVANCE_PAID', 'CONTRACT_PREPARED', 'FEES_CLEARED', 'ACTIVE_OCCUPANT');

-- FEES_CLEARED is the activation gate. The applicant keeps tracking access; the full
-- stakeholder account becomes active only after the final fee is recorded.
CREATE OR REPLACE FUNCTION public.activate_stakeholder_after_fees_cleared()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'FEES_CLEARED' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status := 'ACTIVE_OCCUPANT';
    NEW.activated_at := COALESCE(NEW.activated_at, NOW());
    NEW.current_holding_office := 'Market Operations';

    UPDATE public.stakeholders
    SET application_status = 'ACTIVE_OCCUPANT',
        onboarding_status = 'FULLY_ONBOARDED',
        verified_tenant = TRUE,
        verified_stakeholder = TRUE,
        updated_at = NOW()
    WHERE id = NEW.stakeholder_id;

    UPDATE public.user_profiles
    SET account_status = 'ACTIVE', is_active = TRUE, updated_at = NOW()
    WHERE id = NEW.user_id;

    INSERT INTO public.notifications (stakeholder_id, user_id, title, message, notification_type)
    VALUES (
      NEW.stakeholder_id,
      NEW.user_id,
      'Market stall application complete',
      'Your market stall application is complete. Your stall contract and stakeholder dashboard are now accessible.',
      'APPROVAL_UPDATE'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_stakeholder_after_fees_cleared ON public.stakeholder_applications;
CREATE TRIGGER trg_activate_stakeholder_after_fees_cleared
BEFORE UPDATE OF status ON public.stakeholder_applications
FOR EACH ROW EXECUTE FUNCTION public.activate_stakeholder_after_fees_cleared();

ALTER TABLE public.stakeholders ALTER COLUMN application_status SET DEFAULT 'PENDING';
ALTER TABLE public.stakeholder_applications ALTER COLUMN incumbent_municipal_mayor DROP DEFAULT;
