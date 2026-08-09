const TRUSTPILOT_PROFILE_URL = "https://fr.trustpilot.com/review/spottedtalent.fr";
const TRUSTPILOT_REVIEW_URL = "https://fr.trustpilot.com/evaluate/spottedtalent.fr";
const TRUSTPILOT_LOGO_URL = "https://cdn.trustpilot.net/brand-assets/4.3.0/logo-black.svg";

const TrustpilotFooterBadge = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl border border-border/60 bg-secondary/35 ${compact ? "px-3 py-2" : "px-4 py-3"}`}
    aria-label="Avis Spotted Talent sur Trustpilot"
  >
    <a
      href={TRUSTPILOT_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-md bg-white px-2 py-1 transition-opacity hover:opacity-85"
      aria-label="Consulter les avis Spotted Talent sur Trustpilot"
    >
      <img
        src={TRUSTPILOT_LOGO_URL}
        alt="Trustpilot"
        width="140"
        height="34"
        loading="lazy"
        className={compact ? "h-5 w-auto" : "h-6 w-auto"}
      />
    </a>
    <span className="text-xs text-muted-foreground">Votre expérience compte</span>
    <a
      href={TRUSTPILOT_REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
    >
      Donner mon avis
    </a>
  </div>
);

export default TrustpilotFooterBadge;
