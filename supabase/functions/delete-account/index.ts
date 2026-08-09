import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@14.25.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CONFIRMATION_PHRASE = "SUPPRIMER MON COMPTE";
const ACTIVE_STRIPE_STATUSES = new Set(["trialing", "active", "past_due", "unpaid", "paused"]);
const DEPARTURE_REASONS = new Set([
  "found_job",
  "not_enough_relevant_offers",
  "difficult_to_use",
  "technical_issue",
  "privacy_concerns",
  "too_many_notifications",
  "no_longer_needed",
  "recreate_account",
  "other",
  "prefer_not_to_say",
]);
const MAX_DEPARTURE_FEEDBACK_LENGTH = 500;

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const redactContactDetails = (value: string) => value
  .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[e-mail masqué]")
  .replace(/(?:https?:\/\/|www\.)\S+/gi, "[lien masqué]")
  .replace(/(?:\+33|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}/g, "[téléphone masqué]");

type StorageObject = {
  id?: string | null;
  name: string;
};

const listOwnedStoragePaths = async (
  admin: ReturnType<typeof createClient>,
  bucket: string,
  ownerId: string,
) => {
  const queue = [ownerId];
  const paths: string[] = [];

  while (queue.length > 0) {
    const prefix = queue.shift()!;
    let offset = 0;

    while (true) {
      const { data, error } = await admin.storage.from(bucket).list(prefix, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;

      const objects = (data || []) as StorageObject[];
      for (const object of objects) {
        const path = `${prefix}/${object.name}`;
        if (object.id) paths.push(path);
        else queue.push(path);
      }

      if (objects.length < 100) break;
      offset += objects.length;
    }
  }

  return paths;
};

const removeInBatches = async (
  admin: ReturnType<typeof createClient>,
  bucket: string,
  paths: string[],
) => {
  for (let index = 0; index < paths.length; index += 100) {
    const batch = paths.slice(index, index + 100);
    if (batch.length === 0) continue;
    const { error } = await admin.storage.from(bucket).remove(batch);
    if (error) throw error;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return jsonResponse(401, { error: "unauthorized" });

  let body: {
    confirmation?: unknown;
    departureReason?: unknown;
    departureFeedback?: unknown;
  } = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  if (body.confirmation !== CONFIRMATION_PHRASE) {
    return jsonResponse(400, {
      error: "confirmation_required",
      message: `Saisissez exactement « ${CONFIRMATION_PHRASE} » pour confirmer.`,
    });
  }

  const departureReason = body.departureReason === undefined || body.departureReason === ""
    ? "prefer_not_to_say"
    : body.departureReason;
  if (typeof departureReason !== "string" || !DEPARTURE_REASONS.has(departureReason)) {
    return jsonResponse(400, {
      error: "invalid_departure_reason",
      message: "Le motif de départ sélectionné n'est pas reconnu.",
    });
  }

  if (body.departureFeedback !== undefined && body.departureFeedback !== null && typeof body.departureFeedback !== "string") {
    return jsonResponse(400, { error: "invalid_departure_feedback" });
  }
  const rawDepartureFeedback = typeof body.departureFeedback === "string"
    ? body.departureFeedback.trim()
    : "";
  if (rawDepartureFeedback.length > MAX_DEPARTURE_FEEDBACK_LENGTH) {
    return jsonResponse(400, {
      error: "departure_feedback_too_long",
      message: `La précision ne doit pas dépasser ${MAX_DEPARTURE_FEEDBACK_LENGTH} caractères.`,
    });
  }
  const departureFeedback = rawDepartureFeedback
    ? redactContactDetails(rawDepartureFeedback)
    : null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) return jsonResponse(401, { error: "unauthorized" });

  const user = authData.user;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const accountFingerprint = await sha256(`${user.id}:${serviceRoleKey.slice(-24)}`);

  const [{ data: profile, error: profileError }, { data: billingAccount, error: billingError }, { data: invoices, error: invoiceError }] =
    await Promise.all([
      admin.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
      admin.from("billing_accounts").select("*").eq("user_id", user.id).maybeSingle(),
      admin.from("billing_invoices").select("*").eq("user_id", user.id),
    ]);

  if (profileError || billingError || invoiceError) {
    return jsonResponse(500, { error: "account_lookup_failed" });
  }

  const { data: audit, error: auditError } = await admin
    .from("account_deletion_audit")
    .insert({
      account_fingerprint: accountFingerprint,
      account_role: profile?.role || null,
      departure_reason: profile?.role === "talent" ? departureReason : null,
      departure_feedback: profile?.role === "talent" ? departureFeedback : null,
      result: "started",
      details: { invoice_count: invoices?.length || 0 },
    })
    .select("id")
    .single();

  if (auditError || !audit) return jsonResponse(500, { error: "deletion_audit_failed" });

  const markFailed = async (code: string) => {
    await admin
      .from("account_deletion_audit")
      .update({ result: "failed", completed_at: new Date().toISOString(), details: { code } })
      .eq("id", audit.id);
  };

  try {
    if ((invoices?.length || 0) > 0) {
      const legalIdentity = {
        legal_name: billingAccount?.legal_name || null,
        billing_email: billingAccount?.billing_email || user.email || null,
        vat_number: billingAccount?.vat_number || null,
        siret: billingAccount?.siret || null,
        address_line1: billingAccount?.address_line1 || null,
        address_line2: billingAccount?.address_line2 || null,
        postal_code: billingAccount?.postal_code || null,
        city: billingAccount?.city || null,
        country: billingAccount?.country || "France",
        company_phone: billingAccount?.company_phone || null,
      };

      const archiveRows = invoices!.map((invoice) => ({
        source_invoice_id: invoice.id,
        account_fingerprint: accountFingerprint,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        amount_ht_cents: invoice.amount_ht_cents,
        amount_ttc_cents: invoice.amount_ttc_cents,
        vat_rate: invoice.vat_rate,
        currency: invoice.currency,
        period_label: invoice.period_label,
        issued_at: invoice.issued_at,
        paid_at: invoice.paid_at,
        stripe_invoice_id: invoice.stripe_invoice_id,
        legal_identity: legalIdentity,
        retain_until: new Date(new Date(invoice.issued_at).setFullYear(new Date(invoice.issued_at).getFullYear() + 10)).toISOString(),
      }));

      const { error: archiveError } = await admin
        .from("billing_legal_archives")
        .upsert(archiveRows, { onConflict: "source_invoice_id" });
      if (archiveError) throw new Error("billing_archive_failed");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (billingAccount?.stripe_subscription_id || billingAccount?.stripe_customer_id) {
      if (!stripeSecretKey) throw new Error("stripe_not_configured");
      const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });

      if (billingAccount.stripe_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.retrieve(billingAccount.stripe_subscription_id);
          if (ACTIVE_STRIPE_STATUSES.has(subscription.status)) {
            await stripe.subscriptions.cancel(subscription.id, { invoice_now: false, prorate: false });
          }
        } catch (error) {
          const stripeError = error as { code?: string };
          if (stripeError.code !== "resource_missing") throw error;
        }
      }

      if (billingAccount.stripe_customer_id) {
        try {
          await stripe.customers.del(billingAccount.stripe_customer_id);
        } catch (error) {
          const stripeError = error as { code?: string };
          if (stripeError.code !== "resource_missing") throw error;
        }
      }
    }

    const [avatarPaths, documentPaths] = await Promise.all([
      listOwnedStoragePaths(admin, "avatars", user.id),
      listOwnedStoragePaths(admin, "documents", user.id),
    ]);

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id, false);
    if (deleteUserError) throw new Error("auth_user_deletion_failed");

    const cleanupWarnings: string[] = [];
    const cleanupTasks = [
      removeInBatches(admin, "avatars", avatarPaths).catch(() => cleanupWarnings.push("avatars")),
      removeInBatches(admin, "documents", documentPaths).catch(() => cleanupWarnings.push("documents")),
      admin
        .from("document_access_logs")
        .delete()
        .or(`actor_id.eq.${user.id},owner_id.eq.${user.id}`)
        .then(({ error }) => {
          if (error) cleanupWarnings.push("document_logs");
        }),
    ];
    await Promise.all(cleanupTasks);

    await admin
      .from("account_deletion_audit")
      .update({
        result: cleanupWarnings.length > 0 ? "completed_with_cleanup_warning" : "completed",
        completed_at: new Date().toISOString(),
        details: {
          invoice_count: invoices?.length || 0,
          removed_avatar_count: avatarPaths.length,
          removed_document_count: documentPaths.length,
          cleanup_warnings: cleanupWarnings,
        },
      })
      .eq("id", audit.id);

    return jsonResponse(200, { ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "account_deletion_failed";
    console.error("account_deletion_failed", { code, accountFingerprint });
    await markFailed(code);
    return jsonResponse(500, {
      error: code,
      message: "La suppression n'a pas abouti. Votre compte reste accessible ; réessayez ou contactez le support.",
    });
  }
});
