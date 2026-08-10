import { Link } from "react-router-dom";
import EnterprisePaymentMethods from "@/components/EnterprisePaymentMethods";
import TrustpilotFooterBadge from "@/components/TrustpilotFooterBadge";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Check, Wand2, Users, BarChart3, MessageSquare, Zap, Shield, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const plans = [
  {
    name: "Starter",
    price: "39 €",
    period: "HT /mois",
    desc: "Pour lancer vos premiers recrutements",
    features: ["1 annonce active", "1 nouvelle annonce par semaine", "Messagerie candidats", "Suivi des candidatures", "Documents partagés"],
    highlighted: false,
  },
  {
    name: "Boost",
    price: "149 €",
    period: "HT /mois",
    desc: "Pour recruter plus vite",
    features: ["Tout Starter inclus", "Jusqu'à 5 annonces actives", "5 nouvelles annonces par semaine", "Questions de présélection", "Badge recrutement urgent"],
    highlighted: true,
  },
  {
    name: "Premium Intérim",
    price: "349 €",
    period: "HT /mois",
    desc: "Pour agences et structures à fort volume",
    features: ["Tout Starter et Boost inclus", "Annonces illimitées, usage raisonnable", "Publication intensive", "Annonces prioritaires", "Export candidats"],
    highlighted: false,
  },
];

const features = [
  { icon: Wand2, title: "Offres générées par IA", desc: "Créez des offres d'emploi professionnelles en quelques secondes grâce à notre IA." },
  { icon: Users, title: "Matching par critères", desc: "Un score indicatif rapproche secteur, contrat, localisation, compétences et permis, sans décision automatique." },
  { icon: BarChart3, title: "Dashboard analytique", desc: "Suivez vos recrutements en temps réel avec des statistiques détaillées." },
  { icon: MessageSquare, title: "Messagerie intégrée", desc: "Communiquez directement avec les candidats depuis votre espace entreprise." },
  { icon: Zap, title: "Parcours centralisé", desc: "Regroupez offres, candidatures, échanges et documents dans un seul espace." },
  { icon: Shield, title: "Protection intégrée", desc: "Accès contrôlés, stockage privé, liens temporaires et journalisation des documents." },
];

const stats = [
  { value: "30 j", label: "d’essai avant le premier débit" },
  { value: "220", label: "mots maximum par offre IA" },
  { value: "5", label: "critères de rapprochement" },
  { value: "100 %", label: "des décisions restent humaines" },
];

const comparison = [
  { feature: "Analyse de CV et tri intelligent", spotted: true, classic: false },
  { feature: "Matching candidats / offres", spotted: true, classic: "Limité" },
  { feature: "Documents partagés et suivi", spotted: true, classic: false },
  { feature: "Parcours adapté à l'intérim", spotted: true, classic: false },
];

const faqsEntreprise = [
  {
    q: "Qu'est-ce que Spotted Talent apporte de plus ?",
    a: "Spotted Talent centralise les offres, les candidatures, les échanges et les documents. L’IA intervient uniquement dans les fonctions de rédaction ou d’analyse déclenchées par l’utilisateur. Le matching, lui, repose actuellement sur des critères déclarés et reste indicatif.",
  },
  {
    q: "Comment fonctionne le score de matching ?",
    a: "Le score compare cinq critères déclarés : secteur, contrat, localisation, compétences et permis. Il sert à présenter des correspondances mais ne refuse ni n’accepte automatiquement une candidature. La décision reste humaine.",
  },
  {
    q: "Comment les données sont-elles protégées ?",
    a: "Le produit utilise des accès par rôle, un stockage documentaire privé, des liens temporaires et des journaux d’accès. La documentation RGPD et les contrats des prestataires sont en cours de finalisation avant la commercialisation.",
  },
  {
    q: "Comment gérer les documents avec les candidats ?",
    a: "Depuis votre dashboard, vous pouvez partager et recevoir des documents directement avec chaque candidat — contrats, fiches de poste, justificatifs. Tout est centralisé et traçable sans passer par email.",
  },
  {
    q: "Spotted Talent est-il adapté à l'intérim ?",
    a: "Oui, c'est une de nos forces clés. Le workflow intérim est pensé pour les missions courtes, les renouvellements et la gestion des permis et habilitations. Contrairement aux plateformes généralistes, nous gérons les spécificités du terrain.",
  },
  {
    q: "Puis-je générer des offres d'emploi avec l'IA ?",
    a: "Oui. En quelques secondes, notre IA génère une offre d'emploi complète et professionnelle à partir de vos critères. Vous pouvez la modifier avant publication. Fini les offres mal rédigées qui découragent les bons candidats.",
  },
  {
    q: "Combien de temps pour être opérationnel ?",
    a: "Le parcours vous guide de la création du compte jusqu’à la première annonce. Aucun logiciel n’est à installer : le profil, la facturation et les offres sont gérés depuis le navigateur.",
  },
  {
    q: "Y a-t-il un engagement minimum ?",
    a: "Non. Vous pouvez commencer avec le plan Starter sans engagement et résilier à tout moment. Nous préférons vous garder parce que vous êtes satisfait, pas parce que vous êtes bloqué.",
  },
];

