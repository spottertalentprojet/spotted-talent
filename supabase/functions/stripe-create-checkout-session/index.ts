import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@14.25.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const PLAN_PRICE_KEYS: Record<string, Record<string, string>> = {
  starter: {
    monthly: "STRIPE_PRICE_STARTER_MONTHLY",
    yearly: "STRIPE_PRICE_STARTER_YEARLY",
  },
  boost: {
    monthly: "STRIPE_PRICE_BOOST_MONTHLY",
    yearly: "STRIPE_PRICE_BOOST_YEARLY",
  },
  premium: {
    monthly: "STRIPE_PRICE_PREMIUM_MONTHLY",
    yearly: "STRIPE_PRICE_PREMIUM_YEARLY",
  },
};

const ADDON_PRICE_KEYS: Record<string, Record<string, string>> = {
  "urgent-label": {
    monthly: "STRIPE_PRICE_ADDON_URGENT_LABEL_MONTHLY",
    yearly: "STRIPE_PRICE_ADDON_URGENT_LABEL_YEARLY",
  },
  "sponsored-visibility": {
    monthly: "STRIPE_PRICE_ADDON_SPONSORED_VISIBILITY_MONTHLY",
    yearly: "STRIPE_PRICE_ADDON_SPONSORED_VISIBILITY_YEARLY",
  },
  "smart-screening": {
    monthly: "STRIPE_PRICE_ADDON_SMART_SCREENING_MONTHLY",
    yearly: "STRIPE_PRICE_ADDON_SMART_SCREENING_YEARLY",
  },
  "sms-pack": {
    monthly: "STRIPE_PRICE_ADDON_SMS_PACK_MONTHLY",
    yearly: "STRIPE_PRICE_ADDON_SMS_PACK_YEARLY",
  },
};

type CheckoutBody = {
  planId: "starter" | "boost" | "premium";
  billingCycle: "monthly" | "yearly";
  addons?: string[];
  billingProfile?: {
    legalName?: string;
    billingEmail?: string;
    vatNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  successUrl?: string;
  cancelUrl?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !stripeSecretKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return jsonResponse(401, { error: "missing_authorization_header" });
  }

  const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });

  const { data: authData, error: authError } = await supabaseAuthClient.auth.getUser();
  if (authError || !authData.user) {
    return jsonResponse(401, { error: "unauthorized" });
  }
  const user = authData.user;

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  const planId = body.planId;
  const billingCycle = body.billingCycle;
  const addons = Array.isArray(body.addons) ? body.addons.filter((item): item is string => typeof item === "string") : [];

  if (!planId || !PLAN_PRICE_KEYS[planId]) {
    return jsonResponse(400, { error: "invalid_plan_id" });
  }

  if (billingCycle !== "monthly" && billingCycle !== "yearly") {
    return jsonResponse(400, { error: "invalid_billing_cycle" });
  }

  const planPriceKey = PLAN_PRICE_KEYS[planId][billingCycle];
  const planPriceId = Deno.env.get(planPriceKey);
  if (!planPriceId) {
    return jsonResponse(500, { error: "missing_plan_price_id", key: planPriceKey });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{ price: planPriceId, quantity: 1 }];
  for (const addonId of addons) {
    const addonKeys = ADDON_PRICE_KEYS[addonId];
    if (!addonKeys) continue;
    const addonPriceId = Deno.env.get(addonKeys[billingCycle]);
    if (addonPriceId) {
      lineItems.push({ price: addonPriceId, quantity: 1 });
    }
  }

  const billingProfile = body.billingProfile || {};
  const successUrl =
    typeof body.successUrl === "string" && body.successUrl.trim()
      ? body.successUrl
      : `${new URL(req.url).origin}/entreprise/dashboard?tab=abonnement&billing_status=success&plan=${planId}&cycle=${billingCycle}`;
  const cancelUrl =
    typeof body.cancelUrl === "string" && body.cancelUrl.trim()
      ? body.cancelUrl
      : `${new URL(req.url).origin}/entreprise/dashboard?tab=abonnement&billing_status=cancel`;

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-04-10",
  });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: existingAccount } = await supabaseAdmin
    .from("billing_accounts")
    .select("stripe_customer_id, subscription_status")
    .eq("user_id", user.id)
    .maybeSingle();

  let stripeCustomerId = existingAccount?.stripe_customer_id ?? null;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: billingProfile.billingEmail || user.email || undefined,
      name: billingProfile.legalName || undefined,
      metadata: {
        user_id: user.id,
      },
      address: billingProfile.addressLine1
        ? {
            line1: billingProfile.addressLine1 || undefined,
            line2: billingProfile.addressLine2 || undefined,
            postal_code: billingProfile.postalCode || undefined,
            city: billingProfile.city || undefined,
            country: billingProfile.country === "France" ? "FR" : undefined,
          }
        : undefined,
    });
    stripeCustomerId = customer.id;
  }

  const metadata = {
    user_id: user.id,
    plan_id: planId,
    billing_cycle: billingCycle,
    addon_ids: addons.join(","),
    billing_email: billingProfile.billingEmail || user.email || "",
    vat_number: billingProfile.vatNumber || "",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
    allow_promotion_codes: true,
  });

  const normalizedExistingStatus =
    existingAccount?.subscription_status === "active" ||
    existingAccount?.subscription_status === "past_due" ||
    existingAccount?.subscription_status === "canceled" ||
    existingAccount?.subscription_status === "expired" ||
    existingAccount?.subscription_status === "trial"
      ? existingAccount.subscription_status
      : null;
  const nextSubscriptionStatus = normalizedExistingStatus && normalizedExistingStatus !== "trial"
    ? normalizedExistingStatus
    : "trial";

  await supabaseAdmin.from("billing_accounts").upsert(
    {
      user_id: user.id,
      legal_name: billingProfile.legalName || null,
      billing_email: billingProfile.billingEmail || user.email || null,
      vat_number: billingProfile.vatNumber || null,
      address_line1: billingProfile.addressLine1 || null,
      address_line2: billingProfile.addressLine2 || null,
      postal_code: billingProfile.postalCode || null,
      city: billingProfile.city || null,
      country: billingProfile.country || "France",
      plan_id: planId,
      billing_cycle: billingCycle,
      addon_ids: addons,
      stripe_customer_id: stripeCustomerId,
      subscription_status: nextSubscriptionStatus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  await supabaseAdmin.from("billing_checkout_events").insert({
    user_id: user.id,
    stripe_checkout_session_id: session.id,
    plan_id: planId,
    billing_cycle: billingCycle,
    addon_ids: addons,
    amount_ttc_cents: session.amount_total ?? null,
    status: "pending",
  });

  return jsonResponse(200, {
    ok: true,
    sessionId: session.id,
    customerId: stripeCustomerId,
    url: session.url,
  });
});
