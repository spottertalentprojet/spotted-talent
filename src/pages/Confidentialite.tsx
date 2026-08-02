import type React from "react";

const CONTACT_EMAIL = "contact@spottedtalent.fr";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mb-9 rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm">
    <h2 className="mb-3 text-xl font-bold text-foreground">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
  </section>
);

const Confidentialite = () => {
  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <main className="mx-auto max-w-5xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary">Données personnelles</p>
        <h1 className="mb-2 text-3xl font-bold gradient-text">Politique de confidentialité</h1>
        <p className="mb-10 text-muted-foreground">
          Dernière mise à jour : juillet 2026. Cette page explique comment Spotted Talent collecte, utilise,
          protège et conserve les données personnelles.
        </p>

        <Section title="1. Responsable du traitement">
          <p>
            Le responsable du traitement est <strong>Spotted Talent</strong>, situé à La Ravoire, 73490, France.
            Pour toute question liée aux données personnelles, vous pouvez écrire à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Spotted Talent collecte uniquement les données utiles au fonctionnement du service :</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>compte utilisateur : nom, prénom, e-mail, téléphone, rôle, date de création, dernière connexion ;</li>
            <li>profil talent : CV, lettre de motivation, poste recherché, compétences, localisation, disponibilité ;</li>
            <li>candidatures : offre, statut, historique, messages et échanges liés au recrutement ;</li>
            <li>documents administratifs : pièces demandées dans un dossier accepté, comme RIB, pièce d'identité ou permis ;</li>
            <li>profil entreprise : nom, SIRET, adresse, secteur, logo, informations de recrutement ;</li>
            <li>facturation : formule choisie, statut d'abonnement, factures et identifiant client Stripe ;</li>
            <li>données techniques : logs de sécurité, événements applicatifs, adresse IP ou informations de session si nécessaire.</li>
          </ul>
        </Section>

        <Section title="3. Pourquoi ces données sont utilisées">
          <ul className="list-disc space-y-1 pl-6">
            <li>créer et sécuriser les comptes talent et entreprise ;</li>
            <li>permettre la publication d'offres, les candidatures, la messagerie et le suivi des statuts ;</li>
            <li>permettre l'envoi et la consultation de documents liés à une candidature acceptée ;</li>
            <li>vérifier l'identité d'une entreprise à partir du SIRET ;</li>
            <li>gérer les abonnements, paiements, essais, factures et accès aux fonctions payantes ;</li>
            <li>envoyer les e-mails nécessaires : confirmation, sécurité, rappel d'inactivité, notification utile ;</li>
            <li>améliorer la sécurité, corriger les erreurs et empêcher les abus ;</li>
            <li>fournir des aides par IA, par exemple analyse de CV ou génération d'offre, lorsque l'utilisateur l'utilise.</li>
          </ul>
        </Section>

        <Section title="4. Bases légales">
          <p>
            Les traitements reposent principalement sur l'exécution du service demandé par l'utilisateur, les
            mesures précontractuelles, l'intérêt légitime de sécurité et de prévention des abus, ainsi que les
            obligations légales liées à la facturation et à la comptabilité. Lorsque le consentement est requis,
            il est demandé séparément.
          </p>
        </Section>

        <Section title="5. Documents sensibles et limitation des demandes">
          <p>
            Les documents sensibles ou administratifs ne doivent être demandés que lorsqu'ils sont nécessaires au
            traitement d'un dossier concret. Une entreprise ne doit pas demander une pièce sans lien avec la
            candidature, la mission ou une obligation légale.
          </p>
          <p>
            Les dossiers partagés sont limités aux utilisateurs concernés : le talent et l'entreprise liée à la
            candidature. Les documents personnels du talent restent séparés des documents demandés par une
            entreprise.
          </p>
        </Section>

        <Section title="6. Durées de conservation">
          <ul className="list-disc space-y-1 pl-6">
            <li>Compte actif : données conservées pendant l'utilisation du service.</li>
            <li>Compte inactif : rappels possibles après environ 23 et 29 jours, puis suspension après 30 jours sans connexion.</li>
            <li>Documents sensibles demandés : conservation limitée, avec suppression automatique possible après 30 jours.</li>
            <li>Candidatures et messages : conservés le temps nécessaire au suivi du recrutement, puis supprimés ou anonymisés sur demande lorsque c'est possible.</li>
            <li>Factures et données comptables : conservées selon les obligations légales applicables.</li>
            <li>Logs de sécurité : conservés pendant une durée limitée nécessaire à la sécurité, à la preuve d'accès et au diagnostic des incidents.</li>
          </ul>
        </Section>

        <Section title="7. Sécurité des données">
          <p>Spotted Talent applique plusieurs mesures de protection :</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>authentification sécurisée par e-mail ou Google ;</li>
            <li>confirmation e-mail à la création du compte avant accès complet ;</li>
            <li>double authentification par application TOTP, comme Google Authenticator ou Microsoft Authenticator, lorsque l'utilisateur l'active ;</li>
            <li>règles d'accès par rôle et par utilisateur dans la base de données ;</li>
            <li>stockage privé des documents, sans accès public direct ;</li>
            <li>liens temporaires pour ouvrir les fichiers ;</li>
            <li>journalisation des accès aux documents ;</li>
            <li>chiffrement applicatif des nouveaux documents sensibles lorsque la fonction est disponible ;</li>
            <li>secrets techniques stockés côté serveur et non dans le navigateur ;</li>
            <li>suppression planifiée des documents expirés par fonction serveur sécurisée.</li>
          </ul>
        </Section>

        <Section title="8. Sous-traitants et services utilisés">
          <p>Pour fonctionner, Spotted Talent utilise notamment les prestataires suivants :</p>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Supabase</strong> : base de données, authentification, stockage, fonctions serveur ;</li>
            <li><strong>Vercel</strong> : hébergement du site web ;</li>
            <li><strong>Stripe</strong> : paiements, abonnements, portail client, factures ;</li>
            <li><strong>Resend</strong> : e-mails transactionnels ;</li>
            <li><strong>Groq</strong> : fonctions d'intelligence artificielle utilisées à la demande ;</li>
            <li><strong>Google</strong> : connexion OAuth lorsque l'utilisateur choisit “Continuer avec Google”.</li>
          </ul>
          <p>
            Ces prestataires peuvent traiter certaines données strictement nécessaires à leur mission. Les contrats,
            lieux de traitement et garanties de ces prestataires doivent être vérifiés avant une commercialisation à
            grande échelle.
          </p>
        </Section>

        <Section title="9. Paiement et carte bancaire">
          <p>
            Les paiements sont traités par Stripe. Spotted Talent ne stocke pas le numéro complet de carte bancaire.
            Les informations de paiement, les mandats, les factures et les moyens de paiement sont gérés dans
            l'environnement sécurisé de Stripe.
          </p>
        </Section>

        <Section title="10. Intelligence artificielle">
          <p>
            Lorsque l'utilisateur lance une analyse de CV, une génération de lettre ou une aide à la rédaction
            d'offre, certaines données nécessaires peuvent être transmises au service d'IA utilisé. L'utilisateur
            doit relire les résultats avant publication ou envoi. Les documents sensibles ne doivent pas être
            transmis à l'IA s'ils ne sont pas nécessaires à la fonction demandée.
          </p>
        </Section>

        <Section title="11. Droits des utilisateurs">
          <p>
            Conformément au RGPD, vous pouvez demander l'accès, la rectification, l'effacement, la limitation,
            l'opposition ou la portabilité de vos données. Vous pouvez aussi demander des informations sur les
            traitements réalisés.
          </p>
          <p>
            Pour exercer ces droits, écrivez à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary">
              {CONTACT_EMAIL}
            </a>
            . Une réponse sera apportée dans les délais prévus par la réglementation. Certaines données peuvent
            être conservées lorsqu'une obligation légale l'impose, notamment en matière de facturation.
          </p>
          <p>Vous pouvez également déposer une réclamation auprès de la CNIL.</p>
        </Section>

        <Section title="12. Incident ou fuite de données">
          <p>En cas d'incident de sécurité, Spotted Talent prévoit les actions suivantes :</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>identifier l'origine de l'incident et bloquer l'accès non autorisé ;</li>
            <li>évaluer les données concernées et le niveau de risque pour les personnes ;</li>
            <li>documenter l'incident et les mesures prises ;</li>
            <li>notifier la CNIL dans les 72 heures lorsque la réglementation l'exige ;</li>
            <li>informer les utilisateurs concernés si le risque pour leurs droits et libertés est élevé.</li>
          </ul>
        </Section>

        <Section title="13. Cookies et stockage local">
          <p>
            Le site utilise principalement des cookies ou stockages techniques nécessaires à la connexion, à la
            sécurité et au fonctionnement normal du service. Aucun cookie publicitaire tiers n'est utilisé à ce
            stade. Si des outils de mesure d'audience ou de publicité sont ajoutés, une information et un choix
            adaptés seront mis en place.
          </p>
        </Section>

        <div className="mt-12 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          © 2026 Spotted Talent - Politique de confidentialité
        </div>
      </main>
    </div>
  );
};

export default Confidentialite;
