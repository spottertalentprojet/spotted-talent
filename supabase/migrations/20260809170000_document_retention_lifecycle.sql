-- Apply one coherent retention lifecycle to the two post-acceptance document
-- flows. File contents are deleted from Storage while the minimum audit
-- metadata is retained.

ALTER TABLE public.document_requests
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS storage_deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

ALTER TABLE public.document_requests
  DROP CONSTRAINT IF EXISTS document_requests_status_check;

ALTER TABLE public.document_requests
  ADD CONSTRAINT document_requests_status_check
  CHECK (status IN ('requested', 'uploaded', 'expired'));

ALTER TABLE public.document_encryption_keys
  ALTER COLUMN expires_at DROP NOT NULL,
  ALTER COLUMN iv_b64 DROP NOT NULL,
  ALTER COLUMN key_b64 DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS retention_flow TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS first_downloaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS storage_deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

ALTER TABLE public.document_encryption_keys
  DROP CONSTRAINT IF EXISTS document_encryption_keys_retention_flow_check;

ALTER TABLE public.document_encryption_keys
  ADD CONSTRAINT document_encryption_keys_retention_flow_check
  CHECK (retention_flow IN ('standard', 'talent_to_company', 'company_to_talent'));

CREATE INDEX IF NOT EXISTS document_encryption_keys_retention_due_idx
  ON public.document_encryption_keys (expires_at)
  WHERE storage_deleted_at IS NULL AND expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS document_encryption_keys_recipient_idx
  ON public.document_encryption_keys (recipient_id, sent_at DESC);

ALTER TABLE public.document_access_logs
  ALTER COLUMN actor_id DROP NOT NULL;

ALTER TABLE public.document_access_logs
  DROP CONSTRAINT IF EXISTS document_access_logs_action_check;

ALTER TABLE public.document_access_logs
  ADD CONSTRAINT document_access_logs_action_check
  CHECK (
    action IN (
      'upload',
      'open',
      'download',
      'delete',
      'request_created',
      'request_deleted',
      'retention_deleted',
      'receipt_confirmed',
      'document_supprimé'
    )
  );

-- Backfill existing requested documents. A previously recorded successful open
-- by the destination company is treated as the first confirmed download.
WITH requested_metadata AS (
  SELECT
    dek.storage_path,
    dr.entreprise_id AS recipient_id,
    COALESCE(dr.uploaded_at, dek.created_at) AS sent_at,
    (
      SELECT min(logs.created_at)
      FROM public.document_access_logs logs
      WHERE logs.storage_path = dek.storage_path
        AND logs.actor_id = dr.entreprise_id
        AND logs.action IN ('open', 'download')
    ) AS first_downloaded_at
  FROM public.document_encryption_keys dek
  JOIN public.document_requests dr ON dr.id = dek.document_request_id
  WHERE dek.category = 'shared-requested'
)
UPDATE public.document_encryption_keys dek
SET
  retention_flow = 'talent_to_company',
  recipient_id = requested_metadata.recipient_id,
  sent_at = requested_metadata.sent_at,
  first_downloaded_at = requested_metadata.first_downloaded_at,
  received_at = requested_metadata.first_downloaded_at,
  expires_at = CASE
    WHEN requested_metadata.first_downloaded_at IS NOT NULL
      THEN requested_metadata.first_downloaded_at + interval '7 days'
    ELSE requested_metadata.sent_at + interval '30 days'
  END
FROM requested_metadata
WHERE dek.storage_path = requested_metadata.storage_path
  AND dek.storage_deleted_at IS NULL;

-- Backfill only genuine company-to-talent deliveries. Legacy files uploaded by
-- a talent in the same category keep the standard policy.
WITH company_deliveries AS (
  SELECT
    dek.storage_path,
    c.talent_id AS recipient_id,
    dek.created_at AS sent_at
  FROM public.document_encryption_keys dek
  JOIN public.candidatures c ON c.id = dek.relation_id
  JOIN public.offres o ON o.id = c.offre_id
  WHERE dek.category IN ('shared-contrat', 'shared-fiche-paie', 'shared-interim')
    AND dek.owner_id = o.entreprise_id
    AND c.statut = 'acceptee'
)
UPDATE public.document_encryption_keys dek
SET
  retention_flow = 'company_to_talent',
  recipient_id = company_deliveries.recipient_id,
  sent_at = company_deliveries.sent_at,
  expires_at = company_deliveries.sent_at + interval '90 days'
