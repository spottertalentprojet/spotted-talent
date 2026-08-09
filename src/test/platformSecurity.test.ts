import { describe, expect, it } from "vitest";
import {
  DISTINCT_DOCUMENT_THRESHOLD,
  DOCUMENT_ACCESS_EVENT_THRESHOLD,
  SECURITY_MONITOR_WINDOW_MINUTES,
  normalizePlatformSecurityStatus,
} from "@/lib/platformSecurity";

describe("platform incident response", () => {
  it("reste ouvert quand aucun état d’incident n’est disponible", () => {
    expect(normalizePlatformSecurityStatus(null)).toMatchObject({
      incident_mode: false,
      documents_locked: false,
      sensitive_writes_locked: false,
      severity: "normal",
    });
  });

  it("conserve un verrouillage critique renvoyé par Supabase", () => {
    expect(
      normalizePlatformSecurityStatus({
        incident_mode: true,
        documents_locked: true,
        sensitive_writes_locked: true,
        severity: "critical",
        public_message: " Vérification de sécurité en cours. ",
        auto_triggered: true,
        activated_at: "2026-08-03T10:00:00.000Z",
        updated_at: "2026-08-03T10:00:00.000Z",
      }),
    ).toMatchObject({
      incident_mode: true,
      documents_locked: true,
      sensitive_writes_locked: true,
      severity: "critical",
      public_message: "Vérification de sécurité en cours.",
      auto_triggered: true,
    });
  });

  it("utilise des seuils automatiques assez élevés pour limiter les faux positifs", () => {
    expect(SECURITY_MONITOR_WINDOW_MINUTES).toBe(2);
    expect(DOCUMENT_ACCESS_EVENT_THRESHOLD).toBeGreaterThanOrEqual(20);
    expect(DISTINCT_DOCUMENT_THRESHOLD).toBeGreaterThanOrEqual(10);
  });
});
