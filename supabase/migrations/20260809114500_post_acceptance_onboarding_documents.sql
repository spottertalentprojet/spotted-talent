-- Extend the accepted-candidature vault with a narrowly defined onboarding
-- document set. The candidature relationship and accepted status are enforced
-- by the database, independently from the frontend.

CREATE OR REPLACE FUNCTION public.enforce_allowed_candidate_document_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.candidatures c
    JOIN public.offres o ON o.id = c.offre_id
    WHERE c.id = NEW.candidature_id
      AND c.statut = 'acceptee'
      AND c.talent_id = NEW.talent_id
      AND o.entreprise_id = NEW.entreprise_id
  ) THEN
    RAISE EXCEPTION 'accepted_candidature_required';
  END IF;

  NEW.document_label := CASE NEW.document_key
    WHEN 'diplome-certification' THEN 'Diplôme ou certification'
    WHEN 'permis-conduire' THEN 'Permis de conduire requis'
    WHEN 'justificatif-permis' THEN 'Habilitation ou permis métier'
    WHEN 'titre-sejour' THEN 'Autorisation de travail'
    WHEN 'piece-identite' THEN 'Pièce d’identité'
    WHEN 'rib' THEN 'RIB'
    WHEN 'attestation-securite-sociale' THEN 'Attestation de droits Assurance Maladie'
    WHEN 'justificatif-domicile' THEN 'Justificatif de domicile'
    ELSE NULL
  END;

  IF NEW.document_label IS NULL THEN
    RAISE EXCEPTION 'document_request_not_allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_allowed_candidate_document_request_trigger
  ON public.document_requests;
CREATE TRIGGER enforce_allowed_candidate_document_request_trigger
BEFORE INSERT OR UPDATE OF document_key
ON public.document_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_allowed_candidate_document_request();

COMMENT ON FUNCTION public.enforce_allowed_candidate_document_request() IS
  'Restricts document requests to predefined job or onboarding documents for accepted candidatures only.';
