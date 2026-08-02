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

const ALLOWED_RETURN_ORIGINS = new Set([
  "https://www.spottedtalent.fr",
  "https://spottedtalent.fr",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
]);

const getSiteUrl = () => Deno.env.get("SITE_URL") || "https://www.spottedtalent.fr";

const safeReturnUrl = (value: unknown, fallbackPath: string) => {
  const fallback = new URL(fallbackPath, getSiteUrl()).toString();
  if (typeof value !== "string" || !value.trim()) return fallback;

  try {
    const url = new URL(value);
    if (!ALLOWED_RETURN_ORIGINS.has(url.origin)) return fallback;
    if (!url.pathname.startsWith("/entreprise/dashboard")) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
};

const PORTAL_CONFIGURATION_NAME = "Spotted Talent - Portail client";

const PLAN_PRICE_KEYS = {
  starter: ["STRIPE_PRICE_STARTER_MONTHLY", "STRIPE_PRICE_STARTER_YEARLY"],
  boost: ["STRIPE_PRICE_BOOST_MONTHLY", "STRIPE_PRICE_BOOST_YEARLY"],
  premium: ["STRIPE_PRICE_PREMIUM_MONTHLY", "STRIPE_PRICE_PREMIUM_YEARLY"],
};

const getConfiguredPlanPriceIds = () =>
  Object.values(PLAN_PRICE_KEYS)
    .flat()
    .map((key) => Deno.env.get(key))
    .filter((value): value is string => Boolean(value));

const buildPortalProducts = async (stripe: Stripe) => {
  const priceIds = getConfiguredPlanPriceIds();
  const productsById = new Map<string, string[]>();

  for (const priceId of priceIds) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      const existingPrices = productsById.get(productId) || [];
      productsById.set(productId, [...existingPrices, price.id]);
    } catch (error) {
      console.error("stripe_portal_price_lookup_failed", { priceId, error });
    }
  }

  return [...productsById.entries()].map(([product, prices]) => ({
    product,
    prices,
  }));
};

const buildPortalConfigurationParams = async (stripe: Stripe) => {
  const products = await buildPortalProducts(stripe);
  const subscriptionUpdate = products.length > 0
    ? {
        enabled: true,
        default_allowed_updates: ["price"],
        products,
        proration_behavior: "none",
      }
    : {
        enabled: false,
      };

  return {
    name: PORTAL_CONFIGURATION_NAME,
    business_profile: {
      headline: "Gestion de votre abonnement Spotted Talent",
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["address", "email", "name", "phone", "tax_id"],
      },
      invoice_history: {
        enabled: true,
      },
      payment_method_update: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
      },
      subscription_update: subscriptionUpdate,
    },
  };
};

const getPortalConfigurationId = async (stripe: Stripe) => {
  const configurationParams = await buildPortalConfigurationParams(stripe);
  const configuredPortalId = Deno.env.get("STRIPE_PORTAL_CONFIGURATION_ID");
  if (configuredPortalId) {
    await stripe.billingPortal.configurations.update(configuredPortalId, configurationParams);
    return configuredPortalId;
  }

  const configurations = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });

  const existingConfiguration = configurations.data.find((configuration) =>
    configuration.name === PORTAL_CONFIGURATION_NAME,
  );
  if (existingConfiguration) {
    await stripe.billingPortal.configurations.update(existingConfiguration.id, configurationParams);
    return existingConfiguration.id;
  }

  const configuration = await stripe.billingPortal.configurations.create(configurationParams);

  return configuration.id;
};

const mapStripeStatusToBilling = (status?: string) => {
  if (status === "trialing") return "trial";
  if (status === "active") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled") return "canceled";
  return "expired";
};

const escapeStripeSearchValue = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");

const getCustomerIdIfUsable = async (stripe: Stripe, customerId?: string | null) => {
  if (!customerId) return null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ("deleted" in customer && customer.deleted) return null;
    return customer.id;
  } catch {
    return null;
  }
};

const findCustomerFromSubscription = async (stripe: Stripe, subscriptionId?: string | null) => {
  if (!subscriptionId) return null;
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    return {
      customerId,
      subscriptionId: subscription.id,
      subscription,
    };
  } catch {
    return null;
  }
};

const findCustomerByUserId = async (stripe: Stripe, userId: string) => {
  try {
    const customers = await stripe.customers.search({
      query: `metadata['user_id']:'${escapeStripeSearchValue(userId)}'`,
      limit: 1,
    });
    const customer = customers.data[0];
    if (!customer) return null;

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });
    const subscription = subscriptions.data.find((item) =>
      ["trialing", "active", "past_due", "unpaid"].includes(item.status),
    ) || subscriptions.data[0] || null;

    return {
      customerId: customer.id,
      subscriptionId: subscription?.id || null,
      subscription,
    };
  } catch {
    return null;
  }
};

