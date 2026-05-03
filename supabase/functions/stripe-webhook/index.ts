import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@14.25.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mapStripeStatusToBilling = (status: string): "active" | "past_due" | "canceled" | "expired" => {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled") return "canceled";
  return "expired";
};

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse(400, { error: "missing_signature" });
  }

  const payload = await req.text();
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-04-10",
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (error: any) {
    return jsonResponse(400, { error: "invalid_signature", details: error?.message || "signature_error" });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (userId) {
        await supabaseAdmin.from("billing_accounts").upsert(
          {
            user_id: userId,
            plan_id: session.metadata?.plan_id || "starter",
            billing_cycle: session.metadata?.billing_cycle === "yearly" ? "yearly" : "monthly",
            addon_ids: session.metadata?.addon_ids ? session.metadata.addon_ids.split(",").filter(Boolean) : [],
            subscription_status: "active",
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (session.id) {
          await supabaseAdmin
            .from("billing_checkout_events")
            .update({
              status: "completed",
              amount_ttc_cents: session.amount_total ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_checkout_session_id", session.id);
        }
      }
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      let userId = invoice.parent?.subscription_details?.metadata?.user_id || invoice.lines.data[0]?.metadata?.user_id;
      let billingCycle = invoice.parent?.subscription_details?.metadata?.billing_cycle;
      let planId = invoice.parent?.subscription_details?.metadata?.plan_id;
      let addonIdsRaw = invoice.parent?.subscription_details?.metadata?.addon_ids;

      if (!userId && stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        userId = subscription.metadata?.user_id;
        billingCycle = subscription.metadata?.billing_cycle;
        planId = subscription.metadata?.plan_id;
        addonIdsRaw = subscription.metadata?.addon_ids;
      }

      if (userId) {
        const invoiceNumber = invoice.number || `STRIPE-${invoice.id.slice(-8).toUpperCase()}`;
        const paid = event.type === "invoice.paid";
        await supabaseAdmin.from("billing_invoices").insert({
          user_id: userId,
          invoice_number: invoiceNumber,
          status: paid ? "paid" : "failed",
          amount_ht_cents: Math.max(0, (invoice.amount_paid || invoice.amount_due || 0) - (invoice.tax || 0)),
          amount_ttc_cents: invoice.amount_paid || invoice.amount_due || 0,
          vat_rate: 0.2,
          currency: (invoice.currency || "eur").toUpperCase(),
          period_label: billingCycle === "yearly" ? "Abonnement annuel" : "Abonnement mensuel",
          issued_at: invoice.created ? new Date(invoice.created * 1000).toISOString() : new Date().toISOString(),
          paid_at: paid ? new Date().toISOString() : null,
          pdf_url: invoice.hosted_invoice_url || null,
          stripe_invoice_id: invoice.id,
          metadata: {
            stripe_subscription_id: stripeSubscriptionId,
            plan_id: planId || null,
            addon_ids: addonIdsRaw ? addonIdsRaw.split(",").filter(Boolean) : [],
          },
        });

        await supabaseAdmin
          .from("billing_accounts")
          .update({
            subscription_status: paid ? "active" : "past_due",
            stripe_subscription_id: stripeSubscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (userId) {
        await supabaseAdmin
          .from("billing_accounts")
          .update({
            subscription_status: mapStripeStatusToBilling(subscription.status),
            stripe_subscription_id: subscription.id,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }
  } catch (error: any) {
    return jsonResponse(500, { error: "webhook_processing_failed", details: error?.message || "unknown_error" });
  }

  return jsonResponse(200, { received: true });
});
