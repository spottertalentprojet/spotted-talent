import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@14.25.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { buildInvoiceCustomFields, getOrCreateFrenchVatRate } from "../_shared/stripeBilling.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !stripeSecretKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return jsonResponse(401, { error: "missing_authorization_header" });

  const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await supabaseAuthClient.auth.getUser();
  if (authError || !authData.user) return jsonResponse(401, { error: "unauthorized" });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const [{ data: profile }, { data: account, error: accountError }] = await Promise.all([
    supabaseAdmin.from("profiles").select("role").eq("user_id", authData.user.id).maybeSingle(),
    supabaseAdmin
      .from("billing_accounts")
      .select("stripe_customer_id, stripe_subscription_id, plan_id, billing_cycle, addon_ids, siret, vat_number, legal_name, billing_email, company_phone, address_line1, address_line2, postal_code, city, country")
      .eq("user_id", authData.user.id)
      .maybeSingle(),
  ]);

  if (profile?.role !== "entreprise") return jsonResponse(403, { error: "enterprise_account_required" });
  if (accountError || !account) return jsonResponse(404, { error: "billing_account_not_found" });
  if (!account.stripe_customer_id && !account.stripe_subscription_id) {
    return jsonResponse(200, { ok: true, updated: false });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-04-10" });
  const frenchVatRateId = await getOrCreateFrenchVatRate(stripe);
  const invoiceCustomFields = buildInvoiceCustomFields(account.siret, account.vat_number);

  if (account.stripe_customer_id) {
    try {
      await stripe.customers.update(account.stripe_customer_id, {
        email: account.billing_email || authData.user.email || undefined,
        name: account.legal_name || undefined,
        phone: account.company_phone || undefined,
        metadata: {
          user_id: authData.user.id,
          siret: account.siret || "",
        },
        invoice_settings: invoiceCustomFields.length > 0
          ? { custom_fields: invoiceCustomFields }
          : undefined,
        address: account.address_line1
          ? {
              line1: account.address_line1,
              line2: account.address_line2 || undefined,
              postal_code: account.postal_code || undefined,
              city: account.city || undefined,
              country: account.country === "France" ? "FR" : undefined,
            }
          : undefined,
      });
    } catch (error) {
      console.error("stripe_customer_sync_failed", error);
    }
  }

  let subscription: Stripe.Subscription | null = null;
  if (account.stripe_subscription_id) {
    try {
      subscription = await stripe.subscriptions.update(account.stripe_subscription_id, {
        default_tax_rates: [frenchVatRateId],
        proration_behavior: "none",
      });
    } catch (error) {
      console.error("stripe_subscription_tax_sync_failed", error);
      subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
    }
  }

  let syncedInvoices = 0;
  if (account.stripe_customer_id) {
    const stripeInvoices = await stripe.invoices.list({
      customer: account.stripe_customer_id,
      limit: 25,
    });
    const billingCycle = subscription?.metadata?.billing_cycle || account.billing_cycle;
    const planId = subscription?.metadata?.plan_id || account.plan_id;
    const addonIds = subscription?.metadata?.addon_ids
      ? subscription.metadata.addon_ids.split(",").filter(Boolean)
      : Array.isArray(account.addon_ids)
        ? account.addon_ids
        : [];
    const invoiceRows = stripeInvoices.data
      .filter((invoice) => invoice.status !== "draft")
      .map((invoice) => {
        const amountTtcCents = invoice.total ?? invoice.amount_due ?? invoice.amount_paid ?? 0;
        const amountHtCents = invoice.total_excluding_tax ?? Math.max(0, amountTtcCents - (invoice.tax || 0));
        const stripeSubscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : account.stripe_subscription_id;

        return {
          user_id: authData.user.id,
          invoice_number: invoice.number || `STRIPE-${invoice.id.slice(-8).toUpperCase()}`,
          status: invoice.status === "paid" ? "paid" : invoice.status === "open" ? "open" : "failed",
          amount_ht_cents: amountHtCents,
          amount_ttc_cents: amountTtcCents,
          vat_rate: amountHtCents > 0
            ? Math.max(0, (amountTtcCents - amountHtCents) / amountHtCents)
            : 0,
          currency: (invoice.currency || "eur").toUpperCase(),
          period_label: amountTtcCents === 0
            ? "Période d'essai"
            : billingCycle === "yearly"
              ? "Abonnement annuel"
              : "Abonnement mensuel",
          issued_at: invoice.created
            ? new Date(invoice.created * 1000).toISOString()
            : new Date().toISOString(),
          paid_at: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : invoice.status === "paid"
              ? new Date().toISOString()
              : null,
          pdf_url: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
          stripe_invoice_id: invoice.id,
          metadata: {
            stripe_subscription_id: stripeSubscriptionId,
            plan_id: planId || null,
            addon_ids: addonIds,
            invoice_pdf: invoice.invoice_pdf || null,
            test_invoice: amountTtcCents === 0,
          },
        };
      });

    if (invoiceRows.length > 0) {
      const { error: invoiceSyncError } = await supabaseAdmin
        .from("billing_invoices")
        .upsert(invoiceRows, { onConflict: "stripe_invoice_id" });
      if (invoiceSyncError) return jsonResponse(500, { error: "invoice_sync_failed" });
      syncedInvoices = invoiceRows.length;
    }
  }

  return jsonResponse(200, {
    ok: true,
    updated: true,
    taxRateId: frenchVatRateId,
    syncedInvoices,
  });
});
