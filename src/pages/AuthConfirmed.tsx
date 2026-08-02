import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, MailCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/authMessages";

const getRoleDashboard = (role: string | null) =>
  role === "entreprise" ? "/entreprise/dashboard" : "/talent/dashboard";

const getRoleLogin = (role: string | null) =>
  role === "entreprise" ? "/entreprise/connexion" : "/talent";

const readAuthParams = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return {
    code: queryParams.get("code") || hashParams.get("code"),
    accessToken: queryParams.get("access_token") || hashParams.get("access_token"),
    refreshToken: queryParams.get("refresh_token") || hashParams.get("refresh_token"),
    tokenHash: queryParams.get("token_hash") || hashParams.get("token_hash"),
    type: queryParams.get("type") || hashParams.get("type"),
  };
};

const AuthConfirmed = () => {
  const [params] = useSearchParams();
  const { roleParam } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [checkingLink, setCheckingLink] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);

  const requestedRole =
    roleParam === "entreprise" || params.get("role") === "entreprise" ? "entreprise" : "talent";

  const resolvedRole = useMemo(() => {
    const metadataRole = user?.user_metadata?.role;
    return profile?.role || (metadataRole === "entreprise" ? "entreprise" : metadataRole === "talent" ? "talent" : requestedRole);
  }, [profile?.role, requestedRole, user?.user_metadata?.role]);

  useEffect(() => {
    const completeAuthLink = async () => {
      const authParams = readAuthParams();
      sessionStorage.removeItem("spottedtalent_waiting_email_confirmation");

      try {
        if (authParams.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(authParams.code);
          if (error) throw error;
        } else if (authParams.accessToken && authParams.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: authParams.accessToken,
            refresh_token: authParams.refreshToken,
          });
          if (error) throw error;
        } else if (authParams.tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: authParams.tokenHash,
            type: authParams.type === "email" ? "email" : "signup",
          });
          if (error) throw error;
        }

        await supabase.auth.getSession();
      } catch (error: unknown) {
        const message = error instanceof Error
          ? translateAuthError(error.message, "Lien de confirmation invalide ou expiré.")
          : "Lien de confirmation invalide ou expiré.";
        setLinkError(message);
      } finally {
        setCheckingLink(false);
      }
    };

    void completeAuthLink();
  }, [params]);

  useEffect(() => {
    if (checkingLink || authLoading || linkError || !user) return;

    toast.success("Adresse e-mail confirmee. Bienvenue sur Spotted Talent.");
    const timer = window.setTimeout(() => {
      navigate(getRoleDashboard(resolvedRole), { replace: true });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [authLoading, checkingLink, linkError, navigate, resolvedRole, user]);

  const loginPath = getRoleLogin(requestedRole);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="absolute left-1/3 top-1/3 h-80 w-80 rounded-full bg-primary/15 blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/3 right-1/3 h-60 w-60 rounded-full bg-accent/10 blur-[100px] animate-glow-pulse" />

      <div className="relative w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 text-center shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        <a href="/" className="mb-6 inline-flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="gradient-text">Spotted Talent</span>
        </a>

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          {linkError ? (
            <MailCheck className="h-8 w-8 text-amber-600" />
          ) : checkingLink || authLoading || !user ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          )}
        </div>

        <h1 className="text-2xl font-bold">
          {linkError ? "Confirmation a verifier" : checkingLink || authLoading || !user ? "Confirmation en cours" : "Compte confirme"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {linkError
            ? "Le lien ne peut pas ouvrir automatiquement votre session. Vous pouvez revenir a la connexion et utiliser votre e-mail et mot de passe."
            : checkingLink || authLoading || !user
              ? "Nous securisons votre session et ouvrons votre espace."
              : "Votre adresse e-mail est validee. Redirection automatique vers votre tableau de bord."}
        </p>

        {(linkError || (!checkingLink && !authLoading && !user)) && (
          <Button className="mt-6 w-full" variant="glow" onClick={() => navigate(loginPath, { replace: true })}>
            Retour a la connexion
          </Button>
        )}
      </div>
    </div>
  );
};

export default AuthConfirmed;
