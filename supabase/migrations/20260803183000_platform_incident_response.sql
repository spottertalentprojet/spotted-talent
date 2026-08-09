-- Automatic containment for suspicious document access and a manual incident
-- switch for the platform administrator. The automatic rule only locks the
-- document vault; a complete write freeze always requires an MFA-authenticated
-- administrator to avoid turning a false positive into a platform outage.

CREATE TABLE IF NOT EXISTS public.platform_security_state (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  incident_mode BOOLEAN NOT NULL DEFAULT false,
  documents_locked BOOLEAN NOT NULL DEFAULT false,
  sensitive_writes_locked BOOLEAN NOT NULL DEFAULT false,
  severity TEXT NOT NULL DEFAULT 'normal'
    CHECK (severity IN ('normal', 'elevated', 'critical')),
  public_message TEXT NOT NULL DEFAULT '',
  reason TEXT,
  auto_triggered BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.platform_security_state (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL CHECK (char_length(incident_type) BETWEEN 3 AND 80),
  severity TEXT NOT NULL CHECK (severity IN ('elevated', 'critical')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'contained', 'resolved')),
  source TEXT NOT NULL CHECK (char_length(source) BETWEEN 3 AND 100),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 10 AND 500),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  auto_lock_applied BOOLEAN NOT NULL DEFAULT false,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contained_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_incidents_status_detected_at_idx
  ON public.security_incidents (status, detected_at DESC);

CREATE INDEX IF NOT EXISTS security_incidents_actor_id_idx
  ON public.security_incidents (actor_id, detected_at DESC)
  WHERE actor_id IS NOT NULL;

ALTER TABLE public.platform_security_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.platform_security_state FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.security_incidents FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.security_incidents TO authenticated;

