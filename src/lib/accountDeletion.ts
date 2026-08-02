export const ACCOUNT_DELETION_CONFIRMATION = "SUPPRIMER MON COMPTE";

export const isAccountDeletionConfirmed = (value: string) =>
  value.trim() === ACCOUNT_DELETION_CONFIRMATION;

export const clearAccountLocalState = () => {
  const keys = Object.keys(window.localStorage).filter(
    (key) => key.startsWith("spotted-talent:") || key.startsWith("spottedtalent_"),
  );
  keys.forEach((key) => window.localStorage.removeItem(key));
  window.sessionStorage.clear();
};
