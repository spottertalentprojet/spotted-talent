import { describe, expect, it } from "vitest";
import { REQUESTABLE_DOCUMENTS } from "@/lib/documentRequests";
import {
  getLegalSignupMetadata,
  PRIVACY_NOTICE_VERSION,
  SALES_TERMS_VERSION,
  TERMS_VERSION,
} from "@/lib/legal";
import { buildSupportMailto, SUPPORT_EMAIL } from "@/lib/contact";

describe("legal compliance helpers", () => {
  it("attache les versions juridiques courantes à une inscription", () => {
    expect(getLegalSignupMetadata("talent_email_signup")).toEqual({
      terms_accepted_version: TERMS_VERSION,
      privacy_notice_version: PRIVACY_NOTICE_VERSION,
      legal_acknowledgement_source: "talent_email_signup",
    });
  });

  it("sépare les justificatifs métier du dossier administratif post-acceptation", () => {
    const keys = REQUESTABLE_DOCUMENTS.map((document) => document.key);

    expect(keys).toEqual([
      "diplome-certification",
      "permis-conduire",
      "justificatif-permis",
      "titre-sejour",
      "piece-identite",
      "rib",
      "attestation-securite-sociale",
      "justificatif-domicile",
    ]);

    expect(keys).not.toContain("carte-vitale");
    expect(keys).not.toContain("casier-judiciaire");
    expect(keys).not.toContain("autre-document");
    expect(keys).not.toContain("photo-identite");
    expect(REQUESTABLE_DOCUMENTS.filter((document) => document.phase === "onboarding")).toHaveLength(4);
  });

  it("versionne séparément la révision des CGU sur la conservation documentaire", () => {
    expect(TERMS_VERSION).toBe("2026-08-09-v2");
    expect(PRIVACY_NOTICE_VERSION).toBe("2026-08-09-v2");
    expect(SALES_TERMS_VERSION).toBe("2026-08-09");
  });

  it("adresse toujours le support officiel Spotted Talent", () => {
    expect(SUPPORT_EMAIL).toBe("contact@spottedtalent.fr");
    expect(buildSupportMailto("Besoin d'aide")).toBe(
      "mailto:contact@spottedtalent.fr?subject=Besoin%20d'aide",
    );
  });
});
