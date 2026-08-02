-- Candidate exchanges are opened by the company, never by the talent.
-- Automated status notifications do not count as a human opening message.
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
  v_statut text;
BEGIN
  SELECT c.talent_id, o.entreprise_id, c.statut::text
  INTO v_talent_id, v_entreprise_id, v_statut
  FROM public.candidatures c
  JOIN public.offres o ON o.id = c.offre_id
  WHERE c.id = p_candidature_id;

  IF v_talent_id IS NULL OR v_entreprise_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_statut = 'refusee' THEN
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
        AND m.destinataire_id = v_talent_id
        AND COALESCE(m.automated, false) = false
    );
END;
$$;

COMMENT ON FUNCTION public.can_send_message(uuid, uuid) IS
  'Allows a company to open an exchange and a talent to reply only after a non-automated company message; refused candidatures are read-only.';
