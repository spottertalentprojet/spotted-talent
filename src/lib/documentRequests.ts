export const REQUESTABLE_DOCUMENTS = [
  { key: "piece-identite", label: "Pièce d'identité", desc: "Carte d'identité, passeport ou titre de séjour en cours de validité" },
  { key: "carte-vitale", label: "Carte Vitale", desc: "Justificatif de couverture santé ou attestation de sécurité sociale" },
  { key: "permis-conduire", label: "Permis de conduire", desc: "Permis demandé pour le poste ou la mission" },
  { key: "rib", label: "RIB", desc: "Relevé d'identité bancaire pour les virements" },
  { key: "justificatif-domicile", label: "Justificatif de domicile", desc: "Facture ou attestation récente de domicile" },
  { key: "photo-identite", label: "Photo d'identité", desc: "Photo récente si nécessaire au dossier administratif" },
  { key: "attestation-securite-sociale", label: "Attestation de sécurité sociale", desc: "Attestation à jour fournie par l'Assurance Maladie" },
  { key: "titre-sejour", label: "Titre de séjour", desc: "Titre de séjour ou autorisation de travail si nécessaire" },
  { key: "diplome-certification", label: "Diplôme ou certification", desc: "Diplôme, certificat ou habilitation demandé par l'entreprise" },
  { key: "casier-judiciaire", label: "Casier judiciaire", desc: "Bulletin ou extrait demandé pour les postes concernés" },
  { key: "justificatif-permis", label: "Justificatif de permis spécifiques", desc: "FIMO, FCO, ADR, CACES ou autre permis métier" },
  { key: "autre-document", label: "Autre document administratif", desc: "Pièce complémentaire demandée par l'entreprise" },
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
};

export const getRequestStatusMeta = (status: string | null | undefined) =>
  REQUEST_STATUS_META[status || "requested"] || REQUEST_STATUS_META.requested;

export const getRequestableDocument = (key: string | null | undefined) =>
  REQUESTABLE_DOCUMENTS.find((document) => document.key === key);
