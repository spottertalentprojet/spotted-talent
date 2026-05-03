import { motion } from "framer-motion";

const stats = [
  { value: "5 000+", label: "CV optimisés" },
  { value: "1 000+", label: "Utilisateurs actifs" },
  { value: "98%", label: "Satisfaction" },
  { value: "30s", label: "Temps d'analyse" },
];

const testimonials = [
  {
    name: "Sophie M.",
    role: "Développeuse",
    text: "Mon CV a été transformé en quelques secondes. J'ai décroché 3 entretiens en une semaine.",
  },
  {
    name: "Thomas L.",
    role: "Chef de projet",
    text: "Le matching intelligent m'a fait gagner du temps et m'a montré des offres vraiment utiles.",
  },
  {
    name: "Clara D.",
    role: "RH Manager",
    text: "On suit mieux les candidatures et les documents. L'espace entreprise est plus pratique qu'un simple tableau.",
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
          Ils nous font <span className="gradient-text">confiance</span>
        </h2>
      </motion.div>

      <div className="mb-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 text-center"
          >
            <div className="mb-1 text-3xl font-extrabold gradient-text sm:text-4xl">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6"
          >
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">"{testimonial.text}"</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg text-sm font-bold text-primary-foreground">
                {testimonial.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold">{testimonial.name}</div>
                <div className="text-xs text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProof;
