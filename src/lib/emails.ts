const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const EMAIL_FOOTER = `<p style="color:#888;font-size:12px">© 2026 Spotted Talent - La Ravoire, 73490</p>`;

export const envoyerEmail = async (to: string, subject: string, html: string) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-function`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ to, subject, html }),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Erreur email:", err);
  }
};

export const emailNouvelleCandiature = (talentEmail: string, poste: string) =>
  envoyerEmail(
    talentEmail,
    `Candidature envoyée - ${poste}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#8b5cf6">Votre candidature a été envoyée !</h2>
      <p>Vous venez de postuler au poste de <strong>${poste}</strong>.</p>
      <p>L'entreprise va examiner votre profil et vous contacter prochainement.</p>
      <p>Suivez vos candidatures sur <a href="https://www.spottedtalent.fr/talent">www.spottedtalent.fr</a></p>
      <br/>
      ${EMAIL_FOOTER}
    </div>`
  );

export const emailCandidatureStatut = (talentEmail: string, poste: string, statut: string) => {
  const configs: Record<string, { subject: string; couleur: string; titre: string; message: string }> = {
    envoyee: {
      subject: `Candidature en attente - ${poste}`,
      couleur: "#8b5cf6",
      titre: "Votre candidature est en attente",
      message: `Votre candidature pour le poste de <strong>${poste}</strong> est en cours d'examen. L'entreprise reviendra vers vous prochainement.`,
    },
    entretien: {
      subject: `Candidature en cours d'étude - ${poste}`,
      couleur: "#3b82f6",
      titre: "Votre candidature est en cours d'étude",
      message: `Bonne nouvelle : l'entreprise étudie votre candidature pour le poste de <strong>${poste}</strong>. Restez disponible, elle pourrait vous contacter très prochainement.`,
    },
    acceptee: {
      subject: `Candidature acceptée - ${poste}`,
      couleur: "#22c55e",
      titre: "Félicitations, votre candidature est acceptée !",
      message: `Votre candidature pour le poste de <strong>${poste}</strong> a été acceptée. L'entreprise va vous contacter prochainement pour la suite du processus.`,
    },
    refusee: {
      subject: `Candidature non retenue - ${poste}`,
      couleur: "#ef4444",
      titre: "Votre candidature n'a pas été retenue",
      message: `Après examen de votre candidature pour le poste de <strong>${poste}</strong>, l'entreprise n'a pas donné suite. Ne vous découragez pas, d'autres opportunités vous attendent sur Spotted Talent.`,
    },
  };

  const config = configs[statut] ?? {
    subject: `Mise à jour de votre candidature - ${poste}`,
    couleur: "#8b5cf6",
    titre: "Mise à jour de votre candidature",
    message: `Votre candidature pour le poste de <strong>${poste}</strong> a été mise à jour.`,
  };

  return envoyerEmail(
    talentEmail,
    config.subject,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f0f0f;padding:32px;border-radius:12px;border:1px solid #1f1f1f">
      <h2 style="color:${config.couleur};margin:0 0 16px">${config.titre}</h2>
      <p style="color:#d1d5db;line-height:1.6">${config.message}</p>
      <div style="margin:24px 0;padding:16px;background:#1a1a1a;border-radius:8px;border-left:4px solid ${config.couleur}">
        <p style="color:#9ca3af;font-size:13px;margin:0">Poste : <strong style="color:#f3f4f6">${poste}</strong></p>
        <p style="color:#9ca3af;font-size:13px;margin:8px 0 0">Statut : <strong style="color:${config.couleur}">${config.titre}</strong></p>
      </div>
      <a href="https://www.spottedtalent.fr/talent" style="display:inline-block;background:${config.couleur};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Voir mes candidatures</a>
      <br/><br/>
      <p style="color:#4b5563;font-size:12px">© 2026 Spotted Talent - La Ravoire, 73490</p>
    </div>`
  );
};

export const emailNouveauMessage = (destinataireEmail: string, expediteurNom: string) =>
  envoyerEmail(
    destinataireEmail,
    "Nouveau message sur Spotted Talent",
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#8b5cf6">Vous avez un nouveau message</h2>
      <p><strong>${expediteurNom}</strong> vous a envoyé un message sur Spotted Talent.</p>
      <p>Connectez-vous pour répondre : <a href="https://www.spottedtalent.fr">www.spottedtalent.fr</a></p>
      <br/>
      ${EMAIL_FOOTER}
    </div>`
  );

export const emailNotificationEntreprise = (entrepriseEmail: string, poste: string) =>
  envoyerEmail(
    entrepriseEmail,
    `Nouvelle candidature - ${poste}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#8b5cf6">Nouvelle candidature reçue !</h2>
      <p>Un talent vient de postuler à votre offre <strong>${poste}</strong>.</p>
      <p>Connectez-vous pour consulter le profil : <a href="https://www.spottedtalent.fr/entreprise">www.spottedtalent.fr</a></p>
      <br/>
      ${EMAIL_FOOTER}
    </div>`
  );

export const emailNouvelleOffreTalent = (
  talentEmail: string,
  poste: string,
  entreprise?: string | null,
  localisation?: string | null,
  contrat?: string | null,
) =>
  envoyerEmail(
    talentEmail,
    `Nouvelle offre pour vous - ${poste}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#8b5cf6">Une nouvelle offre correspond à votre profil</h2>
      <p>Une nouvelle opportunité vient d'être publiée sur Spotted Talent.</p>
      <div style="margin:20px 0;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa">
        <p style="margin:0 0 8px"><strong>Poste :</strong> ${poste}</p>
        ${entreprise ? `<p style="margin:0 0 8px"><strong>Entreprise :</strong> ${entreprise}</p>` : ""}
        ${localisation ? `<p style="margin:0 0 8px"><strong>Localisation :</strong> ${localisation}</p>` : ""}
        ${contrat ? `<p style="margin:0"><strong>Contrat :</strong> ${contrat}</p>` : ""}
      </div>
      <p>Connectez-vous à votre espace talent pour consulter l'offre et postuler rapidement.</p>
      <p>
        <a href="https://www.spottedtalent.fr/talent/dashboard" style="display:inline-block;background:#8b5cf6;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Voir les offres
        </a>
      </p>
      <p style="color:#888;font-size:12px">Vous recevez cet email car les notifications d'offres sont actives sur votre profil talent.</p>
    </div>`
  );
