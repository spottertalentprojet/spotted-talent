-- Privacy-safe application error monitoring.
-- Raw messages, stack traces, URLs with query strings and user input are never stored.

CREATE TABLE IF NOT EXISTS public.app_error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_fingerprint TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'error', 'fatal')),
  area TEXT NOT NULL CHECK (char_length(area) BETWEEN 1 AND 80),
  error_code TEXT NOT NULL CHECK (char_length(error_code) BETWEEN 1 AND 80),
  route_pattern TEXT NOT NULL CHECK (char_length(route_pattern) BETWEEN 1 AND 120),
  release TEXT NOT NULL CHECK (char_length(release) BETWEEN 1 AND 80),
  occurrence_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrence_count > 0),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_error_events_last_seen_at_idx
  ON public.app_error_events (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS app_error_events_fingerprint_idx
  ON public.app_error_events (fingerprint, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS app_error_events_user_id_idx
  ON public.app_error_events (user_id, last_seen_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.app_error_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_error_events FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_old_app_error_events(p_now TIMESTAMPTZ DEFAULT now())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.app_error_events
  WHERE last_seen_at < p_now - interval '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_app_error_events(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'spotted_talent_cleanup_old_app_errors') THEN
    PERFORM cron.unschedule('spotted_talent_cleanup_old_app_errors');
  END IF;

  PERFORM cron.schedule(
    'spotted_talent_cleanup_old_app_errors',
    '35 3 * * *',
    'select public.cleanup_old_app_error_events();'
  );
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error monitoring cleanup schedule not installed automatically: %', SQLERRM;
END;
$$;

COMMENT ON TABLE public.app_error_events IS
  'Diagnostic technique pseudonymisé. Aucun message libre, stack trace ou contenu utilisateur.';
