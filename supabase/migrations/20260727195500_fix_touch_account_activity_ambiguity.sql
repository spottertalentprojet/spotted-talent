-- Fix ambiguous column names in account activity tracking.

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
  WHERE ars.user_id = v_user_id
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
