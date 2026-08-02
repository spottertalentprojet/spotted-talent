import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/authMessages";

type TotpFactor = {
  id: string;
  friendly_name?: string | null;
  status?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return translateAuthError(error.message, fallback);
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return translateAuthError(message, fallback);
  }
  return fallback;
};

const getVerifiedTotpFactors = (data: unknown): TotpFactor[] => {
  const factors = typeof data === "object" && data && "totp" in data ? (data as { totp?: unknown }).totp : [];
  if (!Array.isArray(factors)) return [];

  return factors.filter((factor): factor is TotpFactor => {
    if (typeof factor !== "object" || !factor || !("id" in factor)) return false;
    const candidate = factor as { id?: unknown; status?: unknown };
    return typeof candidate.id === "string" && candidate.status === "verified";
  });
};

const MfaChallengeGate = ({
  user,
  loading,
  children,
}: {
  user: User | null;
  loading: boolean;
  children: ReactNode;
}) => {
  const [checking, setChecking] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [selectedFactorId, setSelectedFactorId] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkMfaRequirement = async () => {
      if (!user) {
        setMfaRequired(false);
        setFactors([]);
        setSelectedFactorId("");
        return;
      }

      setChecking(true);
      try {
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) throw aalError;

        if (aalData?.nextLevel === "aal2" && aalData.currentLevel !== "aal2") {
          const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
          if (factorsError) throw factorsError;

          const verifiedFactors = getVerifiedTotpFactors(factorsData);
          if (!isMounted) return;

          setFactors(verifiedFactors);
          setSelectedFactorId(verifiedFactors[0]?.id || "");
          setMfaRequired(verifiedFactors.length > 0);
        } else if (isMounted) {
          setMfaRequired(false);
          setFactors([]);
          setSelectedFactorId("");
        }
      } catch (err: unknown) {
        if (isMounted) {
          toast.error(getErrorMessage(err, "Impossible de vérifier la double authentification."));
          setMfaRequired(false);
        }
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    if (!loading) {
      void checkMfaRequirement();
    }

    return () => {
      isMounted = false;
    };
  }, [loading, user]);

  const verifyCode = async () => {
    const factorId = selectedFactorId || factors[0]?.id;
    if (!factorId) {
      toast.error("Aucune application d'authentification n'est liée à ce compte.");
      return;
    }
    if (code.trim().length < 6) {
      toast.error("Entrez le code à 6 chiffres de votre application.");
      return;
    }

    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      toast.success("Connexion sécurisée validée.");
      setCode("");
      setMfaRequired(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Code incorrect. Réessayez avec un nouveau code."));
    } finally {
      setVerifying(false);
    }
  };

  if (!mfaRequired && !checking) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="dashboard-panel max-w-md p-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-4 font-semibold">Vérification de la sécurité...</p>
          <p className="mt-2 text-sm text-muted-foreground">Nous contrôlons le niveau de protection du compte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="dashboard-panel w-full max-w-md p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Double authentification</p>
            <h1 className="text-xl font-bold">Code de sécurité requis</h1>
          </div>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          Ouvrez Google Authenticator, Microsoft Authenticator ou Authy, puis saisissez le code à 6 chiffres pour entrer dans votre espace.
        </p>

        {factors.length > 1 && (
          <select
            value={selectedFactorId}
            onChange={(event) => setSelectedFactorId(event.target.value)}
            className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {factors.map((factor) => (
              <option key={factor.id} value={factor.id}>
                {factor.friendly_name || "Application d'authentification"}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 flex gap-3">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="Code à 6 chiffres"
            onKeyDown={(event) => {
              if (event.key === "Enter") void verifyCode();
            }}
          />
          <Button variant="glow" onClick={verifyCode} disabled={verifying}>
            <KeyRound className="mr-2 h-4 w-4" />
            {verifying ? "..." : "Valider"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MfaChallengeGate;
