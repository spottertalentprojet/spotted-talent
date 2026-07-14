-- Secure company identity and keep trial/subscription state server-controlled.

ALTER TABLE public.billing_accounts
  ADD COLUMN IF NOT EXISTS siret TEXT,
  ADD COLUMN IF NOT EXISTS siret_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS company_phone TEXT;

ALTER TABLE public.billing_accounts
  DROP CONSTRAINT IF EXISTS billing_accounts_siret_format_check;

ALTER TABLE public.billing_accounts
  ADD CONSTRAINT billing_accounts_siret_format_check
  CHECK (siret IS NULL OR siret ~ '^[0-9]{14}$');

CREATE UNIQUE INDEX IF NOT EXISTS billing_accounts_siret_unique_idx
  ON public.billing_accounts (siret)
  WHERE siret IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_verified_siret_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.siret_verified_at IS NOT NULL
     AND NEW.siret IS DISTINCT FROM OLD.siret THEN
    RAISE EXCEPTION 'verified_siret_is_locked';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_verified_siret_change_trigger ON public.billing_accounts;
CREATE TRIGGER prevent_verified_siret_change_trigger
BEFORE UPDATE ON public.billing_accounts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_verified_siret_change();

-- The browser may edit company/contact details and plan preferences only.
-- Stripe identifiers, trial locks and subscription dates remain server-controlled.
REVOKE INSERT, UPDATE ON public.billing_accounts FROM authenticated;

GRANT INSERT (
  user_id,
  legal_name,
  billing_email,
  vat_number,
  address_line1,
  address_line2,
  postal_code,
  city,
  country,
  company_phone,
  plan_id,
  billing_cycle,
  addon_ids
) ON public.billing_accounts TO authenticated;

GRANT UPDATE (
  user_id,
  legal_name,
  billing_email,
  vat_number,
  address_line1,
  address_line2,
  postal_code,
  city,
  country,
  company_phone,
  plan_id,
  billing_cycle,
  addon_ids
) ON public.billing_accounts TO authenticated;
