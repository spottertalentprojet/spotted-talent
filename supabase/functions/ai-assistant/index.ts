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

type AiTask = "generate_offer" | "generate_bio" | "analyze_cv" | "cover_letter";

type AiRequest = {
  task?: AiTask;
  payload?: Record<string, unknown>;
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const TASK_LIMITS: Record<AiTask, { role: "talent" | "entreprise"; daily: number }> = {
  generate_offer: { role: "entreprise", daily: 20 },
  generate_bio: { role: "talent", daily: 10 },
  analyze_cv: { role: "talent", daily: 10 },
  cover_letter: { role: "talent", daily: 20 },
};

const toText = (value: unknown, maxLength: number) =>
  String(value ?? "").trim().slice(0, maxLength);

const redactCvContactDetails = (value: string) =>
  value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email masque]")
    .replace(/(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}/g, "[telephone masque]");

const buildPrompt = (task: AiTask, payload: Record<string, unknown>) => {
  if (task === "generate_offer") {
    const poste = toText(payload.poste, 160);
    if (!poste) throw new Error("missing_job_title");
    const entreprise = toText(payload.entreprise, 180);
    const contrat = toText(payload.contrat, 80);
    const localisation = toText(payload.localisation, 180) || "France";
    const secteur = toText(payload.secteur, 160);
    const competences = toText(payload.competences, 1200) || "a definir";
    const diplome = toText(payload.diplome, 160);
    const salaireMin = toText(payload.salaireMin, 30);
    const salaireMax = toText(payload.salaireMax, 30);
    const avantages = Array.isArray(payload.avantages)
      ? payload.avantages.map((item) => toText(item, 80)).filter(Boolean).slice(0, 12).join(", ")
      : "";

    return {
      temperature: 0.7,
      maxTokens: 1200,
      messages: [
        {
          role: "system",
          content: "Tu es un expert RH qui redige des offres d'emploi attractives, inclusives et professionnelles en francais. N'invente aucune information qui n'est pas fournie.",
        },
        {
          role: "user",
          content:
            `Redige une offre d'emploi complete pour le poste de ${poste}${entreprise ? ` chez ${entreprise}` : ""}. ` +
            `Contrat: ${contrat || "a definir"}. Localisation: ${localisation}. Secteur: ${secteur || "a definir"}. ` +
            `Competences: ${competences}. Diplome requis: ${diplome || "non precise"}. ` +
            `Salaire: ${salaireMin && salaireMax ? `${salaireMin} EUR a ${salaireMax} EUR brut/mois` : "non precise"}. ` +
            `Avantages: ${avantages || "non precises"}. Inclure une description, les missions, le profil recherche et les avantages.`,
        },
      ] satisfies ChatMessage[],
    };
  }

  if (task === "generate_bio") {
    const poste = toText(payload.poste, 160);
    const competences = toText(payload.competences, 1000);
    if (!poste && !competences) throw new Error("missing_profile_information");

    return {
      temperature: 0.7,
      maxTokens: 200,
      messages: [
        {
          role: "system",
          content: "Tu es un expert RH. Redige une courte presentation professionnelle en 2 ou 3 phrases maximum, a la premiere personne, en francais simple. N'invente aucune experience.",
        },
        {
          role: "user",
          content:
            `Redige une presentation pour un candidat. Poste: ${poste || "non precise"}. ` +
            `Secteur: ${toText(payload.secteur, 160) || "non precise"}. Competences: ${competences || "non precisees"}. ` +
            `Localisation: ${toText(payload.localisation, 180) || "non precisee"}.`,
        },
      ] satisfies ChatMessage[],
    };
  }

  if (task === "analyze_cv") {
    const cvText = redactCvContactDetails(toText(payload.cvText, 12000));
    if (cvText.length < 80) throw new Error("cv_text_too_short");

    return {
      temperature: 0.3,
      maxTokens: 1600,
      messages: [
        {
          role: "system",
          content:
            'Tu es un expert RH et coach CV. Reponds UNIQUEMENT en JSON valide avec cette structure: {"score_global":75,"niveau":"Prometteur","resume":"resume simple et pedagogique en 2 ou 3 phrases","lecture_recruteur":"ce qu un recruteur comprend en quelques secondes","categories":[{"nom":"Presentation","score":80,"explication":"explication simple"},{"nom":"Contenu","score":60,"explication":"explication simple"},{"nom":"Competences","score":55,"explication":"explication simple"},{"nom":"Impact recruteur","score":58,"explication":"explication simple"}],"points_forts":[{"titre":"titre court","detail":"explication concrete"}],"points_faibles":[{"titre":"titre court","detail":"explication concrete"}],"ameliorations_prioritaires":["action concrete 1","action concrete 2","action concrete 3"],"sections_manquantes":["section 1","section 2"],"mots_cles_a_ajouter":["mot 1","mot 2"],"exemples_amelioration":[],"conseil_debutant":"conseil rassurant et utile pour un candidat debutant"}. Les explications doivent etre simples, humaines, precises et actionnables. N evalue jamais l age, le genre, l origine ou un autre critere personnel protege. Les exemples doivent rester lies au contenu reel du CV.',
        },
        {
          role: "user",
          content: `Analyse ce CV et explique clairement ce qui est bien, ce qui est faible et ce qu'il faut ameliorer en priorite:\n${cvText}`,
        },
      ] satisfies ChatMessage[],
    };
  }

  const poste = toText(payload.poste, 160);
  const entreprise = toText(payload.entreprise, 180);
  if (!poste || !entreprise) throw new Error("missing_cover_letter_information");
  const style = payload.style === "terrain" ? "terrain" : "classique";
  const styleInstruction = style === "terrain"
    ? "Adopte un ton direct, concret et terrain avec des phrases courtes. Valorise la reactivite, la ponctualite, la fiabilite et l'adaptation rapide aux missions."
    : "Adopte un ton classique et professionnel avec une structure sobre, rassurante et bien articulee.";

  return {
    temperature: 0.35,
    maxTokens: 700,
    messages: [
      {
        role: "system",
        content: "Tu es un expert RH francophone. Tu rediges des lettres naturelles, credibles et professionnelles. Tu n'inventes jamais une experience, un diplome ou une mission. Fournis uniquement la lettre finale, sans markdown ni commentaire.",
      },
      {
        role: "user",
        content:
          `Redige une lettre de motivation professionnelle. Candidat: ${toText(payload.nomCandidat, 160) || "Candidat"}. ` +
          `Poste vise: ${poste}. Entreprise: ${entreprise}. Poste actuel: ${toText(payload.posteCandidat, 160) || "non precise"}. ` +
          `Localisation: ${toText(payload.localisation, 180) || "non precisee"}. Secteur: ${toText(payload.secteur, 160) || "non precise"}. ` +
          `Contrat recherche: ${toText(payload.contrat, 80) || "non precise"}. Competences: ${toText(payload.competences, 1200) || "non precisees"}. ` +
          `Presentation: ${toText(payload.bio, 1200) || "non precisee"}. Points forts: ${toText(payload.pointsForts, 1000) || "motivation, serieux, envie de bien faire"}. ` +
          `Contraintes: 190 a 260 mots, 4 paragraphes maximum, commencer par Madame, Monsieur, montrer une motivation realiste, terminer par une formule simple et la signature du candidat. ${styleInstruction}`,
      },
    ] satisfies ChatMessage[],
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !groqApiKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return jsonResponse(401, { error: "missing_authorization_header" });

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) return jsonResponse(401, { error: "unauthorized" });

  let body: AiRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  if (
    !body.task ||
    !Object.prototype.hasOwnProperty.call(TASK_LIMITS, body.task) ||
    !body.payload ||
    typeof body.payload !== "object" ||
    Array.isArray(body.payload)
  ) {
    return jsonResponse(400, { error: "invalid_ai_request" });
  }

  if (JSON.stringify(body.payload).length > 30000) {
    return jsonResponse(413, { error: "payload_too_large" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (profileError) return jsonResponse(500, { error: "profile_lookup_failed" });
  if (profile?.role !== TASK_LIMITS[body.task].role) {
    return jsonResponse(403, { error: "task_not_allowed_for_account" });
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: hourlyCount, error: hourlyError } = await admin
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authData.user.id)
    .gte("created_at", hourAgo);
  const { count: dailyTaskCount, error: dailyError } = await admin
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authData.user.id)
    .eq("task", body.task)
    .gte("created_at", dayAgo);
  if (hourlyError || dailyError) return jsonResponse(500, { error: "usage_limit_unavailable" });
  if ((hourlyCount ?? 0) >= 30 || (dailyTaskCount ?? 0) >= TASK_LIMITS[body.task].daily) {
    return jsonResponse(429, { error: "ai_usage_limit_reached" });
  }

  let prompt;
  try {
    prompt = buildPrompt(body.task, body.payload);
  } catch (error) {
    return jsonResponse(400, { error: error instanceof Error ? error.message : "invalid_ai_payload" });
  }

  const { error: usageError } = await admin.from("ai_usage_events").insert({
    user_id: authData.user.id,
    task: body.task,
  });
  if (usageError) return jsonResponse(500, { error: "usage_tracking_failed" });

  let groqResponse: Response;
  try {
    groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: prompt.messages,
        temperature: prompt.temperature,
        max_tokens: prompt.maxTokens,
      }),
    });
  } catch {
    return jsonResponse(503, { error: "ai_provider_unavailable" });
  }

  if (!groqResponse.ok) {
    return jsonResponse(groqResponse.status === 429 ? 429 : 503, {
      error: groqResponse.status === 429 ? "ai_provider_rate_limited" : "ai_provider_unavailable",
    });
  }

  const groqData = await groqResponse.json();
  const content = groqData?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    return jsonResponse(502, { error: "ai_response_invalid" });
  }

  return jsonResponse(200, { ok: true, content });
});
