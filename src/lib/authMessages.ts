const normalizeAuthMessage = (message?: string) =>
  (message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const translateAuthError = (
  message?: string,
  fallback = "Une erreur est survenue. Veuillez reessayer."
) => {
  const normalized = normalizeAuthMessage(message);

  if (!normalized) return fallback;

  if (normalized.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }

  if (normalized.includes("email not confirmed") || normalized.includes("email_not_confirmed")) {
    return "Votre adresse e-mail n'est pas encore confirmee. Verifiez votre boite mail, puis reconnectez-vous.";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "Un compte existe deja avec cette adresse e-mail. Connectez-vous ou utilisez mot de passe oublie.";
  }

  if (normalized.includes("signup disabled")) {
    return "Les inscriptions sont temporairement fermees. Reessayez plus tard.";
  }

  if (
    normalized.includes("password should be at least") ||
    normalized.includes("weak password") ||
    normalized.includes("weak_password")
  ) {
    return "Le mot de passe est trop faible. Utilisez au moins 12 caracteres.";
  }

  if (normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit")) {
    return "Trop de demandes envoyees. Patientez quelques minutes avant de reessayer.";
  }

  if (normalized.includes("otp") && normalized.includes("expired")) {
    return "Le lien a expire. Demandez un nouveau lien.";
  }

  if (normalized.includes("token") && normalized.includes("expired")) {
    return "Le lien a expire. Demandez un nouveau lien.";
  }

  if (normalized.includes("captcha")) {
    return "La verification de securite a echoue. Reessayez.";
  }

  if (
    normalized.includes("mfa") ||
    normalized.includes("totp") ||
    normalized.includes("factor") ||
    normalized.includes("challenge") ||
    normalized.includes("verification code") ||
    normalized.includes("invalid code")
  ) {
    if (normalized.includes("expired")) {
      return "Le code de securite a expire. Demandez un nouveau code.";
    }
    if (normalized.includes("not found") || normalized.includes("missing")) {
      return "Aucune application d'authentification valide n'est liee a ce compte.";
    }
    return "Code de double authentification incorrect. Reessayez avec un nouveau code.";
  }

  if (normalized.includes("network") || normalized.includes("failed to fetch")) {
    return "Connexion impossible pour le moment. Verifiez votre connexion internet puis reessayez.";
  }

  return fallback;
};

export const translateAppError = (
  message?: string,
  fallback = "Une erreur est survenue. Veuillez reessayer."
) => {
  const normalized = normalizeAuthMessage(message);

  if (!normalized) return fallback;

  if (
    normalized.includes("jwt") ||
    normalized.includes("not authenticated") ||
    normalized.includes("unauthorized") ||
    normalized.includes("auth session missing")
  ) {
    return "Votre session a expire. Reconnectez-vous pour continuer.";
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("access denied") ||
    normalized.includes("forbidden")
  ) {
    return "Action refusee par securite. Verifiez votre compte ou reconnectez-vous.";
  }

  if (normalized.includes("duplicate key") || normalized.includes("23505") || normalized.includes("already exists")) {
    return "Cette action existe deja.";
  }

  if (normalized.includes("active_offer_limit_reached")) {
    return "La limite d'annonces actives de votre formule est atteinte.";
  }

  if (normalized.includes("weekly_offer_limit_reached")) {
    return "La limite de nouvelles annonces sur 7 jours est atteinte pour votre formule.";
  }

  if (normalized.includes("checkout_session_missing_url")) {
    return "Stripe n'a pas pu ouvrir la page de paiement. Reessayez dans quelques instants.";
  }

  if (normalized.includes("portal_session_missing_url")) {
    return "Stripe n'a pas pu ouvrir le portail client. Reessayez dans quelques instants.";
  }

  if (normalized.includes("stripe_customer_not_found") || normalized.includes("stripe customer")) {
    return "Aucun client Stripe n'est relie a ce compte. Relancez le paiement securise.";
  }

  if (normalized.includes("stripe_subscription_not_found")) {
    return "Aucun abonnement Stripe actif n'est relie a ce compte.";
  }

  if (normalized.includes("company_verification_required")) {
    return "Le SIRET doit etre verifie avant le paiement.";
  }

  if (normalized.includes("ai_service_unavailable")) {
    return "Le service IA est momentanement indisponible. Reessayez dans quelques instants.";
  }

  if (normalized.includes("ai_response_invalid")) {
    return "La reponse IA est incomplete. Relancez la generation.";
  }

  if (normalized.includes("location_fetch_failed")) {
    return "La recherche de localisation est indisponible pour le moment.";
  }

  if (
    normalized.includes("storage") ||
    normalized.includes("bucket") ||
    normalized.includes("object not found") ||
    normalized.includes("document securise")
  ) {
    return "Impossible d'acceder a ce document securise pour le moment.";
  }

  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Connexion impossible pour le moment. Verifiez internet puis reessayez.";
  }

  if (message && !/[a-z_]+_[a-z_]+/.test(message)) {
    return message;
  }

  return fallback;
};
