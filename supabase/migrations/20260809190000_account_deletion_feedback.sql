-- Store optional, pseudonymized departure feedback after a Talent deletes an account.
-- Raw account identity remains excluded from this audit table.

ALTER TABLE public.account_deletion_audit
  ADD COLUMN IF NOT EXISTS departure_reason TEXT,
  ADD COLUMN IF NOT EXISTS departure_feedback TEXT;

ALTER TABLE public.account_deletion_audit
  DROP CONSTRAINT IF EXISTS account_deletion_audit_departure_reason_check;

ALTER TABLE public.account_deletion_audit
  ADD CONSTRAINT account_deletion_audit_departure_reason_check
  CHECK (
    departure_reason IS NULL
    OR departure_reason IN (
      'found_job',
      'not_enough_relevant_offers',
      'difficult_to_use',
      'technical_issue',
      'privacy_concerns',
      'too_many_notifications',
      'no_longer_needed',
      'recreate_account',
      'other',
      'prefer_not_to_say'
    )
  );

ALTER TABLE public.account_deletion_audit
  DROP CONSTRAINT IF EXISTS account_deletion_audit_departure_feedback_length_check;

ALTER TABLE public.account_deletion_audit
  ADD CONSTRAINT account_deletion_audit_departure_feedback_length_check
  CHECK (departure_feedback IS NULL OR char_length(departure_feedback) <= 500);

CREATE INDEX IF NOT EXISTS account_deletion_audit_departure_reason_idx
  ON public.account_deletion_audit (departure_reason, requested_at DESC)
  WHERE departure_reason IS NOT NULL;

COMMENT ON COLUMN public.account_deletion_audit.departure_reason IS
  'Motif facultatif choisi par le talent au moment de supprimer son compte.';

COMMENT ON COLUMN public.account_deletion_audit.departure_feedback IS
  'Précision facultative, limitée à 500 caractères et sans identité de compte associée dans les interfaces.';

CREATE OR REPLACE FUNCTION public.get_account_deletion_feedback_summary(p_days INTEGER DEFAULT 90)
RETURNS TABLE (
  departure_reason TEXT,
  deletion_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER := LEAST(GREATEST(COALESCE(p_days, 90), 1), 730);
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT audit.departure_reason, count(*)::BIGINT
  FROM public.account_deletion_audit AS audit
  WHERE audit.account_role = 'talent'
    AND audit.departure_reason IS NOT NULL
    AND audit.result IN ('completed', 'completed_with_cleanup_warning')
    AND audit.requested_at >= now() - make_interval(days => v_days)
  GROUP BY audit.departure_reason
  ORDER BY count(*) DESC, audit.departure_reason;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_recent_account_deletion_feedback(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  requested_at TIMESTAMPTZ,
  departure_reason TEXT,
  departure_feedback TEXT,
  result TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    audit.requested_at,
    audit.departure_reason,
    audit.departure_feedback,
    audit.result
  FROM public.account_deletion_audit AS audit
  WHERE audit.account_role = 'talent'
    AND audit.departure_reason IS NOT NULL
    AND audit.result IN ('completed', 'completed_with_cleanup_warning')
  ORDER BY audit.requested_at DESC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_account_deletion_feedback_summary(INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_recent_account_deletion_feedback(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_account_deletion_feedback_summary(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_account_deletion_feedback(INTEGER) TO authenticated;
