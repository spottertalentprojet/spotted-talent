-- Enforce cumulative enterprise plan rights at the database boundary.

ALTER TABLE public.offres
  ADD COLUMN IF NOT EXISTS questions_preselection JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS priority_rank SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE public.candidatures
  ADD COLUMN IF NOT EXISTS reponses_preselection JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS automated BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.offres
  DROP CONSTRAINT IF EXISTS offres_questions_preselection_check;

ALTER TABLE public.offres
  ADD CONSTRAINT offres_questions_preselection_check
  CHECK (
    jsonb_typeof(questions_preselection) = 'array'
    AND jsonb_array_length(questions_preselection) <= 5
    AND octet_length(questions_preselection::text) <= 12000
  );

ALTER TABLE public.candidatures
  DROP CONSTRAINT IF EXISTS candidatures_reponses_preselection_check;

ALTER TABLE public.candidatures
  ADD CONSTRAINT candidatures_reponses_preselection_check
  CHECK (
    jsonb_typeof(reponses_preselection) = 'array'
    AND octet_length(reponses_preselection::text) <= 20000
  );

CREATE INDEX IF NOT EXISTS offres_priority_rank_created_at_idx
  ON public.offres (priority_rank DESC, created_at DESC)
  WHERE statut = 'active';

CREATE OR REPLACE FUNCTION public.get_effective_enterprise_plan(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN b.subscription_status = 'trial'
      AND b.trial_plan_locked IN ('starter', 'boost', 'premium')
      AND b.trial_ends_at > now()
      THEN b.trial_plan_locked
    WHEN b.subscription_status = 'active'
      AND b.plan_id IN ('starter', 'boost', 'premium')
      THEN b.plan_id
    ELSE NULL
  END
  FROM public.billing_accounts b
  WHERE b.user_id = p_user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.enterprise_plan_rank(p_plan TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'starter' THEN 1
    WHEN 'boost' THEN 2
    WHEN 'premium' THEN 3
    ELSE 0
  END;
$$;

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
  v_internal_refresh BOOLEAN := COALESCE(current_setting('app.billing_entitlement_refresh', true), '') = '1';
BEGIN
  v_plan := public.get_effective_enterprise_plan(NEW.entreprise_id);
  v_plan_rank := public.enterprise_plan_rank(v_plan);

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

  IF NEW.statut = 'active'
     AND (TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM 'active')
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

DROP TRIGGER IF EXISTS enforce_offer_plan_entitlements_trigger ON public.offres;
CREATE TRIGGER enforce_offer_plan_entitlements_trigger
BEFORE INSERT OR UPDATE ON public.offres
FOR EACH ROW
EXECUTE FUNCTION public.enforce_offer_plan_entitlements();

CREATE OR REPLACE FUNCTION public.validate_screening_answers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_questions JSONB := '[]'::jsonb;
  v_normalized JSONB := '[]'::jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.reponses_preselection IS DISTINCT FROM OLD.reponses_preselection THEN
      RAISE EXCEPTION 'screening_answers_are_locked';
    END IF;
    RETURN NEW;
  END IF;

  SELECT COALESCE(o.questions_preselection, '[]'::jsonb)
    INTO v_questions
    FROM public.offres o
    WHERE o.id = NEW.offre_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'questionId', q.value ->> 'id',
        'question', q.value ->> 'label',
        'answer', COALESCE((
          SELECT r.value ->> 'answer'
          FROM jsonb_array_elements(COALESCE(NEW.reponses_preselection, '[]'::jsonb)) r
          WHERE r.value ->> 'questionId' = q.value ->> 'id'
          LIMIT 1
        ), '')
      )
      ORDER BY q.ordinality
    ),
    '[]'::jsonb
  )
  INTO v_normalized
  FROM jsonb_array_elements(v_questions) WITH ORDINALITY q(value, ordinality);

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_questions) q
    WHERE COALESCE((q ->> 'required')::boolean, false)
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(v_normalized) r
        WHERE r ->> 'questionId' = q ->> 'id'
          AND btrim(COALESCE(r ->> 'answer', '')) <> ''
      )
  ) THEN
    RAISE EXCEPTION 'required_screening_answer_missing';
  END IF;

  NEW.reponses_preselection := v_normalized;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_screening_answers_trigger ON public.candidatures;
CREATE TRIGGER validate_screening_answers_trigger
BEFORE INSERT OR UPDATE OF reponses_preselection ON public.candidatures
FOR EACH ROW
EXECUTE FUNCTION public.validate_screening_answers();

