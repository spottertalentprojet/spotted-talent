import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const mobileUrl = "https://www.spottedtalent.fr/?utm_source=landing&utm_medium=mobile_qr";
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(mobileUrl)}`;

const AppleStoreLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
    <path d="M15.07 2.09c.14 1.08-.26 2.16-.84 2.88-.63.78-1.67 1.38-2.72 1.29-.13-1.02.3-2.08.88-2.76.65-.78 1.77-1.35 2.68-1.41ZM18.59 18.15c-.51 1.18-.76 1.71-1.42 2.75-.92 1.46-2.21 3.29-3.82 3.31-1.43.02-1.8-.93-3.74-.92-1.95.01-2.36.94-3.79.92-1.61-.02-2.84-1.68-3.76-3.14-2.59-4.07-2.86-8.85-1.27-11.3 1.12-1.75 2.88-2.77 4.54-2.77 1.7 0 2.77.94 4.17.94 1.36 0 2.18-.95 4.15-.95 1.48 0 3.05.84 4.17 2.3-3.65 1.96-3.06 7.18.77 8.86Z" />
  </svg>
);

const GooglePlayLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
    <path d="M4.5 3.75v16.5L13.7 12 4.5 3.75Z" fill="#34A853" />
    <path d="M13.7 12 17.17 8.88l-9.92-5.6L13.7 12Z" fill="#4285F4" />
    <path d="M13.7 12 7.25 20.47l9.97-5.62L13.7 12Z" fill="#FBBC04" />
    <path d="M19.05 10.03 17.17 8.88 13.7 12l3.52 3.15 1.88-1.06c1.28-.73 1.28-2.61-.05-3.36Z" fill="#EA4335" />
  </svg>
);

const storeBadges = [
  {
    eyebrow: "Disponible bientôt",
    label: "App Store",
    description: "Version iPhone en préparation",
    icon: AppleStoreLogo,
    iconWrapperClassName: "bg-secondary text-foreground",
  },
  {
    eyebrow: "Disponible bientôt",
    label: "Google Play",
    description: "Version Android en préparation",
    icon: GooglePlayLogo,
    iconWrapperClassName: "bg-background",
  },
];

const mobileHighlights = [
  "QR code instantané",
  "Sans installation",
  "Compatible iPhone et Android",
];

const MobileAccessSection = () => (
  <section className="section-padding pb-24">
    <div className="mx-auto max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-[32px] border border-primary/15 bg-card/80 p-6 shadow-[0_30px_100px_-50px_hsl(var(--primary))] backdrop-blur sm:p-8 lg:p-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_38%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.12),transparent_30%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Smartphone className="h-4 w-4" />
              Accès mobile Spotted Talent
            </div>

            <div className="space-y-4">
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ouvrez Spotted Talent sur mobile en un scan
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Scannez le QR code pour accéder instantanément à la plateforme depuis votre téléphone.
                Les badges App Store et Google Play sont déjà prêts pour accueillir vos futurs liens officiels.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {storeBadges.map((badge) => {
                const Icon = badge.icon;

                return (
                  <div
                    key={badge.label}
                    className="rounded-[26px] border border-border/70 bg-card/95 p-4 shadow-[0_18px_50px_-40px_hsl(var(--foreground)/0.35)]"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-[18px] border border-border/70 ${badge.iconWrapperClassName}`}
                      >
                        <Icon />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                          {badge.eyebrow}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{badge.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              {mobileHighlights.map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-4 py-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="glow" size="lg" className="text-base">
                <a href={mobileUrl} target="_blank" rel="noreferrer">
                  Ouvrir le site sur mobile
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              </Button>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Le QR code ouvre directement la version mobile de Spotted Talent, sans étape supplémentaire.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-[30px] border border-primary/20 bg-card/95 p-5 shadow-[0_20px_60px_-35px_hsl(var(--primary)/0.45)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Scanner pour ouvrir</p>
                  <p className="text-xs text-muted-foreground">www.spottedtalent.fr</p>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/10 p-2 text-primary">
                  <QrCode className="h-4 w-4" />
                </div>
              </div>

              <a
                href={mobileUrl}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-[24px] bg-white p-4 shadow-inner"
              >
                <img
                  src={qrCodeUrl}
                  alt="QR code pour ouvrir Spotted Talent sur mobile"
                  className="mx-auto aspect-square w-full max-w-[240px]"
                  loading="lazy"
                />
              </a>

              <div className="mt-4 rounded-[22px] border border-border/70 bg-secondary/40 p-4">
                <p className="text-sm font-semibold text-foreground">Astuce mobile</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Scannez avec l'appareil photo de votre téléphone pour ouvrir directement la version mobile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default MobileAccessSection;
