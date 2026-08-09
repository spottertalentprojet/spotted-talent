-- Offer compliance, traceability and DSA-style notice/action workflow.

ALTER TABLE public.offres
  ADD COLUMN IF NOT EXISTS experience_requise TEXT,
  ADD COLUMN IF NOT EXISTS duree_contrat TEXT,
  ADD COLUMN IF NOT EXISTS motif_contrat_temporaire TEXT,
  ADD COLUMN IF NOT EXISTS remuneration_periode TEXT,
  ADD COLUMN IF NOT EXISTS employer_certified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employer_certification_version TEXT,
  ADD COLUMN IF NOT EXISTS compliance_version TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS public_reference TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.offres
  DROP CONSTRAINT IF EXISTS offres_remuneration_periode_check,
  ADD CONSTRAINT offres_remuneration_periode_check
    CHECK (remuneration_periode IS NULL OR remuneration_periode IN ('hourly', 'daily', 'monthly', 'annual')),
  DROP CONSTRAINT IF EXISTS offres_moderation_status_check,
  ADD CONSTRAINT offres_moderation_status_check
    CHECK (moderation_status IN ('published', 'under_review', 'suspended')),
  DROP CONSTRAINT IF EXISTS offres_salary_pair_check,
  ADD CONSTRAINT offres_salary_pair_check
    CHECK ((salaire_min IS NULL AND salaire_max IS NULL) OR (salaire_min IS NOT NULL AND salaire_max IS NOT NULL)) NOT VALID,
  DROP CONSTRAINT IF EXISTS offres_salary_range_check,
  ADD CONSTRAINT offres_salary_range_check
    CHECK (salaire_min IS NULL OR (salaire_min >= 0 AND salaire_max >= salaire_min)) NOT VALID;

UPDATE public.offres
SET public_reference = COALESCE(
      NULLIF(btrim(public_reference), ''),
      'ST-' || to_char(created_at, 'YYYY') || '-' || upper(left(replace(id::text, '-', ''), 8))
    ),
    updated_at = created_at
WHERE compliance_version IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS offres_public_reference_unique_idx
  ON public.offres (public_reference)
  WHERE public_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS offres_visibility_expiration_idx
  ON public.offres (statut, moderation_status, expires_at);