FROM company_deliveries
WHERE dek.storage_path = company_deliveries.storage_path
  AND dek.storage_deleted_at IS NULL;

UPDATE public.document_requests dr
SET
  received_at = dek.received_at,
  receipt_confirmed_at = dek.receipt_confirmed_at,
  retention_expires_at = dek.expires_at,
  storage_deleted_at = dek.storage_deleted_at,
  deletion_reason = dek.deletion_reason
FROM public.document_encryption_keys dek
WHERE dek.document_request_id = dr.id;

CREATE OR REPLACE FUNCTION public.prepare_document_retention_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.document_requests%ROWTYPE;
  v_talent_id UUID;
  v_entreprise_id UUID;
BEGIN
  NEW.sent_at := COALESCE(NEW.sent_at, now());
  NEW.storage_deleted_at := NULL;
  NEW.deletion_reason := NULL;

  IF NEW.category = 'shared-requested' THEN
    IF NEW.document_request_id IS NULL THEN
      RAISE EXCEPTION 'document_request_required';
    END IF;

    SELECT dr.*
    INTO v_request
    FROM public.document_requests dr
    WHERE dr.id = NEW.document_request_id;

    IF NOT FOUND
      OR v_request.status <> 'requested'
      OR v_request.talent_id <> NEW.owner_id
      OR v_request.candidature_id IS DISTINCT FROM NEW.relation_id
      OR NOT EXISTS (
        SELECT 1
        FROM public.candidatures c
        JOIN public.offres o ON o.id = c.offre_id
        WHERE c.id = v_request.candidature_id
          AND c.statut = 'acceptee'
          AND c.talent_id = v_request.talent_id
          AND o.entreprise_id = v_request.entreprise_id
      ) THEN
      RAISE EXCEPTION 'invalid_requested_document_delivery';
    END IF;

    NEW.retention_flow := 'talent_to_company';
    NEW.recipient_id := v_request.entreprise_id;
    NEW.expires_at := NEW.sent_at + interval '30 days';
    RETURN NEW;
  END IF;

  IF NEW.category IN ('shared-contrat', 'shared-fiche-paie', 'shared-interim') THEN
    SELECT c.talent_id, o.entreprise_id
    INTO v_talent_id, v_entreprise_id
    FROM public.candidatures c
    JOIN public.offres o ON o.id = c.offre_id
    WHERE c.id = NEW.relation_id
      AND c.statut = 'acceptee';

    IF NOT FOUND OR NEW.owner_id <> v_entreprise_id THEN
      RAISE EXCEPTION 'company_delivery_requires_accepted_candidature';
    END IF;

    NEW.retention_flow := 'company_to_talent';
    NEW.recipient_id := v_talent_id;
    NEW.expires_at := NEW.sent_at + interval '90 days';
    RETURN NEW;
  END IF;

  NEW.retention_flow := 'standard';
  NEW.recipient_id := NULL;
  NEW.expires_at := COALESCE(NEW.expires_at, NEW.sent_at + interval '30 days');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_document_retention_metadata_trigger
  ON public.document_encryption_keys;
CREATE TRIGGER prepare_document_retention_metadata_trigger
BEFORE INSERT ON public.document_encryption_keys
FOR EACH ROW
EXECUTE FUNCTION public.prepare_document_retention_metadata();

