export const ACCOUNT_DELETION_CONFIRMATION = "SUPPRIMER MON COMPTE";

export const ACCOUNT_DELETION_REASON_OPTIONS = [
  { value: "found_job", label: "J'ai trouvé un emploi" },
  { value: "not_enough_relevant_offers", label: "Je ne trouve pas assez d'offres adaptées" },
  { value: "difficult_to_use", label: "La plateforme est difficile à utiliser" },
  { value: "technical_issue", label: "J'ai rencontré un problème technique" },
  { value: "privacy_concerns", label: "Je suis préoccupé(e) par mes données" },
  { value: "too_many_notifications", label: "Je reçois trop de notifications" },
  { value: "no_longer_needed", label: "Je n'utilise plus la plateforme" },
  { value: "recreate_account", label: "Je souhaite recréer mon compte" },
  { value: "other", label: "Autre raison" },
  { value: "prefer_not_to_say", label: "Je préfère ne pas répondre" },
] as const;

export type AccountDeletionReason = (typeof ACCOUNT_DELETION_REASON_OPTIONS)[number]["value"];

export const ACCOUNT_DELETION_REASON_LABELS = Object.fromEntries(
  ACCOUNT_DELETION_REASON_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<AccountDeletionReason, string>;

export const ACCOUNT_DELETION_FEEDBACK_MAX_LENGTH = 500;

const accountDeletionReasons = new Set<string>(
  ACCOUNT_DELETION_REASON_OPTIONS.map(({ value }) => value),
);

export const isAccountDeletionReason = (value: unknown): value is AccountDeletionReason =>
  typeof value === "string" && accountDeletionReasons.has(value);

export const normalizeAccountDeletionFeedback = (reason: unknown, feedback: unknown) => ({
  reason: isAccountDeletionReason(reason) ? reason : "prefer_not_to_say" as AccountDeletionReason,
  feedback: typeof feedback === "string"
    ? feedback.trim().slice(0, ACCOUNT_DELETION_FEEDBACK_MAX_LENGTH) || null
    : null,
});

export const isAccountDeletionConfirmed = (value: string) =>
  value.trim() === ACCOUNT_DELETION_CONFIRMATION;

export const clearAccountLocalState = () => {
  const keys = Object.keys(window.localStorage).filter(
    (key) => key.startsWith("spotted-talent:") || key.startsWith("spottedtalent_"),
  );
  keys.forEach((key) => window.localStorage.removeItem(key));
  window.sessionStorage.clear();
};
