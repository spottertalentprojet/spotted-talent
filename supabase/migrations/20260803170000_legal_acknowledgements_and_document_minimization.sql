-- Record the exact legal texts acknowledged at signup and prevent new excessive
-- document requests. Existing legacy requests remain readable so no user file is
-- silently deleted by this migration.

CREATE TABLE IF NOT EXISTS public.legal_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL CHECK (char_length(terms_version) BETWEEN 8 AND 40),
  privacy_notice_version TEXT NOT NULL CHECK (char_length(privacy_notice_version) BETWEEN 8 AND 40),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL CHECK (
    source IN (
      'talent_email_signup',
      'entreprise_email_signup',
      'talent_google_signup',
      'entreprise_google_signup',
      'oauth_completion'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, terms_version, privacy_notice_version)
);

CREATE INDEX IF NOT EXISTS legal_acknowledgements_user_id_idx
  ON public.legal_acknowledgements (user_id, accepted_at DESC);

ALTER TABLE public.legal_acknowledgements ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.legal_acknowledgements FROM anon, authenticated;
GRANT SELECT ON public.legal_acknowledgements TO authenticated;

DROP POLICY IF EXISTS "Users can read own legal acknowledgements"
  ON public.legal_acknowledgements;
CREATE POLICY "Users can read own legal acknowledgements"
ON public.legal_acknowledgements
FOR SELECT
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.record_current_legal_acknowledgement(
  p_terms_version TEXT,
  p_privacy_notice_version TEXT,
  p_source TEXT DEFAULT 'oauth_completion'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_source TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_terms_version <> '2026-08-03'
    OR p_privacy_notice_version <> '2026-08-03' THEN
    RAISE EXCEPTION 'legal_version_not_current';
  END IF;

  v_source := CASE
    WHEN p_source IN (
      'talent_email_signup',
      'entreprise_email_signup',
      'talent_google_signup',
      'entreprise_google_signup',
      'oauth_completion'
    ) THEN p_source
    ELSE 'oauth_completion'
  END;

  INSERT INTO public.legal_acknowledgements (
    user_id,
    terms_version,
    privacy_notice_version,
    source
  )
  VALUES (
    auth.uid(),
    p_terms_version,
    p_privacy_notice_version,
    v_source
  )
  ON CONFLICT (user_id, terms_version, privacy_notice_version)
  DO UPDATE SET source = EXCLUDED.source
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_current_legal_acknowledgement(TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_current_legal_acknowledgement(TEXT, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value TEXT;
  signup_phone TEXT;
  signup_full_name TEXT;
  acknowledgement_source TEXT;
BEGIN
  user_role_value := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'entreprise' THEN 'entreprise'
    ELSE 'talent'
  END;
  signup_phone := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'telephone', NEW.raw_user_meta_data->>'company_phone', '')), '');
  signup_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.profiles (
    user_id,
    role,
    full_name,
    company_name,
    email,
    telephone
  )
  VALUES (
    NEW.id,
    user_role_value,
    signup_full_name,
    CASE WHEN user_role_value = 'entreprise' THEN signup_full_name ELSE NULL END,
    NEW.email,
    signup_phone
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    telephone = COALESCE(profiles.telephone, EXCLUDED.telephone),
    full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name),
    company_name = COALESCE(profiles.company_name, EXCLUDED.company_name);

  acknowledgement_source := NEW.raw_user_meta_data->>'legal_acknowledgement_source';

  IF NEW.raw_user_meta_data->>'terms_accepted_version' = '2026-08-03'
    AND NEW.raw_user_meta_data->>'privacy_notice_version' = '2026-08-03'
    AND acknowledgement_source IN ('talent_email_signup', 'entreprise_email_signup') THEN
    INSERT INTO public.legal_acknowledgements (
      user_id,
      terms_version,
      privacy_notice_version,
      source
    )
    VALUES (
      NEW.id,
      '2026-08-03',
      '2026-08-03',
      acknowledgement_source
    )
    ON CONFLICT (user_id, terms_version, privacy_notice_version) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.enforce_allowed_candidate_document_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.document_label := CASE NEW.document_key
    WHEN 'diplome-certification' THEN 'Diplôme ou certification'
    WHEN 'permis-conduire' THEN 'Permis de conduire requis'
    WHEN 'justificatif-permis' THEN 'Habilitation ou permis métier'
    WHEN 'titre-sejour' THEN 'Autorisation de travail'
    ELSE NULL
  END;

  IF NEW.document_label IS NULL THEN
    RAISE EXCEPTION 'document_request_not_allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_allowed_candidate_document_request_trigger
  ON public.document_requests;
CREATE TRIGGER enforce_allowed_candidate_document_request_trigger
BEFORE INSERT OR UPDATE OF document_key
ON public.document_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_allowed_candidate_document_request();