-- Content access is intentionally stricter than audit-metadata access. In
-- particular, a company cannot read a file after it has delivered it to the
-- talent, and platform administrators never receive file-content access.
CREATE OR REPLACE FUNCTION public.can_access_document_path(p_storage_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc public.document_encryption_keys%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NULLIF(trim(p_storage_path), '') IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_doc
  FROM public.document_encryption_keys
  WHERE storage_path = p_storage_path;

  IF NOT FOUND
    OR v_doc.storage_deleted_at IS NOT NULL
    OR v_doc.key_b64 IS NULL
    OR v_doc.iv_b64 IS NULL THEN
    RETURN false;
  END IF;

  IF v_doc.retention_flow = 'company_to_talent' THEN
    RETURN auth.uid() = v_doc.recipient_id
      AND EXISTS (
        SELECT 1
        FROM public.candidatures c
        WHERE c.id = v_doc.relation_id
          AND c.talent_id = auth.uid()
          AND c.statut = 'acceptee'
      );
  END IF;

  IF v_doc.retention_flow = 'talent_to_company' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.document_requests dr
      JOIN public.candidatures c ON c.id = dr.candidature_id
      JOIN public.offres o ON o.id = c.offre_id
      WHERE dr.id = v_doc.document_request_id
        AND dr.storage_path = p_storage_path
        AND dr.status = 'uploaded'
        AND c.statut = 'acceptee'
        AND auth.uid() IN (dr.talent_id, dr.entreprise_id)
        AND dr.entreprise_id = o.entreprise_id
    );
  END IF;

  IF auth.uid() = v_doc.owner_id THEN
    RETURN true;
  END IF;

  IF v_doc.category IN ('cv', 'lettre') THEN
    RETURN public.current_user_role() = 'entreprise'
      AND public.is_linked_talent_for_entreprise(v_doc.owner_id);
  END IF;

  RETURN false;
END;
$$;

DROP POLICY IF EXISTS "Document encryption metadata visible to allowed parties"
  ON public.document_encryption_keys;
CREATE POLICY "Document encryption metadata visible to content recipients"
ON public.document_encryption_keys
FOR SELECT
USING (public.can_access_document_path(storage_path));

DROP POLICY IF EXISTS "Users can delete own encrypted document metadata"
  ON public.document_encryption_keys;

DROP POLICY IF EXISTS "Users can read allowed documents" ON storage.objects;
CREATE POLICY "Users can read allowed documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND public.can_access_document_path(name)
);

CREATE OR REPLACE FUNCTION public.can_delete_document_path(p_storage_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid()::text = split_part(p_storage_path, '/', 1)
    AND (
      NOT EXISTS (
        SELECT 1
        FROM public.document_encryption_keys missing_dek
        WHERE missing_dek.storage_path = p_storage_path
      )
      OR EXISTS (
        SELECT 1
        FROM public.document_encryption_keys dek
        WHERE dek.storage_path = p_storage_path
          AND dek.owner_id = auth.uid()
          AND dek.storage_deleted_at IS NULL
          AND dek.retention_flow <> 'company_to_talent'
      )
    );
$$;

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Owners can delete withdrawable documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents'
  AND public.can_delete_document_path(name)
);

DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
CREATE POLICY "Owners can update withdrawable documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents'
  AND public.can_delete_document_path(name)
)
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = split_part(name, '/', 1)
  AND public.can_delete_document_path(name)
);

