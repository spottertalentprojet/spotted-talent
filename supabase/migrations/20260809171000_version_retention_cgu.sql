-- Record acceptance of the CGU revision that introduces the 7/30/90-day
-- document-retention lifecycle. Earlier acknowledgements remain archived.

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

  IF p_terms_version <> '2026-08-09-v2'
    OR p_privacy_notice_version <> '2026-08-09-v2' THEN
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
  ) VALUES (
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

CREATE OR REPLACE FUNCTION public.record_signup_legal_acknowledgement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acknowledgement_source TEXT;
BEGIN
  acknowledgement_source := NEW.raw_user_meta_data->>'legal_acknowledgement_source';

  IF NEW.raw_user_meta_data->>'terms_accepted_version' = '2026-08-09-v2'
    AND NEW.raw_user_meta_data->>'privacy_notice_version' = '2026-08-09-v2'
    AND acknowledgement_source IN ('talent_email_signup', 'entreprise_email_signup') THEN
    INSERT INTO public.legal_acknowledgements (
      user_id,
      terms_version,
      privacy_notice_version,
      source
    ) VALUES (
      NEW.id,
      '2026-08-09-v2',
      '2026-08-09-v2',
      acknowledgement_source
    )
    ON CONFLICT (user_id, terms_version, privacy_notice_version) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_signup_legal_acknowledgement_on_auth_user ON auth.users;
CREATE TRIGGER record_signup_legal_acknowledgement_on_auth_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.record_signup_legal_acknowledgement();
