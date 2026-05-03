import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export const TRIAL_DURATION_DAYS = 30;
export const ENTREPRISE_BILLING_KEY_PREFIX = "spotted-talent:entreprise-billing:";
export const ENTREPRISE_TRIAL_ALLOWED_TABS = new Set(["dashboard", "profil", "abonnement"]);

export type BillingPlanId = "starter" | "boost" | "premium";
export type BillingCycle = "monthly" | "yearly";
export type BillingSubscriptionStatus = "trial" | "active" | "expired" | "past_due" | "canceled";

export type BillingProfile = {
  legalName: string;
  billingEmail: string;
  vatNumber: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
};

export type BillingInvoiceStatus = "paid" | "open" | "failed";

export type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  status: BillingInvoiceStatus;
  amountHtCents: number;
  amountTtcCents: number;
  vatRate: number;
  currency: string;
  periodLabel: string;
  issuedAt: string;
  paidAt: string | null;
  pdfUrl: string | null;
  stripeInvoiceId: string | null;
};

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  features: string[];
};

export type BillingAddon = {
  id: string;
  label: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
};

export type PaymentMethodCard = {
  id: string;
  label: string;
  caption: string;
};

export type BillingTotals = {
  planHtCents: number;
  addonsHtCents: number;
  subtotalHtCents: number;
  vatCents: number;
  totalTtcCents: number;
};

export type EntrepriseBillingState = {
  plan: BillingPlanId;
  trialPlanLocked: BillingPlanId | null;
  billingCycle: BillingCycle;
  selectedAddons: string[];
  subscriptionStatus: BillingSubscriptionStatus;
  trialStartedAt: string;
  trialEndsAt: string;
  updatedAt: string;
  stripeCustomerId: string | null;
  billingProfile: BillingProfile;
  invoices: BillingInvoice[];
};

type BillingAccountRow = Tables<"billing_accounts">;
type BillingAccountInsert = TablesInsert<"billing_accounts">;
type BillingInvoiceRow = Tables<"billing_invoices">;

const DEFAULT_BILLING_PROFILE: BillingProfile = {
  legalName: "",
  billingEmail: "",
  vatNumber: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  country: "France",
};

export const ABONNEMENT_PLANS: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Pour démarrer simplement avec un premier volume d'annonces.",
    monthlyPriceCents: 3900,
    yearlyPriceCents: 34800,
    features: [
      "1 annonce active",
      "Messagerie avec les talents",
      "Suivi des candidatures",
      "Documents partagés",
    ],
  },
  {
    id: "boost",
    name: "Boost",
    description: "Pour recruter plus vite avec des outils de tri avancés.",
    monthlyPriceCents: 14900,
    yearlyPriceCents: 130800,
    features: [
      "Jusqu'à 5 annonces actives",
      "Questions de présélection",
      "Messages automatiques",
      "Badge recrutement urgent",
    ],
  },
  {
    id: "premium",
    name: "Premium Intérim",
    description: "Pour agences et structures qui recrutent en continu.",
    monthlyPriceCents: 34900,
    yearlyPriceCents: 298800,
    features: [
      "Annonces prioritaires",
      "Profils matchés mis en avant",
      "Export de candidats",
      "Support prioritaire",
    ],
  },
];

export const BILLING_ADDONS: BillingAddon[] = [
  {
    id: "urgent-label",
    label: "Label recrutement urgent",
    description: "Votre offre remonte avec un badge urgent pour accélérer les candidatures.",
    monthlyPriceCents: 2900,
    yearlyPriceCents: 25200,
  },
  {
    id: "sponsored-visibility",
    label: "Annonce sponsorisée",
    description: "Visibilité renforcée dans les résultats et sur la page d'accueil.",
    monthlyPriceCents: 8900,
    yearlyPriceCents: 76800,
  },
  {
    id: "smart-screening",
    label: "Présélection intelligente",
    description: "Filtrage automatique des candidatures selon vos critères métier.",
    monthlyPriceCents: 3900,
    yearlyPriceCents: 34800,
  },
  {
    id: "sms-pack",
    label: "Pack SMS candidats",
    description: "Relance et confirmation de rendez-vous par SMS.",
    monthlyPriceCents: 4900,
    yearlyPriceCents: 42000,
  },
];

