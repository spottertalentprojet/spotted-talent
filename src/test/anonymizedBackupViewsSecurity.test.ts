import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260809200000_secure_anonymized_backup_views.sql",
  "utf8",
);

const protectedViews = [
  "anonymized_backup_profiles",
  "anonymized_backup_candidatures",
  "anonymized_backup_document_requests",
];

describe("anonymized backup view security", () => {
  it("makes every operational view respect the caller's RLS context", () => {
    protectedViews.forEach((view) => {
      expect(migration).toMatch(
        new RegExp(`ALTER VIEW public\\.${view}\\s+SET \\(security_invoker = true\\)`, "i"),
      );
    });
  });

  it("removes browser access and reserves reads for service_role", () => {
    expect(migration).toMatch(/REVOKE ALL PRIVILEGES[\s\S]+FROM PUBLIC, anon, authenticated/i);
    expect(migration).toMatch(/GRANT SELECT[\s\S]+TO service_role/i);
  });
});
