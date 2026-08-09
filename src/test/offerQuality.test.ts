import { describe, expect, it } from "vitest";
import { analyzeOfferQuality } from "@/lib/offerQuality";

describe("analyzeOfferQuality", () => {
  it("bloque une annonce incomplète avant publication", () => {
    const result = analyzeOfferQuality({ title: "Cariste", contract: "CDI", description: "Texte trop court" });

    expect(result.blockers).toContain("Localisation indiquée");
    expect(result.blockers).toContain("Secteur renseigné pour le matching");
    expect(result.blockers).toContain("Annonce générée et relue");
  });

  it("valorise une annonce concise et transparente", () => {
    const description = Array.from({ length: 90 }, (_, index) => `mot${index}`).join(" ");
    const result = analyzeOfferQuality({
      title: "Conducteur poids lourd",
      location: "Chambéry (73000)",
      contract: "CDI",
      sector: "Transport de marchandises",
      skills: "Permis C, FIMO, ponctualité",
      description,
      salaryMin: 2300,
      salaryMax: 2600,
      benefits: ["Mutuelle"],
    });

    expect(result.blockers).toEqual([]);
    expect(result.score).toBe(100);
    expect(result.wordCount).toBe(90);
  });
});
