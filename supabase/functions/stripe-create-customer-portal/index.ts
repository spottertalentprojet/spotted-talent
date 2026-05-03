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

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: account.stripe_customer_id,
    return_url: returnUrl,
  });

  return jsonResponse(200, {
    ok: true,
    url: portalSession.url,
  });
});
