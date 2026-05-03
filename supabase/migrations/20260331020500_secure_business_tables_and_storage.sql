-- Secure business tables and storage access for production.

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '') = 'contact@spottedtalent.fr';
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.owns_offre(p_offre_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.offres o
    WHERE o.id = p_offre_id
      AND o.entreprise_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_candidature_for_offre(p_offre_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.candidatures c
    WHERE c.offre_id = p_offre_id
      AND c.talent_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_linked_talent_for_entreprise(p_talent_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_user_role() = 'entreprise'
    AND EXISTS (
      SELECT 1
      FROM public.candidatures c
      JOIN public.offres o ON o.id = c.offre_id
      WHERE c.talent_id = p_talent_user_id
        AND o.entreprise_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.can_send_message(p_candidature_id uuid, p_destinataire_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_talent_id uuid;
  v_entreprise_id uuid;
BEGIN
  SELECT c.talent_id, o.entreprise_id
  INTO v_talent_id, v_entreprise_id
  FROM public.candidatures c
  JOIN public.offres o ON o.id = c.offre_id
  WHERE c.id = p_candidature_id;

  IF v_talent_id IS NULL OR v_entreprise_id IS NULL THEN
    RETURN false;
  END IF;

  IF auth.uid() NOT IN (v_talent_id, v_entreprise_id) THEN
    RETURN false;
  END IF;

  IF p_destinataire_id NOT IN (v_talent_id, v_entreprise_id) OR p_destinataire_id = auth.uid() THEN
    RETURN false;
  END IF;

  IF auth.uid() = v_entreprise_id THEN
    RETURN p_destinataire_id = v_talent_id;
  END IF;

  RETURN p_destinataire_id = v_entreprise_id
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.candidature_id = p_candidature_id
        AND m.expedition_id = v_entreprise_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_document_object(p_owner_id text, p_category text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
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

  RETURN public.current_user_role() = 'entreprise'
    AND p_category IN ('cv', 'lettre')
    AND public.is_linked_talent_for_entreprise(v_owner_id);
END;
$$;

ALTER TABLE public.offres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage profiles" ON public.profiles;
CREATE POLICY "Admin can manage profiles"
ON public.profiles
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Profiles self or business access" ON public.profiles;
CREATE POLICY "Profiles self or business access"
ON public.profiles
FOR SELECT
USING (
  public.is_admin_user()
  OR auth.uid() = user_id
  OR (auth.role() = 'authenticated' AND role = 'entreprise')
  OR (role = 'talent' AND public.is_linked_talent_for_entreprise(user_id))
);

DROP POLICY IF EXISTS "Authenticated users can read visible offers" ON public.offres;
CREATE POLICY "Authenticated users can read visible offers"
ON public.offres
FOR SELECT
USING (
  public.is_admin_user()
  OR statut = 'active'
  OR entreprise_id = auth.uid()
  OR public.user_has_candidature_for_offre(id)
);

DROP POLICY IF EXISTS "Entreprise can insert own offers" ON public.offres;
CREATE POLICY "Entreprise can insert own offers"
ON public.offres
FOR INSERT
WITH CHECK (
  public.is_admin_user()
  OR entreprise_id = auth.uid()
);

DROP POLICY IF EXISTS "Entreprise can update own offers" ON public.offres;
CREATE POLICY "Entreprise can update own offers"
ON public.offres
FOR UPDATE
USING (
  public.is_admin_user()
  OR entreprise_id = auth.uid()
)
WITH CHECK (
  public.is_admin_user()
  OR entreprise_id = auth.uid()
);

DROP POLICY IF EXISTS "Entreprise can delete own offers" ON public.offres;
CREATE POLICY "Entreprise can delete own offers"
ON public.offres
FOR DELETE
USING (
  public.is_admin_user()
  OR entreprise_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can read related candidatures" ON public.candidatures;
CREATE POLICY "Users can read related candidatures"
ON public.candidatures
FOR SELECT
USING (
  public.is_admin_user()
  OR talent_id = auth.uid()
  OR public.owns_offre(offre_id)
);

DROP POLICY IF EXISTS "Talent can insert own candidatures" ON public.candidatures;
CREATE POLICY "Talent can insert own candidatures"
ON public.candidatures
FOR INSERT
WITH CHECK (
  public.is_admin_user()
  OR (
    talent_id = auth.uid()
    AND public.current_user_role() = 'talent'
  )
);

DROP POLICY IF EXISTS "Entreprise can update related candidatures" ON public.candidatures;
CREATE POLICY "Entreprise can update related candidatures"
ON public.candidatures
FOR UPDATE
USING (
  public.is_admin_user()
  OR public.owns_offre(offre_id)
)
WITH CHECK (
  public.is_admin_user()
  OR public.owns_offre(offre_id)
);

DROP POLICY IF EXISTS "Talent can delete own candidatures" ON public.candidatures;
CREATE POLICY "Talent can delete own candidatures"
ON public.candidatures
FOR DELETE
USING (
  public.is_admin_user()
  OR talent_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can read their messages" ON public.messages;
CREATE POLICY "Users can read their messages"
ON public.messages
FOR SELECT
USING (
  public.is_admin_user()
  OR expedition_id = auth.uid()
  OR destinataire_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can send allowed messages" ON public.messages;
CREATE POLICY "Users can send allowed messages"
ON public.messages
FOR INSERT
WITH CHECK (
  public.is_admin_user()
  OR (
    expedition_id = auth.uid()
    AND public.can_send_message(candidature_id, destinataire_id)
  )
);

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (
  public.is_admin_user()
  OR destinataire_id = auth.uid()
)
WITH CHECK (
  public.is_admin_user()
  OR destinataire_id = auth.uid()
);

DROP POLICY IF EXISTS "Admin can delete messages" ON public.messages;
CREATE POLICY "Admin can delete messages"
ON public.messages
FOR DELETE
USING (public.is_admin_user());

INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

INSERT INTO storage.buckets (id, name, public)
SELECT 'documents', 'documents', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'documents'
);

UPDATE storage.buckets SET public = true WHERE id = 'avatars';
UPDATE storage.buckets SET public = false WHERE id = 'documents';

DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = split_part(name, '/', 1)
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = split_part(name, '/', 1)
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = split_part(name, '/', 1)
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = split_part(name, '/', 1)
);

DROP POLICY IF EXISTS "Users can read allowed documents" ON storage.objects;
CREATE POLICY "Users can read allowed documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND public.can_access_document_object(
    split_part(name, '/', 1),
    split_part(name, '/', 2)
  )
);

DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = split_part(name, '/', 1)
);

DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
CREATE POLICY "Users can update own documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = split_part(name, '/', 1)
)
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = split_part(name, '/', 1)
);

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = split_part(name, '/', 1)
);
