import type React from "react";
import { Link } from "react-router-dom";
import { LEGAL_EFFECTIVE_DATE, TERMS_VERSION_LABEL } from "@/lib/legal";
import { SUPPORT_EMAIL } from "@/lib/contact";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm">
    <h2 className="mb-3 text-xl font-bold text-foreground">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
  </section>
);

const CGU = () => (
  <div className="min-h-screen bg-background px-6 py-12 text-foreground">
    <main className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary">Cadre légal</p>
        <h1 className="mb-2 text-3xl font-bold gradient-text">Mentions légales et conditions générales d’utilisation</h1>
        <p className="text-muted-foreground">
          Version {TERMS_VERSION_LABEL} — applicable à compter du {LEGAL_EFFECTIVE_DATE.split("-").reverse().join("/")}.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-foreground">
        <p className="font-semibold">Version applicable dès sa publication.</p>
        <p className="mt-1 text-muted-foreground">
          Le service est en phase de préparation avant son ouverture commerciale prochaine. Cette version remplace
          les versions antérieures à sa date d’effet. Les abonnements Entreprise sont également soumis aux CGV
          présentées avant la commande.
        </p>
      </div>

      <Section title="1. Éditeur du site">
        <p>
          Éditeur : <strong>Yousri Frigui, entrepreneur individuel</strong><br />
          Nom du service : <strong>Spotted Talent</strong><br />
          Site : <strong>www.spottedtalent.fr</strong><br />
          SIREN : <strong>838 378 156</strong><br />
          SIRET de l’établissement principal : <strong>838 378 156 00023</strong><br />
          Immatriculation au RNE : <strong>5 août 2026</strong><br />
          Code APE : <strong>6201Z - Programmation informatique</strong><br />
          Adresse : <strong>6 R du Pre Hibou, 73490 La Ravoire, France</strong><br />
          Directeur de la publication : <strong>Yousri Frigui</strong><br />
          Contact :{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>
        </p>
        <p>
          Activité déclarée : développement, édition et exploitation d’une plateforme web SaaS de recrutement
          assistée par intelligence artificielle, avec outils de gestion des candidatures, d’analyse de CV,
          de génération de lettres, de mise en relation et de messagerie.
        </p>
      </Section>

      <Section title="2. Hébergement et prestataires techniques">
        <p>
          Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Avenue #4133, Covina, CA 91723,
          États-Unis. Les demandes relatives à l’hébergement peuvent être adressées via le support Vercel.
        </p>
        <p>
          Supabase fournit notamment l’authentification, la base de données, le stockage privé et les fonctions
          serveur. Stripe traite les paiements et abonnements. Resend peut envoyer les courriels transactionnels.
          Groq peut traiter les demandes d’aide par intelligence artificielle déclenchées par l’utilisateur.
        </p>
      </Section>

      <Section title="3. Objet du service">
        <p>
          Spotted Talent facilite la mise en relation entre talents et entreprises. Les talents peuvent créer un
          profil, consulter des offres, candidater, échanger dans une conversation ouverte par une entreprise et
          transmettre des documents nécessaires. Les entreprises peuvent publier des offres, suivre leurs
          candidatures et gérer leurs dossiers autorisés.
        </p>
      </Section>

      <Section title="4. Création et sécurité du compte">
        <p>
          L’utilisateur fournit des informations exactes, utilise un compte personnel et protège ses identifiants.
          Il doit disposer de la capacité juridique nécessaire ou des autorisations requises pour utiliser le
          service. Une confirmation d’adresse électronique peut être exigée avant l’accès complet.
        </p>
        <p>
          À l’inscription, la version des présentes conditions acceptée, la version de la politique de
          confidentialité présentée, la date serveur, l’identifiant du compte et la source de l’inscription sont
          enregistrés. Aucune case publicitaire n’est incluse dans cette confirmation.
        </p>
      </Section>

      <Section title="5. Utilisation autorisée">
        <p>
          Sont interdits les contenus illicites, trompeurs, discriminatoires, malveillants, usurpant l’identité d’un
          tiers ou sans lien avec l’emploi. Il est également interdit de contourner les limites du service, d’accéder
          aux données d’un tiers ou d’extraire massivement les profils.
        </p>
        <p>
          Un compte peut être limité ou suspendu en cas d’abus, de fraude, de non-paiement, de risque de sécurité ou
          de violation des présentes conditions, avec information lorsque la situation le permet.
        </p>
        <p>
          Toute offre comporte un mécanisme de signalement permettant d’indiquer notamment une discrimination, une
          offre trompeuse ou fictive, une candidature payante, une fraude ou une annonce expirée. Le signalement est
          enregistré et fait l’objet d’un examen humain. Il n’entraîne pas, à lui seul, la suppression automatique du
          contenu. Spotted Talent peut demander des précisions utiles sans exiger de donnée sensible.
        </p>
        <p>
          Une décision de suspension, de maintien ou de rétablissement est motivée et journalisée. L’entreprise
          concernée est informée du motif accessible dans son espace lorsque la loi et la sécurité le permettent.
          Le signaleur ou l’entreprise peut demander un réexamen à l’adresse de contact en rappelant la référence de
          l’offre. Les abus répétés du mécanisme de signalement peuvent eux-mêmes être limités.
        </p>
      </Section>

      <Section title="6. Matching et examen humain">
        <p>
          Le score de correspondance est un indicateur calculé à partir des critères renseignés : secteur (30 %),
          contrat (20 %), localisation (20 %), compétences (25 %) et permis ou habilitations (5 %). Il s’agit
          actuellement d’un calcul par règles, et non d’une décision autonome prise par une intelligence artificielle.
        </p>
        <p>
          Le score ne refuse ni n’accepte automatiquement une candidature. Il ne remplace pas l’examen humain et ne
          doit pas être utilisé comme unique motif de décision. Une entreprise reste responsable de sa sélection et
          des règles de non-discrimination applicables.
        </p>
        <p>
          Spotted Talent exclut des critères de matching les caractéristiques protégées et les données sensibles,
          documente les règles de calcul, surveille les incidents signalés et prévoit une révision humaine des
          résultats contestés. Un talent peut demander la correction de ses données ou signaler un résultat
          incohérent à l’adresse de contact.
        </p>
      </Section>

      <Section title="7. Documents et minimisation">
        <p>
          Une entreprise ne peut créer une demande que dans le dossier d’une candidature acceptée et uniquement pour
          un diplôme ou certificat nécessaire, un permis de conduire requis, une habilitation métier ou une
          autorisation de travail légalement nécessaire.
        </p>
        <p>
          Dans ce dossier post-acceptation, l’entreprise peut également demander une pièce d’identité, un RIB, une
          attestation de droits à l’Assurance Maladie ou un justificatif de domicile lorsque la pièce est nécessaire à
          une formalité d’embauche précise. Le talent choisit le fichier transmis et le partage reste limité aux
          parties de la candidature concernée.
        </p>
        <p>
          Les demandes de copie de Carte Vitale, de photographie d’identité sans finalité précise, de copie de casier
          judiciaire ou de document administratif libre restent bloquées. Un cas particulier imposé par un texte ou
          une profession réglementée doit faire l’objet d’un traitement distinct et préalablement validé.
        </p>
        <p>
          <strong>Durée de conservation.</strong> Un document transmis par un talent en réponse à une demande
          d’entreprise est automatiquement supprimé du service sept jours après sa réception confirmée par
          l’entreprise destinataire, ou après trente jours si aucune réception n’a été confirmée. Seules les
          métadonnées de la demande (nature du document, dates de transmission, de réception et de suppression) sont
          conservées à des fins de traçabilité.
        </p>
        <p>
          <strong>Documents transmis au talent.</strong> Lorsqu’une entreprise transmet un document à un talent, ce
          document reste disponible sur le service pendant quatre-vingt-dix jours à compter de son envoi, puis est
          automatiquement supprimé. Spotted Talent n’est pas le canal officiel de remise de ces documents et n’agit
          qu’à titre de passerelle pratique. Le talent conserve la faculté de solliciter directement son entreprise
          pour toute remise ultérieure. Une fois un document transmis, l’entreprise expéditrice ne conserve pas
          d’accès à ce document.
        </p>
      </Section>

      <Section title="8. Outils d’intelligence artificielle">
        <p>
          L’analyse de CV et les aides à la rédaction de lettres ou d’offres sont déclenchées volontairement. Les
          résultats sont des propositions qui peuvent contenir des erreurs. L’utilisateur doit les relire, les
          corriger et les valider. Aucun contenu généré ne constitue un conseil juridique ni une garantie de résultat.
        </p>
        <p>
          Ces fonctions ne peuvent pas prendre une décision d’embauche, écarter automatiquement un candidat ou
          déduire une caractéristique sensible. Avant toute évolution susceptible d’influencer matériellement une
          décision de recrutement, Spotted Talent réévalue la qualification du système au regard du règlement (UE)
          2024/1689, documente les risques, les performances et les limites, et maintient une supervision humaine.
        </p>
      </Section>

      <Section title="9. Données personnelles">
        <p>
          Les catégories de données, finalités, bases légales, destinataires, durées et droits sont présentés dans la{" "}
          <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
        </p>
      </Section>

      <Section title="10. Abonnements professionnels">
        <p>
          Les abonnements professionnels seront activés lors de l’ouverture commerciale annoncée sur la plateforme,
          après validation des informations de facturation et des conditions commerciales. Leur fonctionnement est
          décrit dans les{" "}
          <Link to="/cgv" className="text-primary hover:underline">CGV entreprises</Link>. Les montants et taxes
          définitifs sont toujours affichés avant validation dans Stripe.
        </p>
      </Section>

      <Section title="11. Propriété intellectuelle">
        <p>
          Les interfaces, textes, éléments graphiques, bases et développements propres à Spotted Talent sont protégés.
          Les utilisateurs conservent leurs droits sur leurs contenus et accordent seulement les autorisations
          nécessaires pour fournir le service et afficher les éléments qu’ils ont choisi de partager.
        </p>
      </Section>

      <Section title="12. Disponibilité et responsabilité">
        <p>
          Le service peut être interrompu pour maintenance, correction ou sécurité. Spotted Talent ne garantit pas
          qu’une offre obtienne des candidatures, qu’un talent soit recruté ou qu’une aide automatisée soit exempte
          d’erreur. Chaque utilisateur reste responsable de ses décisions et des contenus qu’il publie.
        </p>
        <p>
          Aucune stipulation ne limite les droits impératifs d’un utilisateur ni la responsabilité qui ne peut être
          exclue par la loi. Pour les clients professionnels, les exclusions et le plafond contractuel applicables
          figurent dans les CGV entreprises.
        </p>
      </Section>

      <Section title="13. Modification des conditions">
        <p>
          Toute modification substantielle est annoncée par e-mail ou dans l’espace connecté au moins 30 jours avant
          son entrée en vigueur. Une modification imposée par la loi, nécessaire à la sécurité ou corrigeant une
          erreur sans réduire les droits peut s’appliquer plus rapidement, avec information dès que possible.
        </p>
        <p>
          L’utilisateur qui refuse une modification peut cesser d’utiliser le service et supprimer son compte avant
          sa date d’effet. Un client Entreprise peut également résilier son abonnement selon les CGV. Lorsqu’une
          nouvelle acceptation est nécessaire, la version et la date d’acceptation sont enregistrées.
        </p>
      </Section>

      <Section title="14. Réclamation, médiation, droit applicable et contact">
        <p>
          Un contenu ou comportement problématique peut être signalé depuis le bouton prévu sur l’offre ou à{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
          Les présentes conditions sont soumises au droit français. Une solution amiable sera recherchée avant toute
          action, sans priver un utilisateur des règles impératives dont il bénéficie.
        </p>
        <p>
          L’espace Talent est gratuit et les offres payantes sont réservées aux professionnels. Par prudence, Spotted
          Talent finalise néanmoins la désignation d’un médiateur de la consommation avant l’ouverture commerciale.
          Son nom, ses coordonnées et son site seront publiés ici dès la convention d’adhésion signée. Aucun médiateur
          non désigné ne peut être indiqué à sa place.
        </p>
      </Section>

      <div className="border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
        © 2026 Spotted Talent — Tous droits réservés
      </div>
    </main>
  </div>
);

export default CGU;
