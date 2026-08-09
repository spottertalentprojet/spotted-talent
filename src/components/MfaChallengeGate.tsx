import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { KeyRound, LockKeyhole, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/authMessages";
import type { SecurityAccountRole } from "@/lib/mfaPolicy";

type TotpFactor = {
  id: string;
  friendly_name?: string | null;
  status?: string;
};

type EnrollmentState = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type EnrollmentPayload = {
  id: string;
  totp?: {
    qr_code?: string;
    qr?: string;
    secret?: string;
  };
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
  role,
  children,
}: {
  user: User | null;
  loading: boolean;
  role?: SecurityAccountRole;
  children: ReactNode;
}) => {
  const [checking, setChecking] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [enrollmentRequired, setEnrollmentRequired] = useState(false);
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [selectedFactorId, setSelectedFactorId] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const mandatoryForEntreprise = role === "entreprise";

  useEffect(() => {
    let isMounted = true;

    const resetGate = () => {
      setMfaRequired(false);
      setEnrollmentRequired(false);
      setFactors([]);
      setSelectedFactorId("");
      setEnrollment(null);
    };

    const checkMfaRequirement = async () => {
      if (!user) {
        resetGate();
        return;
      }

      setChecking(true);
      try {
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) throw aalError;

        const shouldListFactors = mandatoryForEntreprise || (
          aalData?.nextLevel === "aal2" && aalData.currentLevel !== "aal2"
        );
        let verifiedFactors: TotpFactor[] = [];

        if (shouldListFactors) {
          const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
          if (factorsError) throw factorsError;
          verifiedFactors = getVerifiedTotpFactors(factorsData);
        }

        if (!isMounted) return;

        setFactors(verifiedFactors);
        setSelectedFactorId(verifiedFactors[0]?.id || "");

        if (mandatoryForEntreprise && verifiedFactors.length === 0) {
          setEnrollmentRequired(true);
          setMfaRequired(true);
          return;
        }

        const requiresChallenge = aalData?.nextLevel === "aal2" && aalData.currentLevel !== "aal2";
        setEnrollmentRequired(false);
        setMfaRequired(requiresChallenge && verifiedFactors.length > 0);
      } catch (err: unknown) {
        if (isMounted) {
          toast.error(getErrorMessage(err, "Impossible de vérifier la double authentification."));
          if (mandatoryForEntreprise) {
            setFactors([]);
            setSelectedFactorId("");
            setEnrollmentRequired(true);
            setMfaRequired(true);
          } else {
            resetGate();
          }
        }
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    if (!loading) void checkMfaRequirement();

    return () => {
      isMounted = false;
    };
  }, [loading, mandatoryForEntreprise, user]);

  const startEnrollment = async () => {
    setEnrolling(true);
    setCode("");
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Spotted Talent Entreprise",
      });
      if (error) throw error;

      const payload = data as EnrollmentPayload;
      const totp = payload.totp || {};
      setEnrollment({
        factorId: payload.id,
        qrCode: totp.qr_code || totp.qr || "",
        secret: totp.secret || "",
      });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Activation MFA impossible. Vérifiez que TOTP est activé dans Supabase."));
    } finally {
      setEnrolling(false);
    }
  };

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

  const verifyEnrollment = async () => {
    if (!enrollment) return;
    if (code.trim().length < 6) {
      toast.error("Entrez le code à 6 chiffres de votre application.");
      return;
    }

    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollment.factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      toast.success("Protection du compte entreprise activée.");
      setCode("");
      setEnrollment(null);
      setEnrollmentRequired(false);
      setMfaRequired(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Code incorrect. Réessayez avec un nouveau code."));
    } finally {
      setVerifying(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/entreprise/connexion");
  };

  if (!mfaRequired && !checking) return <>{children}</>;

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

  if (enrollmentRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <div className="dashboard-panel w-full max-w-2xl p-6 sm:p-8">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Sécurité entreprise</p>
              <h1 className="mt-1 text-xl font-bold">Protégez l'accès à votre espace</h1>
            </div>
          </div>

          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Avant d'accéder aux recrutements et aux documents candidats, activez la double authentification.
            Elle ajoute un code temporaire à chaque nouvelle connexion.
          </p>

          {!enrollment ? (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.05] p-5">
              <p className="font-semibold text-foreground">Une application d'authentification suffit</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Utilisez Google Authenticator, Microsoft Authenticator ou Authy. Cette étape ne se fait qu'une fois.
              </p>
              <Button className="mt-4" variant="glow" onClick={startEnrollment} disabled={enrolling}>
                <Smartphone className="mr-2 h-4 w-4" />
                {enrolling ? "Préparation..." : "Configurer la protection"}
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 rounded-2xl border border-primary/20 bg-primary/[0.05] p-5 sm:grid-cols-[210px_1fr] sm:items-center">
              <div className="flex justify-center rounded-xl border border-border bg-white p-3">
                {enrollment.qrCode ? (
                  <img src={enrollment.qrCode} alt="QR code de double authentification" className="h-44 w-44" />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center text-center text-xs text-muted-foreground">QR code indisponible</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">1. Scannez le QR code</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Ouvrez votre application, ajoutez un compte puis scannez ce QR code.
                </p>
                {enrollment.secret && (
                  <p className="mt-3 break-all rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                    Code manuel : <span className="font-semibold text-foreground">{enrollment.secret}</span>
                  </p>
                )}
                <p className="mt-4 font-semibold text-foreground">2. Saisissez le code affiché</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="Code à 6 chiffres"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void verifyEnrollment();
                    }}
                  />
                  <Button variant="glow" onClick={verifyEnrollment} disabled={verifying}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {verifying ? "Vérification..." : "Activer"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button className="mt-5" variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
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
          Ouvrez votre application d'authentification, puis saisissez le code à 6 chiffres pour entrer dans votre espace.
        </p>

        {factors.length > 1 && (
          <select
            value={selectedFactorId}
            onChange={(event) => setSelectedFactorId(event.target.value)}
            className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {factors.map((factor) => (
              <option key={factor.id} value={factor.id}>{factor.friendly_name || "Application d'authentification"}</option>
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
