import { motion } from "framer-motion";
import { FileCheck, Target, Clock, TrendingUp } from "lucide-react";

const items = [
  {
    icon: FileCheck,
    title: "CV optimisé par IA",
    desc: "Obtiens un CV plus clair, mieux structuré et plus crédible pour les recruteurs.",
  },
  {
    icon: Target,
    title: "Matching plus utile",
    desc: "Les offres sont filtrées selon ton profil, ton contrat et tes priorités.",
  },
  {
    icon: Clock,
    title: "Gain de temps réel",
    desc: "Centralise ton CV, tes candidatures, tes messages et tes documents au même endroit.",
  },
  {
    icon: TrendingUp,
    title: "Plus d'opportunités",
    desc: "Avance plus vite avec une plateforme pensée pour postuler et suivre tes démarches.",
  },
];

const Benefits = () => (
  <section className="section-padding relative">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
    <div className="relative mx-auto max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          Pourquoi choisir Spotted Talent
        </div>
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Des outils concrets pour <span className="gradient-text">aller plus vite</span>
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Tout est pensé pour aider les talents à mieux se présenter, mieux comprendre leur CV, générer une lettre de motivation et postuler plus efficacement.
        </p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="glass-card group p-6 transition-all duration-300 hover:border-primary/40"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-4xl rounded-[24px] border border-border/60 bg-card/55 p-6 text-center text-sm leading-relaxed text-muted-foreground shadow-[0_24px_60px_-44px_hsl(var(--foreground)/0.28)] backdrop-blur">
        Spotted Talent est une plateforme d&apos;<strong className="text-foreground">offres d&apos;emploi</strong> et d&apos;<strong className="text-foreground">offres de travail</strong> conçue pour
        l&apos;<strong className="text-foreground">analyse de CV</strong>, la <strong className="text-foreground">lettre de motivation</strong> et la candidature rapide avec l&apos;IA.
      </div>
    </div>
  </section>
);

export default Benefits;
