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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const jobSecret = Deno.env.get("RETENTION_JOB_SECRET");
  const suppliedSecret =
    req.headers.get("x-retention-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!jobSecret || suppliedSecret !== jobSecret) {
    return jsonResponse(401, { error: "invalid_retention_job_secret" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: expiredDocuments, error: selectError } = await admin
    .from("document_encryption_keys")
    .select("storage_path, owner_id, category, relation_id, document_request_id, original_file_name, expires_at")
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

  const logs = documents.map((doc) => ({
    actor_id: doc.owner_id,
    action: "delete",
    storage_path: doc.storage_path,
    owner_id: doc.owner_id,
    category: doc.category,
    relation_id: doc.relation_id,
    document_request_id: doc.document_request_id,
    file_name: doc.original_file_name,
    metadata: {
      reason: "retention_expired",
      deleted_by: "system",
      expires_at: doc.expires_at,
      method: "storage_api",
    },
  }));

  const { error: logError } = await admin
    .from("document_access_logs")
    .insert(logs);

  if (logError) {
    return jsonResponse(500, { error: "retention_log_failed", details: logError.message });
  }

  const { error: deleteKeysError } = await admin
    .from("document_encryption_keys")
    .delete()
    .in("storage_path", paths);

  if (deleteKeysError) {
    return jsonResponse(500, { error: "metadata_delete_failed", details: deleteKeysError.message });
  }

  return jsonResponse(200, {
    ok: true,
    deleted: paths.length,
    checked: documents.length,
  });
});