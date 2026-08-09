import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileLock2,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  DISTINCT_DOCUMENT_THRESHOLD,
  DOCUMENT_ACCESS_EVENT_THRESHOLD,
  SECURITY_MONITOR_WINDOW_MINUTES,
  getPlatformSecurityErrorMessage,
  getPlatformSecurityStatus,
  getRecentSecurityIncidents,
  setPlatformIncidentMode,
  type PlatformSecurityStatus,
  type SecurityIncident,
} from "@/lib/platformSecurity";

const statusLabel: Record<SecurityIncident["status"], string> = {
  open: "À analyser",
  contained: "Contenu",
  resolved: "Résolu",
};

const PlatformSecurityAdminPanel = () => {
  const [status, setStatus] = useState<PlatformSecurityStatus | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStatus, nextIncidents] = await Promise.all([
        getPlatformSecurityStatus(),
        getRecentSecurityIncidents(),
      ]);
      setStatus(nextStatus);
      setIncidents(nextIncidents);
    } catch (error) {
      toast.error(getPlatformSecurityErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const verifyAdminMfa = async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    if (data.currentLevel !== "aal2") throw new Error("admin_mfa_required");
  };

  const applyMode = async (mode: "documents" | "critical" | "normal") => {
    const normalizedReason = reason.trim();
    if (mode !== "normal" && normalizedReason.length < 10) {
      toast.error("Indiquez une raison d’au moins 10 caractères.");
      return;
    }

    setUpdating(true);
    try {
      await verifyAdminMfa();
      const nextStatus = await setPlatformIncidentMode({
        incidentMode: mode !== "normal",
        documentsLocked: mode !== "normal",
        sensitiveWritesLocked: mode === "critical",
        reason:
          normalizedReason ||
          "Incident contrôlé et accès rétablis après vérification administrateur.",
      });
      setStatus(nextStatus);
      setReason("");
      await refresh();
      toast.success(
        mode === "normal"
          ? "Mode incident désactivé après vérification."
          : mode === "critical"
            ? "Mode sécurité critique activé."
            : "Coffre documentaire verrouillé.",
      );
    } catch (error) {
      toast.error(getPlatformSecurityErrorMessage(error));
    } finally {
      setUpdating(false);
    }
  };

  const incidentActive = Boolean(status?.incident_mode);

  return (
    <section className="mb-8 space-y-5 rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              incidentActive
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            }`}
          >
            {incidentActive ? <ShieldAlert className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Protection de la plateforme
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {incidentActive ? "Mode incident actif" : "Surveillance active"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {status?.public_message ||
                "Le coffre documentaire est surveillé chaque minute. Une activité anormale déclenche son verrouillage automatique."}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading || updating}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
          <p className="text-xs text-muted-foreground">Documents</p>
          <p className="mt-1 font-semibold">{status?.documents_locked ? "Verrouillés" : "Accessibles"}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
          <p className="text-xs text-muted-foreground">Écritures sensibles</p>
          <p className="mt-1 font-semibold">{status?.sensitive_writes_locked ? "Suspendues" : "Autorisées"}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
          <p className="text-xs text-muted-foreground">Déclenchement</p>
          <p className="mt-1 font-semibold">{status?.auto_triggered ? "Automatique" : incidentActive ? "Administrateur" : "En veille"}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm leading-6 text-muted-foreground">
        <p className="font-semibold text-foreground">Règle automatique prudente</p>
        <p>
          Le coffre est verrouillé lorsqu’un même compte effectue au moins {DOCUMENT_ACCESS_EVENT_THRESHOLD} accès
          ou consulte {DISTINCT_DOCUMENT_THRESHOLD} documents distincts en {SECURITY_MONITOR_WINDOW_MINUTES} minutes.
          Le reste du site demeure disponible afin d’éviter une coupure générale sur une fausse alerte.
        </p>
      </div>

      <div className="space-y-3">
        <label htmlFor="incident-reason" className="text-sm font-semibold">
          Motif de l’action de sécurité
        </label>
        <Textarea
          id="incident-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          placeholder="Ex. : volume inhabituel de téléchargements en cours d’analyse."
          className="min-h-20"
        />
        <p className="text-xs text-muted-foreground">
          Le motif est conservé dans le journal de sécurité. Une validation MFA administrateur est obligatoire.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {!incidentActive ? (
          <>
            <ConfirmActionDialog
              title="Verrouiller les documents ?"
              description="Les téléchargements, dépôts et partages seront suspendus. Les autres rubriques resteront accessibles."
              onConfirm={() => applyMode("documents")}
            >
              <Button variant="outline" disabled={updating}>
                <FileLock2 className="mr-2 h-4 w-4" /> Verrouiller les documents
              </Button>
            </ConfirmActionDialog>
            <ConfirmActionDialog
              title="Activer le mode critique ?"
              description="Les documents et les écritures sensibles des espaces privés seront suspendus jusqu’à votre déblocage MFA."
              onConfirm={() => applyMode("critical")}
            >
              <Button variant="destructive" disabled={updating}>
                <LockKeyhole className="mr-2 h-4 w-4" /> Bloquer les espaces privés
              </Button>
            </ConfirmActionDialog>
          </>
        ) : (
          <ConfirmActionDialog
            title="Rétablir les accès ?"
            description="Ne déverrouillez la plateforme qu’après avoir contrôlé les journaux, les comptes et les clés concernées."
            onConfirm={() => applyMode("normal")}
          >
            <Button disabled={updating}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Clôturer et rétablir les accès
            </Button>
          </ConfirmActionDialog>
        )}
      </div>

      <div className="border-t border-border/70 pt-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold">Derniers incidents</h3>
        </div>
        {incidents.length === 0 ? (
          <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Aucun incident enregistré.
          </p>
        ) : (
          <div className="space-y-2">
            {incidents.map((incident) => (
              <article key={incident.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        incident.severity === "critical"
                          ? "bg-red-500/10 text-red-600 dark:text-red-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {incident.severity === "critical" ? "Critique" : "Élevé"}
                    </span>
                    <span className="text-xs text-muted-foreground">{statusLabel[incident.status]}</span>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(incident.detected_at).toLocaleString("fr-FR")}
                  </time>
                </div>
                <p className="mt-2 text-sm font-medium">{incident.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Source : {incident.source === "automatic_document_monitor" ? "surveillance automatique" : "console administrateur"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PlatformSecurityAdminPanel;
