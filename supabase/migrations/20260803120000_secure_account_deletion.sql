-- Keep the minimum billing evidence required by law after an account deletion.
-- These tables are intentionally unavailable to browser clients.

CREATE TABLE IF NOT EXISTS public.billing_legal_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_invoice_id UUID NOT NULL UNIQUE,
  account_fingerprint TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_ht_cents INTEGER NOT NULL,
  amount_ttc_cents INTEGER NOT NULL,
  vat_rate NUMERIC(6,4) NOT NULL,
  currency TEXT NOT NULL,
  period_label TEXT,
  issued_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  stripe_invoice_id TEXT,
  legal_identity JSONB NOT NULL DEFAULT '{}'::jsonb,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retain_until TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS billing_legal_archives_retain_until_idx
  ON public.billing_legal_archives (retain_until);

ALTER TABLE public.billing_legal_archives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.billing_legal_archives FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.account_deletion_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_fingerprint TEXT NOT NULL,
  account_role TEXT,
  result TEXT NOT NULL CHECK (result IN ('started', 'completed', 'completed_with_cleanup_warning', 'failed')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS account_deletion_audit_requested_at_idx
  ON public.account_deletion_audit (requested_at DESC);

ALTER TABLE public.account_deletion_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.account_deletion_audit FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.billing_legal_archives IS
  'Facturation conservée hors espace utilisateur pendant la durée légale. Accès service_role uniquement.';

COMMENT ON TABLE public.account_deletion_audit IS
  'Traçabilité pseudonymisée des suppressions de compte. Aucun e-mail, nom ou identifiant utilisateur en clair.';
