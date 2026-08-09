import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260809170000_document_retention_lifecycle.sql"),
  "utf8",
);
const cleanupFunction = readFileSync(
  resolve(process.cwd(), "supabase/functions/cleanup-expired-documents/index.ts"),
  "utf8",
);

describe("document retention database contract", () => {
  it("starts seven days at the first download or explicit confirmation", () => {
    expect(migration).toContain("v_expires_at := v_received_at + interval '7 days'");
    expect(migration).toContain("p_receipt_method NOT IN ('download', 'confirmation')");
    expect(migration).toContain("first_downloaded_at");
    expect(migration).toContain("receipt_confirmed_at");
  });

  it("expires an unclaimed talent upload after 30 days and a company delivery after 90 days", () => {
    expect(migration).toContain("NEW.expires_at := NEW.sent_at + interval '30 days'");
    expect(migration).toContain("NEW.expires_at := NEW.sent_at + interval '90 days'");
    expect(migration).toContain("unclaimed_after_30_days");
    expect(migration).toContain("delivery_window_ended");
  });

  it("revokes company and administrator file-content access after company delivery", () => {
    expect(migration).toContain("IF v_doc.retention_flow = 'company_to_talent' THEN");
    expect(migration).toContain("RETURN auth.uid() = v_doc.recipient_id");
    expect(migration).toContain("platform administrators never receive file-content access");
    expect(migration).toContain("dek.retention_flow <> 'company_to_talent'");
  });

  it("cascades cleanup to request status and cryptographic erasure without deleting audit metadata", () => {
    expect(cleanupFunction).toMatch(/\.from\("documents"\)\r?\n\s+\.remove\(paths\)/);
    expect(cleanupFunction).toContain('"finalize_expired_document_deletions"');
    expect(migration).toContain("status = 'expired'");
    expect(migration).toContain("key_b64 = NULL");
    expect(migration).toContain("iv_b64 = NULL");
    expect(migration).toContain("'document_supprimé'");
    expect(migration).not.toContain("DELETE FROM public.document_encryption_keys");
  });

  it("keeps only the Edge Function as the scheduled deletion mechanism", () => {
    expect(migration).toContain("cron.unschedule('spotted_talent_cleanup_expired_documents')");
    expect(migration).toContain("spotted_talent_cleanup_expired_documents_edge");
    expect(migration).toContain("DROP FUNCTION IF EXISTS public.cleanup_expired_documents");
  });
});
