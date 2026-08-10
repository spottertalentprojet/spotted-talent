import { describe, expect, it } from "vitest";
import { MATCHING_WEIGHTS, calculateMatchingResult } from "@/lib/matching";

const offre = {
  secteur: "Transport & Mobilité",
  contrat: "Intérim",
  localisation: "Chambéry (73000)",
  competences: "Conduite PL, sécurité, relation client",
  permis_requis: "Permis C, FIMO",
};

const profil = {
  secteur: "Transport & Mobilité",
  contrat: "Intérim",
  localisation: "Chambéry",
  competences: "Conduite PL, sécurité, relation client",
  permis: "Permis C, FIMO",
};

describe("matching partagé Talent et Entreprise", () => {
  it("utilise une pondération unique totalisant 100 points", () => {
    expect(MATCHING_WEIGHTS).toEqual({
      competences: 30,
      secteur: 30,
      localisation: 20,
      contrat: 20,
    });
    expect(calculateMatchingResult(offre, profil)).toMatchObject({
      score: 100,
      meetsRequiredPermits: true,
      missingRequiredPermits: [],
    });
  });

  it("sort les permis obligatoires du score et signale chaque prérequis manquant", () => {
    const result = calculateMatchingResult(offre, { ...profil, permis: "Permis B" });

    expect(result.score).toBe(100);
    expect(result.meetsRequiredPermits).toBe(false);
    expect(result.missingRequiredPermits).toEqual(["Permis C", "FIMO"]);
  });

  it("ne crée aucun prérequis lorsque l’offre ne demande aucun permis", () => {
    const result = calculateMatchingResult(
      { ...offre, permis_requis: "Aucun permis" },
      { ...profil, permis: "" },
    );

    expect(result.meetsRequiredPermits).toBe(true);
    expect(result.missingRequiredPermits).toEqual([]);
  });

  it("calcule proportionnellement les compétences déclarées", () => {
    const result = calculateMatchingResult(
      offre,
      { ...profil, competences: "Conduite PL, sécurité" },
    );

    expect(result.score).toBe(90);
  });
});
