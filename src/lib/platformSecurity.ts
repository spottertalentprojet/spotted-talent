import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type PlatformSecuritySeverity = "normal" | "elevated" | "critical";

export type PlatformSecurityStatus = {
  incident_mode: boolean;
  documents_locked: boolean;
  sensitive_writes_locked: boolean;
  severity: PlatformSecuritySeverity;
  public_message: string;
  auto_triggered: boolean;
  activated_at: string | null;
  updated_at: string;
};

export type SecurityIncident = {
  id: string;
  incident_type: string;
  severity: "elevated" | "critical";
  status: "open" | "contained" | "resolved";
  source: string;
  summary: string;
  actor_id: string | null;
  details: Json;
  auto_lock_applied: boolean;
  detected_at: string;
  contained_at: string | null;
  resolved_at: string | null;
};

type PlatformSecurityStatusInput = Omit<Partial<PlatformSecurityStatus>, "severity"> & {
  severity?: string | null;
};

export const DOCUMENT_ACCESS_EVENT_THRESHOLD = 25;
export const DISTINCT_DOCUMENT_THRESHOLD = 12;
export const SECURITY_MONITOR_WINDOW_MINUTES = 2;

const NORMAL_STATUS: PlatformSecurityStatus = {
  incident_mode: false,
  documents_locked: false,
  sensitive_writes_locked: false,
  severity: "normal",
  public_message: "",
  auto_triggered: false,
  activated_at: null,
  updated_at: new Date(0).toISOString(),
};

export function normalizePlatformSecurityStatus(
  value: PlatformSecurityStatusInput | null | undefined,
): PlatformSecurityStatus {
  if (!value) return NORMAL_STATUS;

  return {
    incident_mode: Boolean(value.incident_mode),
    documents_locked: Boolean(value.documents_locked),
    sensitive_writes_locked: Boolean(value.sensitive_writes_locked),
    severity:
      value.severity === "critical" || value.severity === "elevated"
        ? value.severity
        : "normal",
    public_message: value.public_message?.trim() || "",
    auto_triggered: Boolean(value.auto_triggered),
    activated_at: value.activated_at || null,
    updated_at: value.updated_at || new Date(0).toISOString(),
  };
}

export async function getPlatformSecurityStatus(): Promise<PlatformSecurityStatus> {
  const { data, error } = await supabase.rpc("get_platform_security_status");
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return normalizePlatformSecurityStatus(row);
}

export async function assertDocumentsAvailable(): Promise<void> {
  const status = await getPlatformSecurityStatus();
  if (status.documents_locked) {
    throw new Error(
      status.public_message ||
        "L’accès aux documents est temporairement suspendu pour vérification de sécurité.",
    );
  }
}

export async function setPlatformIncidentMode(input: {
  incidentMode: boolean;
  documentsLocked: boolean;
  sensitiveWritesLocked: boolean;
  reason: string;
}): Promise<PlatformSecurityStatus> {
  const { data, error } = await supabase.rpc("set_platform_incident_mode", {
    p_incident_mode: input.incidentMode,
    p_documents_locked: input.documentsLocked,
    p_sensitive_writes_locked: input.sensitiveWritesLocked,
    p_reason: input.reason,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return normalizePlatformSecurityStatus(row);
}

export async function getRecentSecurityIncidents(limit = 10): Promise<SecurityIncident[]> {
  const { data, error } = await supabase
    .from("security_incidents")
    .select(
      "id, incident_type, severity, status, source, summary, actor_id, details, auto_lock_applied, detected_at, contained_at, resolved_at",
    )
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as SecurityIncident[];
}

export function getPlatformSecurityErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");

  if (message.includes("admin_mfa_required")) {
    return "Activez puis validez la double authentification administrateur avant cette action.";
  }
  if (message.includes("admin_required")) {
    return "Cette commande est réservée à l’administrateur.";
  }
  if (message.includes("incident_reason_required")) {
    return "Décrivez brièvement la raison du blocage avant de continuer.";
  }

  return "La commande de sécurité n’a pas pu être appliquée. Réessayez ou consultez les journaux Supabase.";
}
