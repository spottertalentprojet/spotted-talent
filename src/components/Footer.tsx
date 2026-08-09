import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { buildSupportMailto } from "@/lib/contact";

const Footer = () => (
  <footer className="border-t border-border/50 px-4 py-12 sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="gradient-text">Spotted Talent</span>
      </Link>
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        <Link to="/aide" className="transition-colors hover:text-foreground">
          Aide et FAQ
        </Link>
        <Link to="/cgu" className="transition-colors hover:text-foreground">
          Mentions légales et CGU
        </Link>
        <Link to="/cgv" className="transition-colors hover:text-foreground">
          CGV entreprises
        </Link>
        <Link to="/confidentialite" className="transition-colors hover:text-foreground">
          Confidentialité
        </Link>
        <a href={buildSupportMailto("Contact depuis le site Spotted Talent")} className="transition-colors hover:text-foreground">
          Contact
        </a>
      </div>
      <p className="text-xs text-muted-foreground">2026 Spotted Talent. Tous droits réservés.</p>
    </div>
  </footer>
);

export default Footer;
