-- PostgreSQL 17 no longer accepts an implicit TEXT -> enum assignment in the
-- signup trigger. Derive the variable type from profiles.role so this remains
-- compatible with both the historical production TEXT column and fresh local
-- environments where the column uses public.user_role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value public.profiles.role%TYPE;
  signup_phone TEXT;
  signup_full_name TEXT;
  acknowledgement_source TEXT;
BEGIN
  user_role_value := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'entreprise'
      THEN 'entreprise'
    ELSE 'talent'
  END;
  signup_phone := NULLIF(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'telephone',
    NEW.raw_user_meta_data->>'company_phone',
    ''
  )), '');
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
    CASE
      WHEN user_role_value::TEXT = 'entreprise'
        THEN signup_full_name
      ELSE NULL
    END,
    NEW.email,
    signup_phone
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = COALESCE(profiles.email, EXCLUDED.email),
    telephone = COALESCE(profiles.telephone, EXCLUDED.telephone),
    full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name),
    company_name = COALESCE(profiles.company_name, EXCLUDED.company_name);

  acknowledgement_source :=
    NEW.raw_user_meta_data->>'legal_acknowledgement_source';

  IF NEW.raw_user_meta_data->>'terms_accepted_version' = '2026-08-03'
    AND NEW.raw_user_meta_data->>'privacy_notice_version' = '2026-08-03'
    AND acknowledgement_source IN (
      'talent_email_signup',
      'entreprise_email_signup'
    ) THEN
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
$$;
