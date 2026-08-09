export const TERMS_VERSION = "2026-08-09-v2";
export const TERMS_VERSION_LABEL = "09/08/2026 — version 2";
export const PRIVACY_NOTICE_VERSION = "2026-08-09-v2";
export const PRIVACY_NOTICE_VERSION_LABEL = "09/08/2026 — version 2";
export const SALES_TERMS_VERSION = "2026-08-09";
export const LEGAL_EFFECTIVE_DATE = "2026-08-09";

export const PENDING_LEGAL_ACKNOWLEDGEMENT_KEY =
  "spottedtalent_pending_legal_acknowledgement";

export type LegalAcknowledgementSource =
  | "talent_email_signup"
  | "entreprise_email_signup"
  | "talent_google_signup"
  | "entreprise_google_signup"
  | "oauth_completion";

export const getLegalSignupMetadata = (source: LegalAcknowledgementSource) => ({
  terms_accepted_version: TERMS_VERSION,
  privacy_notice_version: PRIVACY_NOTICE_VERSION,
  legal_acknowledgement_source: source,
});

export const rememberPendingLegalAcknowledgement = (
  source: LegalAcknowledgementSource,
) => {
  sessionStorage.setItem(
    PENDING_LEGAL_ACKNOWLEDGEMENT_KEY,
    JSON.stringify({
      termsVersion: TERMS_VERSION,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      source,
    }),
  );
};

export const clearPendingLegalAcknowledgement = () => {
  sessionStorage.removeItem(PENDING_LEGAL_ACKNOWLEDGEMENT_KEY);
};

export const hasPendingCurrentLegalAcknowledgement = () => {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(PENDING_LEGAL_ACKNOWLEDGEMENT_KEY) || "null",
    );

    return Boolean(
      stored &&
        stored.termsVersion === TERMS_VERSION &&
        stored.privacyNoticeVersion === PRIVACY_NOTICE_VERSION,
    );
  } catch {
    clearPendingLegalAcknowledgement();
    return false;
  }
};
