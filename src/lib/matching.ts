export const MATCHING_WEIGHTS = {
  competences: 30,
  secteur: 30,
  localisation: 20,
  contrat: 20,
} as const;

export type MatchingResult = {
  score: number;
  meetsRequiredPermits: boolean;
  missingRequiredPermits: string[];
  matchedRequiredPermits: string[];
};

type MatchingOffer = {
  secteur?: string | null;
  contrat?: string | null;
  localisation?: string | null;
  competences?: string | string[] | null;
  permis_requis?: string | string[] | null;
};

type MatchingProfile = {
  secteur?: string | null;
  contrat?: string | null;
  localisation?: string | null;
  competences?: string | string[] | null;
  permis?: string | string[] | null;
};

export const normalizeMatchingText = (value?: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitDeclaredList = (value?: string | string[] | null) => {
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => String(item ?? "").split(/[,;|\n]+|\s+\+\s+/))
    .map((item) => item.trim())
    .filter(Boolean);
};

const NO_PERMIT_REQUIREMENT = new Set([
  "aucun",
  "aucun permis",
  "non requis",
  "pas de permis requis",
  "sans permis",
  "non precise",
  "non renseigne",
]);

const normalizePermit = (value: string) =>
  normalizeMatchingText(value)
    .replace(/^permis de conduire\s+/, "")
    .replace(/^permis\s+/, "")
    .replace(/^habilitation\s+/, "")
    .trim();

const declaredValueMatches = (required: string, declaredValues: string[]) => {
  const normalizedRequired = normalizeMatchingText(required);
  if (!normalizedRequired) return false;

  return declaredValues.some((declared) => {
    const normalizedDeclared = normalizeMatchingText(declared);
    if (!normalizedDeclared) return false;
    return normalizedDeclared === normalizedRequired
      || (normalizedRequired.length >= 3 && normalizedDeclared.includes(normalizedRequired))
      || (normalizedDeclared.length >= 3 && normalizedRequired.includes(normalizedDeclared));
  });
};

const permitMatches = (required: string, declaredPermits: string[]) => {
  const normalizedRequired = normalizePermit(required);
  if (!normalizedRequired) return false;

  return declaredPermits.some((declared) => {
    const normalizedDeclared = normalizePermit(declared);
    if (!normalizedDeclared) return false;
    return normalizedDeclared === normalizedRequired
      || (normalizedRequired.length >= 3 && normalizedDeclared.includes(normalizedRequired))
      || (normalizedDeclared.length >= 3 && normalizedRequired.includes(normalizedDeclared));
  });
};

export const calculateMatchingResult = (
  offre?: MatchingOffer | null,
  profil?: MatchingProfile | null,
): MatchingResult => {
  if (!offre || !profil) {
    return {
      score: 0,
      meetsRequiredPermits: true,
      missingRequiredPermits: [],
      matchedRequiredPermits: [],
    };
  }

  const requiredPermits = splitDeclaredList(offre.permis_requis)
    .filter((permit) => !NO_PERMIT_REQUIREMENT.has(normalizeMatchingText(permit)));
  const declaredPermits = splitDeclaredList(profil.permis);
  const missingRequiredPermits = requiredPermits.filter((permit) => !permitMatches(permit, declaredPermits));
  const matchedRequiredPermits = requiredPermits.filter((permit) => permitMatches(permit, declaredPermits));

  let score = 0;
  if (
    normalizeMatchingText(offre.secteur)
    && normalizeMatchingText(offre.secteur) === normalizeMatchingText(profil.secteur)
  ) {
    score += MATCHING_WEIGHTS.secteur;
  }

  if (
    normalizeMatchingText(offre.contrat)
    && normalizeMatchingText(offre.contrat) === normalizeMatchingText(profil.contrat)
  ) {
    score += MATCHING_WEIGHTS.contrat;
  }

  const offerLocation = normalizeMatchingText(offre.localisation);
  const talentLocation = normalizeMatchingText(profil.localisation);
  if (offerLocation && talentLocation && (offerLocation.includes(talentLocation) || talentLocation.includes(offerLocation))) {
    score += MATCHING_WEIGHTS.localisation;
  }

  const requiredSkills = splitDeclaredList(offre.competences);
  const declaredSkills = splitDeclaredList(profil.competences);
  if (requiredSkills.length > 0 && declaredSkills.length > 0) {
    const matchedSkills = requiredSkills.filter((skill) => declaredValueMatches(skill, declaredSkills));
    score += Math.min(
      MATCHING_WEIGHTS.competences,
      Math.round((matchedSkills.length / requiredSkills.length) * MATCHING_WEIGHTS.competences),
    );
  }

  return {
    score: Math.min(100, score),
    meetsRequiredPermits: missingRequiredPermits.length === 0,
    missingRequiredPermits,
    matchedRequiredPermits,
  };
};
