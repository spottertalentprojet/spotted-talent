-- Billing foundation for enterprise subscriptions, invoices and checkout tracking.

CREATE TABLE IF NOT EXISTS public.billing_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  legal_name TEXT,
  billing_email TEXT,
  vat_number TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'France',
  plan_id TEXT NOT NULL DEFAULT 'starter',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  addon_ids TEXT[] NOT NULL DEFAULT '{}',
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'past_due', 'canceled')),
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'failed', 'void')),
  amount_ht_cents INTEGER NOT NULL DEFAULT 0,
  amount_ttc_cents INTEGER NOT NULL DEFAULT 0,
  vat_rate NUMERIC(6,4) NOT NULL DEFAULT 0.2,
  currency TEXT NOT NULL DEFAULT 'EUR',
  period_label TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  stripe_invoice_id TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_checkout_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  addon_ids TEXT[] NOT NULL DEFAULT '{}',
  amount_ttc_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'canceled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_accounts_subscription_status_idx
  ON public.billing_accounts (subscription_status);

CREATE INDEX IF NOT EXISTS billing_invoices_user_id_issued_at_idx
  ON public.billing_invoices (user_id, issued_at DESC);

CREATE INDEX IF NOT EXISTS billing_checkout_events_user_id_created_at_idx
  ON public.billing_checkout_events (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_billing_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_billing_accounts_updated_at ON public.billing_accounts;
CREATE TRIGGER set_billing_accounts_updated_at
BEFORE UPDATE ON public.billing_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_billing_updated_at();

DROP TRIGGER IF EXISTS set_billing_checkout_events_updated_at ON public.billing_checkout_events;
CREATE TRIGGER set_billing_checkout_events_updated_at
BEFORE UPDATE ON public.billing_checkout_events
FOR EACH ROW
EXECUTE FUNCTION public.set_billing_updated_at();

ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_checkout_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Billing account owner can read" ON public.billing_accounts;
CREATE POLICY "Billing account owner can read"
ON public.billing_accounts
FOR SELECT
USING (
  public.is_admin_user()
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Billing account owner can insert" ON public.billing_accounts;
CREATE POLICY "Billing account owner can insert"
ON public.billing_accounts
FOR INSERT
WITH CHECK (
  public.is_admin_user()
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Billing account owner can update" ON public.billing_accounts;
CREATE POLICY "Billing account owner can update"
ON public.billing_accounts
FOR UPDATE
USING (
  public.is_admin_user()
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_admin_user()
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Billing invoices owner can read" ON public.billing_invoices;
CREATE POLICY "Billing invoices owner can read"
ON public.billing_invoices
FOR SELECT
USING (
  public.is_admin_user()
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Billing checkout owner can read" ON public.billing_checkout_events;
CREATE POLICY "Billing checkout owner can read"
ON public.billing_checkout_events
FOR SELECT
USING (
  public.is_admin_user()
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Billing checkout owner can insert" ON public.billing_checkout_events;
CREATE POLICY "Billing checkout owner can insert"
ON public.billing_checkout_events
FOR INSERT
WITH CHECK (
  public.is_admin_user()
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Billing checkout owner can update" ON public.billing_checkout_events;
CREATE POLICY "Billing checkout owner can update"
ON public.billing_checkout_events
FOR UPDATE
USING (
  public.is_admin_user()
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_admin_user()
  OR user_id = auth.uid()
);
