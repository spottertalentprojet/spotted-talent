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

type Profile = {
  user_id: string;
  role: "talent" | "entreprise";
  full_name: string | null;
  company_name: string | null;
  email: string | null;
};

type RetentionStatus = {
  user_id: string;
  last_seen_at: string;
  reminder_23d_sent_at: string | null;
  reminder_29d_sent_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  deletion_warning_sent_at: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SITE_URL = "https://www.spottedtalent.fr";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const accountUrlFor = (role: string) =>
  role === "entreprise" ? `${SITE_URL}/entreprise/connexion` : `${SITE_URL}/talent`;

const emailLayout = (title: string, message: string, actionUrl: string) => `
  <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px;color:#18181b">
    <h2 style="margin:0 0 18px;color:#111827">${escapeHtml(title)}</h2>
    <div style="font-size:15px;line-height:1.65">${message}</div>
    <p style="margin:26px 0">
      <a href="${actionUrl}" style="display:inline-block;background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Se connecter</a>
    </p>
    <p style="margin-top:30px;color:#71717a;font-size:12px">
      Spotted Talent - La Ravoire, 73490. Cet e-mail concerne la securite et la conservation de votre compte.
    </p>
  </div>`;

const sendEmail = async (
  resendApiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`email_rejected:${response.status}:${details.slice(0, 250)}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });

  const jobSecret = Deno.env.get("RETENTION_JOB_SECRET");
  const suppliedSecret = req.headers.get("x-retention-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!jobSecret || suppliedSecret !== jobSecret) {
    return jsonResponse(401, { error: "invalid_retention_job_secret" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") || "Spotted Talent <notifications@spottedtalent.fr>";
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();
  const before23d = new Date(now.getTime() - 23 * DAY_MS).toISOString();
  const before29d = new Date(now.getTime() - 29 * DAY_MS).toISOString();
  const before30d = new Date(now.getTime() - 30 * DAY_MS).toISOString();
  const before335d = new Date(now.getTime() - 335 * DAY_MS).toISOString();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, role, full_name, company_name, email");

  if (profilesError) return jsonResponse(500, { error: "profiles_unavailable" });

  const activeProfiles = ((profiles || []) as Profile[]).filter((profile) => Boolean(profile.user_id));

  if (activeProfiles.length > 0) {
    await admin.from("account_retention_status").upsert(
      activeProfiles.map((profile) => ({ user_id: profile.user_id, last_seen_at: now.toISOString() })),
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  }

  const { data: statuses, error: statusesError } = await admin
    .from("account_retention_status")
    .select("user_id, last_seen_at, reminder_23d_sent_at, reminder_29d_sent_at, suspended_at, suspension_reason, deletion_warning_sent_at");

  if (statusesError) return jsonResponse(500, { error: "retention_status_unavailable" });

  const profilesByUserId = new Map(activeProfiles.map((profile) => [profile.user_id, profile]));
  const results = {
    reminder23Sent: 0,
    reminder29Sent: 0,
    suspended: 0,
    deletionWarningsSent: 0,
    skippedWithoutEmail: 0,
    emailErrors: 0,
  };

  const logEvent = async (userId: string, eventType: string, metadata: Record<string, unknown> = {}) => {
    await admin.from("account_retention_events").insert({
      user_id: userId,
      event_type: eventType,
      metadata,
    });
  };

  for (const status of (statuses || []) as RetentionStatus[]) {
    const profile = profilesByUserId.get(status.user_id);
    if (!profile) continue;
    if (!profile.email) {
      results.skippedWithoutEmail += 1;
      continue;
    }

    const displayName = escapeHtml(profile.company_name || profile.full_name || "Bonjour");
    const loginUrl = accountUrlFor(profile.role);

    try {
      if (!status.suspended_at && status.last_seen_at <= before30d) {
        await admin.from("account_retention_status").update({
          suspended_at: now.toISOString(),
          suspension_reason: "inactivity_30_days",
          updated_at: now.toISOString(),
        }).eq("user_id", status.user_id);

        await sendEmail(
          resendApiKey,
          from,
          profile.email,
          "Votre compte Spotted Talent est suspendu par securite",
          emailLayout(
            "Compte suspendu par securite",
            `<p>${displayName}, votre compte n'a pas ete utilise depuis 30 jours.</p><p>Par mesure de protection, l'acces est suspendu. Vos donnees ne sont pas supprimees a ce stade. Pour reactiver le compte, reconnectez-vous simplement.</p>`,
            loginUrl,
          ),
        );
        await logEvent(status.user_id, "suspended_30d", { email_sent: true });
        results.suspended += 1;
        continue;
      }

      if (!status.suspended_at && !status.reminder_29d_sent_at && status.last_seen_at <= before29d) {
        await sendEmail(
          resendApiKey,
          from,
          profile.email,
          "Dernier rappel avant suspension de votre compte Spotted Talent",
          emailLayout(
            "Dernier rappel de securite",
            `<p>${displayName}, votre compte Spotted Talent sera suspendu automatiquement si vous ne vous reconnectez pas.</p><p>Cette mesure protege vos informations personnelles et vos documents.</p>`,
            loginUrl,
          ),
        );
        await admin.from("account_retention_status").update({
          reminder_29d_sent_at: now.toISOString(),
          updated_at: now.toISOString(),
        }).eq("user_id", status.user_id);
        await logEvent(status.user_id, "reminder_29d_sent");
        results.reminder29Sent += 1;
        continue;
      }

      if (!status.suspended_at && !status.reminder_23d_sent_at && status.last_seen_at <= before23d) {
        await sendEmail(
          resendApiKey,
          from,
          profile.email,
          "Rappel de connexion a votre compte Spotted Talent",
          emailLayout(
            "Rappel de securite",
            `<p>${displayName}, votre compte Spotted Talent n'a pas ete utilise depuis plusieurs semaines.</p><p>Sans reconnexion avant 30 jours d'inactivite, le compte sera suspendu par securite. Les documents sensibles restent soumis a leur duree de conservation limitee.</p>`,
            loginUrl,
          ),
        );
        await admin.from("account_retention_status").update({
          reminder_23d_sent_at: now.toISOString(),
          updated_at: now.toISOString(),
        }).eq("user_id", status.user_id);
        await logEvent(status.user_id, "reminder_23d_sent");
        results.reminder23Sent += 1;
        continue;
      }

      if (status.suspended_at && !status.deletion_warning_sent_at && status.last_seen_at <= before335d) {
        await sendEmail(
          resendApiKey,
          from,
          profile.email,
          "Rappel conservation des donnees Spotted Talent",
          emailLayout(
            "Compte inactif depuis longtemps",
            `<p>${displayName}, votre compte est inactif depuis une longue periode.</p><p>Pour limiter la conservation des donnees personnelles, Spotted Talent pourra anonymiser ou supprimer les donnees non necessaires apres information prealable, sauf obligations legales de conservation.</p>`,
            loginUrl,
          ),
        );
        await admin.from("account_retention_status").update({
          deletion_warning_sent_at: now.toISOString(),
          updated_at: now.toISOString(),
        }).eq("user_id", status.user_id);
        await logEvent(status.user_id, "deletion_warning_sent");
        results.deletionWarningsSent += 1;
      }
    } catch (error) {
      results.emailErrors += 1;
      await logEvent(status.user_id, "retention_email_error", {
        job_error: String(error instanceof Error ? error.message : error),
      });
    }
  }

  return jsonResponse(200, { ok: true, results });
});
