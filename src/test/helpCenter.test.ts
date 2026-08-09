import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const helpCenter = readFileSync(resolve(process.cwd(), "src/pages/Aide.tsx"), "utf8");
const talentDashboard = readFileSync(resolve(process.cwd(), "src/pages/TalentDashboard.tsx"), "utf8");
const companyDashboard = readFileSync(resolve(process.cwd(), "src/pages/EntrepriseDashboard.tsx"), "utf8");

describe("complete help center", () => {
  it("covers the principal Talent and Entreprise journeys", () => {
    [
      "Démarrage et connexion",
      "Profil Talent",
      "Offres et candidatures",
      "CV, analyse IA et lettre",
      "Documents et coffre sécurisé",
      "Compte et profil Entreprise",
      "Créer et publier une offre",
      "Abonnement, paiement et factures",
      "Sécurité, confidentialité et compte",
      "Dépannage et support",
    ].forEach((title) => expect(helpCenter).toContain(title));
  });

  it("keeps document retention durations sourced from the shared constants", () => {
    expect(helpCenter).toContain("DOCUMENT_RETENTION_DAYS.talentDocumentAfterReceipt");
    expect(helpCenter).toContain("DOCUMENT_RETENTION_DAYS.talentDocumentWithoutReceipt");
    expect(helpCenter).toContain("DOCUMENT_RETENTION_DAYS.companyDocumentDelivery");
  });

  it("links both authenticated spaces to their contextual help", () => {
    expect(talentDashboard).toContain('navigate("/aide?role=talent")');
    expect(companyDashboard).toContain('navigate("/aide?role=entreprise")');
    expect(helpCenter).toContain('buildSupportMailto("Demande d\'aide Spotted Talent")');
  });
});
