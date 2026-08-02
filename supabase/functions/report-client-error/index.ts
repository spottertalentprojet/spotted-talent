import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const allowedOrigins = new Set([
  "https://www.spottedtalent.fr",
  "https://spottedtalent.fr",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

const isAllowedOrigin = (origin: string | null) =>
  !origin || allowedOrigins.has(origin) || /^https:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin);

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : "https://www.spottedtalent.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

const jsonResponse = (req: Request, status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" },
  });

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const cleanToken = (value: unknown, fallback: string, maxLength: number) => {
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_./:-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, maxLength);
  return cleaned || fallback;
};

const cleanRoute = (value: unknown) => {
  const rawRoute = typeof value === "string"
    ? value.split("?")[0].split("#")[0]
    : "/unknown";
  const route = cleanToken(rawRoute, "/unknown", 120);
  return route
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
    .replace(/\/\d{3,}(?=\/|$)/g, "/:id");
};

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) return jsonResponse(req, 403, { error: "origin_not_allowed" });
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return jsonResponse(req, 405, { error: "method_not_allowed" });
  if (!isAllowedOrigin(origin)) return jsonResponse(req, 403, { error: "origin_not_allowed" });

  const contentLength = Number(req.headers.get("Content-Length") || 0);
  if (contentLength > 8_192) return jsonResponse(req, 413, { error: "payload_too_large" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse(req, 500, { error: "server_not_configured" });
  }

  let payload: Record<string, unknown>;
  try {
    const rawBody = await req.text();
    if (rawBody.length > 8_192) return jsonResponse(req, 413, { error: "payload_too_large" });
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonResponse(req, 400, { error: "invalid_json" });
  }

  const area = cleanToken(payload.area, "unknown", 80);
  const errorCode = cleanToken(payload.errorCode, "UNKNOWN_ERROR", 80).toUpperCase();
  const routePattern = cleanRoute(payload.route);
  const release = cleanToken(payload.release, "web", 80);
  const diagnosticHash = cleanToken(payload.diagnosticHash, "none", 80);
  const clientId = cleanToken(payload.clientId, "anonymous", 80);
  const severity = ["warning", "error", "fatal"].includes(String(payload.severity))
    ? String(payload.severity)
    : "error";

  const authorization = req.headers.get("Authorization");
  let userId: string | null = null;
  if (authorization) {
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await authClient.auth.getUser();
    userId = data.user?.id || null;
  }

  const clientFingerprint = await sha256(`${clientId}:${serviceRoleKey.slice(-24)}`);
  const fingerprint = await sha256(`${area}:${errorCode}:${routePattern}:${release}:${diagnosticHash}`);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCount, error: countError } = await admin
    .from("app_error_events")
    .select("id", { count: "exact", head: true })
    .eq("client_fingerprint", clientFingerprint)
    .gte("last_seen_at", oneMinuteAgo);

  if (countError) return jsonResponse(req, 500, { error: "monitoring_unavailable" });
  if ((recentCount || 0) >= 20) return jsonResponse(req, 202, { ok: true, limited: true });

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  let existingQuery = admin
    .from("app_error_events")
    .select("id, occurrence_count")
    .eq("client_fingerprint", clientFingerprint)
    .eq("fingerprint", fingerprint)
    .gte("last_seen_at", fiveMinutesAgo)
    .order("last_seen_at", { ascending: false })
    .limit(1);
  existingQuery = userId ? existingQuery.eq("user_id", userId) : existingQuery.is("user_id", null);
  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) return jsonResponse(req, 500, { error: "monitoring_unavailable" });

  if (existing) {
    const { error } = await admin
      .from("app_error_events")
      .update({
        occurrence_count: Number(existing.occurrence_count || 1) + 1,
        last_seen_at: new Date().toISOString(),
        severity,
      })
      .eq("id", existing.id);
    if (error) return jsonResponse(req, 500, { error: "monitoring_unavailable" });
  } else {
    const { error } = await admin.from("app_error_events").insert({
      user_id: userId,
      client_fingerprint: clientFingerprint,
      fingerprint,
      severity,
      area,
      error_code: errorCode,
      route_pattern: routePattern,
      release,
    });
    if (error) return jsonResponse(req, 500, { error: "monitoring_unavailable" });
  }

  return jsonResponse(req, 202, { ok: true });
});
