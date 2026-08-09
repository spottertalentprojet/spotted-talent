export const DOCUMENT_RETENTION_DAYS = {
  talentDocumentAfterReceipt: 7,
  talentDocumentWithoutReceipt: 30,
  companyDocumentDelivery: 90,
} as const;

export const COMPANY_TO_TALENT_DOCUMENT_CATEGORIES = [
  "shared-contrat",
  "shared-fiche-paie",
  "shared-interim",
] as const;

export const TALENT_TO_COMPANY_DOCUMENT_CATEGORY = "shared-requested";

export type DocumentRetentionFlow =
  | "standard"
  | "talent_to_company"
  | "company_to_talent";

export type DocumentActorRole = "talent" | "entreprise" | "admin";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const addRetentionDays = (value: Date | string, days: number) => {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() + days * DAY_IN_MILLISECONDS);
};

export const getInitialDocumentExpiry = (
  category: string,
  sentAt: Date | string = new Date(),
) => {
  const days = COMPANY_TO_TALENT_DOCUMENT_CATEGORIES.includes(
    category as (typeof COMPANY_TO_TALENT_DOCUMENT_CATEGORIES)[number],
  )
    ? DOCUMENT_RETENTION_DAYS.companyDocumentDelivery
    : DOCUMENT_RETENTION_DAYS.talentDocumentWithoutReceipt;

  return addRetentionDays(sentAt, days);
};

export const getTalentDocumentReceiptExpiry = (
  receivedAt: Date | string = new Date(),
) => addRetentionDays(receivedAt, DOCUMENT_RETENTION_DAYS.talentDocumentAfterReceipt);

export const canReadDeliveredDocument = ({
  flow,
  actorRole,
  isOwner,
  isRecipient,
  storageDeleted,
}: {
  flow: DocumentRetentionFlow;
  actorRole: DocumentActorRole;
  isOwner: boolean;
  isRecipient: boolean;
  storageDeleted: boolean;
}) => {
  if (storageDeleted || actorRole === "admin") return false;
  if (flow === "company_to_talent") return actorRole === "talent" && isRecipient;
  if (flow === "talent_to_company") return isOwner || (actorRole === "entreprise" && isRecipient);
  return isOwner;
};

export const TALENT_REQUEST_RETENTION_MESSAGE = (companyName: string) =>
  `Ce document sera automatiquement supprimé une fois récupéré par ${companyName}, avec un délai de sécurité de 7 jours.`;

export const COMPANY_REQUEST_RETENTION_MESSAGE =
  "Ce document sera supprimé automatiquement après réception. Téléchargez et conservez votre propre copie si nécessaire.";

export const TALENT_RECEIVED_DOCUMENT_RETENTION_MESSAGE =
  "Ce document est disponible ici pendant 90 jours. Ce n'est pas votre bulletin de paie officiel — téléchargez-le si vous voulez le garder, ou redemandez-le à votre employeur à tout moment.";
