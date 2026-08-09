export const SUPPORT_EMAIL = "contact@spottedtalent.fr";

export const buildSupportMailto = (input?: string | { subject?: string; body?: string }) => {
  if (typeof input === "string") {
    return `mailto:${SUPPORT_EMAIL}${input ? `?subject=${encodeURIComponent(input)}` : ""}`;
  }
  const subject = typeof input === "string" ? input : input?.subject;
  const body = typeof input === "string" ? undefined : input?.body;
  const params = [
    subject ? `subject=${encodeURIComponent(subject)}` : "",
    body ? `body=${encodeURIComponent(body)}` : "",
  ].filter(Boolean);
  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return `mailto:${SUPPORT_EMAIL}${query}`;
};
