-- Complete the daily retention scheduler without storing any secret in Git.
-- The generated secret remains in Supabase Vault and is validated by the
-- cleanup Edge Function through a service-role-only RPC.

CREATE OR REPLACE FUNCTION public.validate_retention_job_secret(p_secret TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT
    auth.role() = 'service_role'
    AND NULLIF(p_secret, '') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM vault.decrypted_secrets
      WHERE name = 'spotted_talent_retention_job_secret'
        AND decrypted_secret = p_secret
    );
$$;

REVOKE ALL ON FUNCTION public.validate_retention_job_secret(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_retention_job_secret(TEXT)
  TO service_role;

DO $$
DECLARE
  v_function_url TEXT;
  v_job_secret TEXT;
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

  SELECT decrypted_secret
  INTO v_function_url
  FROM vault.decrypted_secrets
  WHERE name = 'spotted_talent_retention_function_url'
  LIMIT 1;

  IF NULLIF(v_function_url, '') IS NULL THEN
    v_function_url :=
      'https://ozkuavsaftcpuhhxpfdv.supabase.co/functions/v1/cleanup-expired-documents';
    PERFORM vault.create_secret(
      v_function_url,
      'spotted_talent_retention_function_url',
      'URL de la fonction quotidienne de rétention documentaire'
    );
  END IF;

  SELECT decrypted_secret
  INTO v_job_secret
  FROM vault.decrypted_secrets
  WHERE name = 'spotted_talent_retention_job_secret'
  LIMIT 1;

  IF NULLIF(v_job_secret, '') IS NULL THEN
    v_job_secret :=
      replace(gen_random_uuid()::TEXT, '-', '') ||
      replace(gen_random_uuid()::TEXT, '-', '');
    PERFORM vault.create_secret(
      v_job_secret,
      'spotted_talent_retention_job_secret',
      'Secret interne du nettoyage quotidien des documents'
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'spotted_talent_cleanup_expired_documents_edge'
  ) THEN
    PERFORM cron.unschedule('spotted_talent_cleanup_expired_documents_edge');
  END IF;

  PERFORM cron.schedule(
    'spotted_talent_cleanup_expired_documents_edge',
    '20 3 * * *',
    $cron$
      SELECT net.http_post(
        url := (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'spotted_talent_retention_function_url'
          LIMIT 1
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-retention-secret', (
            SELECT decrypted_secret
            FROM vault.decrypted_secrets
            WHERE name = 'spotted_talent_retention_job_secret'
            LIMIT 1
          )
        ),
        body := '{}'::jsonb
      );
    $cron$
  );
END;
$$;
