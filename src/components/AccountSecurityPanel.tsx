import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CheckCircle, KeyRound, MailCheck, RefreshCw, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
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

type EnrollmentState = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

type ConfirmableUser = User & {
  confirmed_at?: string | null;
};

type TotpPayload = {
  qr_code?: string;
  qr?: string;
  secret?: string;
  uri?: string;
};

type EnrollmentPayload = {
  id: string;
  totp?: TotpPayload;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return translateAuthError(error.message, fallback);
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return translateAuthError(message, fallback);
  }
  return fallback;
};

const emailIsConfirmed = (user: User) => {
  const provider = user.app_metadata?.provider;
  const providers = Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : [];
  const confirmableUser = user as ConfirmableUser;

  return Boolean(
    user.email_confirmed_at ||
      confirmableUser.confirmed_at ||
      provider === "google" ||
      providers.includes("google"),
  );
};

const extractTotpFactors = (data: unknown): TotpFactor[] => {
  const factors = typeof data === "object" && data && "totp" in data ? (data as { totp?: unknown }).totp : [];
  if (!Array.isArray(factors)) return [];

  return factors
    .filter((factor): factor is TotpFactor => {
      if (typeof factor !== "object" || !factor || !("id" in factor)) return false;
      const candidate = factor as { id?: unknown; status?: unknown };
      return typeof candidate.id === "string" && candidate.status === "verified";
    });
};

const AccountSecurityPanel = ({ user }: { user: User }) => {
  const [loadingFactors, setLoadingFactors] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedFactors, setVerifiedFactors] = useState<TotpFactor[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [code, setCode] = useState("");

  const confirmedEmail = useMemo(() => emailIsConfirmed(user), [user]);
  const hasMfa = verifiedFactors.length > 0;

  const refreshFactors = async () => {
    setLoadingFactors(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setVerifiedFactors(extractTotpFactors(data));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Impossible de vérifier la double authentification."));
    } finally {
      setLoadingFactors(false);
    }
  };

  useEffect(() => {
    void refreshFactors();
  }, []);

  const startEnrollment = async () => {
    setEnrolling(true);
    setCode("");

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Spotted Talent",
      });

      if (error) throw error;

      const enrollmentData = data as EnrollmentPayload;
      const totp = enrollmentData.totp || {};
      setEnrollment({
        factorId: enrollmentData.id,
        qrCode: totp.qr_code || totp.qr || "",
        secret: totp.secret || "",
        uri: totp.uri || "",
      });
      toast.info("Scannez le QR code avec Google Authenticator, puis saisissez le code à 6 chiffres.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Activation MFA impossible. Vérifiez que TOTP est activé dans Supabase."));
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!enrollment) return;
    if (code.trim().length < 6) {
      toast.error("Entrez le code à 6 chiffres de votre application d'authentification.");
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

      toast.success("Double authentification activée.");
      setEnrollment(null);
      setCode("");
      await refreshFactors();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Code incorrect. Réessayez avec un nouveau code."));
    } finally {
      setVerifying(false);
    }
  };

  const removeFactor = async (factorId: string) => {
    setLoadingFactors(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success("Double authentification désactivée.");
      await refreshFactors();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Impossible de désactiver la double authentification."));
    } finally {
      setLoadingFactors(false);
    }
  };

  return (
    <section className="dashboard-panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sécurité du compte
          </div>
          <h3 className="text-xl font-bold text-foreground">Protection renforcée</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Vérification e-mail, double authentification et contrôle de session pour protéger les données personnelles et les documents sensibles.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshFactors} disabled={loadingFactors}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingFactors ? "animate-spin" : ""}`} />
          Vérifier
        </Button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="dashboard-subcard p-4">
          <div className="flex items-start gap-3">
            <MailCheck className={confirmedEmail ? "mt-1 h-5 w-5 text-emerald-600" : "mt-1 h-5 w-5 text-amber-500"} />
            <div>
              <p className="font-semibold">Confirmation e-mail</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {confirmedEmail
                  ? "Adresse vérifiée. Le compte peut utiliser les espaces sécurisés."
                  : "Adresse non confirmée. L'accès doit rester bloqué jusqu'à validation du lien reçu par e-mail."}
              </p>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${confirmedEmail ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {confirmedEmail ? "Confirmé" : "À confirmer"}
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-subcard p-4">
          <div className="flex items-start gap-3">
            <KeyRound className={hasMfa ? "mt-1 h-5 w-5 text-emerald-600" : "mt-1 h-5 w-5 text-primary"} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Double authentification</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {hasMfa
                  ? "Un code d'application est demandé après connexion."
                  : "Activez Google Authenticator, Microsoft Authenticator ou Authy pour demander un code à chaque connexion."}
              </p>

              {hasMfa ? (
                <div className="mt-4 space-y-2">
                  {verifiedFactors.map((factor) => (
                    <div key={factor.id} className="flex flex-col gap-2 rounded-lg border border-border bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="inline-flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        {factor.friendly_name || "Application d'authentification"}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => removeFactor(factor.id)} disabled={loadingFactors}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Désactiver
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Button className="mt-4" variant="glow" onClick={startEnrollment} disabled={enrolling}>
                  <Smartphone className="mr-2 h-4 w-4" />
                  {enrolling ? "Préparation..." : "Activer la double authentification"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {enrollment && (
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
            <div className="flex justify-center rounded-lg border border-border bg-white p-3">
              {enrollment.qrCode ? (
                <img src={enrollment.qrCode} alt="QR code double authentification" className="h-44 w-44" />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center text-center text-xs text-muted-foreground">
                  QR code indisponible
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">1. Scannez le QR code</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Ouvrez Google Authenticator, Microsoft Authenticator ou Authy, ajoutez un compte, puis scannez ce QR code.
              </p>
              {enrollment.secret && (
                <p className="mt-3 break-all rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                  Code manuel : <span className="font-semibold text-foreground">{enrollment.secret}</span>
                </p>
              )}
              {enrollment.uri && (
                <p className="mt-2 break-all text-xs text-muted-foreground">URI : {enrollment.uri}</p>
              )}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="Code à 6 chiffres"
                  className="sm:max-w-[220px]"
                />
                <Button variant="glow" onClick={verifyEnrollment} disabled={verifying}>
                  {verifying ? "Vérification..." : "Valider la sécurité"}
                </Button>
                <Button variant="outline" onClick={() => setEnrollment(null)} disabled={verifying}>
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountSecurityPanel;
