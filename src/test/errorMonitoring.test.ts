import { describe, expect, it } from "vitest";
import { normalizeMonitoringRoute } from "@/lib/errorMonitoring";

describe("privacy-safe error monitoring", () => {
  it("removes identifiers and query strings from routes", () => {
    expect(normalizeMonitoringRoute("/entreprise/profil/6f1d7d43-5bd2-44ab-b056-762528d115aa?token=secret"))
      .toBe("/entreprise/profil/:id");
    expect(normalizeMonitoringRoute("/offres/123456#details")).toBe("/offres/:id");
  });

  it("keeps known static routes readable", () => {
    expect(normalizeMonitoringRoute("/talent/dashboard")).toBe("/talent/dashboard");
  });
});
