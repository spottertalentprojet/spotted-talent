export const REQUESTABLE_DOCUMENTS = [
  {
    key: "diplome-certification",
    label: "Diplôme ou certification",
    desc: "Uniquement si le diplôme ou la certification est nécessaire au poste proposé.",
    phase: "qualification",
  },
  {
    key: "permis-conduire",
    label: "Permis de conduire requis",
    desc: "Uniquement si la conduite est une condition réelle du poste ou de la mission.",
    phase: "qualification",
  },
  {
    key: "justificatif-permis",
    label: "Habilitation ou permis métier",
    desc: "FIMO, FCO, ADR, CACES ou autre habilitation indispensable à la mission.",
    phase: "qualification",
  },
  {
    key: "titre-sejour",
    label: "Autorisation de travail",
    desc: "Uniquement pour vérifier le droit de travailler lorsque cette vérification est légalement nécessaire.",
    phase: "qualification",
  },
  {
    key: "piece-identite",
    label: "Pièce d’identité",
    desc: "Pour préparer les formalités d’embauche d’un candidat définitivement retenu.",
    phase: "onboarding",
  },
  {
    key: "rib",
    label: "RIB",
    desc: "Pour préparer le versement du salaire après acceptation de la candidature.",
    phase: "onboarding",
  },
  {
    key: "attestation-securite-sociale",
    label: "Attestation de droits Assurance Maladie",
    desc: "À demander uniquement si elle est nécessaire aux formalités sociales d’embauche. La copie de la Carte Vitale n’est pas demandée.",
    phase: "onboarding",
  },
  {
    key: "justificatif-domicile",
    label: "Justificatif de domicile",
    desc: "Uniquement lorsqu’une adresse doit être justifiée pour une formalité d’embauche précise.",
    phase: "onboarding",
  },
] as const;

export const REQUESTABLE_DOCUMENT_PHASES = [
  { key: "qualification", label: "Qualifications nécessaires au poste" },
  { key: "onboarding", label: "Dossier administratif après acceptation" },
] as const;

export const REQUEST_STATUS_META: Record<string, { label: string; className: string }> = {
  requested: {
    label: "En attente",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  uploaded: {
    label: "Reçu",
    className: "border-green-500/20 bg-green-500/10 text-green-400",
  },
  expired: {
    label: "Supprimé automatiquement",
    className: "border-slate-500/20 bg-slate-500/10 text-slate-500 dark:text-slate-300",
  },
};

export const getRequestStatusMeta = (status: string | null | undefined) =>
  REQUEST_STATUS_META[status || "requested"] || REQUEST_STATUS_META.requested;

export const getRequestableDocument = (key: string | null | undefined) =>
  REQUESTABLE_DOCUMENTS.find((document) => document.key === key);
