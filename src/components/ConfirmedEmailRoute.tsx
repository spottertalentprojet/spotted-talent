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

  if (loading || !user || !isEmailConfirmed(user)) return null;

  return <>{children}</>;
};

export default ConfirmedEmailRoute;