export const BILLING_PAYMENT_METHODS: PaymentMethodCard[] = [
  { id: "visa", label: "VISA", caption: "Cartes débit/crédit" },
  { id: "mastercard", label: "Mastercard", caption: "Paiement international" },
  { id: "apple-pay", label: "Apple Pay", caption: "Paiement mobile rapide" },
  { id: "google-pay", label: "Google Pay", caption: "Paiement en un geste" },
  { id: "sepa", label: "SEPA", caption: "Prélèvement entreprise" },
];

export const BILLING_GUARANTEES = [
  "3D Secure et tokenisation des cartes",
  "Facture PDF automatique après chaque règlement",
  "Renouvellement mensuel avec annulation simple",
];

const nowIso = () => new Date().toISOString();

const createInvoiceId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `inv_${Math.random().toString(36).slice(2)}_${Date.now()}`;
};

const makeInvoiceNumber = () => {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `ST-${yy}${mm}${dd}-${suffix}`;
};

const sortInvoices = (invoices: BillingInvoice[]) =>
  [...invoices].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

const dedupeInvoices = (invoices: BillingInvoice[]) => {
  const seen = new Set<string>();
  return sortInvoices(invoices).filter((invoice) => {
    const key = invoice.stripeInvoiceId || invoice.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseInvoices = (value: unknown): BillingInvoice[] => {
  if (!Array.isArray(value)) return [];
  return dedupeInvoices(
    value
      .filter((item) => item && typeof item === "object")
      .map((item: any) => ({
        id: typeof item.id === "string" ? item.id : createInvoiceId(),
        invoiceNumber: typeof item.invoiceNumber === "string" ? item.invoiceNumber : makeInvoiceNumber(),
        status: item.status === "open" || item.status === "failed" ? item.status : "paid",
        amountHtCents: Number.isFinite(item.amountHtCents) ? Number(item.amountHtCents) : 0,
        amountTtcCents: Number.isFinite(item.amountTtcCents) ? Number(item.amountTtcCents) : 0,
        vatRate: Number.isFinite(item.vatRate) ? Number(item.vatRate) : 0.2,
        currency: typeof item.currency === "string" ? item.currency : "EUR",
        periodLabel: typeof item.periodLabel === "string" ? item.periodLabel : "Abonnement",
        issuedAt: typeof item.issuedAt === "string" ? item.issuedAt : nowIso(),
        paidAt: typeof item.paidAt === "string" || item.paidAt === null ? item.paidAt : null,
        pdfUrl: typeof item.pdfUrl === "string" || item.pdfUrl === null ? item.pdfUrl : null,
        stripeInvoiceId:
          typeof item.stripeInvoiceId === "string" || item.stripeInvoiceId === null
            ? item.stripeInvoiceId
            : null,
      })),
  );
};

const sanitizeBillingProfile = (value: unknown): BillingProfile => {
  if (!value || typeof value !== "object") return DEFAULT_BILLING_PROFILE;
  const source = value as Record<string, unknown>;
  return {
    legalName: typeof source.legalName === "string" ? source.legalName : "",
    billingEmail: typeof source.billingEmail === "string" ? source.billingEmail : "",
    vatNumber: typeof source.vatNumber === "string" ? source.vatNumber : "",
    addressLine1: typeof source.addressLine1 === "string" ? source.addressLine1 : "",
    addressLine2: typeof source.addressLine2 === "string" ? source.addressLine2 : "",
    postalCode: typeof source.postalCode === "string" ? source.postalCode : "",
    city: typeof source.city === "string" ? source.city : "",
    country: typeof source.country === "string" && source.country.trim() ? source.country : "France",
  };
};

const mergeBillingProfiles = (primary: BillingProfile, secondary: BillingProfile): BillingProfile => ({
  legalName: primary.legalName || secondary.legalName,
  billingEmail: primary.billingEmail || secondary.billingEmail,
  vatNumber: primary.vatNumber || secondary.vatNumber,
  addressLine1: primary.addressLine1 || secondary.addressLine1,
  addressLine2: primary.addressLine2 || secondary.addressLine2,
  postalCode: primary.postalCode || secondary.postalCode,
  city: primary.city || secondary.city,
  country: primary.country || secondary.country || "France",
});

const sanitizePlan = (value: unknown): BillingPlanId => {
  if (value === "boost" || value === "premium") return value;
  return "starter";
};

const sanitizeOptionalPlan = (value: unknown): BillingPlanId | null => {
  if (value === "starter" || value === "boost" || value === "premium") return value;
  return null;
};

const sanitizeCycle = (value: unknown): BillingCycle => {
  if (value === "yearly") return "yearly";
  return "monthly";
};

const sanitizeStatus = (value: unknown): BillingSubscriptionStatus => {
  if (value === "active" || value === "expired" || value === "past_due" || value === "canceled") return value;
  return "trial";
};

const rowToBillingInvoice = (row: BillingInvoiceRow): BillingInvoice => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  status: row.status === "failed" || row.status === "open" ? row.status : "paid",
  amountHtCents: row.amount_ht_cents,
  amountTtcCents: row.amount_ttc_cents,
  vatRate: Number(row.vat_rate ?? 0.2),
  currency: row.currency || "EUR",
  periodLabel: row.period_label || "Abonnement",
  issuedAt: row.issued_at,
  paidAt: row.paid_at,
  pdfUrl: row.pdf_url,
  stripeInvoiceId: row.stripe_invoice_id,
});

const createRemoteBillingState = (
  account: BillingAccountRow,
  invoices: BillingInvoiceRow[],
): EntrepriseBillingState => {
  const remoteState: EntrepriseBillingState = {
    plan: sanitizePlan(account.plan_id),
    trialPlanLocked: sanitizeOptionalPlan(account.trial_plan_locked),
    billingCycle: sanitizeCycle(account.billing_cycle),
    selectedAddons: Array.isArray(account.addon_ids)
      ? account.addon_ids.filter((item): item is string => typeof item === "string")
      : [],
    subscriptionStatus: sanitizeStatus(account.subscription_status),
    trialStartedAt: typeof account.trial_started_at === "string" ? account.trial_started_at : nowIso(),
    trialEndsAt: typeof account.trial_ends_at === "string" ? account.trial_ends_at : nowIso(),
    updatedAt: typeof account.updated_at === "string" ? account.updated_at : nowIso(),
    stripeCustomerId: account.stripe_customer_id,
    billingProfile: {
      legalName: account.legal_name || "",
      billingEmail: account.billing_email || "",
      vatNumber: account.vat_number || "",
      addressLine1: account.address_line1 || "",
      addressLine2: account.address_line2 || "",
      postalCode: account.postal_code || "",
      city: account.city || "",
      country: account.country || "France",
    },
    invoices: sortInvoices((invoices || []).map(rowToBillingInvoice)),
  };

  if (remoteState.subscriptionStatus === "trial" && new Date(remoteState.trialEndsAt).getTime() <= Date.now()) {
    return {
      ...remoteState,
      subscriptionStatus: "expired",
      updatedAt: nowIso(),
    };
  }

  return remoteState;
};

export const getEntrepriseBillingStorageKey = (userId: string) => `${ENTREPRISE_BILLING_KEY_PREFIX}${userId}`;

export const createInitialEntrepriseBillingState = (): EntrepriseBillingState => {
  const now = new Date();
  const trialEndsAtDate = new Date(now);
  trialEndsAtDate.setDate(trialEndsAtDate.getDate() + TRIAL_DURATION_DAYS);
  return {
    plan: "starter",
    trialPlanLocked: null,
    billingCycle: "monthly",
    selectedAddons: [],
    subscriptionStatus: "trial",
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEndsAtDate.toISOString(),
    updatedAt: now.toISOString(),
    stripeCustomerId: null,
    billingProfile: DEFAULT_BILLING_PROFILE,
    invoices: [],
  };
};

export const saveEntrepriseBillingState = (userId: string, state: EntrepriseBillingState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getEntrepriseBillingStorageKey(userId), JSON.stringify(state));
};

