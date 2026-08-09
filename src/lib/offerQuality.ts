export type OfferQualityInput = {
  title?: string | null;
  location?: string | null;
  contract?: string | null;
  sector?: string | null;
  skills?: string | null;
  description?: string | null;
  salaryMin?: string | number | null;
  salaryMax?: string | number | null;
  benefits?: string[] | string | null;
};

export type OfferQualityCheck = {
  id: string;
  label: string;
  passed: boolean;
  blocking: boolean;
};

export type OfferQualityResult = {
  score: number;
  wordCount: number;
  checks: OfferQualityCheck[];
  blockers: string[];
  suggestions: string[];
};

const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;

const hasBenefits = (benefits: OfferQualityInput["benefits"]) =>
  Array.isArray(benefits) ? benefits.some(hasValue) : hasValue(benefits);

export const analyzeOfferQuality = (input: OfferQualityInput): OfferQualityResult => {
  const description = String(input.description ?? "").trim();
  const wordCount = description ? description.split(/\s+/u).filter(Boolean).length : 0;
  const checks: OfferQualityCheck[] = [
    { id: "title", label: "Intitulé précis", passed: String(input.title ?? "").trim().length >= 3, blocking: true },
    { id: "location", label: "Localisation indiquée", passed: hasValue(input.location), blocking: true },
    { id: "contract", label: "Contrat indiqué", passed: hasValue(input.contract), blocking: true },
    { id: "sector", label: "Secteur renseigné pour le matching", passed: hasValue(input.sector), blocking: true },
    { id: "description", label: "Annonce générée et relue", passed: wordCount >= 60, blocking: true },
    { id: "readability", label: "Texte concis pour mobile", passed: wordCount >= 60 && wordCount <= 260, blocking: false },
    { id: "skills", label: "Compétences ou contraintes précisées", passed: hasValue(input.skills), blocking: false },
    { id: "salary", label: "Rémunération transparente", passed: hasValue(input.salaryMin) || hasValue(input.salaryMax), blocking: false },
    { id: "benefits", label: "Avantages concrets", passed: hasBenefits(input.benefits), blocking: false },
  ];

  const weights: Record<string, number> = {
    title: 10,
    location: 10,
    contract: 8,
    sector: 12,
    description: 25,
    readability: 10,
    skills: 10,
    salary: 10,
    benefits: 5,
  };
  const score = checks.reduce((total, check) => total + (check.passed ? weights[check.id] || 0 : 0), 0);
  const blockers = checks.filter((check) => check.blocking && !check.passed).map((check) => check.label);
  const suggestions = checks.filter((check) => !check.blocking && !check.passed).map((check) => check.label);

  return { score, wordCount, checks, blockers, suggestions };
};
