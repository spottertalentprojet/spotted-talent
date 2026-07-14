import { supabase } from "@/integrations/supabase/client";

type EmailNotificationType =
  | "offer_published"
  | "new_offer"
  | "application_submitted"
  | "new_application"
  | "application_status"
  | "new_message";

const sendNotificationEmail = async (
  type: EmailNotificationType,
  to: string,
  contextId: string,
  data: Record<string, unknown> = {},
) => {
  if (!to || !contextId) return { skipped: true };

  const { data: result, error } = await supabase.functions.invoke("hyper-function", {
    body: { type, to, contextId, data },
  });

  if (error) {
    console.error("Erreur email:", error);
    return { error: true };
  }

  return result;
};

export const emailOffrePubliee = (entrepriseEmail: string, offreId: string) =>
  sendNotificationEmail("offer_published", entrepriseEmail, offreId);

export const emailNouvelleCandiature = (
  talentEmail: string,
  candidatureId: string,
) => sendNotificationEmail("application_submitted", talentEmail, candidatureId);

export const emailCandidatureStatut = (
  talentEmail: string,
  candidatureId: string,
  statut: string,
) => sendNotificationEmail("application_status", talentEmail, candidatureId, { statut });

export const emailNouveauMessage = (
  destinataireEmail: string,
  candidatureId: string,
) => sendNotificationEmail("new_message", destinataireEmail, candidatureId);

export const emailNotificationEntreprise = (
  entrepriseEmail: string,
  candidatureId: string,
) => sendNotificationEmail("new_application", entrepriseEmail, candidatureId);

export const emailNouvelleOffreTalent = (
  talentEmail: string,
  offreId: string,
) => sendNotificationEmail("new_offer", talentEmail, offreId);