DROP POLICY IF EXISTS "Security incidents visible to admin" ON public.security_incidents;
CREATE POLICY "Security incidents visible to admin"
ON public.security_incidents
FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE OR REPLACE FUNCTION public.platform_admin_has_mfa()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_user()
    AND COALESCE(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

REVOKE ALL ON FUNCTION public.platform_admin_has_mfa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.platform_admin_has_mfa() TO authenticated;

CREATE OR REPLACE FUNCTION public.platform_documents_available()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(auth.role(), '') = 'service_role'
    OR (auth.role() IS NULL AND auth.uid() IS NULL)
    OR public.platform_admin_has_mfa()
    OR NOT COALESCE(
      (SELECT state.documents_locked
       FROM public.platform_security_state state
       WHERE state.id = true),
      false
    );
$$;

CREATE OR REPLACE FUNCTION public.platform_sensitive_writes_available()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(auth.role(), '') = 'service_role'
    OR (auth.role() IS NULL AND auth.uid() IS NULL)
    OR public.platform_admin_has_mfa()
    OR NOT COALESCE(
      (SELECT state.sensitive_writes_locked
       FROM public.platform_security_state state
       WHERE state.id = true),
      false
    );
$$;

REVOKE ALL ON FUNCTION public.platform_documents_available() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.platform_sensitive_writes_available() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.platform_documents_available() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_sensitive_writes_available() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_platform_security_status()
RETURNS TABLE (
  incident_mode BOOLEAN,
  documents_locked BOOLEAN,
  sensitive_writes_locked BOOLEAN,
  severity TEXT,
  public_message TEXT,
  auto_triggered BOOLEAN,
  activated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    state.incident_mode,
    state.documents_locked,
    state.sensitive_writes_locked,
    state.severity,
    state.public_message,
    state.auto_triggered,
    state.activated_at,
    state.updated_at
  FROM public.platform_security_state state
  WHERE state.id = true;
$$;

REVOKE ALL ON FUNCTION public.get_platform_security_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_security_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_platform_incident_mode(
  p_incident_mode BOOLEAN,
  p_documents_locked BOOLEAN,
  p_sensitive_writes_locked BOOLEAN,
  p_reason TEXT
)
RETURNS SETOF public.platform_security_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason TEXT := NULLIF(trim(COALESCE(p_reason, '')), '');
  v_public_message TEXT;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  IF NOT public.platform_admin_has_mfa() THEN
    RAISE EXCEPTION 'admin_mfa_required' USING ERRCODE = '42501';
  END IF;

  IF p_incident_mode IS DISTINCT FROM (p_documents_locked OR p_sensitive_writes_locked) THEN
    RAISE EXCEPTION 'invalid_incident_state';
  END IF;

  IF p_incident_mode AND (v_reason IS NULL OR char_length(v_reason) < 10) THEN
    RAISE EXCEPTION 'incident_reason_required';
  END IF;

  IF v_reason IS NOT NULL AND char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'incident_reason_too_long';
  END IF;

  v_public_message := CASE
    WHEN p_sensitive_writes_locked THEN
      'Spotted Talent est temporairement placé en mode sécurité. Les espaces privés sont suspendus pendant les vérifications.'
    WHEN p_documents_locked THEN
      'Par précaution, l’accès aux documents est temporairement suspendu pendant une vérification de sécurité.'
    ELSE ''
  END;

  UPDATE public.platform_security_state
  SET
    incident_mode = p_incident_mode,
    documents_locked = p_documents_locked,
    sensitive_writes_locked = p_sensitive_writes_locked,
    severity = CASE
      WHEN p_sensitive_writes_locked THEN 'critical'
      WHEN p_documents_locked THEN 'elevated'
      ELSE 'normal'
    END,
    public_message = v_public_message,
    reason = v_reason,
    auto_triggered = false,
    activated_at = CASE WHEN p_incident_mode THEN now() ELSE NULL END,
    activated_by = CASE WHEN p_incident_mode THEN auth.uid() ELSE NULL END,
    updated_at = now()
  WHERE id = true;

  IF p_incident_mode THEN
    INSERT INTO public.security_incidents (
      incident_type,
      severity,
      status,
      source,
      summary,
      auto_lock_applied,
      detected_at,
      contained_at,
      created_by
    )
    VALUES (
      CASE WHEN p_sensitive_writes_locked THEN 'manual_platform_lock' ELSE 'manual_document_lock' END,
      CASE WHEN p_sensitive_writes_locked THEN 'critical' ELSE 'elevated' END,
      'contained',
      'admin_console',
      v_reason,
      true,
      now(),
      now(),
      auth.uid()
    );
  ELSE
    UPDATE public.security_incidents
    SET status = 'resolved', resolved_at = now()
    WHERE status IN ('open', 'contained');
  END IF;

  RETURN QUERY
  SELECT state.*
  FROM public.platform_security_state state
  WHERE state.id = true;
END;
$$;

REVOKE ALL ON FUNCTION public.set_platform_incident_mode(BOOLEAN, BOOLEAN, BOOLEAN, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_platform_incident_mode(BOOLEAN, BOOLEAN, BOOLEAN, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.evaluate_platform_security_signals(
  p_now TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  triggered BOOLEAN,
  incident_id UUID,
  suspicious_actor UUID,
  access_count BIGINT,
  distinct_document_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_access_count BIGINT;
  v_distinct_count BIGINT;
  v_incident_id UUID;
  v_already_locked BOOLEAN;
BEGIN
  SELECT state.documents_locked
  INTO v_already_locked
  FROM public.platform_security_state state
  WHERE state.id = true
  FOR UPDATE;

  SELECT
    logs.actor_id,
    count(*),
    count(DISTINCT logs.storage_path)
  INTO v_actor_id, v_access_count, v_distinct_count
  FROM public.document_access_logs logs
  WHERE logs.created_at >= p_now - interval '2 minutes'
    AND logs.created_at <= p_now
    AND logs.action IN ('open', 'download')
    AND logs.storage_path IS NOT NULL
  GROUP BY logs.actor_id
  HAVING count(*) >= 25 OR count(DISTINCT logs.storage_path) >= 12
  ORDER BY count(DISTINCT logs.storage_path) DESC, count(*) DESC
  LIMIT 1;

  IF v_actor_id IS NULL OR COALESCE(v_already_locked, false) THEN
    RETURN QUERY SELECT false, NULL::UUID, v_actor_id,
      COALESCE(v_access_count, 0), COALESCE(v_distinct_count, 0);
    RETURN;
  END IF;

  INSERT INTO public.security_incidents (
    incident_type,
    severity,
    status,
    source,
    summary,
    actor_id,
    details,
    auto_lock_applied,
    detected_at,
    contained_at
  )
  VALUES (
    'document_access_spike',
    'critical',
    'contained',
    'automatic_document_monitor',
    'Volume inhabituel d’accès aux documents détecté sur une fenêtre de deux minutes.',
    v_actor_id,
    jsonb_build_object(
      'window_minutes', 2,
      'access_count', v_access_count,
      'distinct_document_count', v_distinct_count,
      'event_threshold', 25,
      'distinct_document_threshold', 12
    ),
    true,
    p_now,
    p_now
  )
  RETURNING id INTO v_incident_id;

  UPDATE public.platform_security_state
  SET
    incident_mode = true,
    documents_locked = true,
    sensitive_writes_locked = false,
    severity = 'critical',
    public_message = 'Par précaution, l’accès aux documents est temporairement suspendu pendant une vérification de sécurité.',
    reason = 'Blocage automatique après détection d’un volume inhabituel d’accès aux documents.',
    auto_triggered = true,
    activated_at = p_now,
    activated_by = NULL,
    updated_at = p_now
  WHERE id = true;

  RETURN QUERY SELECT true, v_incident_id, v_actor_id, v_access_count, v_distinct_count;
END;
$$;

REVOKE ALL ON FUNCTION public.evaluate_platform_security_signals(TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_resolved_security_incidents(
  p_now TIMESTAMPTZ DEFAULT now()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.security_incidents
  WHERE status = 'resolved'
    AND resolved_at < p_now - interval '24 months';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_resolved_security_incidents(TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;

-- Restrictive policies are combined with every existing permissive policy.
-- They therefore act as an emergency brake without replacing the ownership
-- and candidature checks that already protect the vault.
DROP POLICY IF EXISTS "Incident mode restricts document storage" ON storage.objects;
CREATE POLICY "Incident mode restricts document storage"
ON storage.objects
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (bucket_id <> 'documents' OR public.platform_documents_available())
WITH CHECK (bucket_id <> 'documents' OR public.platform_documents_available());

DROP POLICY IF EXISTS "Incident mode restricts document metadata" ON public.document_encryption_keys;
CREATE POLICY "Incident mode restricts document metadata"
ON public.document_encryption_keys
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.platform_documents_available())
WITH CHECK (public.platform_documents_available());

DROP POLICY IF EXISTS "Incident mode restricts document requests" ON public.document_requests;
CREATE POLICY "Incident mode restricts document requests"
ON public.document_requests
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.platform_documents_available())
WITH CHECK (public.platform_documents_available());

CREATE OR REPLACE FUNCTION public.enforce_platform_sensitive_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.platform_sensitive_writes_available() THEN
    RAISE EXCEPTION 'platform_incident_write_lock' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_platform_sensitive_write()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS platform_incident_profiles_write_guard ON public.profiles;
CREATE TRIGGER platform_incident_profiles_write_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_platform_sensitive_write();

DROP TRIGGER IF EXISTS platform_incident_offres_write_guard ON public.offres;
CREATE TRIGGER platform_incident_offres_write_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.offres
FOR EACH ROW EXECUTE FUNCTION public.enforce_platform_sensitive_write();

DROP TRIGGER IF EXISTS platform_incident_candidatures_write_guard ON public.candidatures;
CREATE TRIGGER platform_incident_candidatures_write_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.candidatures
FOR EACH ROW EXECUTE FUNCTION public.enforce_platform_sensitive_write();

DROP TRIGGER IF EXISTS platform_incident_messages_write_guard ON public.messages;
CREATE TRIGGER platform_incident_messages_write_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_platform_sensitive_write();

DROP TRIGGER IF EXISTS platform_incident_document_requests_write_guard ON public.document_requests;
CREATE TRIGGER platform_incident_document_requests_write_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.document_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_platform_sensitive_write();

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'spotted_talent_security_monitor') THEN
    PERFORM cron.unschedule('spotted_talent_security_monitor');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'spotted_talent_cleanup_security_incidents') THEN
    PERFORM cron.unschedule('spotted_talent_cleanup_security_incidents');
  END IF;

  PERFORM cron.schedule(
    'spotted_talent_security_monitor',
    '* * * * *',
    'select * from public.evaluate_platform_security_signals();'
  );

  PERFORM cron.schedule(
    'spotted_talent_cleanup_security_incidents',
    '45 3 * * *',
    'select public.cleanup_resolved_security_incidents();'
  );
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Security monitor cron schedule not installed automatically: %', SQLERRM;
END;
$$;

COMMENT ON TABLE public.security_incidents IS
  'Journal minimal des incidents de sécurité. Les chemins et contenus des documents ne sont jamais copiés ici.';

COMMENT ON FUNCTION public.evaluate_platform_security_signals(TIMESTAMPTZ) IS
  'Verrouille automatiquement le coffre documentaire après au moins 25 accès ou 12 documents distincts par un même compte en deux minutes.';
