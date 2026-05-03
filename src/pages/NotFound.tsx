import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute left-1/3 top-1/3 h-80 w-80 rounded-full bg-primary/15 blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/3 right-1/3 h-60 w-60 rounded-full bg-accent/10 blur-[100px] animate-glow-pulse" />

      <div className="dashboard-panel relative w-full max-w-xl p-10 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Spotted Talent
        </div>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mb-3 text-5xl font-bold tracking-tight">404</h1>
        <p className="mb-2 text-2xl font-semibold text-foreground">Page introuvable</p>
        <p className="mx-auto mb-8 max-w-md text-sm leading-6 text-muted-foreground">
          La page que vous cherchez n'existe pas ou n'est plus disponible. Revenez à l'accueil pour continuer.
        </p>
        <a href="/">
          <Button variant="glow" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil
          </Button>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
