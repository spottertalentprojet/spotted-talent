import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "39,99€",
    period: "/mois",
    desc: "Pour les petites entreprises",
    features: ["5 annonces par mois", "Matching candidats IA", "Dashboard basique", "Support email"],
    highlighted: false,
  },
  {
    name: "Business",
    price: "149,99€",
    period: "/mois",
    desc: "Pour les entreprises en croissance",
    features: ["25 annonces par mois", "Matching candidats avancé", "Offres générées par IA", "Dashboard analytics complet", "Support prioritaire"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "349,99€",
    period: "/mois",
    desc: "Pour les grandes structures",
    features: ["Annonces illimitées", "Matching premium IA", "Offres 100% générées par IA", "Dashboard analytics avancé", "API access", "Account manager dédié"],
    highlighted: false,
  },
];

const Pricing = () => (
  <section id="pricing" className="section-padding">
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tarifs <span className="gradient-text">Entreprises</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Gratuit pour les candidats. Choisissez le plan adapté à votre entreprise.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-8 flex flex-col ${plan.highlighted ? "border-primary/50 glow-primary relative" : ""}`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-bg text-xs font-semibold text-primary-foreground">
                Recommandé
              </div>
            )}
            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">{plan.desc}</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">{plan.price}</span>
              {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={plan.highlighted ? "glow" : "ghost-glow"} className="w-full">
              Commencer
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;
