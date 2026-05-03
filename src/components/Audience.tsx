import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Building2, FileSearch, Lightbulb, FolderOpen, Wand2, Users, Zap } from "lucide-react";

const candidat = [
  { icon: FileSearch, text: "Analyse détaillée de ton CV" },
  { icon: Lightbulb, text: "Suggestions IA plus pédagogiques" },
  { icon: FolderOpen, text: "Espace perso pour candidatures et documents" },
];

const entreprise = [
  { icon: Wand2, text: "Création d'offres plus rapide" },
  { icon: Users, text: "Suivi centralisé des candidats" },
  { icon: Zap, text: "Messagerie et documents au même endroit" },
];

const Column = ({
  icon: Icon,
  title,
  subtitle,
  features,
  accent,
  ctaLabel,
  ctaTo,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  features: { icon: React.ElementType; text: string }[];
  accent: "primary" | "accent";
  ctaLabel: string;
  ctaTo: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass-card flex flex-col p-8"
  >
    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${accent === "primary" ? "bg-primary/15" : "bg-accent/15"}`}>
      <Icon className={`h-7 w-7 ${accent === "primary" ? "text-primary" : "text-accent"}`} />
    </div>
    <h3 className="mb-2 text-2xl font-bold">{title}</h3>
    <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>
    <ul className="flex-1 space-y-4">
      {features.map((feature) => (
        <li key={feature.text} className="flex items-center gap-3 text-sm">
          <feature.icon className={`h-5 w-5 shrink-0 ${accent === "primary" ? "text-primary" : "text-accent"}`} />
          <span>{feature.text}</span>
        </li>
      ))}
    </ul>
    <div className="mt-8">
      <Button variant={accent === "primary" ? "ghost-glow" : "glow"} size="sm" className="w-full sm:w-auto" asChild>
        <Link to={ctaTo}>{ctaLabel}</Link>
      </Button>
    </div>
  </motion.div>
);

const Audience = () => (
  <section className="section-padding">
    <div className="mx-auto max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Une plateforme pour <span className="gradient-text">les talents et les entreprises</span>
        </h2>
      </motion.div>
      <div className="grid gap-8 md:grid-cols-2">
        <Column
          icon={User}
          title="Talents"
          subtitle="Optimise ton profil, comprends mieux ton CV et avance plus vite dans tes candidatures."
          features={candidat}
          accent="primary"
          ctaLabel="Accéder à l'espace talent"
          ctaTo="/talent"
        />
        <Column
          icon={Building2}
          title="Entreprises"
          subtitle="Publiez, suivez et recrutez avec un espace plus clair pour vos équipes et vos candidats."
          features={entreprise}
          accent="accent"
          ctaLabel="Découvrir l'espace entreprise"
          ctaTo="/entreprise-info"
        />
      </div>
    </div>
  </section>
);

export default Audience;
