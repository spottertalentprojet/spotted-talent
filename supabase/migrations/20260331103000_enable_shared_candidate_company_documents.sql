-- Allow shared document folders scoped to a candidature between the linked talent and entreprise.

CREATE OR REPLACE FUNCTION public.user_is_party_to_candidature(p_candidature_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.candidatures c
    JOIN public.offres o ON o.id = c.offre_id
    WHERE c.id = p_candidature_id
      AND auth.uid() IN (c.talent_id, o.entreprise_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_document_object(p_owner_id text, p_category text, p_relation_id text DEFAULT NULL)
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

  IF p_category IN ('shared-contrat', 'shared-fiche-paie', 'shared-interim') THEN
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

DROP POLICY IF EXISTS "Users can read allowed documents" ON storage.objects;
CREATE POLICY "Users can read allowed documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND public.can_access_document_object(
    split_part(name, '/', 1),
    split_part(name, '/', 2),
    NULLIF(split_part(name, '/', 3), '')
  )
);
