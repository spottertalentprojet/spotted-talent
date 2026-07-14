-- Hide offers immediately when billing access expires and enforce downgrade quotas.

CREATE OR REPLACE FUNCTION public.is_offer_visible_to_talent(p_offer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offres o
    WHERE o.id = p_offer_id
      AND o.statut = 'active'
      AND public.get_effective_enterprise_plan(o.entreprise_id) IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_offer_visible_to_talent(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_offer_visible_to_talent(UUID) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can read visible offers" ON public.offres;
CREATE POLICY "Authenticated users can read visible offers"
ON public.offres
FOR SELECT
USING (
  public.is_admin_user()
  OR public.is_offer_visible_to_talent(id)
  OR entreprise_id = auth.uid()
  OR public.user_has_candidature_for_offre(id)
);

CREATE OR REPLACE FUNCTION public.refresh_company_offer_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_plan_rank INTEGER;
  v_active_limit INTEGER;
BEGIN
  v_plan := public.get_effective_enterprise_plan(NEW.user_id);
  v_plan_rank := public.enterprise_plan_rank(v_plan);
  v_active_limit := CASE v_plan
    WHEN 'starter' THEN 1
    WHEN 'boost' THEN 5
    WHEN 'premium' THEN NULL
    ELSE 0
  END;
  PERFORM set_config('app.billing_entitlement_refresh', '1', true);

  UPDATE public.offres
  SET
    urgent = CASE WHEN v_plan_rank >= 2 THEN urgent ELSE false END,
    questions_preselection = CASE WHEN v_plan_rank >= 2 THEN questions_preselection ELSE '[]'::jsonb END,
    priority_rank = CASE WHEN v_plan = 'premium' THEN 100 ELSE 0 END
  WHERE entreprise_id = NEW.user_id;

  IF v_active_limit IS NOT NULL THEN
    UPDATE public.offres
    SET statut = 'inactive'
    WHERE id IN (
      SELECT id
      FROM public.offres
      WHERE entreprise_id = NEW.user_id
        AND statut = 'active'
      ORDER BY created_at DESC, id DESC
      OFFSET v_active_limit
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_company_offer_entitlements_trigger ON public.billing_accounts;
CREATE TRIGGER refresh_company_offer_entitlements_trigger
AFTER INSERT OR UPDATE OF plan_id, subscription_status, trial_plan_locked, trial_ends_at
ON public.billing_accounts
FOR EACH ROW
EXECUTE FUNCTION public.refresh_company_offer_entitlements();

-- Align existing visible offers with the current server-side plan once.
SELECT set_config('app.billing_entitlement_refresh', '1', true);

UPDATE public.offres o
SET statut = 'inactive'
WHERE o.statut = 'active'
  AND public.get_effective_enterprise_plan(o.entreprise_id) IS NULL;

WITH ranked_offers AS (
  SELECT
    o.id,
    row_number() OVER (
      PARTITION BY o.entreprise_id
      ORDER BY o.created_at DESC, o.id DESC
    ) AS position,
    public.get_effective_enterprise_plan(o.entreprise_id) AS plan_id
  FROM public.offres o
  WHERE o.statut = 'active'
)
UPDATE public.offres o
SET statut = 'inactive'
FROM ranked_offers ranked
WHERE o.id = ranked.id
  AND (
    (ranked.plan_id = 'starter' AND ranked.position > 1)
    OR (ranked.plan_id = 'boost' AND ranked.position > 5)
  );
