import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, KeyRound, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const role = params.get("role") === "entreprise" ? "entreprise" : "talent";
  const backPath = role === "entreprise" ? "/entreprise" : "/talent";
  const successPath = role === "entreprise" ? "/entreprise/dashboard" : "/talent/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Votre mot de passe a été mis à jour.");
      navigate(successPath, { replace: true });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute left-1/3 top-1/3 h-80 w-80 rounded-full bg-primary/15 blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/3 right-1/3 h-60 w-60 rounded-full bg-accent/10 blur-[100px] animate-glow-pulse" />

      <div className="relative w-full max-w-md">
        <button
          onClick={() => navigate(backPath)}
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="mb-8 text-center">
          <a href="/" className="mb-4 inline-flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="gradient-text">Spotted Talent</span>
          </a>
          <h1 className="mt-4 text-2xl font-bold">Définir un nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ouvrez le lien reçu par email, puis choisissez un nouveau mot de passe sécurisé.
          </p>
        </div>

        <div className="glass-card space-y-4 p-8">
          {authLoading ? (
            <p className="text-sm text-muted-foreground">Vérification du lien en cours...</p>
          ) : !session ? (
            <>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
                Le lien de réinitialisation doit être ouvert depuis votre email. Si besoin, renvoyez un nouveau lien
                depuis votre page de connexion.
              </div>
              <Link to={backPath}>
                <Button variant="ghost-glow" className="w-full">
                  Retour à la connexion
                </Button>
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border bg-secondary pl-10"
                  required
                  minLength={6}
                />
              </div>

              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-border bg-secondary pl-10"
                  required
                  minLength={6}
                />
              </div>

              <Button variant="glow" className="w-full" disabled={loading}>
                {loading ? "Mise à jour..." : "Enregistrer mon nouveau mot de passe"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
