import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { REQUESTABLE_DOCUMENTS } from "@/lib/documentRequests";
import {
  getLegalSignupMetadata,
  LEGAL_EFFECTIVE_DATE,
  PRIVACY_NOTICE_VERSION,
  SALES_TERMS_VERSION,
  TERMS_VERSION,
} from "@/lib/legal";
import { buildSupportMailto, SUPPORT_EMAIL } from "@/lib/contact";

const publicInformationPages = [
  "src/pages/Aide.tsx",
  "src/pages/CGU.tsx",
  "src/pages/CGV.tsx",
  "src/pages/Confidentialite.tsx",
  "src/components/Footer.tsx",
]
  .map((filePath) => readFileSync(resolve(process.cwd(), filePath), "utf8"))
  .join("\n");

const matchingDisclosurePages = [
  "src/pages/CGU.tsx",
  "src/pages/Confidentialite.tsx",
  "docs/rgpd/aipd-recrutement-matching.md",
].map((filePath) => ({
  filePath,
  content: readFileSync(resolve(process.cwd(), filePath), "utf8"),
}));

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

  it("présente une ouverture prochaine sans date commerciale obsolète", () => {
    expect(LEGAL_EFFECTIVE_DATE).toBe("2026-08-09");
    expect(publicInformationPages).not.toContain("1er septembre 2026");
    expect(publicInformationPages).not.toContain("01/09/2026");
    expect(publicInformationPages).toContain("ouverture commerciale prochaine");
  });

  it("évite les points-virgules résiduels dans les textes publics", () => {
    expect(publicInformationPages).not.toMatch(/\s;/);
  });

  it("publie la même pondération et le même traitement des prérequis dans les deux espaces", () => {
    matchingDisclosurePages.forEach(({ content, filePath }) => {
      expect(content, filePath).toMatch(/Secteur|secteur/);
      expect(content, filePath).toMatch(/30\s*(?:%|points)/);
      expect(content, filePath).toMatch(/20\s*(?:%|points)/);
      expect(content, filePath).toMatch(/prérequis/i);
      expect(content, filePath).toMatch(/sans empêcher|n’empêche pas|ne bloque pas/i);
      expect(content, filePath).toMatch(/aucun refus automatique|sans entraîner de refus automatique|ne produit aucun refus automatique/i);
    });
  });
});