export const loadEntrepriseBillingState = (userId: string): EntrepriseBillingState => {
  if (typeof window === "undefined") return createInitialEntrepriseBillingState();

  const key = getEntrepriseBillingStorageKey(userId);
  const fallback = createInitialEntrepriseBillingState();

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      saveEntrepriseBillingState(userId, fallback);
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<EntrepriseBillingState>;
    if (!parsed || typeof parsed !== "object") {
      saveEntrepriseBillingState(userId, fallback);
      return fallback;
    }

    const trialStartedAt = typeof parsed.trialStartedAt === "string" ? parsed.trialStartedAt : fallback.trialStartedAt;
    const trialEndsAt = typeof parsed.trialEndsAt === "string" ? parsed.trialEndsAt : fallback.trialEndsAt;
    const updatedAt = typeof parsed.updatedAt === "string" ? parsed.updatedAt : fallback.updatedAt;
    const selectedAddons = Array.isArray(parsed.selectedAddons)
      ? parsed.selectedAddons.filter((item): item is string => typeof item === "string")
      : [];

    const normalized: EntrepriseBillingState = {
      plan: sanitizePlan(parsed.plan),
      trialPlanLocked: sanitizeOptionalPlan((parsed as { trialPlanLocked?: unknown }).trialPlanLocked),
      billingCycle: sanitizeCycle(parsed.billingCycle),
      selectedAddons,
      subscriptionStatus: sanitizeStatus(parsed.subscriptionStatus),
      trialStartedAt,
      trialEndsAt,
      updatedAt,
      stripeCustomerId: typeof parsed.stripeCustomerId === "string" ? parsed.stripeCustomerId : null,
      billingProfile: sanitizeBillingProfile(parsed.billingProfile),
      invoices: parseInvoices(parsed.invoices),
    };

    const trialExpired = new Date(trialEndsAt).getTime() <= Date.now();
    if (normalized.subscriptionStatus === "trial" && trialExpired) {
      const expiredState: EntrepriseBillingState = {
        ...normalized,
        subscriptionStatus: "expired",
        updatedAt: nowIso(),
      };
      saveEntrepriseBillingState(userId, expiredState);
      return expiredState;
    }

    return normalized;
  } catch {
    saveEntrepriseBillingState(userId, fallback);
    return fallback;
  }
};

