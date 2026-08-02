CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value TEXT;
  signup_phone TEXT;
  signup_full_name TEXT;
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
