import { motion } from "framer-motion";
import { Upload, BrainCircuit, Send } from "lucide-react";

const steps = [
  { icon: Upload, title: "Importe ton CV", desc: "Glisse ton CV en PDF ou Word en quelques secondes." },
  {
    icon: BrainCircuit,
    title: "L'IA l'analyse",
    desc: "Notre IA détecte les faiblesses et améliore ton CV automatiquement.",
  },
  {
    icon: Send,
    title: "Postule en un clic",
    desc: "Reçois des offres adaptées et postule directement depuis la plateforme.",
  },
];

const HowItWorks = () => (
  <section id="fonctionnalites" className="section-padding">
    <div className="mx-auto max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Comment <span className="gradient-text">ça marche ?</span>
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Trois étapes simples pour transformer ta recherche d'emploi.
        </p>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 }}
            className="glass-card group p-8 text-center transition-all duration-300 hover:border-primary/40"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg transition-all group-hover:glow-primary">
              <step.icon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="mb-2 text-xs font-semibold text-primary">ÉTAPE {index + 1}</div>
            <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
