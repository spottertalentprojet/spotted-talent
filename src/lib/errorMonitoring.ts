import { supabase } from "@/integrations/supabase/client";

type ClientErrorArea =
  | "react_render"
  | "window_error"
  | "unhandled_rejection"
  | "resource_load"
  | "auth_initialization"
  | "account_deletion";

type ClientErrorSeverity = "warning" | "error" | "fatal";

const CLIENT_ID_KEY = "spotted-talent:error-client-id";
const reportedRecently = new Map<string, number>();

const cleanToken = (value: string, fallback: string, maxLength = 80) => {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_./:-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, maxLength);
  return cleaned || fallback;
};

export const normalizeMonitoringRoute = (pathname: string) => {
  const cleanPath = pathname.split("?")[0].split("#")[0] || "/unknown";
  return cleanPath
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
    .replace(/\/\d{3,}(?=\/|$)/g, "/:id")
    .slice(0, 120);
};

const getClientId = () => {
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, generated);
  return generated;
};

const digest = async (value: string) => {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const diagnosticSeed = (error: unknown) => {
  if (error instanceof Error) {
    const firstFrame = error.stack?.split("\n").slice(0, 2).join("|") || "no_stack";
    return `${error.name}:${firstFrame}`;
  }
  return typeof error;
};

export const reportClientError = async (
  area: ClientErrorArea,
  error: unknown,
  severity: ClientErrorSeverity = "error",
) => {
  if (!import.meta.env.PROD || typeof window === "undefined") return;

  try {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorCode = cleanToken(errorName, "UNKNOWN_ERROR").toUpperCase();
    const route = normalizeMonitoringRoute(window.location.pathname);
    const diagnosticHash = await digest(diagnosticSeed(error));
    const localKey = `${area}:${errorCode}:${route}:${diagnosticHash}`;
    const lastReport = reportedRecently.get(localKey) || 0;
    if (Date.now() - lastReport < 60_000) return;
    reportedRecently.set(localKey, Date.now());

    await supabase.functions.invoke("report-client-error", {
      body: {
        area,
        errorCode,
        route,
        severity,
        diagnosticHash,
        clientId: getClientId(),
        release: cleanToken(import.meta.env.VITE_APP_RELEASE || "web", "web"),
      },
    });
  } catch {
    // La télémétrie ne doit jamais perturber le parcours utilisateur.
  }
};

export const installGlobalErrorMonitoring = () => {
  if (typeof window === "undefined") return () => undefined;

  const onError = (event: ErrorEvent) => {
    void reportClientError("window_error", event.error || new Error("WindowError"));
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    void reportClientError("unhandled_rejection", event.reason);
  };
  const onResourceError = (event: Event) => {
    if (event instanceof ErrorEvent) return;
    void reportClientError("resource_load", new Error("ResourceLoadError"), "warning");
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onResourceError, true);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    window.removeEventListener("error", onResourceError, true);
  };
};
