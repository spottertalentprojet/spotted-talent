import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AlertTriangle, CheckCircle, KeyRound, MailCheck, RefreshCw, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  ACCOUNT_DELETION_FEEDBACK_MAX_LENGTH,
  ACCOUNT_DELETION_REASON_OPTIONS,
  clearAccountLocalState,
  isAccountDeletionConfirmed,
  normalizeAccountDeletionFeedback,
} from "@/lib/accountDeletion";
import { reportClientError } from "@/lib/errorMonitoring";
import { translateAuthError } from "@/lib/authMessages";
import { canEnrollMfaForRole, isMfaMandatoryForRole, type SecurityAccountRole } from "@/lib/mfaPolicy";

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

const readFunctionErrorMessage = async (error: unknown, fallback: string) => {
  if (typeof error === "object" && error && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const payload = await context.clone().json() as { message?: unknown };
        if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
      } catch {
        // Le message générique ci-dessous reste volontairement sans détail technique.
      }
    }
  }

  return getErrorMessage(error, fallback);
};

const AccountSecurityPanel = ({
  user,
  role,
}: {
  user: User;
  role?: SecurityAccountRole;
}) => {
  const [loadingFactors, setLoadingFactors] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedFactors, setVerifiedFactors] = useState<TotpFactor[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [code, setCode] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteFeedback, setDeleteFeedback] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const confirmedEmail = useMemo(() => emailIsConfirmed(user), [user]);
  const hasMfa = verifiedFactors.length > 0;
  const canEnrollMfa = canEnrollMfaForRole(role);
  const mfaMandatory = isMfaMandatoryForRole(role);
  const showMfaManagement = canEnrollMfa || hasMfa;

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

  const deleteAccount = async () => {
    if (!isAccountDeletionConfirmed(deleteConfirmation)) {
      toast.error(`Saisissez exactement « ${ACCOUNT_DELETION_CONFIRMATION} ».`);
      return;
    }

    setDeletingAccount(true);
    try {
      const departureFeedback = normalizeAccountDeletionFeedback(deleteReason, deleteFeedback);
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: {
          confirmation: ACCOUNT_DELETION_CONFIRMATION,
          departureReason: role === "talent" ? departureFeedback.reason : undefined,
          departureFeedback: role === "talent" ? departureFeedback.feedback : undefined,
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error("account_deletion_failed");

      toast.success("Votre compte et vos données ont été supprimés.");
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Le compte n'existe déjà plus côté serveur ; seul le nettoyage local compte ici.
      }
      clearAccountLocalState();
      window.location.replace(role === "entreprise" ? "/entreprise" : "/");
    } catch (error) {
      void reportClientError("account_deletion", error);
      toast.error(await readFunctionErrorMessage(
        error,
        "La suppression n'a pas abouti. Votre compte reste accessible ; réessayez ou contactez le support.",
      ));
      setDeletingAccount(false);
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
            {canEnrollMfa
              ? "Vérification e-mail, double authentification et contrôle de session pour protéger les données sensibles."
              : "Vérification e-mail et contrôle de session pour protéger votre compte sans compliquer vos connexions."}
          </p>
        </div>
        {showMfaManagement && (
          <Button variant="outline" size="sm" onClick={refreshFactors} disabled={loadingFactors}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingFactors ? "animate-spin" : ""}`} />
            Vérifier
          </Button>
        )}
      </div>

      <div className={`mt-5 grid gap-4 ${showMfaManagement ? "lg:grid-cols-2" : ""}`}>
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

        {showMfaManagement && <div className="dashboard-subcard p-4">
          <div className="flex items-start gap-3">
            <KeyRound className={hasMfa ? "mt-1 h-5 w-5 text-emerald-600" : "mt-1 h-5 w-5 text-primary"} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Double authentification</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {hasMfa
                  ? "Un code d'application est demandé après connexion."
                  : "Activez Google Authenticator, Microsoft Authenticator ou Authy pour demander un code à chaque connexion."}
              </p>

              {mfaMandatory && (
                <p className="mt-2 text-xs font-medium leading-5 text-primary">
                  Obligatoire pour les comptes entreprise avant l'accès aux outils de recrutement et aux documents candidats.
                </p>
              )}

              {hasMfa ? (
                <div className="mt-4 space-y-2">
                  {verifiedFactors.map((factor) => (
                    <div key={factor.id} className="flex flex-col gap-2 rounded-lg border border-border bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="inline-flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        {factor.friendly_name || "Application d'authentification"}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => removeFactor(factor.id)} disabled={loadingFactors || mfaMandatory} title={mfaMandatory ? "Cette protection est obligatoire pour les comptes entreprise." : undefined}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Désactiver
                      </Button>
                    </div>
                  ))}
                </div>
              ) : canEnrollMfa ? (
                <Button className="mt-4" variant="glow" onClick={startEnrollment} disabled={enrolling}>
                  <Smartphone className="mr-2 h-4 w-4" />
                  {enrolling ? "Préparation..." : "Activer la double authentification"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>}
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

      {role !== "admin" && <div className="mt-5 rounded-xl border border-destructive/25 bg-destructive/5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-foreground">Supprimer définitivement mon compte</p>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Le profil, les candidatures, les échanges et les documents seront supprimés. Pour une entreprise,
                l’abonnement actif est annulé. Les seules données de facture exigées par la loi restent isolées et
                inaccessibles depuis le site pendant leur durée légale de conservation.
              </p>
            </div>
          </div>

          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              if (deletingAccount) return;
              setDeleteDialogOpen(open);
              if (!open) {
                setDeleteConfirmation("");
                setDeleteReason("");
                setDeleteFeedback("");
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="shrink-0">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cette suppression est irréversible</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">
                    Vous perdrez immédiatement l’accès à votre espace et aux documents associés.
                  </span>
                  <span className="block font-medium text-foreground">
                    Pour confirmer, saisissez exactement : {ACCOUNT_DELETION_CONFIRMATION}
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              {role === "talent" && (
                <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                  <div>
                    <label htmlFor="account-deletion-reason" className="text-sm font-semibold text-foreground">
                      Pourquoi quittez-vous Spotted Talent ? <span className="font-normal text-muted-foreground">(facultatif)</span>
                    </label>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Votre réponse nous aide à améliorer la plateforme. Elle n'est associée ni à votre nom ni à votre e-mail.
                    </p>
                  </div>
                  <select
                    id="account-deletion-reason"
                    value={deleteReason}
                    onChange={(event) => setDeleteReason(event.target.value)}
                    disabled={deletingAccount}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Sélectionner un motif (facultatif)</option>
                    {ACCOUNT_DELETION_REASON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div>
                    <Textarea
                      value={deleteFeedback}
                      onChange={(event) => setDeleteFeedback(event.target.value.slice(0, ACCOUNT_DELETION_FEEDBACK_MAX_LENGTH))}
                      maxLength={ACCOUNT_DELETION_FEEDBACK_MAX_LENGTH}
                      rows={3}
                      placeholder="Une précision pour nous aider à progresser (facultatif)"
                      aria-label="Précision facultative sur la suppression du compte"
                      disabled={deletingAccount}
                      className="resize-none"
                    />
                    <div className="mt-1 flex items-start justify-between gap-3 text-[11px] leading-4 text-muted-foreground">
                      <span>N'indiquez ni nom, e-mail, téléphone ni information sensible.</span>
                      <span className="shrink-0">{deleteFeedback.length}/{ACCOUNT_DELETION_FEEDBACK_MAX_LENGTH}</span>
                    </div>
                  </div>
                </div>
              )}
              <Input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder={ACCOUNT_DELETION_CONFIRMATION}
                autoComplete="off"
                aria-label="Confirmation de suppression du compte"
                disabled={deletingAccount}
              />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deletingAccount}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    void deleteAccount();
                  }}
                  disabled={!isAccountDeletionConfirmed(deleteConfirmation) || deletingAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deletingAccount ? "Suppression en cours..." : "Supprimer définitivement"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>}
    </section>
  );
};

export default AccountSecurityPanel;
