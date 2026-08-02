import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isEmailConfirmed } from "@/lib/authSecurity";

type ConfirmedEmailRouteProps = {
  children: ReactNode;
  role: "talent" | "entreprise";
};

const authPathByRole = {
  talent: "/talent",
  entreprise: "/entreprise/connexion",
} as const;

const ConfirmedEmailRoute = ({ children, role }: ConfirmedEmailRouteProps) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const authPath = authPathByRole[role];

    if (!user) {
      navigate(authPath, { replace: true });
      return;
    }

    if (!isEmailConfirmed(user)) {
      sessionStorage.setItem("spottedtalent_account_notice", "email_unconfirmed");
      void signOut().finally(() => {
        navigate(authPath, { replace: true });
      });
    }
  }, [loading, navigate, role, signOut, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card/90 p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="font-semibold">Ouverture de votre espace sécurisé...</p>
          <p className="mt-2 text-sm text-muted-foreground">La connexion est en cours de vérification.</p>
        </div>
      </div>
    );
  }

  if (!user || !isEmailConfirmed(user)) return null;

  return <>{children}</>;
};

export default ConfirmedEmailRoute;
