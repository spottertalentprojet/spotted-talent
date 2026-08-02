import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import MfaChallengeGate from "@/components/MfaChallengeGate";
import { isEmailConfirmed } from "@/lib/authSecurity";
import { reportClientError } from "@/lib/errorMonitoring";

type Profile = Tables<"profiles">;

type AccountActivityResult = {
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  reactivated: boolean;
  last_seen_at: string;
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, loading: true, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const privateRoutePrefixes = [
  "/talent/dashboard",
  "/entreprise/dashboard",
  "/talent/profil",
  "/admin",
];

const shouldRequireMfaForPath = (pathname: string) =>
  privateRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erreur chargement profil:", error);
      setProfile(null);
      return;
    }

    setProfile(data);
  };

  const syncAccountActivity = async (reactivate: boolean) => {
    const pendingLoginReactivation = sessionStorage.getItem("spottedtalent_reactivate_login") === "1";
    const shouldReactivate = reactivate || pendingLoginReactivation;

    const { data, error } = await supabase.rpc("touch_account_activity", {
      p_reactivate: shouldReactivate,
    });

    if (error) {
      console.error("Erreur suivi activite compte:", error);
      return true;
    }

    const status = (Array.isArray(data) ? data[0] : data) as AccountActivityResult | null;

    if (status?.is_suspended && !shouldReactivate) {
      sessionStorage.setItem("spottedtalent_account_notice", "suspended");
      sessionStorage.removeItem("spottedtalent_reactivate_login");
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      return false;
    }

    if (shouldReactivate) {
      sessionStorage.removeItem("spottedtalent_reactivate_login");
    }

    if (status?.reactivated) {
      sessionStorage.setItem("spottedtalent_account_notice", "reactivated");
    }

    return true;
  };

  const loadSession = async (nextSession: Session | null, reactivate: boolean) => {
    if (nextSession?.user) {
      if (!isEmailConfirmed(nextSession.user)) {
        sessionStorage.setItem("spottedtalent_account_notice", "email_unconfirmed");
        sessionStorage.removeItem("spottedtalent_reactivate_login");
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(nextSession);
      const canContinue = await syncAccountActivity(reactivate);
      if (canContinue) {
        await fetchProfile(nextSession.user.id);
      }
    } else {
      setSession(null);
      setProfile(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    const loadingSafetyTimeout = window.setTimeout(() => {
      if (active) setLoading(false);
    }, 10_000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(() => {
          if (active) void loadSession(session, _event === "SIGNED_IN");
        }, 0);
      }
    );

    void supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) throw error;
        if (active) void loadSession(session, false);
      })
      .catch((error: unknown) => {
        console.error("Erreur initialisation session:", error);
        void reportClientError("auth_initialization", error);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(loadingSafetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut }}>
      {shouldRequireMfaForPath(location.pathname) ? (
        <MfaChallengeGate user={session?.user ?? null} loading={loading}>
          {children}
        </MfaChallengeGate>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
