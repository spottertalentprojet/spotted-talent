export const ALLOWED_OFFER_CONTRACTS = ["CDI", "CDD", "Intérim", "Alternance", "Stage"] as const;

export const TEMPORARY_OFFER_CONTRACTS = ["CDD", "Intérim", "Alternance", "Stage"] as const;

export const SALARY_PERIODS = [
  { value: "hourly", label: "par heure" },
  { value: "daily", label: "par jour" },
  { value: "monthly", label: "par mois" },
  { value: "annual", label: "par an" },
] as const;

export type OfferComplianceSeverity = "blocker" | "review" | "advice";

export type OfferComplianceFinding = {
  id: string;
  severity: OfferComplianceSeverity;
  field: string;
  label: string;
  message: string;
};

export type OfferComplianceInput = {
  title?: string | null;
  description?: string | null;
  location?: string | null;
  contract?: string | null;
  sector?: string | null;
  experience?: string | null;
  duration?: string | null;
  temporaryReason?: string | null;
  degree?: string | null;
  salaryMin?: string | number | null;
  salaryMax?: string | number | null;
  salaryPeriod?: string | null;
  screeningQuestions?: Array<{ label?: string | null }> | string[] | null;
  employerConfirmed?: boolean;
};

export type OfferComplianceResult = {
  findings: OfferComplianceFinding[];
  blockers: OfferComplianceFinding[];
  reviews: OfferComplianceFinding[];
  advice: OfferComplianceFinding[];
  canPublish: boolean;
};

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;