const EntrepriseLanding = () => {
  return (
    <div className="min-h-screen bg-background">

      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-1.5 whitespace-nowrap text-base font-bold sm:gap-2 sm:text-xl">
            <Sparkles className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            <span className="gradient-text">Spotted Talent</span>
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <a href="/" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
              Retour à l'accueil
            </a>
            <Link to="/entreprise/connexion">
              <Button variant="glow" size="sm" className="px-3 sm:px-4">Se connecter</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 pb-24 pt-36">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-24 h-[500px] w-[500px] rounded-full bg-accent/6 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
                <Sparkles className="h-3 w-3" />
                Du besoin au dossier candidat
              </div>
              <h1 className="mb-5 text-4xl font-bold leading-[1.1] min-[420px]:text-5xl sm:text-6xl">
                Des offres claires.<br />
                Des candidatures suivies.<br />
                <span className="gradient-text">Un seul espace.</span>
              </h1>
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Rédigez une annonce courte avec l’IA, suivez chaque candidature et échangez les documents utiles sans disperser votre recrutement entre plusieurs outils.
              </p>
              <div className="mb-10 flex flex-col gap-3 sm:flex-row">
                <Link to="/entreprise/connexion">
                  <Button variant="glow" size="lg" className="w-full gap-2 px-8 sm:w-auto">
                    Essayer pendant 30 jours
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#fonctionnalites">
                  <Button variant="ghost-glow" size="lg" className="w-full sm:w-auto">
                    Voir les fonctionnalités
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                {["Sans engagement", "Aucun débit immédiat", "Décision toujours humaine"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card border border-border/60 p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
                    <Wand2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Votre parcours recruteur</p>
                    <p className="text-xs text-muted-foreground">Simple, guidé et vérifiable</p>
                  </div>
                </div>
                <span className="rounded-full bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-500">Prêt à utiliser</span>
              </div>
              <div className="space-y-3">
                {[
                  { step: "01", title: "Décrivez votre besoin", text: "Poste, lieu, contrat et critères utiles." },
                  { step: "02", title: "Relisez l’offre générée", text: "Aperçu candidat et contrôle qualité avant publication." },
                  { step: "03", title: "Suivez les candidatures", text: "Statut, échanges et pièces réunis dans le même dossier." },
                ].map(({ step, title, text }) => (
                  <div key={step} className="flex items-start gap-4 rounded-xl border border-border/40 bg-secondary/50 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-xs font-bold text-accent">{step}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <p className="text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Documents protégés :</span> stockage privé, accès contrôlé et ouvertures journalisées.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 px-4 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="mb-1 text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
                Pourquoi Spotted Talent
              </div>
              <h2 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">
                Une plateforme qui crée plus de valeur{" "}
                <span className="gradient-text">pour les recruteurs.</span>
              </h2>
              <p className="mb-8 text-muted-foreground">
                Vous gagnez en lisibilité, en vitesse et en qualité sans vous noyer dans des candidatures peu utiles.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: "Moins de bruit", sub: "Des profils plus ciblés" },
                  { label: "Plus de clarté", sub: "Suivi plus simple" },
                  { label: "Plus d'impact", sub: "Un meilleur tri" },
                ].map(({ label, sub }) => (
                  <div key={label} className="rounded-xl border border-border/50 bg-secondary/40 px-4 py-3">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card border border-border/60 overflow-hidden">
              <div className="grid grid-cols-3 border-b border-border/50 bg-secondary/30 px-6 py-3 text-xs font-semibold text-muted-foreground">
                <span>Point clé</span>
                <span className="text-center text-accent">Spotted Talent</span>
                <span className="text-center">Classique</span>
              </div>
              {comparison.map(({ feature, spotted, classic }, i) => (
                <div key={feature} className={`grid grid-cols-3 items-center px-6 py-4 text-sm ${i % 2 === 0 ? "bg-secondary/10" : ""}`}>
                  <span className="text-muted-foreground">{feature}</span>
                  <span className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-green-400/10 px-2.5 py-0.5 text-xs font-medium text-green-400">Oui</span>
                  </span>
                  <span className="text-center">
                    {classic === false ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-red-400/10 px-2.5 py-0.5 text-xs font-medium text-red-400">Non</span>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-full bg-orange-400/10 px-2.5 py-0.5 text-xs font-medium text-orange-400">{classic}</span>
                    )}
                  </span>
                </div>
              ))}
              <div className="border-t border-border/50 bg-secondary/20 px-6 py-4">
                <p className="text-xs italic text-muted-foreground">
                  La bonne question n'est pas : combien de candidatures ?<br />
                  <span className="font-semibold text-foreground">La bonne question est : combien de candidatures vraiment utiles ?</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="border-t border-border/50 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Tout ce dont vous avez <span className="gradient-text">besoin</span>
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Des outils puissants pour moderniser votre recrutement.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card group p-6 transition-all hover:border-accent/30">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-border/50 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Tarifs <span className="gradient-text">transparents</span>
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Gratuit pour les candidats. Choisissez la formule adaptée à votre entreprise.</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`glass-card relative flex flex-col p-8 transition-all ${plan.highlighted ? "border-primary/50 shadow-lg shadow-primary/5" : "hover:border-border"}`}>
                {plan.highlighted && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full gradient-bg px-4 py-1 text-xs font-semibold text-white">
                    Recommandé
                  </div>
                )}
                <h3 className="mb-1 text-xl font-bold">{plan.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/entreprise/connexion">
                  <Button variant={plan.highlighted ? "glow" : "ghost-glow"} className="w-full">Commencer</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-border/50 px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Questions <span className="gradient-text">fréquentes</span>
            </h2>
            <p className="text-muted-foreground">Tout ce que vous devez savoir avant de commencer.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqsEntreprise.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`} className="glass-card border-none px-6">
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="glass-card mx-auto max-w-3xl border border-accent/20 p-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
            <Sparkles className="h-3 w-3" />
            Préparez votre premier recrutement
          </div>
          <h2 className="mb-4 text-3xl font-bold">
            Prêt à moderniser votre <span className="gradient-text">recrutement</span> ?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Testez le parcours complet pendant 30 jours, puis gardez uniquement la formule adaptée à votre volume de recrutement.
          </p>
          <Link to="/entreprise/connexion">
            <Button variant="glow" size="lg" className="gap-2 px-10">
              Démarrer mon essai
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 px-4 py-8">
        <div className="mx-auto mb-7 max-w-7xl">
          <EnterprisePaymentMethods />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-4 sm:grid-cols-[1fr_auto] xl:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold gradient-text">Spotted Talent</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <nav aria-label="Informations légales" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <a href="/cgu" className="text-xs text-muted-foreground hover:text-foreground">Mentions légales & CGU</a>
              <a href="/cgv" className="text-xs text-muted-foreground hover:text-foreground">CGV Entreprises</a>
              <a href="/confidentialite" className="text-xs text-muted-foreground hover:text-foreground">Confidentialité</a>
            </nav>
            <p className="text-xs text-muted-foreground">© 2026 Spotted Talent — La Ravoire, 73490</p>
          </div>
          <div className="flex justify-center xl:justify-end">
            <TrustpilotFooterBadge compact />
          </div>
        </div>
      </footer>

    </div>
  );
};

export default EntrepriseLanding;
