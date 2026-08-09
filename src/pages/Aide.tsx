import { useMemo, useState, type ComponentType } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  FileSearch,
  FileText,
  FolderLock,
  KeyRound,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { DOCUMENT_RETENTION_DAYS } from "@/lib/documentRetention";
import { buildSupportMailto, SUPPORT_EMAIL } from "@/lib/contact";

type HelpAudience = "all" | "talent" | "entreprise";

type HelpQuestion = {
  question: string;
  answer: string;
};

type HelpTopic = {
  id: string;
  title: string;
  description: string;
  audience: HelpAudience;
  icon: ComponentType<{ className?: string }>;
  actionLabel?: string;
  actionTo?: string;
  questions: HelpQuestion[];
};

const helpTopics: HelpTopic[] = [
  {
    id: "demarrage",
    title: "Démarrage et connexion",
    description: "Créer son compte, confirmer son e-mail et retrouver son accès.",
    audience: "all",
    icon: KeyRound,
    questions: [
      {
        question: "Quel espace choisir à l'inscription ?",
        answer:
          "Choisissez Talent si vous recherchez un emploi et Entreprise si vous recrutez. Un compte est associé à un seul rôle afin de protéger les données et de présenter uniquement les outils utiles.",
      },
      {
        question: "Pourquoi dois-je confirmer mon adresse e-mail ?",
        answer:
          "La confirmation vérifie que l'adresse vous appartient et protège l'accès à votre espace. Ouvrez le message reçu, cliquez sur le lien puis revenez sur Spotted Talent. Pensez à vérifier le dossier des courriers indésirables.",
      },
      {
        question: "Comment réinitialiser mon mot de passe ?",
        answer:
          "Depuis l'écran de connexion, choisissez « Mot de passe oublié », saisissez votre adresse puis utilisez le lien reçu. Si le message tarde, attendez quelques minutes avant de refaire une demande et vérifiez les courriers indésirables.",
      },
      {
        question: "Comment passer du mode jour au mode nuit ?",
        answer:
          "Utilisez le bouton d'apparence dans l'en-tête ou en bas du menu latéral. Votre préférence est conservée sur votre appareil.",
      },
    ],
  },
  {
    id: "profil-talent",
    title: "Profil Talent",
    description: "Présenter son parcours et améliorer la pertinence des offres proposées.",
    audience: "talent",
    icon: UserRound,
    actionLabel: "Ouvrir mon profil",
    actionTo: "/talent/dashboard?tab=profile",
    questions: [
      {
        question: "Quelles informations dois-je compléter ?",
        answer:
          "Indiquez au minimum votre poste visé, vos compétences, votre localisation, votre disponibilité et une courte présentation. Un profil précis améliore la qualité des offres proposées et aide les recruteurs à comprendre votre projet.",
      },
      {
        question: "Comment fonctionne la recherche automatique d'adresse ?",
        answer:
          "Commencez à saisir une rue, une ville ou un code postal puis sélectionnez une proposition. La ville et le code postal sont remplis automatiquement. Si le service public d'adresse est momentanément indisponible, vous pouvez toujours saisir les informations manuellement.",
      },
      {
        question: "Qui peut voir mon profil ?",
        answer:
          "Les entreprises utilisent votre profil professionnel dans le cadre du recrutement. Vos documents sensibles restent séparés et ne deviennent pas publics avec votre profil.",
      },
    ],
  },
  {
    id: "offres-candidatures",
    title: "Offres et candidatures",
    description: "Comprendre le matching, enregistrer une offre et suivre une candidature.",
    audience: "talent",
    icon: BriefcaseBusiness,
    actionLabel: "Voir mes candidatures",
    actionTo: "/talent/dashboard?tab=mes-candidatures",
    questions: [
      {
        question: "Quelle différence entre une offre matchée et une offre enregistrée ?",
        answer:
          "Une offre matchée est proposée selon les informations de votre profil. Une offre enregistrée est une offre que vous avez volontairement mise de côté avec le bouton en forme de cœur.",
      },
      {
        question: "Le score de matching décide-t-il à la place du recruteur ?",
        answer:
          "Non. Le score est un indicateur fondé sur le secteur, le contrat, la localisation, les compétences et les permis ou habilitations. Il ne refuse ni n'accepte automatiquement une candidature : la décision reste humaine.",
      },
      {
        question: "Où suivre l'avancement de ma candidature ?",
        answer:
          "La rubrique « Mes candidatures » affiche les dossiers en attente, en entretien, acceptés ou refusés. Sélectionnez une candidature pour consulter ses messages et les éventuels documents demandés.",
      },
      {
        question: "Puis-je consulter la page de l'entreprise ?",
        answer:
          "Oui. Depuis le détail d'une offre, ouvrez le profil de l'entreprise pour consulter sa présentation, ses secteurs et ses autres offres disponibles.",
      },
    ],
  },
  {
    id: "cv-lettre",
    title: "CV, analyse IA et lettre",
    description: "Analyser un CV et préparer une lettre personnalisée dans le même espace.",
    audience: "talent",
    icon: FileSearch,
    actionLabel: "Ouvrir CV et lettre",
    actionTo: "/talent/dashboard?tab=candidature",
    questions: [
      {
        question: "Quels formats de CV sont acceptés ?",
        answer:
          "Vous pouvez utiliser un fichier PDF, DOCX ou TXT. Vérifiez que le texte est lisible et que le document contient bien vos expériences, compétences et coordonnées utiles.",
      },
      {
        question: "Que fait l'analyse du CV ?",
        answer:
          "Elle repère notamment les expériences, compétences, mots-clés et éléments de lisibilité afin de proposer un diagnostic. Le résultat est une aide à la préparation et non une garantie de recrutement.",
      },
      {
        question: "La lettre utilise-t-elle réellement mon CV ?",
        answer:
          "Oui. Analysez d'abord le CV affiché à gauche : la génération utilise les compétences et expériences détectées pour adapter la lettre au poste et à l'entreprise. Relisez toujours le résultat avant de l'envoyer.",
      },
      {
        question: "Puis-je modifier et mettre en forme la lettre ?",
        answer:
          "Oui. Le texte reste modifiable. Vous pouvez utiliser le gras, l'italique, le soulignement et les listes, choisir le ton de la lettre, enregistrer votre brouillon puis l'exporter en PDF.",
      },
    ],
  },
  {
    id: "echanges",
    title: "Échanges candidats–recruteurs",
    description: "Une conversation encadrée autour d'une candidature réelle.",
    audience: "all",
    icon: MessageSquare,
    questions: [
      {
        question: "Un talent peut-il démarcher librement une entreprise par message ?",
        answer:
          "Non. La messagerie n'est pas un chat public. L'entreprise ouvre l'échange à partir d'une candidature reçue. Le talent peut ensuite répondre tant que l'échange reste ouvert.",
      },
      {
        question: "Pourquoi la zone de réponse peut-elle être bloquée ?",
        answer:
          "La réponse est désactivée lorsque l'entreprise n'a pas encore ouvert l'échange ou lorsque le dossier est clôturé. Le statut de la candidature reste consultable.",
      },
      {
        question: "Puis-je transmettre un document dans un message ?",
        answer:
          "Utilisez de préférence le dossier Documents prévu pour la candidature. Il applique les contrôles d'accès, les durées de conservation et la traçabilité adaptés aux pièces demandées.",
      },
    ],
  },
  {
    id: "documents",
    title: "Documents et coffre sécurisé",
    description: "Partager uniquement la bonne pièce, au bon destinataire et pendant la bonne durée.",
    audience: "all",
    icon: FolderLock,
    questions: [
      {
        question: "Quand une entreprise peut-elle demander une pièce ?",
        answer:
          "Une demande administrative n'est possible que dans le dossier d'une candidature acceptée. Le talent voit l'entreprise, la candidature et la nature de la pièce avant de choisir le fichier à transmettre.",
      },
      {
        question: "Quels documents peuvent être demandés ?",
        answer:
          "Selon le poste et la formalité d'embauche : diplôme ou certificat, permis requis, habilitation métier, autorisation de travail et, lorsque cela est réellement nécessaire, pièce d'identité, RIB, attestation de droits ou justificatif de domicile.",
      },
      {
        question: "Quels documents restent bloqués ?",
        answer:
          "La copie de Carte Vitale, la photo d'identité générale, la copie de casier judiciaire et les demandes administratives libres restent bloquées. Un cas légal particulier doit être traité séparément.",
      },
      {
        question: "Combien de temps un document envoyé par un talent reste-t-il disponible ?",
        answer: `Après téléchargement ou confirmation par l'entreprise, un délai de sécurité de ${DOCUMENT_RETENTION_DAYS.talentDocumentAfterReceipt} jours commence. Sans réception confirmée, le fichier est supprimé ${DOCUMENT_RETENTION_DAYS.talentDocumentWithoutReceipt} jours après son envoi. Les métadonnées utiles restent conservées pour la traçabilité.`,
      },
      {
        question: "Combien de temps un document reçu par le talent reste-t-il disponible ?",
        answer: `Un contrat, une fiche de paie ou un document d'intérim transmis au talent reste disponible pendant ${DOCUMENT_RETENTION_DAYS.companyDocumentDelivery} jours. Le talent doit télécharger sa copie s'il souhaite la conserver. Après la remise, l'entreprise ne peut plus ouvrir ni retélécharger le fichier.`,
      },
    ],
  },
  {
    id: "entreprise-profil",
    title: "Compte et profil Entreprise",
    description: "Vérifier l'entreprise et présenter une identité rassurante aux talents.",
    audience: "entreprise",
    icon: Building2,
    actionLabel: "Ouvrir Mon Entreprise",
    actionTo: "/entreprise/dashboard?tab=profil",
    questions: [
      {
        question: "Pourquoi vérifier le SIRET ?",
        answer:
          "La vérification aide à confirmer l'existence de l'établissement et peut préremplir les informations officielles disponibles, comme la raison sociale et l'adresse. Les informations de facturation doivent rester exactes.",
      },
      {
        question: "Que voient les talents sur mon entreprise ?",
        answer:
          "Ils peuvent consulter le nom, le logo, l'image de couverture, la présentation, les secteurs d'activité, la localisation et les offres publiées. Les données internes de facturation ne sont pas affichées sur le profil public.",
      },
      {
        question: "Pourquoi certaines fonctions indiquent-elles qu'elles sont bloquées ?",
        answer:
          "La création d'offres, le suivi des candidatures et les outils associés nécessitent une formule active ou l'activation de l'essai. Le bouton proposé vous conduit directement à l'étape de facturation manquante.",
      },
    ],
  },
  {
    id: "creation-offre",
    title: "Créer et publier une offre",
    description: "Préparer un brouillon lisible, vérifier sa conformité puis le publier.",
    audience: "entreprise",
    icon: WandSparkles,
    actionLabel: "Créer une offre IA",
    actionTo: "/entreprise/dashboard?tab=offres",
    questions: [
      {
        question: "Comment générer une offre avec l'IA ?",
        answer:
          "Renseignez le poste, la localisation, le contrat et l'expérience, puis ajoutez les compétences, permis ou contraintes réellement nécessaires. L'IA prépare une base que vous devez relire et corriger avant publication.",
      },
      {
        question: "Où retrouver un brouillon ?",
        answer:
          "Enregistrez l'offre comme brouillon depuis l'éditeur. Vous la retrouverez dans « Mes offres » pour la reprendre, la modifier et la publier plus tard.",
      },
      {
        question: "Pourquoi une offre peut-elle être refusée ou signalée ?",
        answer:
          "Les annonces discriminatoires, trompeuses, fictives, expirées, demandant un paiement au candidat ou comportant des critères interdits peuvent être bloquées ou examinées. Une décision de modération reste soumise à un examen humain et peut être contestée auprès du support.",
      },
      {
        question: "Comment rendre l'annonce plus lisible ?",
        answer:
          "Utilisez un titre précis, une courte présentation, des missions sous forme de liste, les critères réellement indispensables, une rémunération claire et un appel à candidater. Évitez les longs blocs de texte et les répétitions.",
      },
    ],
  },
  {
    id: "recrutement",
    title: "Candidatures et recrutement",
    description: "Étudier les candidatures, échanger et finaliser un dossier accepté.",
    audience: "entreprise",
    icon: CheckCircle2,
    actionLabel: "Voir les candidatures",
    actionTo: "/entreprise/dashboard?tab=candidats",
    questions: [
      {
        question: "Comment changer le statut d'une candidature ?",
        answer:
          "Ouvrez la candidature puis utilisez le statut adapté : en attente, entretien, acceptée ou refusée. Le talent voit l'évolution de son dossier.",
      },
      {
        question: "Comment ouvrir un échange avec le talent ?",
        answer:
          "Depuis une candidature reçue, ouvrez l'échange puis envoyez votre message. Le talent pourra répondre dans cette conversation liée au recrutement.",
      },
      {
        question: "Quand demander les documents d'embauche ?",
        answer:
          "Attendez l'acceptation de la candidature. Ouvrez ensuite le dossier partagé et choisissez uniquement une pièce prévue par la plateforme et nécessaire à la formalité concernée.",
      },
    ],
  },
  {
    id: "abonnement",
    title: "Abonnement, paiement et factures",
    description: "Activer une formule, gérer Stripe et récupérer les justificatifs.",
    audience: "entreprise",
    icon: CreditCard,
    actionLabel: "Gérer l'abonnement",
    actionTo: "/entreprise/dashboard?tab=abonnement",
    questions: [
      {
        question: "Pourquoi une carte est-elle demandée pour l'essai ?",
        answer:
          "Stripe demande une carte pour activer l'essai de la formule choisie. Les conditions, la durée de l'essai, le prix et la date du prochain paiement sont affichés avant votre validation.",
      },
      {
        question: "Où télécharger une facture ?",
        answer:
          "Ouvrez la rubrique « Abonnement », puis l'historique de facturation. Les factures disponibles peuvent être téléchargées depuis votre espace ou le portail Stripe sécurisé.",
      },
      {
        question: "Comment changer de formule ou résilier ?",
        answer:
          "Utilisez le portail Stripe depuis la rubrique Abonnement. Les conséquences du changement, la prochaine échéance et les modalités applicables sont présentées avant confirmation.",
      },
      {
        question: "Mes coordonnées bancaires sont-elles stockées par Spotted Talent ?",
        answer:
          "Non. La saisie et la conservation des informations de carte sont assurées par Stripe. Spotted Talent conserve uniquement les références nécessaires au suivi de l'abonnement et des factures.",
      },
    ],
  },
  {
    id: "securite",
    title: "Sécurité, confidentialité et compte",
    description: "Comprendre les protections du compte et garder le contrôle de ses données.",
    audience: "all",
    icon: ShieldCheck,
    questions: [
      {
        question: "La double authentification est-elle obligatoire ?",
        answer:
          "Elle est obligatoire pour les comptes Entreprise, qui manipulent des données de recrutement et des dossiers candidats. Elle n'est pas imposée au Talent. Les opérations administrateur sensibles demandent également une authentification renforcée.",
      },
      {
        question: "Un administrateur peut-il lire mes documents sensibles ?",
        answer:
          "Non. L'administration peut consulter les métadonnées nécessaires à la sécurité et à la traçabilité, mais elle ne reçoit pas l'accès au contenu du coffre documentaire.",
      },
      {
        question: "Comment signaler une offre problématique ?",
        answer:
          "Utilisez le bouton de signalement présent sur l'offre et sélectionnez le motif approprié. Le signalement est enregistré puis examiné par une personne. Il ne provoque pas automatiquement la suppression de l'annonce.",
      },
      {
        question: "Comment supprimer mon compte ou exercer mes droits ?",
        answer:
          "Les réglages de sécurité permettent de demander la suppression du compte. Pour une demande d'accès, de rectification ou de confidentialité, contactez le support en précisant l'adresse liée à votre compte, sans joindre de document sensible dans l'e-mail.",
      },
    ],
  },
  {
    id: "depannage",
    title: "Dépannage et support",
    description: "Résoudre les problèmes courants et transmettre une demande utile au support.",
    audience: "all",
    icon: CircleHelp,
    questions: [
      {
        question: "Que faire si une page reste vide ou affiche l'ancienne version ?",
        answer:
          "Actualisez la page avec Ctrl+F5 sur Windows, vérifiez votre connexion puis reconnectez-vous. Sur mobile, fermez complètement l'onglet avant de rouvrir le site.",
      },
      {
        question: "Que faire si un fichier refuse de s'envoyer ?",
        answer:
          "Vérifiez le format et la taille indiqués dans la zone d'envoi, renommez le fichier avec un nom simple puis réessayez. Pour une pièce demandée, assurez-vous d'utiliser le bouton du dossier de candidature accepté correspondant.",
      },
      {
        question: "Quelles informations envoyer au support ?",
        answer:
          "Indiquez votre rôle, la rubrique concernée, l'action effectuée, le message d'erreur et l'heure approximative. Vous pouvez joindre une capture d'écran après avoir masqué toute donnée sensible, clé ou information bancaire.",
      },
    ],
  },
];

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const audienceMeta: Record<HelpAudience, { label: string; className: string }> = {
  all: { label: "Pour tous", className: "border-border bg-secondary/50 text-muted-foreground" },
  talent: { label: "Talent", className: "border-primary/20 bg-primary/10 text-primary" },
  entreprise: { label: "Entreprise", className: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
};

const Aide = () => {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get("role");
  const initialAudience: HelpAudience = requestedRole === "talent" || requestedRole === "entreprise" ? requestedRole : "all";
  const [audience, setAudience] = useState<HelpAudience>(initialAudience);
  const [query, setQuery] = useState("");

  const filteredTopics = useMemo(() => {
    const needle = normalizeSearch(query);

    return helpTopics
      .filter((topic) => audience === "all" || topic.audience === "all" || topic.audience === audience)
      .map((topic) => {
        if (!needle) return topic;

        const topicText = normalizeSearch(`${topic.title} ${topic.description} ${audienceMeta[topic.audience].label}`);
        if (topicText.includes(needle)) return topic;

        return {
          ...topic,
          questions: topic.questions.filter((item) =>
            normalizeSearch(`${item.question} ${item.answer}`).includes(needle),
          ),
        };
      })
      .filter((topic) => topic.questions.length > 0);
  }, [audience, query]);

  const visibleQuestionCount = filteredTopics.reduce((total, topic) => total + topic.questions.length, 0);

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <main className="mx-auto max-w-6xl space-y-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold text-primary">
            <Sparkles className="h-5 w-5" /> Spotted Talent
          </div>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-cyan-500/10 px-5 py-9 sm:px-9 lg:px-12 lg:py-12">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative mx-auto max-w-3xl text-center">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 text-xs font-semibold text-primary">
                <CircleHelp className="h-4 w-4" /> Centre d'aide Spotted Talent
              </div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Comment pouvons-nous vous aider ?</h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Retrouvez des réponses simples sur votre compte, les candidatures, l'IA, les documents, les abonnements et la sécurité.
              </p>
              <label className="mx-auto mt-7 flex max-w-2xl items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 shadow-sm focus-within:border-primary/45 focus-within:ring-4 focus-within:ring-primary/10">
                <Search className="h-5 w-5 shrink-0 text-primary" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher : CV, facture, document, mot de passe..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  aria-label="Rechercher dans le centre d'aide"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="text-xs font-semibold text-primary hover:underline">
                    Effacer
                  </button>
                )}
              </label>
            </div>
          </div>

          <div className="border-t border-border/60 bg-secondary/15 px-5 py-5 sm:px-8">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Afficher l'aide adaptée à votre espace</p>
            <div className="mx-auto mt-3 grid max-w-2xl grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-background/70 p-1.5">
              {([
                { id: "all", label: "Tout", icon: Sparkles },
                { id: "talent", label: "Talent", icon: UserRound },
                { id: "entreprise", label: "Entreprise", icon: Building2 },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={audience === id}
                  onClick={() => setAudience(id)}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${audience === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {!query && audience === "all" && (
          <section className="grid gap-4 md:grid-cols-2">
            <Link to="/talent/dashboard" className="group rounded-3xl border border-primary/20 bg-primary/[0.06] p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary/15 p-3 text-primary"><UserRound className="h-6 w-6" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">Guide Talent</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Profil, offres, candidatures, CV, lettre, documents et échanges.</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Accéder à mon espace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </div>
            </Link>
            <Link to="/entreprise/dashboard" className="group rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.06] p-6 transition-all hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-700 dark:text-cyan-300"><Building2 className="h-6 w-6" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">Guide Entreprise</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Profil, offres IA, candidatures, abonnement, factures et dossiers.</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-700 dark:text-cyan-300">Accéder à mon espace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </div>
            </Link>
          </section>
        )}

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Guides et réponses</p>
              <h2 className="mt-1 text-2xl font-bold">{query ? `Résultats pour « ${query} »` : "Toutes les rubriques"}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{visibleQuestionCount} réponse{visibleQuestionCount > 1 ? "s" : ""}</p>
          </div>

          {filteredTopics.length > 0 ? (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {filteredTopics.map((topic) => {
                const Icon = topic.icon;
                const meta = audienceMeta[topic.audience];
                return (
                  <article id={topic.id} key={topic.id} className="scroll-mt-6 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm sm:p-6">
                    <div className="flex items-start gap-4 border-b border-border/60 pb-5">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">{topic.title}</h3>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}>{meta.label}</span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{topic.description}</p>
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="mt-2">
                      {topic.questions.map((item, index) => (
                        <AccordionItem key={item.question} value={`${topic.id}-${index}`} className="border-border/60">
                          <AccordionTrigger className="text-left text-sm font-semibold leading-5 hover:no-underline hover:text-primary">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="pr-3 text-sm leading-6 text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    {topic.id === "documents" && (
                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        {audience !== "entreprise" && (
                          <Button asChild variant="outline" size="sm" className="justify-between rounded-xl">
                            <Link to="/talent/dashboard?tab=documents">Documents Talent<ArrowRight className="h-4 w-4" /></Link>
                          </Button>
                        )}
                        {audience !== "talent" && (
                          <Button asChild variant="outline" size="sm" className="justify-between rounded-xl">
                            <Link to="/entreprise/dashboard?tab=documents">Documents Entreprise<ArrowRight className="h-4 w-4" /></Link>
                          </Button>
                        )}
                      </div>
                    )}

                    {topic.id !== "documents" && topic.actionTo && topic.actionLabel && (
                      <Button asChild variant="outline" size="sm" className="mt-5 w-full justify-between rounded-xl">
                        <Link to={topic.actionTo}>{topic.actionLabel}<ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-bold">Aucune réponse trouvée</h3>
              <p className="mt-2 text-sm text-muted-foreground">Essayez un autre mot ou contactez directement notre support.</p>
              <Button type="button" variant="outline" className="mt-5" onClick={() => { setQuery(""); setAudience("all"); }}>Afficher toute l'aide</Button>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-cyan-500/10 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Mail className="h-4 w-4" /> Besoin d'une réponse personnalisée ?</div>
              <h2 className="mt-2 text-2xl font-bold">Notre support peut vous aider</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Décrivez la rubrique, l'action réalisée et le message affiché. Ne transmettez jamais de mot de passe, de clé ou de document sensible par e-mail.
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">Adresse officielle : {SUPPORT_EMAIL}</p>
            </div>
            <Button asChild className="shrink-0 rounded-xl">
              <a href={buildSupportMailto("Demande d'aide Spotted Talent")}>Contacter le support <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          <Link to="/cgu" className="hover:text-foreground hover:underline">CGU</Link>
          <Link to="/cgv" className="hover:text-foreground hover:underline">CGV entreprises</Link>
          <Link to="/confidentialite" className="hover:text-foreground hover:underline">Politique de confidentialité</Link>
          <Link to="/" className="hover:text-foreground hover:underline">Accueil</Link>
        </div>
      </main>
    </div>
  );
};

export default Aide;
