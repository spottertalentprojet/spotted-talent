import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

type OfficialEstablishment = {
  siret?: string;
  adresse?: string;
  code_postal?: string;
  libelle_commune?: string;
  etat_administratif?: string;
};

type OfficialCompany = {
  nom_complet?: string;
  nom_raison_sociale?: string;
  etat_administratif?: string;
  siege?: OfficialEstablishment;
  matching_etablissements?: OfficialEstablishment[];
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
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return jsonResponse(401, { error: "missing_authorization_header" });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) {
    return jsonResponse(401, { error: "unauthorized" });
  }

  let body: { siret?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  const siret = String(body.siret || "").replace(/\D/g, "");
  if (!/^\d{14}$/.test(siret)) {
    return jsonResponse(400, { error: "invalid_siret" });
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: userProfile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    return jsonResponse(500, { error: "profile_lookup_failed" });
  }

  if (userProfile?.role !== "entreprise") {
    return jsonResponse(403, { error: "enterprise_account_required" });
  }

  const { data: existingAccount, error: accountError } = await admin
    .from("billing_accounts")
    .select("siret, siret_verified_at")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (accountError) {
    return jsonResponse(500, { error: "billing_account_lookup_failed" });
  }

  if (existingAccount?.siret_verified_at && existingAccount.siret !== siret) {
    return jsonResponse(409, { error: "verified_siret_is_locked" });
  }

  let officialResponse: Response;
  try {
    officialResponse = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(siret)}&per_page=1`,
      { headers: { Accept: "application/json" } },
    );
  } catch {
    return jsonResponse(503, { error: "official_company_service_unavailable" });
  }

  if (!officialResponse.ok) {
    return jsonResponse(503, { error: "official_company_service_unavailable" });
  }

  const officialPayload = await officialResponse.json();
  const result = (officialPayload?.results || []).find((company: OfficialCompany) =>
    company.siege?.siret === siret ||
    company.matching_etablissements?.some((establishment) => establishment.siret === siret)
  ) as OfficialCompany | undefined;

  if (!result) {
    return jsonResponse(404, { error: "siret_not_found" });
  }

  const establishment = result.siege?.siret === siret
    ? result.siege
    : result.matching_etablissements?.find((item) => item.siret === siret);

  if (!establishment) {
    return jsonResponse(404, { error: "siret_not_found" });
  }

  if (result.etat_administratif !== "A" || establishment.etat_administratif !== "A") {
    return jsonResponse(422, { error: "company_establishment_inactive" });
  }

  const legalName = String(result.nom_complet || result.nom_raison_sociale || "").trim();
  const addressLine1 = String(establishment.adresse || "").trim();
  const postalCode = String(establishment.code_postal || "").trim();
  const city = String(establishment.libelle_commune || "").trim();
  const verifiedAt = new Date().toISOString();

  const { error: saveError } = await admin.from("billing_accounts").upsert(
    {
      user_id: authData.user.id,
      siret,
      siret_verified_at: verifiedAt,
      legal_name: legalName || null,
      billing_email: authData.user.email || null,
      address_line1: addressLine1 || null,
      postal_code: postalCode || null,
      city: city || null,
      country: "France",
    },
    { onConflict: "user_id" },
  );

  if (saveError) {
    if (saveError.code === "23505") {
      return jsonResponse(409, { error: "siret_already_registered" });
    }
    return jsonResponse(500, { error: "siret_save_failed" });
  }

  await admin
    .from("profiles")
    .update({
      full_name: legalName || undefined,
      company_name: legalName || undefined,
      adresse: addressLine1 || undefined,
      localisation: [postalCode, city].filter(Boolean).join(" ") || undefined,
    })
    .eq("user_id", authData.user.id);

  return jsonResponse(200, {
    ok: true,
    company: {
      siret,
      verifiedAt,
      legalName,
      addressLine1,
      postalCode,
      city,
      country: "France",
    },
  });
});
