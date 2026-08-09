import type React from "react";
import { PRIVACY_NOTICE_VERSION_LABEL } from "@/lib/legal";
import { SUPPORT_EMAIL } from "@/lib/contact";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm">
    <h2 className="mb-3 text-xl font-bold text-foreground">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
  </section>
);

const Confidentialite = () => (
  <div className="min-h-screen bg-background px-6 py-12 text-foreground">
    <main className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary">Données personnelles</p>
        <h1 className="mb-2 text-3xl font-bold gradient-text">Politique de confidentialité</h1>
        <p className="text-muted-foreground">
          Version {PRIVACY_NOTICE_VERSION_LABEL}. Cette page décrit les traitements mis en œuvre ou prévus pour
          fournir le service Spotted Talent.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-foreground">
        <p className="font-semibold">Politique applicable dès sa publication.</p>
        <p className="mt-1 text-muted-foreground">
          Le service est actuellement en phase de préparation avant son ouverture commerciale prochaine. Cette
          politique sera mise à jour si les traitements, les prestataires ou les fonctionnalités évoluent.
        </p>
      </div>

      <Section title="1. Responsable du traitement et contact">
        <p>
          Le responsable du traitement est <strong>Yousri Frigui, entrepreneur individuel</strong>, exerçant sous le
          nom commercial <strong>Spotted Talent</strong>, SIREN 838 378 156, établissement principal SIRET
          838 378 156 00023, situé 6 R du Pre Hibou, 73490 La Ravoire, France. L’activité est immatriculée au
          Registre national des entreprises depuis le 5 août 2026.
        </p>
        <p>
          Pour toute question ou demande relative aux données :{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
        </p>
      </Section>

      <Section title="2. Données obligatoires et facultatives">
        <p>
          Une adresse électronique, un mot de passe pour la connexion par e-mail, le rôle du compte et un nom
          d’affichage sont nécessaires pour créer un compte. Un numéro de téléphone est actuellement demandé lors de
          l’inscription classique. Une entreprise doit fournir les informations nécessaires à sa vérification avant
          de souscrire un abonnement payant.
        </p>
        <p>
          Le CV, l’adresse détaillée, la présentation, les compétences, la mobilité et les documents métier sont
          facultatifs tant que l’utilisateur n’emploie pas la fonction correspondante. Ne pas fournir une donnée
          facultative limite seulement la personnalisation, le matching ou le dossier concerné.
        </p>
      </Section>

      <Section title="3. Catégories de données collectées">
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Compte :</strong> identité déclarée, e-mail, téléphone, rôle, dates de création et de connexion.</li>
          <li><strong>Profil talent :</strong> poste, secteur, contrat, compétences, localisation, disponibilité, CV et lettre.</li>
          <li><strong>Recrutement :</strong> offres, candidatures, réponses, statuts, messages et notes liées au dossier.</li>
          <li><strong>Pièces métier autorisées :</strong> diplôme, certification, permis, habilitation ou autorisation de travail.</li>
          <li><strong>Entreprise :</strong> nom, SIRET, adresse, secteur, contacts, logo et informations de facturation.</li>
          <li><strong>Paiement :</strong> formule, statut, identifiants Stripe et factures, sans numéro complet de carte.</li>
          <li><strong>Sécurité :</strong> identifiants techniques, journaux d’accès documentaire, erreurs et informations de session.</li>
          <li><strong>IA :</strong> texte strictement utile envoyé volontairement pour une analyse ou une génération.</li>
        </ul>
      </Section>

      <Section title="4. Finalités et bases légales">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-semibold text-foreground">Finalité</th>
                <th className="px-3 py-2 font-semibold text-foreground">Base principale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr><td className="px-3 py-2">Créer le compte et fournir les espaces demandés</td><td className="px-3 py-2">Exécution du service et mesures précontractuelles</td></tr>
              <tr><td className="px-3 py-2">Publier, candidater, échanger et suivre un dossier</td><td className="px-3 py-2">Exécution du service</td></tr>
              <tr><td className="px-3 py-2">Calculer un score indicatif de correspondance</td><td className="px-3 py-2">Exécution du service et intérêt légitime d’organisation</td></tr>
              <tr><td className="px-3 py-2">Sécuriser les comptes, tracer les accès et prévenir les abus</td><td className="px-3 py-2">Intérêt légitime de sécurité</td></tr>
              <tr><td className="px-3 py-2">Gérer les abonnements, paiements et factures</td><td className="px-3 py-2">Contrat et obligations comptables</td></tr>
              <tr><td className="px-3 py-2">Analyser ou générer un contenu à la demande</td><td className="px-3 py-2">Action volontaire et exécution de la fonction demandée</td></tr>
              <tr><td className="px-3 py-2">Envoyer confirmations et alertes indispensables</td><td className="px-3 py-2">Exécution du service et intérêt légitime de sécurité</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Une prospection commerciale éventuelle devra disposer d’un choix séparé. L’acceptation des CGU ne vaut
          pas consentement à recevoir de la publicité.
        </p>
      </Section>

      <Section title="5. Matching, classement et décision humaine">
        <p>
          Le matching actuel est un calcul par règles fondé sur le secteur (30 %), le contrat (20 %), la localisation
          (20 %), les compétences (25 %) et les permis ou habilitations (5 %). Ces critères proviennent des
          informations fournies par le talent et l’entreprise.
        </p>
        <p>
          Le score sert uniquement à ordonner ou présenter des correspondances. Il n’accepte ni ne refuse
          automatiquement une candidature et ne remplace pas l’examen humain. Une personne peut demander des
          explications, signaler une donnée incorrecte ou exercer son droit d’opposition lorsqu’il est applicable en
          écrivant à l’adresse de contact.
        </p>
        <p>
          Les caractéristiques protégées et les données sensibles ne font pas partie des critères du score. Spotted
          Talent documente les règles, traite les contestations, surveille les incidents signalés et réévalue les
          risques avant toute modification susceptible d’influencer matériellement une décision de recrutement.
        </p>
      </Section>

      <Section title="6. Documents et données à risque">
        <p>
          Une entreprise ne peut demander une pièce que dans le dossier sécurisé d’une candidature acceptée. Les
          justificatifs de qualification restent limités au diplôme ou certificat nécessaire, au permis de conduire
          requis, à une habilitation métier ou à une autorisation de travail légalement nécessaire.
        </p>
        <p>
          Pour préparer l’embauche du candidat retenu, ce dossier peut également recevoir une pièce d’identité, un
          RIB, une attestation de droits à l’Assurance Maladie ou un justificatif de domicile lorsqu’une finalité
          administrative précise le nécessite. Les demandes de copie de Carte Vitale, de photographie d’identité sans
          finalité précise, de copie de casier judiciaire et de document administratif libre restent bloquées.
        </p>
      </Section>

      <Section title="7. Destinataires">
        <p>
          Les données sont accessibles à l’utilisateur concerné et, selon le sens du partage, à l’entreprise partie à
          la candidature. Les administrateurs chargés de la sécurité peuvent consulter les métadonnées et journaux
          nécessaires, mais ne disposent pas d’un accès au contenu des fichiers du coffre. Un profil ou un document
          privé n’est pas rendu public par défaut.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Supabase :</strong> base, authentification, stockage privé et fonctions serveur.</li>
          <li><strong>Vercel :</strong> hébergement de l’application web et journaux techniques.</li>
          <li><strong>Stripe :</strong> paiement, abonnement, portail client et factures.</li>
          <li><strong>Resend :</strong> courriels transactionnels.</li>
          <li><strong>Groq :</strong> traitement IA déclenché par l’utilisateur.</li>
          <li><strong>Google :</strong> OAuth si l’utilisateur choisit la connexion Google.</li>
        </ul>
      </Section>

      <Section title="8. Transferts hors Espace économique européen">
        <p>
          Certains prestataires sont établis ou peuvent traiter des données hors de l’Espace économique européen.
          Lorsqu’un transfert est nécessaire, il doit reposer sur un mécanisme reconnu par le RGPD, tel qu’une
          décision d’adéquation ou des clauses contractuelles types. Les garanties applicables et les sous-traitants
          ultérieurs sont suivis dans la documentation interne de Spotted Talent.
        </p>
      </Section>

      <Section title="9. Durées de conservation">
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Compte et profil :</strong> pendant l’utilisation du service, puis suppression avec le compte, sauf obligation contraire.</li>
          <li><strong>Inactivité :</strong> rappels vers 23 et 29 jours, puis suspension à 30 jours. La suspension ne supprime pas le compte.</li>
          <li><strong>Document envoyé par un talent à la demande d’une entreprise :</strong> suppression du fichier sept jours après la première réception confirmée, ou trente jours après l’envoi sans réception.</li>
          <li><strong>Contrat, fiche de paie ou document d’intérim envoyé par une entreprise au talent :</strong> disponibilité pendant quatre-vingt-dix jours après l’envoi.</li>
          <li><strong>Métadonnées de transmission :</strong> conservation limitée à la traçabilité de la demande, de la réception et de la suppression.</li>
          <li><strong>Candidatures non retenues :</strong> objectif maximal de deux ans après le dernier contact, sous réserve que le talent en ait été informé.</li>
          <li><strong>Messages :</strong> pendant la durée du dossier de recrutement, puis suppression ou anonymisation avec ce dossier.</li>
          <li><strong>Factures et pièces comptables :</strong> pendant la durée légale applicable, généralement dix ans.</li>
          <li><strong>Journaux de sécurité :</strong> pendant la durée nécessaire à la détection, à l’analyse et à la preuve des incidents, puis suppression ou anonymisation selon le calendrier interne.</li>
        </ul>
        <p>
          Les suppressions documentaires de sept, trente et quatre-vingt-dix jours sont traitées quotidiennement par
          une fonction serveur. Les autres suppressions sont exécutées conformément aux durées indiquées et aux
          obligations légales applicables.
        </p>
      </Section>

      <Section title="10. Intelligence artificielle">
        <p>
          L’analyse de CV et la génération de lettres ou d’offres sont facultatives. Seul le contenu nécessaire à la
          demande est transmis au prestataire IA. Les pièces administratives ne doivent jamais être envoyées à ces
          fonctions. Les résultats doivent être relus et ne provoquent aucune décision automatique de recrutement.
        </p>
        <p>
          Les fonctions de génération assistent l’utilisateur sans classer ni écarter un candidat. Si un futur cas
          d’usage entre dans la catégorie des systèmes d’IA à haut risque du règlement (UE) 2024/1689, il ne sera mis
          en service qu’après l’évaluation, la documentation, les mesures de transparence, la surveillance et le
          contrôle humain requis pour ce cas d’usage.
        </p>
      </Section>

      <Section title="11. Sécurité">
        <ul className="list-disc space-y-1 pl-6">
          <li>Confirmation de l’adresse électronique et double authentification obligatoire pour les comptes entreprise, facultative pour les talents.</li>
          <li>Contrôles d’accès par utilisateur, rôle et candidature.</li>
          <li>Stockage privé, liens temporaires et validation des fichiers.</li>
          <li>Journalisation des ouvertures, téléchargements et suppressions de documents.</li>
          <li>Secrets conservés côté serveur et nettoyage planifié des documents arrivés à échéance.</li>
        </ul>
      </Section>

      <Section title="12. Vos droits">
        <p>
          Selon le traitement, vous pouvez demander l’accès, la rectification, l’effacement, la limitation, la
          portabilité ou vous opposer au traitement. Vous pouvez également retirer un consentement lorsqu’un traitement
          repose réellement sur celui-ci, sans remettre en cause ce qui a été fait auparavant.
        </p>
        <p>
          Écrivez à{" "}<a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
          Une preuve d’identité limitée au nécessaire pourra être demandée en cas de doute raisonnable. Vous pouvez
          aussi déposer une réclamation auprès de la{" "}
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer" className="text-primary hover:underline">CNIL</a>.
        </p>
      </Section>

      <Section title="13. Incident de sécurité">
        <p>
          Tout incident est analysé, contenu et documenté. Lorsqu’une violation est susceptible d’engendrer un risque,
          la CNIL est notifiée dans les meilleurs délais et, si possible, dans les 72 heures après sa découverte. Les
          personnes concernées sont informées lorsque le risque pour leurs droits et libertés est élevé.
        </p>
      </Section>

      <Section title="14. Cookies et stockage local">
        <p>
          Le site utilise actuellement uniquement les stockages nécessaires à la connexion, à la sécurité, aux
          préférences d’interface et aux brouillons. Aucun outil publicitaire tiers n’a été détecté dans
          l’application. Tout futur outil de mesure non exempté sera soumis à une information et à un choix adaptés.
        </p>
      </Section>

      <div className="border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
        © 2026 Spotted Talent — Politique de confidentialité
      </div>
    </main>
  </div>
);

export default Confidentialite;
