-- Strengthen document access with path-level checks and an audit trail.

CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upload', 'open', 'download', 'delete', 'request_created', 'request_deleted')),
  bucket_id TEXT NOT NULL DEFAULT 'documents',
  storage_path TEXT,
  owner_id UUID,
  category TEXT,
  relation_id UUID,
  document_request_id UUID REFERENCES public.document_requests(id) ON DELETE SET NULL,
  file_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_access_logs_actor_id_idx
  ON public.document_access_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS document_access_logs_storage_path_idx
  ON public.document_access_logs (storage_path, created_at DESC);

CREATE INDEX IF NOT EXISTS document_access_logs_relation_id_idx
  ON public.document_access_logs (relation_id, created_at DESC);

ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Document logs visible to related parties" ON public.document_access_logs;
CREATE POLICY "Document logs visible to related parties"
ON public.document_access_logs
FOR SELECT
USING (
  public.is_admin_user()
  OR actor_id = auth.uid()
  OR owner_id = auth.uid()
  OR (
    relation_id IS NOT NULL
    AND public.user_is_party_to_candidature(relation_id)
  )
);

CREATE OR REPLACE FUNCTION public.can_access_document_path(p_storage_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_text text;
  v_category text;
  v_relation_text text;
  v_request_text text;
  v_relation_id uuid;
  v_request_id uuid;
BEGIN
  IF p_storage_path IS NULL OR length(trim(p_storage_path)) = 0 THEN
    RETURN false;
  END IF;

  v_owner_text := split_part(p_storage_path, '/', 1);
  v_category := split_part(p_storage_path, '/', 2);
  v_relation_text := NULLIF(split_part(p_storage_path, '/', 3), '');
  v_request_text := NULLIF(split_part(p_storage_path, '/', 4), '');

  IF NOT public.can_access_document_object(v_owner_text, v_category, v_relation_text) THEN
    RETURN false;
  END IF;

  IF v_category = 'shared-requested' THEN
    BEGIN
      v_relation_id := v_relation_text::uuid;
      v_request_id := v_request_text::uuid;
    EXCEPTION
      WHEN others THEN
        RETURN false;
    END;

    RETURN EXISTS (
      SELECT 1
      FROM public.document_requests dr
      WHERE dr.id = v_request_id
        AND dr.candidature_id = v_relation_id
        AND dr.storage_path = p_storage_path
        AND dr.status = 'uploaded'
        AND (
          public.is_admin_user()
          OR auth.uid() IN (dr.talent_id, dr.entreprise_id)
        )
    );
  END IF;

  IF v_category IN ('shared-contrat', 'shared-fiche-paie', 'shared-interim') THEN
    BEGIN
      v_relation_id := v_relation_text::uuid;
    EXCEPTION
      WHEN others THEN
        RETURN false;
    END;

    RETURN EXISTS (
      SELECT 1
      FROM public.candidatures c
      JOIN public.offres o ON o.id = c.offre_id
      WHERE c.id = v_relation_id
        AND c.statut = 'acceptee'
        AND auth.uid() IN (c.talent_id, o.entreprise_id)
    ) OR public.is_admin_user();
  END IF;

  RETURN true;
END;
$$;

DROP POLICY IF EXISTS "Users can read allowed documents" ON storage.objects;
CREATE POLICY "Users can read allowed documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND public.can_access_document_path(name)
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

  IF p_action NOT IN ('upload', 'open', 'download', 'delete', 'request_created', 'request_deleted') THEN
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

    IF NOT public.can_access_document_path(p_storage_path) THEN
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
