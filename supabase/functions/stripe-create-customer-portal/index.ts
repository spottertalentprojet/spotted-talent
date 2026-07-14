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

const getPortalConfigurationId = async (stripe: Stripe) => {
  const configuredPortalId = Deno.env.get("STRIPE_PORTAL_CONFIGURATION_ID");
  if (configuredPortalId) return configuredPortalId;

  const configurations = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 10,
  });

  const defaultConfiguration = configurations.data.find((configuration) => configuration.is_default);
  if (defaultConfiguration) return defaultConfiguration.id;

  const existingConfiguration = configurations.data[0];
  if (existingConfiguration) return existingConfiguration.id;

  const configuration = await stripe.billingPortal.configurations.create({
    name: "Spotted Talent - Portail client",
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
      subscription_update: {
        enabled: false,
      },
    },
  });

  return configuration.id;
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
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (accountError || !account?.stripe_customer_id) {
    return jsonResponse(404, { error: "stripe_customer_not_found" });
  }

  let body: { returnUrl?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const returnUrl =
    typeof body.returnUrl === "string" && body.returnUrl.trim()
      ? body.returnUrl
      : `${new URL(req.url).origin}/entreprise/dashboard?tab=abonnement`;

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-04-10",
  });

  try {
    const configuration = await getPortalConfigurationId(stripe);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
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