const parseSalary = (value: OfferComplianceInput["salaryMin"]) => {
  if (!hasValue(value)) return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const addFinding = (
  findings: OfferComplianceFinding[],
  finding: OfferComplianceFinding,
) => {
  if (!findings.some((current) => current.id === finding.id)) findings.push(finding);
};

const BLOCKING_CONTENT_PATTERNS: Array<{
  id: string;
  label: string;
  message: string;
  pattern: RegExp;
}> = [
  {
    id: "gender-exclusion",
    label: "Critère de sexe explicite",
    message: "Retirez les formulations qui réservent le poste aux hommes ou aux femmes.",
    pattern: /\b(?:hommes?|femmes?)\s+uniquement\b|\breserve(?:e|es|s)?\s+aux?\s+(?:hommes?|femmes?)\b|\bprofil\s+(?:masculin|feminin)\b/u,
  },
  {
    id: "age-exclusion",
    label: "Critère d’âge explicite",
    message: "Retirez la limite d’âge et décrivez uniquement l’expérience nécessaire au poste.",
    pattern: /\b(?:moins de|maximum|max\.?|age maximum)\s+\d{2}\s+ans\b|\bentre\s+\d{2}\s+et\s+\d{2}\s+ans\b/u,
  },
  {
    id: "family-status-exclusion",
    label: "Situation familiale demandée",
    message: "La situation familiale ne doit pas être un critère de recrutement.",
    pattern: /\b(?:sans enfant|celibataire uniquement|mariee? uniquement)\b/u,
  },
  {
    id: "origin-exclusion",
    label: "Origine ou nationalité imposée",
    message: "Retirez les critères d’origine ou de nationalité. Indiquez seulement une autorisation de travail lorsqu’elle est légalement nécessaire.",
    pattern: /\b(?:nationalite francaise obligatoire|francais de souche|origine (?:francaise|europeenne) exigee)\b/u,
  },
  {
    id: "disability-exclusion",
    label: "Exclusion liée au handicap",
    message: "Retirez toute exclusion générale liée au handicap et décrivez précisément les contraintes réelles du poste.",
    pattern: /\b(?:sans handicap|personne non handicapee|aucun handicap)\b/u,
  },
  {
    id: "paid-application",
    label: "Candidature payante",
    message: "Une candidature doit rester gratuite. Retirez tout paiement, achat ou formation payante préalable.",
    pattern: /\b(?:frais de candidature|payer pour postuler|paiement pour postuler|formation payante obligatoire avant (?:de )?postuler)\b/u,
  },
  {
    id: "premium-phone",
    label: "Numéro potentiellement surtaxé",
    message: "Retirez le numéro en 081, 082 ou 089 et utilisez la candidature gratuite intégrée à Spotted Talent.",
    pattern: /(?:^|\D)0(?:81|82|89)\d(?:[ .-]?\d{2}){3}(?:\D|$)/u,
  },
];

const REVIEW_CONTENT_PATTERNS: Array<{
  id: string;
  label: string;
  message: string;
  pattern: RegExp;
}> = [
  {
    id: "young-profile",
    label: "Formulation liée à l’âge",
    message: "Vérifiez la formulation « jeune » : elle peut exclure des candidats. Préférez décrire l’expérience attendue.",
    pattern: /\b(?:profil jeune|jeune et dynamique|candidat jeune)\b/u,
  },
  {
    id: "physical-condition",
    label: "Exigence physique à justifier",
    message: "Décrivez la tâche concrète qui justifie cette exigence et les aménagements possibles.",
    pattern: /\b(?:bonne condition physique|excellente condition physique|bonne sante)\b/u,
  },
  {
    id: "temporary-to-permanent-promise",
    label: "Promesse de CDI après contrat temporaire",
    message: "Évitez de présenter un CDI futur comme garanti. Décrivez uniquement le contrat réellement proposé.",
    pattern: /\b(?:cdd|interim|stage)\s+(?:pouvant|avec possibilite de|debouchant)\s+(?:deboucher\s+)?sur\s+(?:un\s+)?cdi\b/u,
  },
];

export const analyzeOfferCompliance = (input: OfferComplianceInput): OfferComplianceResult => {
  const findings: OfferComplianceFinding[] = [];
  const addRequired = (id: string, field: string, label: string, value: unknown, message: string) => {
    if (!hasValue(value)) addFinding(findings, { id, severity: "blocker", field, label, message });
  };

  addRequired("title-required", "title", "Intitulé du poste manquant", input.title, "Indiquez un intitulé précis.");
  addRequired("location-required", "location", "Localisation manquante", input.location, "Indiquez la ville ou le lieu de travail.");
  addRequired("contract-required", "contract", "Contrat non choisi", input.contract, "Choisissez explicitement le type de contrat.");
  addRequired("sector-required", "sector", "Secteur manquant", input.sector, "Choisissez le secteur d’activité.");
  addRequired("experience-required", "experience", "Expérience non choisie", input.experience, "Choisissez le niveau d’expérience réellement nécessaire.");

  const contract = String(input.contract ?? "").trim();
  if (contract && !ALLOWED_OFFER_CONTRACTS.includes(contract as (typeof ALLOWED_OFFER_CONTRACTS)[number])) {
    addFinding(findings, {
      id: "contract-invalid",
      severity: "blocker",
      field: "contract",
      label: "Type de contrat non proposé",
      message: "Choisissez CDI, CDD, Intérim, Alternance ou Stage.",
    });
  }

  if (TEMPORARY_OFFER_CONTRACTS.includes(contract as (typeof TEMPORARY_OFFER_CONTRACTS)[number])) {
    addRequired("duration-required", "duration", "Durée du contrat manquante", input.duration, "Indiquez une durée exacte, par exemple « 6 mois ».");
  }
  if (contract === "CDD") {
    addRequired("temporary-reason-required", "temporaryReason", "Motif du CDD manquant", input.temporaryReason, "Indiquez le motif réel du recours au CDD.");
  }

  const description = String(input.description ?? "").trim();
  const wordCount = description ? description.split(/\s+/u).filter(Boolean).length : 0;
  if (wordCount < 60) {
    addFinding(findings, {
      id: "description-too-short",
      severity: "blocker",
      field: "description",
      label: "Description trop courte",
      message: "Rédigez au moins 60 mots pour présenter clairement le poste, les missions et le profil.",
    });
  }
  if (wordCount > 300) {
    addFinding(findings, {
      id: "description-too-long",
      severity: "advice",
      field: "description",
      label: "Annonce trop longue",
      message: "Visez moins de 300 mots pour une lecture claire sur mobile.",
    });
  }

  const salaryMin = parseSalary(input.salaryMin);
  const salaryMax = parseSalary(input.salaryMax);
  const hasSalaryMin = salaryMin !== null;
  const hasSalaryMax = salaryMax !== null;
  if (hasSalaryMin !== hasSalaryMax) {
    addFinding(findings, {
      id: "salary-range-incomplete",
      severity: "blocker",
      field: "salary",
      label: "Fourchette de rémunération incomplète",
      message: "Renseignez les deux bornes de rémunération ou laissez les deux champs vides.",
    });
  }
  if ((hasSalaryMin && (!Number.isFinite(salaryMin) || Number(salaryMin) < 0)) || (hasSalaryMax && (!Number.isFinite(salaryMax) || Number(salaryMax) < 0))) {
    addFinding(findings, {
      id: "salary-invalid",
      severity: "blocker",
      field: "salary",
      label: "Rémunération invalide",
      message: "La rémunération doit être un nombre positif.",
    });
  }
  if (Number.isFinite(salaryMin) && Number.isFinite(salaryMax) && Number(salaryMin) > Number(salaryMax)) {
    addFinding(findings, {
      id: "salary-range-order",
      severity: "blocker",
      field: "salary",
      label: "Fourchette inversée",
      message: "Le minimum ne peut pas dépasser le maximum.",
    });
  }
  if (hasSalaryMin && !SALARY_PERIODS.some((period) => period.value === input.salaryPeriod)) {
    addFinding(findings, {
      id: "salary-period-required",
      severity: "blocker",
      field: "salaryPeriod",
      label: "Période de rémunération manquante",
      message: "Précisez si le montant est horaire, journalier, mensuel ou annuel.",
    });
  }

  const questions = Array.isArray(input.screeningQuestions)
    ? input.screeningQuestions.map((question) => typeof question === "string" ? question : question?.label ?? "").join(" ")
    : "";
  const contentToScan = normalizeText([input.title, input.description, questions].filter(Boolean).join(" "));
  BLOCKING_CONTENT_PATTERNS.forEach((rule) => {
    if (rule.pattern.test(contentToScan)) {
      addFinding(findings, { ...rule, severity: "blocker", field: "content" });
    }
  });
  REVIEW_CONTENT_PATTERNS.forEach((rule) => {
    if (rule.pattern.test(contentToScan)) {
      addFinding(findings, { ...rule, severity: "review", field: "content" });
    }
  });

  if (!input.employerConfirmed) {
    addFinding(findings, {
      id: "employer-confirmation-required",
      severity: "blocker",
      field: "employerConfirmed",
      label: "Attestation employeur requise",
      message: "Confirmez que l’emploi est réel, que les informations sont exactes, que la candidature est gratuite et que le recrutement respecte la non-discrimination.",
    });
  }

  const blockers = findings.filter((finding) => finding.severity === "blocker");
  const reviews = findings.filter((finding) => finding.severity === "review");
  const advice = findings.filter((finding) => finding.severity === "advice");
  return { findings, blockers, reviews, advice, canPublish: blockers.length === 0 };
};
