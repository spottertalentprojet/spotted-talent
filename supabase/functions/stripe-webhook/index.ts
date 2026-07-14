import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@14.25.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type BillingStatus = "trial" | "active" | "past_due" | "canceled" | "expired";

const mapStripeStatusToBilling = (status: string): BillingStatus => {
  if (status === "trialing") return "trial";
  if (status === "active") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled") return "canceled";
  return "expired";
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  boost: "Boost",
  premium: "Premium Intérim",
};

const sendBillingConfirmationEmail = async ({
  to,
  planId,
  billingCycle,
  status,
  trialEndsAt,
}: {
  to: string;
  planId: string;
  billingCycle: string;
  status: BillingStatus;
  trialEndsAt: string | null;
}) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey || !to) return;

  const from = Deno.env.get("RESEND_FROM_EMAIL") || "Spotted Talent <contact@spottedtalent.fr>";
  const planLabel = PLAN_LABELS[planId] || "Spotted Talent";
  const cycleLabel = billingCycle === "yearly" ? "annuel" : "mensuel";
  const trialing = status === "trial";
  const trialEndLabel = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })
    : null;
  const subject = trialing
    ? `Votre essai ${planLabel} est activé`
    : `Votre abonnement ${planLabel} est confirmé`;
  const headline = trialing ? "Votre essai de 30 jours est activé" : "Votre abonnement est actif";
  const detail = trialing
    ? `Votre carte a bien été enregistrée. Aucun débit ne sera effectué avant${trialEndLabel ? ` le ${trialEndLabel}` : " la fin de votre essai"}.`
    : "Votre paiement a été confirmé et votre abonnement est maintenant actif.";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:32px;color:#18181b">
        <h1 style="font-size:24px;margin:0 0 18px">${headline}</h1>
        <p style="line-height:1.6">${detail}</p>
        <div style="margin:24px 0;padding:18px;border:1px solid #e4e4e7;border-radius:8px;background:#fafafa">
          <p style="margin:0 0 8px"><strong>Formule :</strong> ${planLabel}</p>
          <p style="margin:0"><strong>Facturation :</strong> ${cycleLabel}</p>
        </div>
        <p style="line-height:1.6">Vous pouvez gérer votre carte et votre abonnement depuis votre espace entreprise.</p>
        <a href="https://www.spottedtalent.fr/entreprise/dashboard?tab=abonnement" style="display:inline-block;margin-top:8px;background:#18181b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Gérer mon abonnement</a>
        <p style="margin-top:28px;color:#71717a;font-size:12px">© 2026 Spotted Talent</p>
      </div>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`resend_${response.status}`);
  }
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const sendPaidInvoiceEmail = async ({
  to,
  invoiceNumber,
  amountTtcCents,
  currency,
  invoiceUrl,
  periodLabel,
}: {
  to: string;
  invoiceNumber: string;
  amountTtcCents: number;
  currency: string;
  invoiceUrl: string;
  periodLabel: string;
}) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey || !to || !invoiceUrl) return;

  const from = Deno.env.get("RESEND_FROM_EMAIL") || "Spotted Talent <contact@spottedtalent.fr>";
  const amountLabel = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountTtcCents / 100);
  const safeInvoiceNumber = escapeHtml(invoiceNumber);
  const safeInvoiceUrl = escapeHtml(invoiceUrl);
  const safePeriodLabel = escapeHtml(periodLabel);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Votre facture Spotted Talent ${invoiceNumber}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:32px;color:#18181b">
        <h1 style="font-size:24px;margin:0 0 18px">Votre facture est disponible</h1>
        <p style="line-height:1.6">Votre paiement a bien été confirmé. La facture est conservée dans votre espace entreprise et reste accessible via Stripe.</p>
        <div style="margin:24px 0;padding:18px;border:1px solid #e4e4e7;border-radius:8px;background:#fafafa">
          <p style="margin:0 0 8px"><strong>Facture :</strong> ${safeInvoiceNumber}</p>
          <p style="margin:0 0 8px"><strong>Période :</strong> ${safePeriodLabel}</p>
          <p style="margin:0"><strong>Total TTC :</strong> ${amountLabel}</p>
        </div>
        <a href="${safeInvoiceUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Ouvrir ma facture</a>
        <p style="margin-top:28px;color:#71717a;font-size:12px">© 2026 Spotted Talent</p>
      </div>`,
    }),
  });

  if (!response.ok) throw new Error(`resend_${response.status}`);
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
        const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        const subscription = stripeSubscriptionId
          ? await stripe.subscriptions.retrieve(stripeSubscriptionId)
          : null;
        const subscriptionStatus = subscription
          ? mapStripeStatusToBilling(subscription.status)
          : session.payment_status === "paid"
            ? "active"
            : "trial";
        const planId = session.metadata?.plan_id || "starter";
        const billingCycle = session.metadata?.billing_cycle === "yearly" ? "yearly" : "monthly";
        const trialStartedAt = subscription?.trial_start
          ? new Date(subscription.trial_start * 1000).toISOString()
          : null;
        const trialEndsAt = subscription?.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;
        const currentPeriodEnd = subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
        const { data: checkoutEvent } = await supabaseAdmin
          .from("billing_checkout_events")
          .select("status")
          .eq("stripe_checkout_session_id", session.id)
          .maybeSingle();

        await supabaseAdmin.from("billing_accounts").upsert(
          {
            user_id: userId,
            plan_id: planId,
            trial_plan_locked: planId,
            billing_cycle: billingCycle,
            addon_ids: session.metadata?.addon_ids ? session.metadata.addon_ids.split(",").filter(Boolean) : [],
            subscription_status: subscriptionStatus,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id: stripeSubscriptionId,
            ...(trialStartedAt ? { trial_started_at: trialStartedAt } : {}),
            ...(trialEndsAt ? { trial_ends_at: trialEndsAt } : {}),
            ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
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

        if (checkoutEvent?.status !== "completed") {
          const recipient = session.customer_details?.email || session.metadata?.billing_email || "";
          try {
            await sendBillingConfirmationEmail({
              to: recipient,
              planId,
              billingCycle,
              status: subscriptionStatus,
              trialEndsAt,
            });
          } catch (emailError) {
            console.error("billing_confirmation_email_failed", emailError);
          }
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
      let subscription: Stripe.Subscription | null = null;

      if (stripeSubscriptionId) {
        subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        userId = userId || subscription.metadata?.user_id;
        billingCycle = billingCycle || subscription.metadata?.billing_cycle;
        planId = planId || subscription.metadata?.plan_id;
        addonIdsRaw = addonIdsRaw || subscription.metadata?.addon_ids;
      }

      if (userId) {
        const invoiceNumber = invoice.number || `STRIPE-${invoice.id.slice(-8).toUpperCase()}`;
        const paid = event.type === "invoice.paid";
        const amountTtcCents = invoice.amount_paid || invoice.amount_due || 0;
        const amountHtCents = invoice.total_excluding_tax ?? Math.max(0, amountTtcCents - (invoice.tax || 0));
        const periodLabel = amountTtcCents === 0
          ? "Période d'essai"
          : billingCycle === "yearly"
            ? "Abonnement annuel"
            : "Abonnement mensuel";
        const invoiceUrl = invoice.hosted_invoice_url || invoice.invoice_pdf || "";
        const { data: existingInvoice } = await supabaseAdmin
          .from("billing_invoices")
          .select("status")
          .eq("stripe_invoice_id", invoice.id)
          .maybeSingle();

        if (amountTtcCents >= 0) {
          await supabaseAdmin.from("billing_invoices").upsert({
            user_id: userId,
            invoice_number: invoiceNumber,
            status: paid ? "paid" : "failed",
            amount_ht_cents: amountHtCents,
            amount_ttc_cents: amountTtcCents,
            vat_rate: amountHtCents > 0
              ? Math.max(0, (amountTtcCents - amountHtCents) / amountHtCents)
              : 0,
            currency: (invoice.currency || "eur").toUpperCase(),
            period_label: periodLabel,
            issued_at: invoice.created ? new Date(invoice.created * 1000).toISOString() : new Date().toISOString(),
            paid_at: paid ? new Date().toISOString() : null,
            pdf_url: invoiceUrl || null,
            stripe_invoice_id: invoice.id,
            metadata: {
              stripe_subscription_id: stripeSubscriptionId,
              plan_id: planId || null,
              addon_ids: addonIdsRaw ? addonIdsRaw.split(",").filter(Boolean) : [],
              invoice_pdf: invoice.invoice_pdf || null,
            },
          }, { onConflict: "stripe_invoice_id" });

          if (amountTtcCents > 0 && paid && existingInvoice?.status !== "paid" && invoiceUrl) {
            const { data: billingAccount } = await supabaseAdmin
              .from("billing_accounts")
              .select("billing_email")
              .eq("user_id", userId)
              .maybeSingle();
            let recipient = invoice.customer_email || billingAccount?.billing_email || "";

            if (!recipient && typeof invoice.customer === "string") {
              const customer = await stripe.customers.retrieve(invoice.customer);
              if (!customer.deleted) recipient = customer.email || "";
            }

            try {
              await sendPaidInvoiceEmail({
                to: recipient,
                invoiceNumber,
                amountTtcCents,
                currency: invoice.currency || "eur",
                invoiceUrl,
                periodLabel,
              });
            } catch (emailError) {
              console.error("paid_invoice_email_failed", emailError);
            }
          }
        }

        await supabaseAdmin
          .from("billing_accounts")
          .update({
            subscription_status: paid
              ? subscription
                ? mapStripeStatusToBilling(subscription.status)
                : "active"
              : "past_due",
            stripe_subscription_id: stripeSubscriptionId,
            current_period_end: subscription?.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
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
