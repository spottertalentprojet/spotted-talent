-- Account inactivity protection: reminders, suspension after 30 days, and audit trail.

CREATE TABLE IF NOT EXISTS public.account_retention_status (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reminder_23d_sent_at TIMESTAMPTZ,
  reminder_29d_sent_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  reactivated_at TIMESTAMPTZ,
  deletion_warning_sent_at TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_retention_status_last_seen_at_idx
  ON public.account_retention_status (last_seen_at);

CREATE INDEX IF NOT EXISTS account_retention_status_suspended_at_idx
  ON public.account_retention_status (suspended_at)
  WHERE suspended_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.account_retention_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'activity_seen',
      'reminder_23d_sent',
      'reminder_29d_sent',
      'suspended_30d',
      'reactivated',
      'deletion_warning_sent',
      'anonymized',
      'retention_email_error'
    )
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_retention_events_user_created_at_idx
  ON public.account_retention_events (user_id, created_at DESC);

ALTER TABLE public.account_retention_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_retention_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.account_retention_status FROM anon, authenticated;
REVOKE ALL ON public.account_retention_events FROM anon, authenticated;

GRANT SELECT ON public.account_retention_status TO authenticated;
GRANT SELECT ON public.account_retention_events TO authenticated;

DROP POLICY IF EXISTS "Account retention visible to owner or admin" ON public.account_retention_status;
CREATE POLICY "Account retention visible to owner or admin"
ON public.account_retention_status
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS "Account retention events visible to owner or admin" ON public.account_retention_events;
CREATE POLICY "Account retention events visible to owner or admin"
ON public.account_retention_events
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_admin_user()
);

INSERT INTO public.account_retention_status (user_id, last_seen_at)
SELECT p.user_id, now()
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_account_retention_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.account_retention_status (user_id, last_seen_at)
  VALUES (NEW.user_id, now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_account_retention_status_on_profile ON public.profiles;
CREATE TRIGGER ensure_account_retention_status_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_account_retention_status();

CREATE OR REPLACE FUNCTION public.touch_account_activity(p_reactivate boolean DEFAULT false)
RETURNS TABLE (
  is_suspended boolean,
  suspended_at timestamptz,
  suspension_reason text,
  reactivated boolean,
  last_seen_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_status public.account_retention_status%ROWTYPE;
  v_reactivated boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.account_retention_status (user_id, last_seen_at)
  VALUES (v_user_id, now())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT *
  INTO v_status
  FROM public.account_retention_status ars
  WHERE ars.user_id = v_user_id
  FOR UPDATE;

  IF v_status.suspended_at IS NOT NULL AND NOT p_reactivate THEN
    RETURN QUERY SELECT true, v_status.suspended_at, v_status.suspension_reason, false, v_status.last_seen_at;
    RETURN;
  END IF;

  v_reactivated := v_status.suspended_at IS NOT NULL AND p_reactivate;

  UPDATE public.account_retention_status AS ars
  SET
    last_seen_at = now(),
    reminder_23d_sent_at = NULL,
    reminder_29d_sent_at = NULL,
    suspended_at = CASE WHEN p_reactivate THEN NULL ELSE ars.suspended_at END,
    suspension_reason = CASE WHEN p_reactivate THEN NULL ELSE ars.suspension_reason END,
    reactivated_at = CASE WHEN v_reactivated THEN now() ELSE ars.reactivated_at END,
    deletion_warning_sent_at = NULL,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING *
  INTO v_status;

  IF v_reactivated THEN
    INSERT INTO public.account_retention_events (user_id, event_type, metadata)
    VALUES (v_user_id, 'reactivated', jsonb_build_object('method', 'login'));
  END IF;

  RETURN QUERY SELECT false, v_status.suspended_at, v_status.suspension_reason, v_reactivated, v_status.last_seen_at;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_account_activity(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_account_activity(boolean) TO authenticated;