CREATE OR REPLACE FUNCTION public.normalize_offer_compliance_text(p_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(translate(COALESCE(p_value, ''),
    'àâäáãåçèéêëìíîïñòóôöõùúûüýÿœæ',
    'aaaaaaceeeeiiiinooooouuuuyyoea'));
$$;

CREATE OR REPLACE FUNCTION public.enforce_offer_compliance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_validate BOOLEAN := TG_OP = 'INSERT';
  v_content TEXT;
  v_word_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_validate := OLD.compliance_version IS NOT NULL
      OR NEW.statut = 'active' AND OLD.statut IS DISTINCT FROM 'active'
      OR ROW(
        NEW.titre, NEW.contrat, NEW.secteur, NEW.localisation, NEW.description,
        NEW.competences, NEW.diplome, NEW.salaire_min, NEW.salaire_max,
        NEW.questions_preselection, NEW.experience_requise, NEW.duree_contrat,
        NEW.motif_contrat_temporaire, NEW.remuneration_periode
      ) IS DISTINCT FROM ROW(
        OLD.titre, OLD.contrat, OLD.secteur, OLD.localisation, OLD.description,
        OLD.competences, OLD.diplome, OLD.salaire_min, OLD.salaire_max,
        OLD.questions_preselection, OLD.experience_requise, OLD.duree_contrat,
        OLD.motif_contrat_temporaire, OLD.remuneration_periode
      );
  END IF;

  NEW.updated_at := now();

  IF TG_OP = 'INSERT' THEN
    NEW.public_reference := COALESCE(
      NULLIF(btrim(NEW.public_reference), ''),
      'ST-' || to_char(now(), 'YYYY') || '-' || upper(left(replace(NEW.id::text, '-', ''), 8))
    );
    NEW.moderation_status := COALESCE(NEW.moderation_status, 'published');
  END IF;

  IF NOT v_validate THEN
    RETURN NEW;
  END IF;

  IF NEW.statut = 'active' AND NEW.moderation_status = 'suspended' THEN
    RAISE EXCEPTION 'offer_compliance:moderation_suspended';
  END IF;

  IF btrim(COALESCE(NEW.titre, '')) = '' OR char_length(btrim(NEW.titre)) < 3 THEN
    RAISE EXCEPTION 'offer_compliance:title_required';
  END IF;
  IF btrim(COALESCE(NEW.localisation, '')) = '' THEN
    RAISE EXCEPTION 'offer_compliance:location_required';
  END IF;
  IF btrim(COALESCE(NEW.secteur, '')) = '' THEN
    RAISE EXCEPTION 'offer_compliance:sector_required';
  END IF;
  IF NEW.contrat IS NULL OR NEW.contrat NOT IN ('CDI', 'CDD', 'Intérim', 'Alternance', 'Stage') THEN
    RAISE EXCEPTION 'offer_compliance:invalid_contract';
  END IF;
  IF btrim(COALESCE(NEW.experience_requise, '')) = '' THEN
    RAISE EXCEPTION 'offer_compliance:experience_required';
  END IF;
  IF NEW.contrat IN ('CDD', 'Intérim', 'Alternance', 'Stage') AND btrim(COALESCE(NEW.duree_contrat, '')) = '' THEN
    RAISE EXCEPTION 'offer_compliance:duration_required';
  END IF;
  IF NEW.contrat = 'CDD' AND btrim(COALESCE(NEW.motif_contrat_temporaire, '')) = '' THEN
    RAISE EXCEPTION 'offer_compliance:temporary_reason_required';
  END IF;
  IF NEW.salaire_min IS NOT NULL AND NEW.remuneration_periode IS NULL THEN
    RAISE EXCEPTION 'offer_compliance:salary_period_required';
  END IF;
  IF NEW.employer_certified_at IS NULL OR btrim(COALESCE(NEW.employer_certification_version, '')) = '' THEN
    RAISE EXCEPTION 'offer_compliance:employer_confirmation_required';
  END IF;

  v_word_count := COALESCE(array_length(regexp_split_to_array(btrim(COALESCE(NEW.description, '')), '\s+'), 1), 0);
  IF v_word_count < 60 THEN
    RAISE EXCEPTION 'offer_compliance:description_too_short';
  END IF;

  v_content := public.normalize_offer_compliance_text(
    concat_ws(' ', NEW.titre, NEW.description, COALESCE(NEW.questions_preselection::text, ''))
  );
  IF v_content ~ '\m(homme|hommes|femme|femmes)\s+uniquement\M'
    OR v_content ~ '\mreserve(e|es|s)?\s+au(x)?\s+(homme|hommes|femme|femmes)\M'
    OR v_content ~ '\m(moins de|maximum|max\.?|age maximum)\s+[0-9]{2}\s+ans\M'
    OR v_content ~ '\m(sans enfant|celibataire uniquement|marie uniquement|mariee uniquement)\M'
    OR v_content ~ '\m(nationalite francaise obligatoire|francais de souche|sans handicap)\M'
    OR v_content ~ '\m(frais de candidature|payer pour postuler|paiement pour postuler)\M'
    OR v_content ~ '(^|[^0-9])0(81|82|89)[0-9]([ .-]?[0-9]{2}){3}([^0-9]|$)'
  THEN
    RAISE EXCEPTION 'offer_compliance:prohibited_content';
  END IF;

  NEW.compliance_version := '2026-08-09';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_offer_compliance_trigger ON public.offres;
CREATE TRIGGER enforce_offer_compliance_trigger
BEFORE INSERT OR UPDATE ON public.offres
FOR EACH ROW EXECUTE FUNCTION public.enforce_offer_compliance();

-- Only company accounts may write their own offers through the public API.
DROP POLICY IF EXISTS "Entreprise can insert own offers" ON public.offres;
CREATE POLICY "Entreprise can insert own offers"
ON public.offres
FOR INSERT
WITH CHECK (
  public.is_admin_user()
  OR (entreprise_id = auth.uid() AND public.current_user_role() = 'entreprise')
);

DROP POLICY IF EXISTS "Entreprise can update own offers" ON public.offres;
CREATE POLICY "Entreprise can update own offers"
ON public.offres
FOR UPDATE
USING (
  public.is_admin_user()
  OR (entreprise_id = auth.uid() AND public.current_user_role() = 'entreprise')
)
WITH CHECK (
  public.is_admin_user()
  OR (entreprise_id = auth.uid() AND public.current_user_role() = 'entreprise')
);

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
      AND o.moderation_status <> 'suspended'
      AND public.get_effective_enterprise_plan(o.entreprise_id) IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_offer_visible_to_talent(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_offer_visible_to_talent(UUID) TO authenticated;

CREATE TABLE IF NOT EXISTS public.offer_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offres(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('discrimination', 'misleading', 'paid_application', 'fraud', 'expired', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  decision TEXT CHECK (decision IS NULL OR decision IN ('suspend', 'dismiss', 'reinstate')),
  decision_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS offer_reports_one_open_per_user_idx
  ON public.offer_reports (offer_id, reporter_id)
  WHERE status IN ('pending', 'under_review');
CREATE INDEX IF NOT EXISTS offer_reports_admin_queue_idx
  ON public.offer_reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.offer_moderation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offres(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.offer_reports(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('reported', 'under_review', 'suspended', 'dismissed', 'reinstated')),
  reason TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offer_moderation_events_offer_idx
  ON public.offer_moderation_events (offer_id, created_at DESC);

ALTER TABLE public.offer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_moderation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reporters can create offer reports" ON public.offer_reports;
CREATE POLICY "Reporters can create offer reports"
ON public.offer_reports
FOR INSERT
WITH CHECK (
  reporter_id = auth.uid()
  AND public.current_user_role() = 'talent'
  AND public.is_offer_visible_to_talent(offer_id)
);

DROP POLICY IF EXISTS "Reporters can read own offer reports" ON public.offer_reports;
CREATE POLICY "Reporters can read own offer reports"
ON public.offer_reports
FOR SELECT
USING (reporter_id = auth.uid() OR public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update offer reports" ON public.offer_reports;
CREATE POLICY "Admins can update offer reports"
ON public.offer_reports
FOR UPDATE
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can read moderation events" ON public.offer_moderation_events;
CREATE POLICY "Admins can read moderation events"
ON public.offer_moderation_events
FOR SELECT
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.offres o
    WHERE o.id = offer_moderation_events.offer_id
      AND o.entreprise_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.record_offer_report_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.offer_moderation_events (offer_id, report_id, action, reason, actor_id)
  VALUES (NEW.offer_id, NEW.id, 'reported', COALESCE(NULLIF(btrim(NEW.details), ''), NEW.reason), NEW.reporter_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_offer_report_event_trigger ON public.offer_reports;
CREATE TRIGGER record_offer_report_event_trigger
AFTER INSERT ON public.offer_reports
FOR EACH ROW EXECUTE FUNCTION public.record_offer_report_event();

CREATE OR REPLACE FUNCTION public.admin_decide_offer_report(
  p_report_id UUID,
  p_decision TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report public.offer_reports%ROWTYPE;
  v_action TEXT;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'admin_required';
  END IF;
  IF p_decision NOT IN ('suspend', 'dismiss', 'reinstate') THEN
    RAISE EXCEPTION 'invalid_moderation_decision';
  END IF;
  IF char_length(btrim(COALESCE(p_reason, ''))) < 10 THEN
    RAISE EXCEPTION 'moderation_reason_required';
  END IF;

  SELECT * INTO v_report
  FROM public.offer_reports
  WHERE id = p_report_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'offer_report_not_found';
  END IF;

  IF p_decision = 'suspend' THEN
    UPDATE public.offres
    SET statut = 'inactive', moderation_status = 'suspended', moderation_reason = btrim(p_reason),
        moderated_at = now(), moderated_by = auth.uid()
    WHERE id = v_report.offer_id;
    v_action := 'suspended';
  ELSIF p_decision = 'reinstate' THEN
    UPDATE public.offres
    SET statut = 'active', moderation_status = 'published', moderation_reason = btrim(p_reason),
        moderated_at = now(), moderated_by = auth.uid()
    WHERE id = v_report.offer_id;
    v_action := 'reinstated';
  ELSE
    UPDATE public.offres
    SET moderation_status = 'published', moderation_reason = btrim(p_reason),
        moderated_at = now(), moderated_by = auth.uid()
    WHERE id = v_report.offer_id;
    v_action := 'dismissed';
  END IF;

  UPDATE public.offer_reports
  SET status = CASE WHEN p_decision = 'dismiss' THEN 'dismissed' ELSE 'resolved' END,
      decision = p_decision,
      decision_reason = btrim(p_reason),
      reviewed_by = auth.uid(),
      updated_at = now(),
      resolved_at = now()
  WHERE id = p_report_id;

  INSERT INTO public.offer_moderation_events (offer_id, report_id, action, reason, actor_id)
  VALUES (v_report.offer_id, p_report_id, v_action, btrim(p_reason), auth.uid());

  RETURN jsonb_build_object('ok', true, 'offer_id', v_report.offer_id, 'action', v_action);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_decide_offer_report(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_decide_offer_report(UUID, TEXT, TEXT) TO authenticated;
