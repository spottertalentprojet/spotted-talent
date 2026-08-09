import { motion } from "framer-motion";

const productFacts = [
  { value: "0 €", label: "Pour les talents" },
  { value: "2", label: "Espaces dédiés" },
  { value: "5", label: "Critères de matching" },
  { value: "30 j", label: "Échéance des documents protégés" },
];

const useCases = [
  {
    title: "Préparer sa candidature",
    text: "Le talent analyse son CV, génère une base de lettre puis corrige librement chaque élément avant l’envoi.",
  },
  {
    title: "Suivre sans automatiser la décision",
    text: "L’entreprise centralise les candidatures et utilise un score indicatif, tout en conservant la décision humaine.",
  },
  {
    title: "Échanger les pièces utiles",
    text: "Les documents restent liés au dossier concerné et les nouvelles demandes sont limitées aux justificatifs métier nécessaires.",
  },
];

const SocialProof = () => (
  <section className="section-padding relative">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
    <div className="relative mx-auto max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Des fonctions <span className="gradient-text">concrètes et transparentes</span>
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          En phase bêta, nous présentons uniquement des caractéristiques vérifiables du produit.
        </p>
      </motion.div>

      <div className="mb-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {productFacts.map((fact, index) => (
          <motion.div
            key={fact.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 text-center"
          >
            <div className="mb-1 text-3xl font-extrabold gradient-text sm:text-4xl">{fact.value}</div>
            <div className="text-sm text-muted-foreground">{fact.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {useCases.map((useCase, index) => (
          <motion.div
            key={useCase.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="mb-3 font-semibold text-foreground">{useCase.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{useCase.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProof;