const findCustomerByEmail = async (stripe: Stripe, email?: string | null, userId?: string) => {
  if (!email) return null;
  try {
    const customers = await stripe.customers.list({ email, limit: 10 });
    for (const customer of customers.data) {
      if ("deleted" in customer && customer.deleted) continue;

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 10,
      });
      const subscription = subscriptions.data.find((item) =>
        ["trialing", "active", "past_due", "unpaid"].includes(item.status),
      ) || subscriptions.data[0] || null;

      if (customer.metadata?.user_id === userId || subscription?.metadata?.user_id === userId || subscription) {
        return {
          customerId: customer.id,
          subscriptionId: subscription?.id || null,
          subscription,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
};

const findManagedSubscription = async (
  stripe: Stripe,
  customerId: string,
  knownSubscription?: Stripe.Subscription | null,
) => {
  if (knownSubscription && ["trialing", "active", "past_due", "unpaid"].includes(knownSubscription.status)) {
    return knownSubscription;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  return subscriptions.data.find((subscription) =>
    ["trialing", "active", "past_due", "unpaid"].includes(subscription.status),
  ) || null;
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

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: account, error: accountError } = await supabaseAdmin
    .from("billing_accounts")
    .select("stripe_customer_id, stripe_subscription_id, billing_email")
    .eq("user_id", user.id)
    .maybeSingle();

  let body: { returnUrl?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const returnUrl = safeReturnUrl(body.returnUrl, "/entreprise/dashboard?tab=abonnement");

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-04-10",
  });

  try {
    if (accountError) {
      return jsonResponse(500, { error: "billing_account_lookup_failed" });
    }

    const subscriptionMatch = await findCustomerFromSubscription(stripe, account?.stripe_subscription_id);
    const customerIdFromAccount = await getCustomerIdIfUsable(stripe, account?.stripe_customer_id);
    const customerMatch = subscriptionMatch ||
      (customerIdFromAccount
        ? { customerId: customerIdFromAccount, subscriptionId: account?.stripe_subscription_id || null, subscription: null }
        : null) ||
      await findCustomerByUserId(stripe, user.id) ||
      await findCustomerByEmail(stripe, account?.billing_email || user.email, user.id);

    if (!customerMatch?.customerId) {
      return jsonResponse(404, {
        error: "stripe_customer_not_found",
        message: "Aucun client Stripe n'est relié à ce compte. Relancez le paiement sécurisé pour recréer le lien Stripe.",
      });
    }

    const managedSubscription = await findManagedSubscription(
      stripe,
      customerMatch.customerId,
      customerMatch.subscription,
    );

    if (!managedSubscription) {
      await supabaseAdmin
        .from("billing_accounts")
        .update({
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return jsonResponse(409, {
        error: "stripe_subscription_not_found",
        message: "Le client Stripe existe, mais aucun abonnement Stripe n'est actif. Relancez le paiement securise pour creer l'abonnement.",
      });
    }

    await supabaseAdmin.from("billing_accounts").upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerMatch.customerId,
        stripe_subscription_id: managedSubscription.id,
        subscription_status: mapStripeStatusToBilling(managedSubscription.status),
        plan_id: managedSubscription.metadata?.plan_id || undefined,
        billing_cycle: managedSubscription.metadata?.billing_cycle === "yearly" ? "yearly" : undefined,
        trial_plan_locked: managedSubscription.metadata?.plan_id || undefined,
        trial_ends_at: managedSubscription.trial_end
          ? new Date(managedSubscription.trial_end * 1000).toISOString()
          : undefined,
        current_period_end: managedSubscription.current_period_end
          ? new Date(managedSubscription.current_period_end * 1000).toISOString()
          : undefined,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    const configuration = await getPortalConfigurationId(stripe);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerMatch.customerId,
      return_url: returnUrl,
      configuration,
    });

    return jsonResponse(200, {
      ok: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.error("stripe_customer_portal_error", error);
    const stripeError = error as {
      code?: string;
      decline_code?: string;
      message?: string;
      requestId?: string;
      type?: string;
    };
    return jsonResponse(500, {
      error: "stripe_customer_portal_unavailable",
      code: stripeError.code || null,
      type: stripeError.type || null,
      requestId: stripeError.requestId || null,
      message: stripeError.message || (error instanceof Error ? error.message : "Unknown Stripe portal error"),
    });
  }
});
