import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroMockup from "@/assets/hero-mockup-premium-v3.png";

const trustStats = [
  { value: "5 000+", label: "CV optimisés" },
  { value: "1 000+", label: "utilisateurs actifs" },
  { value: "98%", label: "satisfaction" },
];

const HeroSection = () => {
  return (
    <section className="section-padding relative flex min-h-[100svh] items-start overflow-hidden pt-28 sm:items-center sm:pt-32">
      <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-glow-pulse rounded-full bg-primary/20 blur-[120px]" />
      <div
        className="absolute bottom-1/4 right-1/4 h-72 w-72 animate-glow-pulse rounded-full bg-accent/15 blur-[100px]"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="mx-auto grid w-full max-w-[1380px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(620px,1.08fr)] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto flex w-full max-w-[560px] flex-col text-left lg:mx-0"
        >
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-2 w-2 animate-glow-pulse rounded-full gradient-bg" />
            Propulsé par l&apos;intelligence artificielle
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Booste ton CV avec <span className="gradient-text">l&apos;IA</span> et trouve un job{" "}
            <span className="gradient-text">plus vite</span>
          </h1>

          <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Analyse ton CV avec l&apos;IA, améliore ta lettre de motivation et postule aux meilleures offres d&apos;emploi
            en quelques clics.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button variant="glow" size="lg" className="w-full text-base sm:w-auto" asChild>
              <Link to="/talent">
                Analyser mon CV gratuitement
                <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 rounded-[26px] border border-border/60 bg-card/55 px-5 py-5 shadow-[0_24px_60px_-44px_hsl(var(--foreground)/0.28)] backdrop-blur sm:mt-10 sm:px-6">
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Ils nous font confiance</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  &quot;Mon CV a été clarifié en quelques secondes et j&apos;ai mieux compris comment me présenter.&quot;
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">Sophie M. · Candidate</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {trustStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-full border border-border/60 bg-background/75 px-3 py-2 text-center shadow-sm"
                  >
                    <p className="text-sm font-extrabold gradient-text">{stat.value}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto w-full max-w-[760px] lg:-mr-6 lg:max-w-[840px]"
        >
          <div className="relative rounded-[34px] border border-border/60 bg-card/30 p-3 shadow-[0_0_70px_-22px_hsl(var(--glow-primary)/0.46)] backdrop-blur-sm sm:p-4">
            <div className="relative overflow-hidden rounded-[26px] border border-border/40 glow-primary animate-float">
              <img
                src={heroMockup}
                alt="Interface d'analyse de CV par IA et d'offres d'emploi"
                className="h-auto w-full scale-[1.04] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
