import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-retention-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type ExpiredDocument = {
  storage_path: string;
  owner_id: string | null;
  category: string | null;
  relation_id: string | null;
  document_request_id: string | null;
  original_file_name: string | null;
  expires_at: string | null;
  retention_flow: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const suppliedSecret =
    req.headers.get("x-retention-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const jobSecret = Deno.env.get("RETENTION_JOB_SECRET");
  let isAuthorized = Boolean(
    suppliedSecret && jobSecret && suppliedSecret === jobSecret,
  );

  if (!isAuthorized && suppliedSecret) {
    const { data: vaultAuthorized, error: vaultError } = await admin.rpc(
      "validate_retention_job_secret",
      { p_secret: suppliedSecret },
    );

    if (vaultError) {
      return jsonResponse(500, { error: "retention_authorization_unavailable" });
    }

    isAuthorized = vaultAuthorized === true;
  }

  if (!isAuthorized) {
    return jsonResponse(401, { error: "invalid_retention_job_secret" });
  }

  const { data: expiredDocuments, error: selectError } = await admin
    .from("document_encryption_keys")
    .select("storage_path, owner_id, category, relation_id, document_request_id, original_file_name, expires_at, retention_flow")
    .is("storage_deleted_at", null)
    .not("expires_at", "is", null)
    .lte("expires_at", new Date().toISOString())
    .limit(500);

  if (selectError) {
    return jsonResponse(500, { error: "expired_documents_unavailable", details: selectError.message });
  }

  const documents = (expiredDocuments || []) as ExpiredDocument[];

  if (documents.length === 0) {
    return jsonResponse(200, { ok: true, deleted: 0, message: "no_expired_documents" });
  }

  const paths = [...new Set(documents.map((doc) => doc.storage_path).filter(Boolean))];

  if (paths.length === 0) {
    return jsonResponse(200, { ok: true, deleted: 0, message: "no_storage_paths" });
  }

  const { error: storageError } = await admin.storage
    .from("documents")
    .remove(paths);

  if (storageError) {
    return jsonResponse(500, { error: "storage_delete_failed", details: storageError.message });
  }

  const deletedAt = new Date().toISOString();
  const { data: finalizedDocuments, error: finalizeError } = await admin.rpc(
    "finalize_expired_document_deletions",
    {
      p_storage_paths: paths,
      p_deleted_at: deletedAt,
    },
  );

  if (finalizeError) {
    return jsonResponse(500, {
      error: "retention_finalize_failed",
      details: finalizeError.message,
      storage_deleted: paths.length,
    });
  }

  return jsonResponse(200, {
    ok: true,
    storage_deleted: paths.length,
    metadata_finalized: finalizedDocuments?.length || 0,
    checked: documents.length,
    deleted_at: deletedAt,
  });
});
