import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, Mail, Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path d="M21.81 12.23c0-.72-.06-1.25-.19-1.81H12v3.44h5.65c-.11.86-.69 2.15-1.98 3.02l-.02.12 2.8 2.17.19.02c1.74-1.61 2.76-3.98 2.76-6.96Z" fill="#4285F4" />
    <path d="M12 22c2.76 0 5.07-.91 6.76-2.47l-3.22-2.49c-.86.6-2 1.02-3.54 1.02-2.71 0-5-1.79-5.82-4.27l-.11.01-2.91 2.26-.04.1A10.22 10.22 0 0 0 12 22Z" fill="#34A853" />
    <path d="M6.18 13.79A6.15 6.15 0 0 1 5.86 12c0-.62.11-1.22.3-1.79l-.01-.12-2.95-2.3-.1.05A10.02 10.02 0 0 0 2 12c0 1.61.38 3.13 1.1 4.47l3.08-2.68Z" fill="#FBBC05" />
    <path d="M12 5.94c1.93 0 3.22.83 3.96 1.53l2.89-2.82C17.06 2.99 14.76 2 12 2a10.22 10.22 0 0 0-8.9 5.54l3.06 2.37C7 7.72 9.29 5.94 12 5.94Z" fill="#EA4335" />
  </svg>
);

const TalentAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !user) return;

    const role = profile?.role ?? user.user_metadata?.role;

    if (role === "talent") {
      navigate("/talent/dashboard", { replace: true });
      return;
    }

    if (role && role !== "talent") {
      toast.error("Ce compte n'est pas un compte talent.");
      void signOut();
    }
  }, [authLoading, navigate, profile?.role, signOut, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie !");
        navigate("/talent/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: "talent", full_name: fullName },
            emailRedirectTo: `${window.location.origin}/talent`,
          },
        });

        if (error) throw error;

        toast.success("Compte créé ! Vérifiez votre email pour finaliser l'accès.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Renseignez votre email pour recevoir le lien de réinitialisation.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?role=talent`,
      });

      if (error) throw error;

      toast.success("Email de réinitialisation envoyé.");
      setShowForgotPassword(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/oauth-complete?role=talent`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-start justify-center bg-background px-4 py-8 sm:items-center sm:py-0">
      <div className="absolute left-1/3 top-1/3 h-80 w-80 rounded-full bg-primary/15 blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/3 right-1/3 h-60 w-60 rounded-full bg-accent/10 blur-[100px] animate-glow-pulse" />

      <div className="relative w-full max-w-md pt-10 sm:pt-0">
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="mb-6 text-center sm:mb-8">
          <a href="/" className="mb-4 inline-flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="gradient-text">Spotted Talent</span>
          </a>
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
            {showForgotPassword
              ? "Mot de passe oublié"
              : isLogin
                ? "Connexion Talent"
                : "Créer un compte talent"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {showForgotPassword
              ? "Entrez votre email pour recevoir le lien de réinitialisation."
              : isLogin
                ? "Accède à ton espace personnel"
                : "Rejoins la communauté et booste ta carrière"}
          </p>
        </div>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="glass-card space-y-4 p-5 sm:p-8">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border bg-secondary pl-10"
                required
              />
            </div>

            <Button variant="glow" className="w-full" disabled={loading}>
              {loading ? "Envoi..." : "Réinitialiser le mot de passe"}
            </Button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="glass-card space-y-4 p-5 sm:p-8">
              {!isLogin && (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Nom complet"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-border bg-secondary pl-10"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border bg-secondary pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border bg-secondary pl-10"
                  required
                  minLength={6}
                />
              </div>

              {isLogin && (
                <div className="flex items-center justify-end gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              <Button variant="glow" className="w-full" disabled={loading}>
                {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer mon compte"}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/70" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button type="button" variant="ghost-glow" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
                <GoogleLogo />
                Continuer avec Google
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
              <button onClick={() => setIsLogin(!isLogin)} className="ml-1 font-medium text-primary hover:underline">
                {isLogin ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default TalentAuth;
