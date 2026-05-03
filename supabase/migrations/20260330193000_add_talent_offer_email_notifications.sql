ALTER TABLE IF EXISTS public.offres
  ADD COLUMN IF NOT EXISTS secteur TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_offres_email BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.get_matching_talent_email_recipients_for_offer(p_offre_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.email, p.full_name
  FROM public.offres o
  JOIN public.profiles p ON p.role = 'talent'
  WHERE o.id = p_offre_id
    AND o.entreprise_id = auth.uid()
    AND o.statut = 'active'
    AND COALESCE(p.notification_offres_email, true) = true
    AND p.email IS NOT NULL
    AND btrim(p.email) <> ''
    AND (
      (NULLIF(btrim(COALESCE(o.secteur, '')), '') IS NOT NULL AND lower(COALESCE(p.secteur, '')) = lower(o.secteur))
      OR
      (NULLIF(btrim(COALESCE(o.contrat, '')), '') IS NOT NULL AND lower(COALESCE(p.contrat, '')) = lower(o.contrat))
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_matching_talent_email_recipients_for_offer(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_matching_talent_email_recipients_for_offer(UUID) TO authenticated;
