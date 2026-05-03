-- Add request-based document workflow between entreprise and accepted talents.

CREATE TABLE IF NOT EXISTS public.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidature_id UUID NOT NULL REFERENCES public.candidatures(id) ON DELETE CASCADE,
  entreprise_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  document_key TEXT NOT NULL,
  document_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'uploaded')),
  storage_path TEXT,
  file_name TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS document_requests_candidature_document_key_idx
  ON public.document_requests (candidature_id, document_key);

CREATE INDEX IF NOT EXISTS document_requests_candidature_id_idx
  ON public.document_requests (candidature_id);

CREATE INDEX IF NOT EXISTS document_requests_talent_id_idx
  ON public.document_requests (talent_id);

CREATE INDEX IF NOT EXISTS document_requests_entreprise_id_idx
  ON public.document_requests (entreprise_id);

ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parties can read document requests" ON public.document_requests;
CREATE POLICY "Parties can read document requests"
ON public.document_requests
FOR SELECT
USING (
  public.is_admin_user()
  OR public.user_is_party_to_candidature(candidature_id)
);

DROP POLICY IF EXISTS "Entreprise can request candidate documents" ON public.document_requests;
CREATE POLICY "Entreprise can request candidate documents"
ON public.document_requests
FOR INSERT
WITH CHECK (
  public.is_admin_user()
  OR (
    entreprise_id = auth.uid()
    AND requested_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.candidatures c
      JOIN public.offres o ON o.id = c.offre_id
      WHERE c.id = candidature_id
        AND c.statut = 'acceptee'
        AND c.talent_id = talent_id
        AND o.entreprise_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Talent can upload requested documents" ON public.document_requests;
CREATE POLICY "Talent can upload requested documents"
ON public.document_requests
FOR UPDATE
USING (
  public.is_admin_user()
  OR (
    talent_id = auth.uid()
    AND public.user_is_party_to_candidature(candidature_id)
  )
)
WITH CHECK (
  public.is_admin_user()
  OR (
    talent_id = auth.uid()
    AND public.user_is_party_to_candidature(candidature_id)
  )
);

DROP POLICY IF EXISTS "Entreprise can manage own document requests" ON public.document_requests;
CREATE POLICY "Entreprise can manage own document requests"
ON public.document_requests
FOR UPDATE
USING (
  public.is_admin_user()
  OR (
    entreprise_id = auth.uid()
    AND public.user_is_party_to_candidature(candidature_id)
  )
)
WITH CHECK (
  public.is_admin_user()
  OR (
    entreprise_id = auth.uid()
    AND public.user_is_party_to_candidature(candidature_id)
  )
);

DROP POLICY IF EXISTS "Entreprise can delete own document requests" ON public.document_requests;
CREATE POLICY "Entreprise can delete own document requests"
ON public.document_requests
FOR DELETE
USING (
  public.is_admin_user()
  OR (
    entreprise_id = auth.uid()
    AND public.user_is_party_to_candidature(candidature_id)
  )
);

CREATE OR REPLACE FUNCTION public.can_access_document_object(
  p_owner_id text,
  p_category text,
  p_relation_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_relation_id uuid;
BEGIN
  BEGIN
    v_owner_id := p_owner_id::uuid;
  EXCEPTION
    WHEN others THEN
      RETURN false;
  END;

  IF public.is_admin_user() OR auth.uid() = v_owner_id THEN
    RETURN true;
  END IF;

  IF p_category IN ('cv', 'lettre') THEN
    RETURN public.current_user_role() = 'entreprise'
      AND public.is_linked_talent_for_entreprise(v_owner_id);
  END IF;

  IF p_category IN ('shared-contrat', 'shared-fiche-paie', 'shared-interim', 'shared-requested') THEN
    BEGIN
      v_relation_id := p_relation_id::uuid;
    EXCEPTION
      WHEN others THEN
        RETURN false;
    END;

    RETURN public.user_is_party_to_candidature(v_relation_id)
      AND EXISTS (
        SELECT 1
        FROM public.candidatures c
        JOIN public.offres o ON o.id = c.offre_id
        WHERE c.id = v_relation_id
          AND v_owner_id IN (c.talent_id, o.entreprise_id)
      );
  END IF;

  RETURN false;
END;
$$;