export const mergeEntrepriseBillingStates = (
  localState: EntrepriseBillingState,
  remoteState: EntrepriseBillingState,
): EntrepriseBillingState => {
  const localUpdatedAt = new Date(localState.updatedAt).getTime();
  const remoteUpdatedAt = new Date(remoteState.updatedAt).getTime();
  const shouldPreferRemote =
    remoteState.subscriptionStatus !== "trial" ||
    !Number.isFinite(localUpdatedAt) ||
    (Number.isFinite(remoteUpdatedAt) && remoteUpdatedAt >= localUpdatedAt);
  const primary = shouldPreferRemote ? remoteState : localState;
  const secondary = shouldPreferRemote ? localState : remoteState;

  return {
    plan: primary.plan,
    trialPlanLocked: primary.trialPlanLocked || secondary.trialPlanLocked,
    billingCycle: primary.billingCycle,
    selectedAddons: primary.selectedAddons.length ? primary.selectedAddons : secondary.selectedAddons,
    subscriptionStatus: primary.subscriptionStatus,
    trialStartedAt: primary.trialStartedAt || secondary.trialStartedAt,
    trialEndsAt: primary.trialEndsAt || secondary.trialEndsAt,
    updatedAt: primary.updatedAt || secondary.updatedAt || nowIso(),
    stripeCustomerId: primary.stripeCustomerId || secondary.stripeCustomerId,
    billingProfile: mergeBillingProfiles(primary.billingProfile, secondary.billingProfile),
    invoices: dedupeInvoices([...remoteState.invoices, ...localState.invoices]),
  };
};

