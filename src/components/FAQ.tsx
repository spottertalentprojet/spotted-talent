import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Est-ce gratuit pour les candidats ?",
    a: "Oui, la plateforme est 100% gratuite pour tous les candidats. Vous pouvez analyser votre CV, recevoir des suggestions et postuler sans frais.",
  },
  {
    q: "Comment fonctionne l'analyse IA ?",
    a: "L'IA analyse la structure, le contenu et les mots-clés de votre CV pour vous aider à mieux vous présenter face aux recruteurs.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Les données sont gérées dans un cadre sécurisé et peuvent être supprimées sur demande.",
  },
  {
    q: "Puis-je l'utiliser pour recruter ?",
    a: "Oui. L'espace entreprise permet de publier des offres, suivre les candidatures, échanger des messages et gérer les documents.",
  },
];

const FAQ = () => (
  <section id="faq" className="section-padding">
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Questions <span className="gradient-text">fréquentes</span>
        </h2>
      </motion.div>

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={faq.q}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
          >
            <AccordionItem value={`faq-${index}`} className="glass-card border-none px-6">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card relative mt-20 overflow-hidden p-12 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <div className="relative">
          <h3 className="mb-4 text-2xl font-bold sm:text-3xl">Prêt à booster ta carrière ?</h3>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">
            Rejoins une plateforme pensée pour aider les talents à mieux se présenter et postuler plus vite.
          </p>
          <Button variant="glow" size="lg" className="text-base" asChild>
            <Link to="/talent">
              Commencer maintenant
              <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default FAQ;
