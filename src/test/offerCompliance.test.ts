import { describe, expect, it } from "vitest";
import { analyzeOfferCompliance } from "@/lib/offerCompliance";

const validOffer = {
  title: "Conducteur poids lourd",
  location: "Chambéry (73000)",
  contract: "CDI",
  sector: "Transport de marchandises",
  experience: "2 à 5 ans",
  description: Array.from({ length: 85 }, (_, index) => `contenu${index}`).join(" "),
  salaryMin: "28000",
  salaryMax: "34000",
  salaryPeriod: "annual",
  employerConfirmed: true,
};

describe("analyzeOfferCompliance", () => {
  it("accepte une offre complète sans inventer de valeur", () => {
    expect(analyzeOfferCompliance(validOffer).blockers).toEqual([]);
  });

  it("exige durée et motif pour un CDD", () => {
    const result = analyzeOfferCompliance({ ...validOffer, contract: "CDD" });
    expect(result.blockers.map((finding) => finding.id)).toEqual(expect.arrayContaining([
      "duration-required",
      "temporary-reason-required",
    ]));
  });

  it("refuse une fourchette de rémunération incomplète ou inversée", () => {
    const incomplete = analyzeOfferCompliance({ ...validOffer, salaryMax: "" });
    const inverted = analyzeOfferCompliance({ ...validOffer, salaryMin: "35000", salaryMax: "30000" });
    expect(incomplete.blockers.some((finding) => finding.id === "salary-range-incomplete")).toBe(true);
    expect(inverted.blockers.some((finding) => finding.id === "salary-range-order")).toBe(true);
  });

  it("bloque les exclusions explicites et place les formulations ambiguës en revue", () => {
    const blocked = analyzeOfferCompliance({ ...validOffer, title: "Poste réservé aux hommes" });
    const review = analyzeOfferCompliance({ ...validOffer, title: "Jeune et dynamique", description: `${validOffer.description} jeune et dynamique` });
    expect(blocked.blockers.some((finding) => finding.id === "gender-exclusion")).toBe(true);
    expect(review.reviews.some((finding) => finding.id === "young-profile")).toBe(true);
  });

  it("bloque les frais de candidature et les numéros potentiellement surtaxés", () => {
    const result = analyzeOfferCompliance({
      ...validOffer,
      description: `${validOffer.description} Frais de candidature : 15 euros. Appelez le 0899 12 34 56.`,
    });
    expect(result.blockers.map((finding) => finding.id)).toEqual(expect.arrayContaining([
      "paid-application",
      "premium-phone",
    ]));
  });
});
