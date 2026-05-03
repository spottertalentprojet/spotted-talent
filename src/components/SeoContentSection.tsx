import { motion } from "framer-motion";
import { BriefcaseBusiness, FileSearch, PenLine } from "lucide-react";

const cards = [
  {
    icon: FileSearch,
    title: "Analyse de CV par IA",
    text: "Comprenez rapidement les points forts, les points faibles et les améliorations à apporter à votre CV.",
  },
  {
    icon: PenLine,
    title: "Lettre de motivation",
    text: "Générez une lettre de motivation plus claire et plus professionnelle pour répondre aux offres d'emploi.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Offres d'emploi et de travail",
    text: "Retrouvez des offres adaptées à votre profil, votre contrat recherché, votre ville et votre secteur d'activité.",
  },
];

const SeoContentSection = () => (
  <section className="section-padding pt-0">
    <div className="mx-auto max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <div className="mb-4 inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
          Recherche d'emploi intelligente
        </div>
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Analyse de CV, lettre de motivation et <span className="gradient-text">offres de travail</span>
        </h2>
        <p className="mx-auto max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Spotted Talent aide les candidats à trouver un emploi plus vite grâce à l'analyse de CV par IA, à la lettre de motivation générée avec l'IA et à un moteur d'offres d'emploi pensé pour la France.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="glass-card p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <card.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold">{card.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{card.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SeoContentSection;
