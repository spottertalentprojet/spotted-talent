-- Add application-level document encryption metadata, retention helpers, and anonymized backup views.

CREATE TABLE IF NOT EXISTS public.document_encryption_keys (
  storage_path TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  relation_id UUID,
  document_request_id UUID REFERENCES public.document_requests(id) ON DELETE SET NULL,
  original_file_name TEXT NOT NULL,
  original_mime_type TEXT,
  original_size_bytes BIGINT,
  encrypted_size_bytes BIGINT,
  algorithm TEXT NOT NULL DEFAULT 'AES-GCM',
  iv_b64 TEXT NOT NULL,
  key_b64 TEXT NOT NULL,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE INDEX IF NOT EXISTS document_encryption_keys_owner_id_idx
  ON public.document_encryption_keys (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS document_encryption_keys_relation_id_idx
  ON public.document_encryption_keys (relation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS document_encryption_keys_expires_at_idx
  ON public.document_encryption_keys (expires_at);

ALTER TABLE public.document_encryption_keys ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname
  INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.document_access_logs'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%action%'
  LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.document_access_logs DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END;
$$;

ALTER TABLE public.document_access_logs
ADD CONSTRAINT document_access_logs_action_check
CHECK (action IN ('upload', 'open', 'download', 'delete', 'request_created', 'request_deleted', 'retention_deleted'));

DROP POLICY IF EXISTS "Document encryption metadata visible to allowed parties" ON public.document_encryption_keys;
CREATE POLICY "Document encryption metadata visible to allowed parties"
ON public.document_encryption_keys
FOR SELECT
USING (
  public.is_admin_user()
  OR owner_id = auth.uid()
  OR public.can_access_document_path(storage_path)
);

DROP POLICY IF EXISTS "Users can register own encrypted documents" ON public.document_encryption_keys;
CREATE POLICY "Users can register own encrypted documents"
ON public.document_encryption_keys
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND owner_id = auth.uid()
  AND owner_id::text = split_part(storage_path, '/', 1)
);

DROP POLICY IF EXISTS "Users can delete own encrypted document metadata" ON public.document_encryption_keys;
CREATE POLICY "Users can delete own encrypted document metadata"
ON public.document_encryption_keys
FOR DELETE
USING (
  public.is_admin_user()
  OR owner_id = auth.uid()
);

CREATE OR REPLACE FUNCTION public.log_document_access(
  p_action text,
  p_storage_path text DEFAULT NULL,
  p_file_name text DEFAULT NULL,
  p_document_request_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_text text;
  v_category text;
  v_relation_text text;
  v_owner_id uuid;
  v_relation_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_action NOT IN ('upload', 'open', 'download', 'delete', 'request_created', 'request_deleted', 'retention_deleted') THEN
    RAISE EXCEPTION 'invalid_document_action';
  END IF;

  IF p_storage_path IS NOT NULL AND length(trim(p_storage_path)) > 0 THEN
    v_owner_text := split_part(p_storage_path, '/', 1);
    v_category := split_part(p_storage_path, '/', 2);
    v_relation_text := NULLIF(split_part(p_storage_path, '/', 3), '');

    BEGIN
      v_owner_id := v_owner_text::uuid;
    EXCEPTION
      WHEN others THEN
        RAISE EXCEPTION 'invalid_document_owner';
    END;

    IF v_relation_text IS NOT NULL THEN
      BEGIN
        v_relation_id := v_relation_text::uuid;
      EXCEPTION
        WHEN others THEN
          v_relation_id := NULL;
      END;
    END IF;

    IF NOT (
      public.can_access_document_path(p_storage_path)
      OR (p_action = 'upload' AND v_owner_id = auth.uid())
      OR public.is_admin_user()
    ) THEN
      RAISE EXCEPTION 'document_access_denied';
    END IF;
  END IF;

  IF p_document_request_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.document_requests dr
      WHERE dr.id = p_document_request_id
        AND (
          public.is_admin_user()
          OR auth.uid() IN (dr.talent_id, dr.entreprise_id, dr.requested_by)
        )
    ) THEN
      RAISE EXCEPTION 'document_request_access_denied';
    END IF;
  END IF;

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
  )
  VALUES (
    auth.uid(),
    p_action,
    NULLIF(p_storage_path, ''),
    v_owner_id,
    v_category,
    v_relation_id,
    p_document_request_id,
    NULLIF(p_file_name, ''),
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_document_access(text, text, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_document_access(text, text, text, uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_expired_documents(p_now timestamptz DEFAULT now())
RETURNS TABLE(storage_path text, deleted_reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  RETURN QUERY
  WITH expired AS (
    SELECT
      dek.storage_path,
      dek.owner_id,
      dek.category,
      dek.relation_id,
      dek.document_request_id,
      dek.original_file_name,
      dek.expires_at
    FROM public.document_encryption_keys dek
    WHERE dek.expires_at <= p_now
  ),
  retention_log AS (
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
    )
    SELECT
      e.owner_id,
      'retention_deleted',
      e.storage_path,
      e.owner_id,
      e.category,
      e.relation_id,
      e.document_request_id,
      e.original_file_name,
      jsonb_build_object(
        'reason', 'retention_expired',
        'deleted_by', 'system',
        'expires_at', e.expires_at
      )
    FROM expired e
    RETURNING storage_path
  ),
  deleted_objects AS (
    DELETE FROM storage.objects so
    USING expired e
    WHERE so.bucket_id = 'documents'
      AND so.name = e.storage_path
    RETURNING so.name
  ),
  deleted_keys AS (
    DELETE FROM public.document_encryption_keys dek
    USING expired e
    WHERE dek.storage_path = e.storage_path
    RETURNING dek.storage_path
  )
  SELECT COALESCE(deleted_objects.name, deleted_keys.storage_path), 'retention_expired'
  FROM deleted_keys
  FULL JOIN deleted_objects ON deleted_objects.name = deleted_keys.storage_path;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_documents(timestamptz) FROM PUBLIC;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
  PERFORM cron.schedule(
    'spotted_talent_cleanup_expired_documents',
    '15 3 * * *',
    'select public.cleanup_expired_documents();'
  );
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'pg_cron schedule not installed automatically: %', SQLERRM;
END;
$$;

CREATE OR REPLACE VIEW public.anonymized_backup_profiles AS
SELECT
  user_id,
  role,
  md5(COALESCE(email, '')) AS email_hash,
  CASE WHEN full_name IS NULL THEN NULL ELSE 'Utilisateur ' || left(md5(full_name), 8) END AS full_name_masked,
  CASE WHEN telephone IS NULL THEN NULL ELSE 'phone_' || left(md5(telephone), 8) END AS telephone_masked,
  CASE WHEN company_name IS NULL THEN NULL ELSE 'Entreprise ' || left(md5(company_name), 8) END AS company_name_masked,
  secteur,
  created_at
FROM public.profiles;

CREATE OR REPLACE VIEW public.anonymized_backup_candidatures AS
SELECT
  id,
  md5(talent_id::text) AS talent_hash,
  offre_id,
  statut,
  note,
  created_at
FROM public.candidatures;

CREATE OR REPLACE VIEW public.anonymized_backup_document_requests AS
SELECT
  id,
  candidature_id,
  md5(entreprise_id::text) AS entreprise_hash,
  md5(talent_id::text) AS talent_hash,
  document_key,
  document_label,
  status,
  CASE WHEN file_name IS NULL THEN NULL ELSE 'file_' || left(md5(file_name), 8) END AS file_name_masked,
  requested_at,
  uploaded_at,
  created_at
FROM public.document_requests;
