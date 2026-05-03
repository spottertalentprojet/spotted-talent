import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Sparkles, Check, Wand2, Users, BarChart3, MessageSquare, Zap, Shield, ArrowRight, TrendingUp } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const plans = [
  {
    name: "Starter",
    price: "39,99€",
    period: "/mois",
    desc: "Pour les petites entreprises",
    features: ["5 annonces par mois", "Matching candidats IA", "Dashboard essentiel", "Support email"],
    highlighted: false,
  },
  {
    name: "Business",
    price: "149,99€",
    period: "/mois",
    desc: "Pour les entreprises en croissance",
    features: ["25 annonces par mois", "Matching candidats avancé", "Offres générées par IA", "Dashboard analytique complet", "Support prioritaire"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "349,99€",
    period: "/mois",
    desc: "Pour les grandes structures",
    features: ["Annonces illimitées", "Matching premium IA", "Offres 100% générées par IA", "Dashboard analytique avancé", "Accès API", "Responsable de compte dédié"],
    highlighted: false,
  },
];

const features = [
  { icon: Wand2, title: "Offres générées par IA", desc: "Créez des offres d'emploi professionnelles en quelques secondes grâce à notre IA." },
  { icon: Users, title: "Matching intelligent", desc: "Notre algorithme trouve automatiquement les meilleurs talents pour vos postes." },
  { icon: BarChart3, title: "Dashboard analytique", desc: "Suivez vos recrutements en temps réel avec des statistiques détaillées." },
  { icon: MessageSquare, title: "Messagerie intégrée", desc: "Communiquez directement avec les candidats depuis votre espace entreprise." },
  { icon: Zap, title: "Recrutement rapide", desc: "Réduisez votre temps de recrutement de 60% grâce à nos outils IA." },
  { icon: Shield, title: "Données sécurisées", desc: "Vos données et celles de vos candidats sont protégées et conformes au RGPD." },
];

const stats = [
  { value: "60%", label: "Temps de recrutement réduit" },
  { value: "1 000+", label: "Entreprises utilisatrices" },
  { value: "98%", label: "Satisfaction client" },
  { value: "30s", label: "Pour créer une offre IA" },
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
    a: "Les plateformes classiques affichent des CV sans les analyser et vous laissent trier seul des dizaines de candidatures peu qualifiées. Spotted Talent analyse chaque profil par IA, génère vos offres en quelques secondes, matche candidats et postes dans les deux sens en temps réel, et centralise tous vos documents en un seul endroit. Résultat : moins de temps perdu, des candidatures vraiment utiles, et un recrutement jusqu'à 60% plus rapide.",
  },
  {
    q: "Comment fonctionne le matching IA ?",
    a: "Notre algorithme analyse le profil complet du candidat (compétences, expérience, secteur, permis, disponibilité) et le compare à vos critères de poste. Le score de matching vous permet de visualiser en un coup d'œil les meilleurs candidats sans lire 50 CV.",
  },
  {
    q: "Est-ce conforme au RGPD ?",
    a: "Oui. Toutes les données sont hébergées en Europe. Les candidats peuvent demander la suppression de leurs données à tout moment. Vous en tant qu'entreprise avez accès uniquement aux profils qui ont consenti à être contactés.",
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
    a: "Moins de 5 minutes. Créez votre compte, complétez votre profil entreprise et publiez votre première offre. Pas d'installation, pas de formation, tout fonctionne depuis votre navigateur.",
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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="gradient-text">Spotted Talent</span>
          </a>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a href="/" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
              Retour à l'accueil
            </a>
            <Link to="/entreprise">
              <Button variant="glow" size="sm">Se connecter</Button>
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
                Plateforme de recrutement par IA
              </div>
              <h1 className="mb-5 text-5xl font-bold leading-[1.1] sm:text-6xl">
                Plus de qualité.<br />
                Plus de valeur.<br />
                <span className="gradient-text">Moins de tri inutile.</span>
              </h1>
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Spotted Talent aide les entreprises à recevoir des candidatures plus pertinentes et mieux qualifiées — sans se noyer dans le volume.
              </p>
              <div className="mb-10 flex flex-col gap-3 sm:flex-row">
                <Link to="/entreprise">
                  <Button variant="glow" size="lg" className="w-full gap-2 px-8 sm:w-auto">
                    Commencer gratuitement
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
                {["Sans engagement", "Mise en route en 5 minutes", "Support inclus"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card border border-border/60 p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
                    <BarChart3 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Dashboard Entreprise</p>
                    <p className="text-xs text-muted-foreground">Vue en temps réel</p>
                  </div>
                </div>
                <span className="rounded-full bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-400">● Live</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "12", label: "Offres actives", color: "gradient-text" },
                  { value: "48", label: "Candidatures", color: "gradient-text" },
                  { value: "85%", label: "Taux de matching", color: "text-green-400" },
                  { value: "3j", label: "Temps moyen", color: "gradient-text" },
                ].map(({ value, label, color }) => (
                  <div key={label} className="rounded-xl border border-border/40 bg-secondary/50 p-4">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-border/40 bg-secondary/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Offre la plus populaire</p>
                    <p className="font-bold gradient-text">Développeur React Senior</p>
                    <p className="text-xs text-muted-foreground">23 candidatures cette semaine</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-accent/40" />
                </div>
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
                <Link to="/entreprise">
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
            Rejoignez 1000+ entreprises
          </div>
          <h2 className="mb-4 text-3xl font-bold">
            Prêt à moderniser votre <span className="gradient-text">recrutement</span> ?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Créez votre compte en 2 minutes et commencez à recruter différemment.
          </p>
          <Link to="/entreprise">
            <Button variant="glow" size="lg" className="gap-2 px-10">
              Créer mon compte entreprise
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold gradient-text">Spotted Talent</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Spotted Talent — La Ravoire, 73490</p>
          <a href="/cgu" className="text-xs text-muted-foreground hover:text-foreground">Mentions légales & CGU</a>
        </div>
      </footer>

    </div>
  );
};

export default EntrepriseLanding;