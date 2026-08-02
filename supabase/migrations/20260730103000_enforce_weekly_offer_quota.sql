-- Enforce weekly offer publication quotas at the database boundary.

CREATE INDEX IF NOT EXISTS offres_entreprise_created_at_idx
  ON public.offres (entreprise_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_offer_plan_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_plan_rank INTEGER;
  v_active_count INTEGER;
  v_active_limit INTEGER;
  v_weekly_count INTEGER;
  v_weekly_limit INTEGER;
  v_week_start TIMESTAMPTZ := now() - interval '7 days';
  v_internal_refresh BOOLEAN := COALESCE(current_setting('app.billing_entitlement_refresh', true), '') = '1';
BEGIN
  v_plan := public.get_effective_enterprise_plan(NEW.entreprise_id);
  v_plan_rank := public.enterprise_plan_rank(v_plan);

  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  END IF;

  IF v_plan IS NULL AND NOT v_internal_refresh THEN
    RAISE EXCEPTION 'billing_plan_required';
  END IF;

  IF v_plan_rank < 2 THEN
    IF COALESCE(NEW.urgent, false) AND NOT v_internal_refresh THEN
      RAISE EXCEPTION 'feature_not_in_plan:urgent_badge';
    END IF;
    IF NEW.questions_preselection <> '[]'::jsonb AND NOT v_internal_refresh THEN
      RAISE EXCEPTION 'feature_not_in_plan:screening_questions';
    END IF;
    NEW.urgent := false;
    NEW.questions_preselection := '[]'::jsonb;
  END IF;

  NEW.priority_rank := CASE WHEN v_plan = 'premium' THEN 100 ELSE 0 END;

  IF TG_OP = 'INSERT'
     AND v_plan IN ('starter', 'boost')
     AND NOT v_internal_refresh THEN
    v_weekly_limit := CASE v_plan WHEN 'starter' THEN 1 WHEN 'boost' THEN 5 END;

    SELECT count(*)
      INTO v_weekly_count
      FROM public.offres o
      WHERE o.entreprise_id = NEW.entreprise_id
        AND o.created_at >= v_week_start;

    IF v_weekly_count >= v_weekly_limit THEN
      RAISE EXCEPTION 'weekly_offer_limit_reached:%', v_weekly_limit;
    END IF;
  END IF;

  IF NEW.statut = 'active'
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.statut IS DISTINCT FROM 'active'))
     AND v_plan IN ('starter', 'boost') THEN
    v_active_limit := CASE v_plan WHEN 'starter' THEN 1 WHEN 'boost' THEN 5 END;

    SELECT count(*)
      INTO v_active_count
      FROM public.offres o
      WHERE o.entreprise_id = NEW.entreprise_id
        AND o.statut = 'active'
        AND (TG_OP = 'INSERT' OR o.id <> NEW.id);

    IF v_active_count >= v_active_limit THEN
      RAISE EXCEPTION 'active_offer_limit_reached:%', v_active_limit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
