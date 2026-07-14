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

type NotificationType =
  | "offer_published"
  | "new_offer"
  | "application_submitted"
  | "new_application"
  | "application_status"
  | "new_message";

type NotificationRequest = {
  type?: NotificationType;
  to?: string;
  contextId?: string;
  data?: Record<string, unknown>;
};

const NOTIFICATION_TYPES = new Set<NotificationType>([
  "offer_published",
  "new_offer",
  "application_submitted",
  "new_application",
  "application_status",
  "new_message",
]);

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const emailLayout = (title: string, message: string, actionLabel: string, actionUrl: string) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;color:#18181b">
    <h2 style="margin:0 0 18px;color:#6d28d9">${title}</h2>
    <div style="font-size:15px;line-height:1.65">${message}</div>
    <p style="margin:26px 0">
      <a href="${actionUrl}" style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">${actionLabel}</a>
    </p>
    <p style="margin-top:30px;color:#71717a;font-size:12px">Spotted Talent - La Ravoire, 73490</p>
  </div>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey) {
    return jsonResponse(500, { error: "server_not_configured" });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return jsonResponse(401, { error: "missing_authorization_header" });

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) return jsonResponse(401, { error: "unauthorized" });

  let body: NotificationRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  if (
    !body.type ||
    !NOTIFICATION_TYPES.has(body.type) ||
    !body.contextId ||
    !/^[0-9a-f-]{36}$/i.test(body.contextId) ||
    !body.to ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)
  ) {
    return jsonResponse(400, { error: "invalid_notification_request" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: senderProfile, error: senderError } = await admin
    .from("profiles")
    .select("user_id, role, full_name, company_name, email")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (senderError || !senderProfile) return jsonResponse(403, { error: "sender_profile_required" });

  const { data: recipientProfile, error: recipientError } = await admin
    .from("profiles")
    .select("user_id, role, full_name, company_name, email, notification_offres_email")
    .ilike("email", body.to.trim())
    .maybeSingle();
  if (recipientError || !recipientProfile) return jsonResponse(403, { error: "registered_recipient_required" });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: hourlyCount, error: hourlyError } = await admin
    .from("email_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authData.user.id)
    .gte("created_at", oneHourAgo);
  const { count: dailyCount, error: dailyError } = await admin
    .from("email_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authData.user.id)
    .gte("created_at", oneDayAgo);
  if (hourlyError || dailyError) return jsonResponse(500, { error: "email_limit_unavailable" });
  const hourlyLimit = senderProfile.role === "entreprise" ? 100 : 30;
  const dailyLimit = senderProfile.role === "entreprise" ? 400 : 80;
  if ((hourlyCount ?? 0) >= hourlyLimit || (dailyCount ?? 0) >= dailyLimit) {
    return jsonResponse(429, { error: "email_usage_limit_reached" });
  }

  let offer: Record<string, unknown> | null = null;
  let application: Record<string, unknown> | null = null;
  if (body.type === "offer_published" || body.type === "new_offer") {
    const { data, error } = await admin
      .from("offres")
      .select("id, entreprise_id, titre, contrat, localisation, statut")
      .eq("id", body.contextId)
      .maybeSingle();
    if (error || !data) return jsonResponse(404, { error: "offer_not_found" });
    offer = data;
  } else {
    const { data, error } = await admin
      .from("candidatures")
      .select("id, talent_id, statut, offre:offre_id(id, entreprise_id, titre)")
      .eq("id", body.contextId)
      .maybeSingle();
    if (error || !data) return jsonResponse(404, { error: "application_not_found" });
    application = data;
    offer = Array.isArray(data.offre) ? data.offre[0] : data.offre;
  }

  const offerOwnerId = String(offer?.entreprise_id ?? "");
  const talentId = String(application?.talent_id ?? "");
  const isSenderCompany = senderProfile.user_id === offerOwnerId;
  const isSenderTalent = senderProfile.user_id === talentId;
  const isRecipientCompany = recipientProfile.user_id === offerOwnerId;
  const isRecipientTalent = recipientProfile.user_id === talentId;
  const isSelfRecipient = recipientProfile.user_id === senderProfile.user_id;

  const allowed = (() => {
    switch (body.type) {
      case "offer_published":
        return senderProfile.role === "entreprise" && isSenderCompany && isSelfRecipient;
      case "new_offer":
        return senderProfile.role === "entreprise" && isSenderCompany &&
          recipientProfile.role === "talent" && recipientProfile.notification_offres_email !== false &&
          offer?.statut === "active";
      case "application_submitted":
        return senderProfile.role === "talent" && isSenderTalent && isSelfRecipient;
      case "new_application":
        return senderProfile.role === "talent" && isSenderTalent && isRecipientCompany;
      case "application_status":
        return senderProfile.role === "entreprise" && isSenderCompany && isRecipientTalent;
      case "new_message":
        return (isSenderCompany && isRecipientTalent) || (isSenderTalent && isRecipientCompany);
    }
  })();
  if (!allowed) return jsonResponse(403, { error: "notification_not_allowed" });

  const offerTitle = escapeHtml(offer?.titre || "votre candidature");
  const companyName = escapeHtml(senderProfile.company_name || senderProfile.full_name || "Une entreprise");
  const talentName = escapeHtml(senderProfile.full_name || "Un talent");
  const requestedStatus = String(body.data?.statut || application?.statut || "envoyee");

  let subject = "Notification Spotted Talent";
  let html = "";
  if (body.type === "offer_published") {
    subject = `Votre offre "${String(offer?.titre || "").slice(0, 100)}" est publiee`;
    html = emailLayout("Votre offre est en ligne", `<p>Votre offre <strong>${offerTitle}</strong> est maintenant visible par les talents.</p>`, "Voir mes offres", "https://www.spottedtalent.fr/entreprise/dashboard?tab=offres");
  } else if (body.type === "new_offer") {
    subject = `Nouvelle offre pour vous - ${String(offer?.titre || "").slice(0, 100)}`;
    html = emailLayout("Une nouvelle offre correspond a votre profil", `<p><strong>${offerTitle}</strong></p><p>Entreprise : ${companyName}</p><p>Localisation : ${escapeHtml(offer?.localisation || "Non precisee")}</p><p>Contrat : ${escapeHtml(offer?.contrat || "Non precise")}</p>`, "Consulter l'offre", "https://www.spottedtalent.fr/talent/dashboard?tab=offres");
  } else if (body.type === "application_submitted") {
    subject = `Candidature envoyee - ${String(offer?.titre || "").slice(0, 100)}`;
    html = emailLayout("Votre candidature a ete envoyee", `<p>Votre candidature pour <strong>${offerTitle}</strong> a bien ete enregistree.</p>`, "Suivre ma candidature", "https://www.spottedtalent.fr/talent/dashboard?tab=candidatures");
  } else if (body.type === "new_application") {
    subject = `Nouvelle candidature - ${String(offer?.titre || "").slice(0, 100)}`;
    html = emailLayout("Nouvelle candidature recue", `<p>${talentName} vient de postuler a votre offre <strong>${offerTitle}</strong>.</p>`, "Voir la candidature", "https://www.spottedtalent.fr/entreprise/dashboard?tab=candidats");
  } else if (body.type === "new_message") {
    const senderName = senderProfile.role === "entreprise" ? companyName : talentName;
    subject = "Nouveau message sur Spotted Talent";
    html = emailLayout("Vous avez un nouveau message", `<p><strong>${senderName}</strong> vous a envoye un message concernant <strong>${offerTitle}</strong>.</p>`, "Ouvrir la messagerie", `https://www.spottedtalent.fr/${recipientProfile.role === "entreprise" ? "entreprise" : "talent"}/dashboard?tab=messagerie`);
  } else {
    const statusConfig: Record<string, { title: string; subject: string; message: string }> = {
      envoyee: { title: "Candidature en attente", subject: "Candidature en attente", message: "Votre candidature est en cours d'examen." },
      entretien: { title: "Candidature en entretien", subject: "Entretien pour votre candidature", message: "Votre candidature passe en phase d'entretien. L'entreprise vous contactera prochainement." },
      acceptee: { title: "Candidature acceptee", subject: "Votre candidature est acceptee", message: "Bonne nouvelle : votre candidature a ete acceptee." },
      refusee: { title: "Candidature non retenue", subject: "Mise a jour de votre candidature", message: "Votre candidature n'a pas ete retenue. D'autres opportunites vous attendent sur Spotted Talent." },
    };
    const config = statusConfig[requestedStatus] || statusConfig.envoyee;
    subject = `${config.subject} - ${String(offer?.titre || "").slice(0, 100)}`;
    html = emailLayout(config.title, `<p>${config.message}</p><p>Poste : <strong>${offerTitle}</strong></p>`, "Voir mes candidatures", "https://www.spottedtalent.fr/talent/dashboard?tab=candidatures");
  }

  const { error: usageError } = await admin.from("email_usage_events").insert({
    user_id: authData.user.id,
    notification_type: body.type,
    recipient_user_id: recipientProfile.user_id,
  });
  if (usageError) return jsonResponse(500, { error: "email_tracking_failed" });

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Spotted Talent <notifications@spottedtalent.fr>",
        to: [recipientProfile.email],
        subject,
        html,
      }),
    });
  } catch {
    return jsonResponse(503, { error: "email_provider_unavailable" });
  }

  if (!resendResponse.ok) return jsonResponse(503, { error: "email_provider_rejected" });
  const result = await resendResponse.json();
  return jsonResponse(200, { ok: true, id: result?.id || null });
});