export const fetchEntrepriseBillingStateRemote = async (userId: string): Promise<EntrepriseBillingState | null> => {
  try {
    const [{ data: account, error: accountError }, { data: invoices, error: invoicesError }] = await Promise.all([
      supabase
        .from("billing_accounts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("billing_invoices")
        .select("*")
        .eq("user_id", userId)
        .order("issued_at", { ascending: false }),
    ]);

    if (accountError) {
      throw accountError;
    }

    if (!account) {
      return null;
    }

    if (invoicesError) {
      throw invoicesError;
    }

    return createRemoteBillingState(account, invoices || []);
  } catch (error) {
    console.warn("billing_remote_load_failed", error);
    return null;
  }
};

export const saveEntrepriseBillingStateRemote = async (
  userId: string,
  state: EntrepriseBillingState,
): Promise<boolean> => {
  try {
    const payload: BillingAccountInsert = {
      user_id: userId,
      legal_name: state.billingProfile.legalName || null,
      billing_email: state.billingProfile.billingEmail || null,
      vat_number: state.billingProfile.vatNumber || null,
      address_line1: state.billingProfile.addressLine1 || null,
      address_line2: state.billingProfile.addressLine2 || null,
      postal_code: state.billingProfile.postalCode || null,
      city: state.billingProfile.city || null,
      country: state.billingProfile.country || "France",
      plan_id: state.plan,
      billing_cycle: state.billingCycle,
      addon_ids: state.selectedAddons,
      subscription_status: state.subscriptionStatus,
      trial_started_at: state.trialStartedAt,
      trial_ends_at: state.trialEndsAt,
      stripe_customer_id: state.stripeCustomerId,
      updated_at: state.updatedAt,
    };

    if (state.trialPlanLocked) {
      payload.trial_plan_locked = state.trialPlanLocked;
    }

    const { error } = await supabase.from("billing_accounts").upsert(payload, { onConflict: "user_id" });
    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.warn("billing_remote_save_failed", error);
    return false;
  }
};

export const isEntrepriseTabLockedByBilling = (
  tabId: string,
  billingState: EntrepriseBillingState | null,
) => {
  if (!billingState) return false;
  if (billingState.subscriptionStatus === "active") return false;
  if (billingState.subscriptionStatus === "trial") return false;
  return !ENTREPRISE_TRIAL_ALLOWED_TABS.has(tabId);
};

export const getPlanById = (planId: BillingPlanId) =>
  ABONNEMENT_PLANS.find((plan) => plan.id === planId) || ABONNEMENT_PLANS[0];

export const getPlanPriceCents = (planId: BillingPlanId, cycle: BillingCycle) => {
  const plan = getPlanById(planId);
  return cycle === "yearly" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
};

export const getPlanYearlyReferenceCents = (planId: BillingPlanId) => {
  const plan = getPlanById(planId);
  return plan.monthlyPriceCents * 12;
};

export const getPlanYearlySavingsCents = (planId: BillingPlanId) => {
  const plan = getPlanById(planId);
  return Math.max(0, getPlanYearlyReferenceCents(planId) - plan.yearlyPriceCents);
};

export const getYearlyEquivalentMonthlyCents = (yearlyPriceCents: number) => Math.round(yearlyPriceCents / 12);

export const getAddonById = (addonId: string) => BILLING_ADDONS.find((addon) => addon.id === addonId);

export const getAddonPriceCents = (addonId: string, cycle: BillingCycle) => {
  const addon = getAddonById(addonId);
  if (!addon) return 0;
  return cycle === "yearly" ? addon.yearlyPriceCents : addon.monthlyPriceCents;
};

export const computeBillingTotals = (
  planId: BillingPlanId,
  cycle: BillingCycle,
  selectedAddons: string[],
): BillingTotals => {
  const planHtCents = getPlanPriceCents(planId, cycle);
  const addonsHtCents = selectedAddons.reduce((sum, addonId) => sum + getAddonPriceCents(addonId, cycle), 0);
  const subtotalHtCents = planHtCents + addonsHtCents;
  const vatCents = Math.round(subtotalHtCents * 0.2);
  const totalTtcCents = subtotalHtCents + vatCents;
  return {
    planHtCents,
    addonsHtCents,
    subtotalHtCents,
    vatCents,
    totalTtcCents,
  };
};

export const formatEuroFromCents = (amountCents: number) => {
  return (amountCents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
};

export const createPaidInvoice = (
  planId: BillingPlanId,
  cycle: BillingCycle,
  selectedAddons: string[],
  options?: {
    amountHtCents?: number;
    amountTtcCents?: number;
    stripeInvoiceId?: string | null;
    pdfUrl?: string | null;
  },
): BillingInvoice => {
  const computed = computeBillingTotals(planId, cycle, selectedAddons);
  const amountHtCents = options?.amountHtCents ?? computed.subtotalHtCents;
  const amountTtcCents = options?.amountTtcCents ?? computed.totalTtcCents;
  const now = nowIso();
  return {
    id: createInvoiceId(),
    invoiceNumber: makeInvoiceNumber(),
    status: "paid",
    amountHtCents,
    amountTtcCents,
    vatRate: 0.2,
    currency: "EUR",
    periodLabel: cycle === "yearly" ? "Abonnement annuel" : "Abonnement mensuel",
    issuedAt: now,
    paidAt: now,
    pdfUrl: options?.pdfUrl ?? null,
    stripeInvoiceId: options?.stripeInvoiceId ?? null,
  };
};
