import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Menu, X, Sparkles } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="gradient-text">Spotted Talent</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
          <ThemeToggle />
          <Link to="/talent">
            <Button variant="ghost-glow" size="sm">
              Je suis un talent
            </Button>
          </Link>
          <Link to="/entreprise-info">
            <Button variant="glow" size="sm">
              Espace Entreprise
            </Button>
          </Link>
        </div>

        <button className="text-foreground md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-b border-border bg-background/95 px-4 pb-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-3 py-2">
            <span className="text-sm font-medium text-foreground">Thème</span>
            <ThemeToggle />
          </div>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <Link to="/talent" className="block" onClick={() => setOpen(false)}>
            <Button variant="ghost-glow" size="sm" className="w-full">
              Je suis un talent
            </Button>
          </Link>
          <Link to="/entreprise-info" className="block" onClick={() => setOpen(false)}>
            <Button variant="glow" size="sm" className="w-full">
              Espace Entreprise
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
