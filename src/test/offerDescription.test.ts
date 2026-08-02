import { describe, expect, it } from "vitest";
import { getOfferDescriptionPreview, parseOfferDescription } from "@/components/OfferDescription";

describe("offer description formatting", () => {
  const legacyDescription =
    "Chauffeur-Livreur VL (CDI) Entreprise: HDL Localisation: Chambéry --- 📝 Description du poste HDL recherche un chauffeur-livreur pour renforcer son équipe. --- 🎯 Missions principales - Livraison de marchandises aux clients. - Respect des règles de sécurité. --- 👤 Profil recherché | Critère | Détail | |---|---| | Expérience | 2 à 5 ans | | Compétences | Ponctualité et sens du service | --- 📩 Comment postuler Envoyez votre CV par email.";

  it("transforme une ancienne annonce compacte en sections lisibles", () => {
    const sections = parseOfferDescription(legacyDescription);

    expect(sections.map((section) => section.title)).toEqual([
      "À propos du poste",
      "Vos missions",
      "Profil recherché",
    ]);
    expect(sections[0].lines.join(" ")).not.toContain("Entreprise:");
    expect(sections[1].lines).toContain("• Livraison de marchandises aux clients.");
    expect(sections.flatMap((section) => section.lines).join(" ")).not.toContain("Envoyez votre CV");
  });

  it("produit un aperçu court sans balises de mise en forme", () => {
    const preview = getOfferDescriptionPreview(legacyDescription, 90);

    expect(preview.length).toBeLessThanOrEqual(91);
    expect(preview).not.toContain("---");
    expect(preview).not.toContain("📝");
  });
});
