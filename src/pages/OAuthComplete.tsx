import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { ArrowLeft, Building2, Hash, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/authMessages";
import LegalAcknowledgementFields from "@/components/LegalAcknowledgementFields";
import {
  clearPendingLegalAcknowledgement,
  hasPendingCurrentLegalAcknowledgement,
  PRIVACY_NOTICE_VERSION,
  TERMS_VERSION,
} from "@/lib/legal";

const OAuthComplete = () => {
  const [params] = useSearchParams();
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncingProfile, setSyncingProfile] = useState(false);
  const [legalStatus, setLegalStatus] = useState<"checking" | "required" | "recorded">("checking");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const role = params.get("role") === "entreprise" ? "entreprise" : "talent";

  const suggestedName = useMemo(() => {
    if (!user) return "";

    return user.user_metadata?.company_name || user.user_metadata?.full_name || user.user_metadata?.name || "";
  }, [user]);

  useEffect(() => {
    if (!companyName && suggestedName) {
      setCompanyName(suggestedName);
    }
  }, [companyName, suggestedName]);

  const saveProfile = async (values: TablesInsert<"profiles">) => {
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", values.user_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingProfile) {
      const updates: TablesUpdate<"profiles"> = {
        role: values.role,
        full_name: values.full_name,
        company_name: values.company_name ?? null,
        email: values.email ?? null,
      };

      const { error: updateError } = await supabase.from("profiles").update(updates).eq("user_id", values.user_id);
      if (updateError) throw updateError;
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert(values);
    if (insertError) throw insertError;
  };

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    const checkLegalAcknowledgement = async () => {
      setLegalStatus("checking");

      const { data, error } = await supabase
        .from("legal_acknowledgements")
        .select("id")
        .eq("user_id", user.id)
        .eq("terms_version", TERMS_VERSION)
        .eq("privacy_notice_version", PRIVACY_NOTICE_VERSION)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("legal_acknowledgement_check_error", error);
        setLegalStatus("required");
        return;
      }

      if (data) {
        clearPendingLegalAcknowledgement();
        setLegalStatus("recorded");
        return;
      }

      if (hasPendingCurrentLegalAcknowledgement()) {
        const { error: recordError } = await supabase.rpc("record_current_legal_acknowledgement", {
          p_terms_version: TERMS_VERSION,
          p_privacy_notice_version: PRIVACY_NOTICE_VERSION,
          p_source: "oauth_completion",
        });

        if (cancelled) return;
        if (!recordError) {
          clearPendingLegalAcknowledgement();
          setLegalStatus("recorded");
          return;
        }

        console.error("legal_acknowledgement_record_error", recordError);
      }

      setLegalStatus("required");
    };

    void checkLegalAcknowledgement();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    const ensureTalentProfile = async () => {
      if (authLoading || !user || role !== "talent" || syncingProfile || legalStatus !== "recorded") return;

      if (profile?.role === "talent") {
        navigate("/talent/dashboard", { replace: true });
        return;
      }

      setSyncingProfile(true);

      try {
        const talentName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "";

        await saveProfile({
          user_id: user.id,
          role: "talent",
          full_name: talentName,
          email: user.email ?? null,
        });

        const { error: userError } = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            role: "talent",
            full_name: talentName,
          },
        });

        if (userError) throw userError;

        navigate("/talent/dashboard", { replace: true });
      } catch (err: any) {
        toast.error(translateAuthError(err?.message));
      } finally {
        setSyncingProfile(false);
      }
    };

    void ensureTalentProfile();
  }, [authLoading, legalStatus, navigate, profile?.role, role, syncingProfile, user]);

  useEffect(() => {
    if (authLoading || !user || role !== "entreprise" || legalStatus !== "recorded") return;

    if (profile?.role === "entreprise") {
      navigate("/entreprise/dashboard", { replace: true });
    }
  }, [authLoading, legalStatus, navigate, profile?.role, role, user]);

  const handleLegalAcknowledgement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !termsAccepted || !privacyAcknowledged) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("record_current_legal_acknowledgement", {
        p_terms_version: TERMS_VERSION,
        p_privacy_notice_version: PRIVACY_NOTICE_VERSION,
        p_source: "oauth_completion",
      });
      if (error) throw error;

      clearPendingLegalAcknowledgement();
      setLegalStatus("recorded");
      toast.success("Vos choix juridiques ont été enregistrés.");
    } catch (err: any) {
      toast.error(translateAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEntrepriseCompletion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Connexion introuvable. Recommencez avec Google.");
      return;
    }

    if (!companyName.trim()) {
      toast.error("Renseignez le nom de l'entreprise.");
      return;
    }

    if (siret.length !== 14) {
      toast.error("Le SIRET doit contenir 14 chiffres.");
      return;
    }

    setLoading(true);

    try {
      const cleanName = companyName.trim();

      await saveProfile({
        user_id: user.id,
        role: "entreprise",
        full_name: cleanName,
        company_name: cleanName,
        email: user.email ?? null,
      });

      const { error: userError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          role: "entreprise",
          full_name: cleanName,
          company_name: cleanName,
          siret,
        },
      });

      if (userError) throw userError;

      toast.success("Profil entreprise finalisé.");
      navigate("/entreprise/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(translateAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const backPath = role === "entreprise" ? "/entreprise/connexion" : "/talent";

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
          <h1 className="mt-4 text-2xl font-bold">
            {role === "entreprise" ? "Finaliser l'accès entreprise" : "Connexion Google en cours"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {role === "entreprise"
              ? "Encore une étape pour sécuriser votre accès entreprise avec Google."
              : "Nous finalisons votre connexion Google."}
          </p>
        </div>

        <div className="glass-card space-y-4 p-8">
          {authLoading || syncingProfile || legalStatus === "checking" ? (
            <p className="text-sm text-muted-foreground">Vérification de la connexion en cours...</p>
          ) : !user ? (
            <>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
                La connexion Google n'a pas encore été détectée. Réessayez depuis votre page de connexion.
              </div>
              <Button variant="ghost-glow" className="w-full" onClick={() => navigate(backPath)}>
                Retour à la connexion
              </Button>
            </>
          ) : legalStatus === "required" ? (
            <form onSubmit={handleLegalAcknowledgement} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Une dernière confirmation</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Avant de créer l’espace lié à votre compte Google, consultez les textes applicables.
                </p>
              </div>
              <LegalAcknowledgementFields
                termsAccepted={termsAccepted}
                privacyAcknowledged={privacyAcknowledged}
                onTermsAcceptedChange={setTermsAccepted}
                onPrivacyAcknowledgedChange={setPrivacyAcknowledged}
                disabled={loading}
              />
              <Button
                variant="glow"
                className="w-full"
                disabled={loading || !termsAccepted || !privacyAcknowledged}
              >
                {loading ? "Enregistrement..." : "Accepter et continuer"}
              </Button>
            </form>
          ) : role === "entreprise" && profile?.role !== "entreprise" ? (
            <form onSubmit={handleEntrepriseCompletion} className="space-y-4">
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Nom de l'entreprise"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="border-border bg-secondary pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Numéro SIRET (14 chiffres)"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value.replace(/\D/g, "").slice(0, 14))}
                  className="border-border bg-secondary pl-10"
                  required
                  maxLength={14}
                />
              </div>

              <Button variant="glow" className="w-full" disabled={loading}>
                {loading ? "Validation..." : "Finaliser mon espace entreprise"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Redirection en cours...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthComplete;