CREATE OR REPLACE FUNCTION public.create_automated_candidate_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_offer_title TEXT;
  v_plan TEXT;
  v_content TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.statut IS NOT DISTINCT FROM OLD.statut THEN
    RETURN NEW;
  END IF;

  SELECT o.entreprise_id, o.titre
    INTO v_company_id, v_offer_title
    FROM public.offres o
    WHERE o.id = NEW.offre_id;

  v_plan := public.get_effective_enterprise_plan(v_company_id);
  IF public.enterprise_plan_rank(v_plan) < 2 THEN
    RETURN NEW;
  END IF;

  v_content := CASE NEW.statut
    WHEN 'entretien' THEN 'Votre candidature pour « ' || v_offer_title || ' » passe en phase d''entretien. Nous vous contacterons prochainement.'
    WHEN 'acceptee' THEN 'Bonne nouvelle : votre candidature pour « ' || v_offer_title || ' » est acceptée. Consultez votre espace pour la suite.'
    WHEN 'refusee' THEN 'Votre candidature pour « ' || v_offer_title || ' » n''a pas été retenue. Merci pour votre intérêt.'
    ELSE 'Bonjour, votre candidature pour « ' || v_offer_title || ' » a bien été reçue et sera étudiée prochainement.'
  END;

  INSERT INTO public.messages (
    candidature_id,
    contenu,
    destinataire_id,
    expedition_id,
    lu,
    automated
  ) VALUES (
    NEW.id,
    v_content,
    NEW.talent_id,
    v_company_id,
    false,
    true
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_automated_candidate_message_trigger ON public.candidatures;
CREATE TRIGGER create_automated_candidate_message_trigger
AFTER INSERT OR UPDATE OF statut ON public.candidatures
FOR EACH ROW
EXECUTE FUNCTION public.create_automated_candidate_message();

CREATE OR REPLACE FUNCTION public.refresh_company_offer_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_plan_rank INTEGER;
BEGIN
  v_plan := public.get_effective_enterprise_plan(NEW.user_id);
  v_plan_rank := public.enterprise_plan_rank(v_plan);
  PERFORM set_config('app.billing_entitlement_refresh', '1', true);

  UPDATE public.offres
  SET
    urgent = CASE WHEN v_plan_rank >= 2 THEN urgent ELSE false END,
    questions_preselection = CASE WHEN v_plan_rank >= 2 THEN questions_preselection ELSE '[]'::jsonb END,
    priority_rank = CASE WHEN v_plan = 'premium' THEN 100 ELSE 0 END
  WHERE entreprise_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_company_offer_entitlements_trigger ON public.billing_accounts;
CREATE TRIGGER refresh_company_offer_entitlements_trigger
AFTER INSERT OR UPDATE OF plan_id, subscription_status, trial_plan_locked, trial_ends_at
ON public.billing_accounts
FOR EACH ROW
EXECUTE FUNCTION public.refresh_company_offer_entitlements();

-- Existing offers are aligned once when this migration is installed.
SELECT set_config('app.billing_entitlement_refresh', '1', true);

UPDATE public.offres o
SET
  urgent = CASE WHEN public.enterprise_plan_rank(public.get_effective_enterprise_plan(o.entreprise_id)) >= 2 THEN urgent ELSE false END,
  questions_preselection = CASE WHEN public.enterprise_plan_rank(public.get_effective_enterprise_plan(o.entreprise_id)) >= 2 THEN questions_preselection ELSE '[]'::jsonb END,
  priority_rank = CASE WHEN public.get_effective_enterprise_plan(o.entreprise_id) = 'premium' THEN 100 ELSE 0 END;

-- Billing identity and subscription rights must not be writable from the browser.
REVOKE INSERT (
  user_id, legal_name, billing_email, vat_number, address_line1, address_line2,
  postal_code, city, country, company_phone, plan_id, billing_cycle, addon_ids
) ON public.billing_accounts FROM authenticated;

REVOKE UPDATE (
  user_id, legal_name, billing_email, vat_number, address_line1, address_line2,
  postal_code, city, country, company_phone, plan_id, billing_cycle, addon_ids
) ON public.billing_accounts FROM authenticated;

GRANT INSERT (
  user_id, legal_name, billing_email, vat_number, address_line1, address_line2,
  postal_code, city, country, company_phone
) ON public.billing_accounts TO authenticated;

GRANT UPDATE (
  legal_name, billing_email, vat_number, address_line1, address_line2,
  postal_code, city, country, company_phone
) ON public.billing_accounts TO authenticated;

REVOKE ALL ON FUNCTION public.get_effective_enterprise_plan(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enterprise_plan_rank(TEXT) FROM PUBLIC;
