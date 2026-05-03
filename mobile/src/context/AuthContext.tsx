import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { ProfileRow } from "../types/database";

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "user_id, role, email, full_name, prenom, nom, company_name, poste, localisation, adresse, contrat, secteur, competences, bio, telephone, telephone2, notification_offres_email",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setProfile(null);
      return;
    }

    setProfile(data ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }
    await fetchProfile(session.user.id);
  }, [fetchProfile, session?.user?.id]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!isMounted) return;
        setSession(data.session);
        if (data.session?.user?.id) {
          await fetchProfile(data.session.user.id);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        await fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return error.message;
    }

    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      signIn,
      signOut,
      refreshProfile,
    }),
    [loading, profile, refreshProfile, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider");
  }
  return context;
}