CREATE OR REPLACE FUNCTION public.record_document_receipt(
  p_storage_path TEXT,
  p_receipt_method TEXT DEFAULT 'download'
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc public.document_encryption_keys%ROWTYPE;
  v_received_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_action TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_receipt_method NOT IN ('download', 'confirmation') THEN
    RAISE EXCEPTION 'invalid_receipt_method';
  END IF;

  SELECT * INTO v_doc
  FROM public.document_encryption_keys
  WHERE storage_path = p_storage_path
  FOR UPDATE;

  IF NOT FOUND OR v_doc.retention_flow <> 'talent_to_company' THEN
    RETURN NULL;
  END IF;

  IF v_doc.storage_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'document_receipt_not_allowed';
  END IF;

  -- The talent who sent the file may still open their own copy without
  -- starting the destination company's seven-day receipt clock.
  IF v_doc.recipient_id <> auth.uid() THEN
    RETURN NULL;
  END IF;

  v_received_at := COALESCE(v_doc.received_at, now());
  v_expires_at := v_received_at + interval '7 days';
  v_action := CASE WHEN p_receipt_method = 'confirmation' THEN 'receipt_confirmed' ELSE 'download' END;

  UPDATE public.document_encryption_keys
  SET
    received_at = v_received_at,
    first_downloaded_at = CASE
      WHEN p_receipt_method = 'download' THEN COALESCE(first_downloaded_at, now())
      ELSE first_downloaded_at
    END,
    receipt_confirmed_at = CASE
      WHEN p_receipt_method = 'confirmation' THEN COALESCE(receipt_confirmed_at, now())
      ELSE receipt_confirmed_at
    END,
    expires_at = v_expires_at
  WHERE storage_path = p_storage_path;

  UPDATE public.document_requests
  SET
    received_at = v_received_at,
    receipt_confirmed_at = CASE
      WHEN p_receipt_method = 'confirmation' THEN COALESCE(receipt_confirmed_at, now())
      ELSE receipt_confirmed_at
    END,
    retention_expires_at = v_expires_at
  WHERE id = v_doc.document_request_id;

  INSERT INTO public.document_access_logs (
    actor_id,
    action,
    storage_path,
    owner_id,
    category,
    relation_id,
    document_request_id,
    file_name,
    metadata
  ) VALUES (
    auth.uid(),
    v_action,
    v_doc.storage_path,
    v_doc.owner_id,
    v_doc.category,
    v_doc.relation_id,
    v_doc.document_request_id,
    v_doc.original_file_name,
    jsonb_build_object(
      'receipt_method', p_receipt_method,
      'received_at', v_received_at,
      'delete_after', v_expires_at
    )
  );

  RETURN v_expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.record_document_receipt(TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_document_receipt(TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.record_manual_document_deletion(p_storage_path TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc public.document_encryption_keys%ROWTYPE;
  v_deleted_at TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO v_doc
  FROM public.document_encryption_keys
  WHERE storage_path = p_storage_path
  FOR UPDATE;

  IF NOT FOUND OR v_doc.owner_id <> auth.uid() OR v_doc.retention_flow = 'company_to_talent' THEN
    RAISE EXCEPTION 'manual_document_deletion_not_allowed';
  END IF;

  UPDATE public.document_encryption_keys
  SET
    storage_deleted_at = COALESCE(storage_deleted_at, v_deleted_at),
    deletion_reason = COALESCE(deletion_reason, 'user_deleted'),
    key_b64 = NULL,
    iv_b64 = NULL
  WHERE storage_path = p_storage_path;

  IF v_doc.document_request_id IS NOT NULL THEN
    UPDATE public.document_requests
    SET
      status = 'expired',
      storage_deleted_at = COALESCE(storage_deleted_at, v_deleted_at),
      deletion_reason = COALESCE(deletion_reason, 'withdrawn_by_talent')
    WHERE id = v_doc.document_request_id;
  END IF;

  INSERT INTO public.document_access_logs (
    actor_id, action, storage_path, owner_id, category, relation_id,
    document_request_id, file_name, metadata
  ) VALUES (
    auth.uid(), 'document_supprimé', v_doc.storage_path, v_doc.owner_id,
    v_doc.category, v_doc.relation_id, v_doc.document_request_id,
    v_doc.original_file_name,
    jsonb_build_object('reason', 'user_deleted', 'deleted_at', v_deleted_at)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_manual_document_deletion(TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_manual_document_deletion(TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.list_candidature_document_records(p_candidature_id UUID)
RETURNS TABLE(
  storage_path TEXT,
  owner_id UUID,
  recipient_id UUID,
  category TEXT,
  original_file_name TEXT,
  retention_flow TEXT,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  storage_deleted_at TIMESTAMPTZ,
  deletion_reason TEXT,
  document_request_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (
    public.user_is_party_to_candidature(p_candidature_id)
    OR public.is_admin_user()
  ) THEN
    RAISE EXCEPTION 'document_metadata_access_denied';
  END IF;

  RETURN QUERY
  SELECT
    dek.storage_path,
    dek.owner_id,
    dek.recipient_id,
    dek.category,
    dek.original_file_name,
    dek.retention_flow,
    dek.sent_at,
    dek.received_at,
    dek.expires_at,
    dek.storage_deleted_at,
    dek.deletion_reason,
    dek.document_request_id
  FROM public.document_encryption_keys dek
  WHERE dek.relation_id = p_candidature_id
    AND dek.retention_flow IN ('talent_to_company', 'company_to_talent')
  ORDER BY dek.sent_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_candidature_document_records(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_candidature_document_records(UUID)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.finalize_expired_document_deletions(
  p_storage_paths TEXT[],
  p_deleted_at TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(storage_path TEXT, retention_flow TEXT, document_request_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role')
    AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required';
  END IF;

  RETURN QUERY
  WITH due AS (
    SELECT dek.*
    FROM public.document_encryption_keys dek
    WHERE dek.storage_path = ANY(p_storage_paths)
      AND dek.storage_deleted_at IS NULL
      AND dek.expires_at IS NOT NULL
      AND dek.expires_at <= p_deleted_at
    FOR UPDATE
  ),
  logged AS (
    INSERT INTO public.document_access_logs (
      actor_id, action, storage_path, owner_id, category, relation_id,
      document_request_id, file_name, metadata
    )
    SELECT
      NULL,
      'document_supprimé',
      due.storage_path,
      due.owner_id,
      due.category,
      due.relation_id,
      due.document_request_id,
      due.original_file_name,
      jsonb_build_object(
        'reason', CASE
          WHEN due.retention_flow = 'talent_to_company' AND due.received_at IS NULL
            THEN 'unclaimed_after_30_days'
          WHEN due.retention_flow = 'talent_to_company'
            THEN 'received_grace_period_ended'
          WHEN due.retention_flow = 'company_to_talent'
            THEN 'delivery_window_ended'
          ELSE 'retention_expired'
        END,
        'sent_at', due.sent_at,
        'received_at', due.received_at,
        'expires_at', due.expires_at,
        'deleted_at', p_deleted_at
      )
    FROM due
    RETURNING document_access_logs.storage_path
  ),
  updated_keys AS (
    UPDATE public.document_encryption_keys dek
    SET
      storage_deleted_at = p_deleted_at,
      deletion_reason = CASE
        WHEN dek.retention_flow = 'talent_to_company' AND dek.received_at IS NULL
          THEN 'unclaimed_after_30_days'
        WHEN dek.retention_flow = 'talent_to_company'
          THEN 'received_grace_period_ended'
        WHEN dek.retention_flow = 'company_to_talent'
          THEN 'delivery_window_ended'
        ELSE 'retention_expired'
      END,
      key_b64 = NULL,
      iv_b64 = NULL
    FROM due
    WHERE dek.storage_path = due.storage_path
      AND EXISTS (SELECT 1 FROM logged WHERE logged.storage_path = due.storage_path)
    RETURNING dek.storage_path, dek.retention_flow, dek.document_request_id, dek.deletion_reason
  ),
  updated_requests AS (
    UPDATE public.document_requests dr
    SET
      status = 'expired',
      storage_deleted_at = p_deleted_at,
      deletion_reason = updated_keys.deletion_reason,
      retention_expires_at = COALESCE(dr.retention_expires_at, p_deleted_at)
    FROM updated_keys
    WHERE dr.id = updated_keys.document_request_id
    RETURNING dr.id
  )
  SELECT updated_keys.storage_path, updated_keys.retention_flow, updated_keys.document_request_id
  FROM updated_keys;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_expired_document_deletions(TEXT[], TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_expired_document_deletions(TEXT[], TIMESTAMPTZ)
  TO service_role;

-- The Edge Function performs the real Storage API deletion, so the old SQL
-- cleanup (which deleted storage.objects directly and erased metadata) must no
-- longer be scheduled.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'spotted_talent_cleanup_expired_documents'
  ) THEN
    PERFORM cron.unschedule('spotted_talent_cleanup_expired_documents');
  END IF;
EXCEPTION
  WHEN undefined_table OR undefined_function THEN
    RAISE NOTICE 'pg_cron is not available; use the external daily Edge Function trigger.';
END;
$$;

DROP FUNCTION IF EXISTS public.cleanup_expired_documents(TIMESTAMPTZ);

-- Prefer Supabase Cron + pg_net when the two Vault secrets already exist. The
-- migration stays deployable without them; operations can configure the same
-- daily Edge Function call later (see docs/operations/document-retention.md).
DO $$
DECLARE
  v_function_url TEXT;
  v_job_secret TEXT;
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
  CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE NOTICE 'Supabase Vault unavailable; configure an external daily trigger.';
    RETURN;
  END IF;

  EXECUTE $query$
    SELECT
      max(decrypted_secret) FILTER (WHERE name = 'spotted_talent_retention_function_url'),
      max(decrypted_secret) FILTER (WHERE name = 'spotted_talent_retention_job_secret')
    FROM vault.decrypted_secrets
  $query$
  INTO v_function_url, v_job_secret;

  IF NULLIF(v_function_url, '') IS NULL OR NULLIF(v_job_secret, '') IS NULL THEN
    RAISE NOTICE 'Retention Vault secrets are missing; daily cleanup is not scheduled yet.';
    RETURN;
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
    format(
      $cron$
        SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-retention-secret', %L
          ),
          body := '{}'::jsonb
        );
      $cron$,
      v_function_url,
      v_job_secret
    )
  );
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Daily Edge cleanup was not scheduled automatically: %', SQLERRM;
END;
$$;

-- Tighten request mutation so uploaded/expired audit rows cannot be erased or
-- rewritten by a destination company.
DROP POLICY IF EXISTS "Entreprise can manage own document requests"
  ON public.document_requests;

DROP POLICY IF EXISTS "Entreprise can delete own document requests"
  ON public.document_requests;
CREATE POLICY "Entreprise can delete pending own document requests"
ON public.document_requests
FOR DELETE
USING (
  entreprise_id = auth.uid()
  AND status = 'requested'
  AND public.user_is_party_to_candidature(candidature_id)
);

CREATE OR REPLACE FUNCTION public.guard_document_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.talent_id
    AND OLD.status = 'requested'
    AND NEW.status = 'uploaded'
    AND NEW.candidature_id IS NOT DISTINCT FROM OLD.candidature_id
    AND NEW.entreprise_id IS NOT DISTINCT FROM OLD.entreprise_id
    AND NEW.talent_id IS NOT DISTINCT FROM OLD.talent_id
    AND NEW.requested_by IS NOT DISTINCT FROM OLD.requested_by
    AND NEW.document_key IS NOT DISTINCT FROM OLD.document_key
    AND NEW.document_label IS NOT DISTINCT FROM OLD.document_label
    AND NEW.storage_path IS NOT NULL
    AND NEW.file_name IS NOT NULL
    AND NEW.uploaded_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.entreprise_id
    AND OLD.status = 'uploaded'
    AND NEW.status = 'uploaded'
    AND NEW.candidature_id IS NOT DISTINCT FROM OLD.candidature_id
    AND NEW.entreprise_id IS NOT DISTINCT FROM OLD.entreprise_id
    AND NEW.talent_id IS NOT DISTINCT FROM OLD.talent_id
    AND NEW.requested_by IS NOT DISTINCT FROM OLD.requested_by
    AND NEW.document_key IS NOT DISTINCT FROM OLD.document_key
    AND NEW.document_label IS NOT DISTINCT FROM OLD.document_label
    AND NEW.storage_path IS NOT DISTINCT FROM OLD.storage_path
    AND NEW.file_name IS NOT DISTINCT FROM OLD.file_name
    AND NEW.uploaded_at IS NOT DISTINCT FROM OLD.uploaded_at THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.talent_id
    AND OLD.status = 'uploaded'
    AND NEW.status = 'expired'
    AND NEW.candidature_id IS NOT DISTINCT FROM OLD.candidature_id
    AND NEW.entreprise_id IS NOT DISTINCT FROM OLD.entreprise_id
    AND NEW.talent_id IS NOT DISTINCT FROM OLD.talent_id
    AND NEW.requested_by IS NOT DISTINCT FROM OLD.requested_by
    AND NEW.document_key IS NOT DISTINCT FROM OLD.document_key
    AND NEW.document_label IS NOT DISTINCT FROM OLD.document_label
    AND NEW.storage_path IS NOT DISTINCT FROM OLD.storage_path
    AND NEW.file_name IS NOT DISTINCT FROM OLD.file_name
    AND NEW.uploaded_at IS NOT DISTINCT FROM OLD.uploaded_at THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'invalid_document_request_transition';
END;
$$;

DROP TRIGGER IF EXISTS guard_document_request_update_trigger
  ON public.document_requests;
CREATE TRIGGER guard_document_request_update_trigger
BEFORE UPDATE ON public.document_requests
FOR EACH ROW
EXECUTE FUNCTION public.guard_document_request_update();

COMMENT ON FUNCTION public.record_document_receipt(TEXT, TEXT) IS
  'Starts the seven-day deletion grace period after a company download or explicit receipt confirmation.';
COMMENT ON FUNCTION public.finalize_expired_document_deletions(TEXT[], TIMESTAMPTZ) IS
  'Finalizes Storage deletions while preserving traceability metadata and expiring related document requests.';
