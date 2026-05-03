import { envoyerEmail, emailCandidatureStatut } from "@/lib/emails";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";
import { Sparkles, Wand2, Users, BarChart3, LogOut, Building2, Plus, FileText, Camera, Trash2, CheckCircle, Eye, EyeOff, Send, MessageSquare, ChevronDown, Search, MapPin, Euro, GraduationCap, Calendar, Briefcase, Wrench, Mail, Check, X, Pencil, Menu, ArrowLeft, CreditCard } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emailNouvelleOffreTalent } from "@/lib/emails";
import { REQUESTABLE_DOCUMENTS, getRequestStatusMeta } from "@/lib/documentRequests";
import {
  formatTalentAvailabilityLabel,
  parseTalentAvailabilityFromBio,
  stripTalentAvailabilityMetadata,
} from "@/lib/talentAvailability";
import {
  ABONNEMENT_PLANS,
  BILLING_ADDONS,
  BILLING_GUARANTEES,
  BILLING_PAYMENT_METHODS,
  BillingCycle,
  BillingInvoice,
  BillingPlanId,
  BillingProfile,
  EntrepriseBillingState,
  computeBillingTotals,
  createPaidInvoice,
  formatEuroFromCents,
  getAddonById,
  getAddonPriceCents,
  getPlanById,
  getPlanPriceCents,
  getPlanYearlyReferenceCents,
  getPlanYearlySavingsCents,
  getYearlyEquivalentMonthlyCents,
  isEntrepriseTabLockedByBilling,
  mergeEntrepriseBillingStates,
  fetchEntrepriseBillingStateRemote,
  loadEntrepriseBillingState,
  saveEntrepriseBillingState,
  saveEntrepriseBillingStateRemote,
} from "@/lib/entrepriseBilling";

const SECTEURS = [
  "Aéronautique & Spatial", "Agriculture & Ressources naturelles", "Agroalimentaire",
  "Architecture & Urbanisme", "Artisanat", "Arts Culture & Loisirs", "Assurance",
  "Audit & Conseil", "Automobile", "BTP & Construction", "Bâtiment second œuvre",
  "Banque & Crédit", "Chimie & Matériaux", "Coiffure & Esthétique", "Commerce & Distribution",
  "Communication & Médias", "Conduite & Livraison", "Cybersécurité", "Défense & Sécurité",
  "E-commerce", "Éducation & Formation", "Électroménager & Réparation", "Énergie & Environnement",
  "Événementiel", "Finance & Banque", "Gouvernance & Administration publique", "Grande distribution",
  "Hôtellerie & Tourisme", "Immobilier", "Import & Export", "Industrie manufacturière",
  "Informatique & Technologie", "Intelligence artificielle & Data", "Juridique & Droit",
  "Logistique & Supply chain", "Luxe & Mode", "Maintenance & Facility management",
  "Manutention & Entreposage", "Marine & Pêche", "Marketing & Publicité", "Nucléaire",
  "ONG & Associations", "Pétrole & Gaz", "Pharmacie & Biotechnologie",
  "Recherche & Développement", "Ressources humaines & Recrutement", "Restauration",
  "Santé & Médical", "Sécurité privée", "Services à la personne", "Services funéraires",
  "Sport & Bien-être", "Télécommunications", "Textile & Habillement", "Transport & Mobilité",
  "Transport de marchandises", "Travaux publics", "Vétérinaire & Animalerie",
];

const CONTRATS = [
  "CDI", "CDI Cadre", "CDD", "CDD - Court terme (jusqu'à 3 mois)",
  "CDD - Court terme (jusqu'à 6 mois)", "CDD Renouvelable", "Intérim", "Freelance",
  "Stage", "Alternance", "Contrat de professionnalisation", "Contrat étudiant",
  "Service civique", "Intermittent",
];

const DISPLAY_LABELS: Record<string, string> = {
  "Aeronautique & Spatial": "Aéronautique & Spatial",
  "Batiment second oeuvre": "Bâtiment second œuvre",
  "Banque & Credit": "Banque & Crédit",
  "Chimie & Materiaux": "Chimie & Matériaux",
  "Coiffure & Esthetique": "Coiffure & Esthétique",
  "Communication & Medias": "Communication & Médias",
  "Cybersecurite": "Cybersécurité",
  "Defense & Securite": "Défense & Sécurité",
  "Education & Formation": "Éducation & Formation",
  "Electromenager & Reparation": "Électroménager & Réparation",
  "Energie & Environnement": "Énergie & Environnement",
  "Evenementiel": "Événementiel",
  "Hotellerie & Tourisme": "Hôtellerie & Tourisme",
  "Industrie manufacturiere": "Industrie manufacturière",
  "Marine & Peche": "Marine & Pêche",
  "Marketing & Publicite": "Marketing & Publicité",
  "Nucleaire": "Nucléaire",
  "Petrole & Gaz": "Pétrole & Gaz",
  "Recherche & Developpement": "Recherche & Développement",
  "Sante & Medical": "Santé & Médical",
  "Securite privee": "Sécurité privée",
  "Services a la personne": "Services à la personne",
  "Services funeraires": "Services funéraires",
  "Sport & Bien-etre": "Sport & Bien-être",
  "Telecommunications": "Télécommunications",
  "Transport & Mobilite": "Transport & Mobilité",
  "Veterinaire & Animalerie": "Vétérinaire & Animalerie",
  "CDD - Court terme (jusqu a 3 mois)": "CDD - Court terme (jusqu'à 3 mois)",
  "CDD - Court terme (jusqu a 6 mois)": "CDD - Court terme (jusqu'à 6 mois)",
  "Interim": "Intérim",
  "Contrat etudiant": "Contrat étudiant",
  "Sans diplome": "Sans diplôme",
  "Bac +4 (Maitrise)": "Bac +4 (Maîtrise)",
  "Bac +5 (Master, Ingenieur)": "Bac +5 (Master, Ingénieur)",
  "Habilitation electrique": "Habilitation électrique",
  "Teletravail": "Télétravail",
  "Vehicule de fonction": "Véhicule de fonction",
  "Participation aux benefices": "Participation aux bénéfices",
  "13eme mois": "13e mois",
};

const formatDisplayLabel = (value?: string | null) => {
  if (!value) return "";
  return DISPLAY_LABELS[value] || value;
};

const formatDisplayList = (value?: string | null) => {
  if (!value) return "";
  return value
    .split(",")
    .map((item) => formatDisplayLabel(item.trim()))
    .join(", ");
};

const getDisplayCandidatureStatus = (status?: string | null) => {
  if (status === "envoyee") return "En attente";
  if (status === "entretien") return "En entretien";
  if (status === "acceptee") return "Acceptée";
  if (status === "refusee") return "Refusée";
  return status || "";
};

type LocationSuggestion = {
  label: string;
  value: string;
};

const normalizeLocationSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const buildFranceLocationApiUrl = (query: string) => {
  const trimmed = query.trim();
  const base = "https://geo.api.gouv.fr/communes?fields=departement,codesPostaux&boost=population&limit=8";

  if (/^\d{5}$/.test(trimmed)) {
    return `${base}&codePostal=${encodeURIComponent(trimmed)}`;
  }

  if (/^\d{2,3}$/.test(trimmed)) {
    return `${base}&codeDepartement=${encodeURIComponent(trimmed)}`;
  }

  return `${base}&nom=${encodeURIComponent(trimmed)}`;
};

const formatFranceLocationSuggestion = (commune: any): LocationSuggestion | null => {
  const city = commune?.nom?.trim();
  if (!city) return null;

  const postalCode = Array.isArray(commune.codesPostaux) && commune.codesPostaux.length > 0 ? commune.codesPostaux[0] : "";
  const department = commune?.departement?.nom?.trim() || "";

  return {
    label: `${city}${postalCode ? ` (${postalCode})` : ""}${department ? ` - ${department}` : ""}`,
    value: postalCode ? `${city} (${postalCode})` : city,
  };
};

const dedupeLocationSuggestions = (suggestions: LocationSuggestion[]) => {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    const key = normalizeLocationSearch(suggestion.label);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const LocationAutocompleteInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [fetchFailed, setFetchFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      setLoadingSuggestions(false);
      setFetchFailed(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      setFetchFailed(false);

      try {
        const response = await fetch(buildFranceLocationApiUrl(query), { signal: controller.signal });
        if (!response.ok) throw new Error("location_fetch_failed");

        const communes = await response.json();
        const suggestions = dedupeLocationSuggestions(
          (communes || [])
            .map(formatFranceLocationSuggestion)
            .filter(Boolean) as LocationSuggestion[],
        );

        setLocationSuggestions(suggestions);
      } catch (error: any) {
        if (controller.signal.aborted) return;
        setLocationSuggestions([]);
        setFetchFailed(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSuggestions(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [value]);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm pl-10 pr-10 focus:outline-none focus:border-accent/50"
          placeholder={placeholder}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
              setLocationSuggestions([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            X
          </button>
        )}
      </div>

      {open && value.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-xl">
          {loadingSuggestions ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">Recherche des villes et codes postaux...</p>
          ) : locationSuggestions.length > 0 ? (
            locationSuggestions.map((suggestion) => (
              <button
                key={`${suggestion.label}-${suggestion.value}`}
                type="button"
                onClick={() => {
                  onChange(suggestion.value);
                  setOpen(false);
                }}
                className="w-full border-b border-border/50 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-secondary"
              >
                {suggestion.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              {fetchFailed
                ? "Impossible de charger les suggestions pour le moment. Vous pouvez quand même saisir la ville manuellement."
                : "Aucune ville trouvée pour cette recherche."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SecteurSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const filtres = SECTEURS.filter(s => s.toLowerCase().includes(recherche.toLowerCase()));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between focus:outline-none hover:border-accent/30 transition-colors">
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{value ? formatDisplayLabel(value) : "Rechercher un secteur..."}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input autoFocus value={recherche} onChange={(e) => setRecherche(e.target.value)} className="w-full bg-secondary rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none" placeholder="Rechercher..." />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {value && (<button onClick={() => { onChange(""); setOpen(false); setRecherche(""); }} className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">Effacer la sélection</button>)}
            {filtres.length === 0 ? (<p className="text-xs text-muted-foreground text-center py-3">Aucun résultat</p>) : filtres.map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); setRecherche(""); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${value === s ? "text-accent bg-accent/5" : ""}`}>
                {value === s && <Check className="w-3 h-3 inline mr-1" />}{s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "profil", label: "Mon Entreprise", icon: Building2 },
  { id: "offres", label: "Créer une offre IA", icon: Wand2 },
  { id: "mes-offres", label: "Mes offres", icon: Eye },
  { id: "abonnement", label: "Abonnement", icon: CreditCard },
  { id: "candidats", label: "Candidatures reçues", icon: Users },
  { id: "messagerie", label: "Messagerie", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
];

const readEntrepriseSignalMap = (key: string): Record<string, boolean> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeEntrepriseSignalMap = (key: string, value: Record<string, boolean>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const EntrepriseDashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(params.get("tab") || "dashboard");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nbOffres, setNbOffres] = useState(0);
  const [nbCandidatures, setNbCandidatures] = useState(0);
  const [nbMessagesNonLus, setNbMessagesNonLus] = useState(0);
  const [nbNouvellesCandidatures, setNbNouvellesCandidatures] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [offresRefreshToken, setOffresRefreshToken] = useState(0);
  const [billingState, setBillingState] = useState<EntrepriseBillingState | null>(null);
  const candidaturesRecuesSignalKey = user ? `spotted-talent:entreprise-candidatures:${user.id}` : "";
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || "Dashboard";

  useEffect(() => { if (!loading && !user) navigate("/entreprise"); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const localState = loadEntrepriseBillingState(user.id);
    setBillingState(localState);

    let cancelled = false;
    void (async () => {
      const remoteState = await fetchEntrepriseBillingStateRemote(user.id);
      if (cancelled || !remoteState) return;
      const mergedState = mergeEntrepriseBillingStates(localState, remoteState);
      if (cancelled) return;
      setBillingState(mergedState);
      saveEntrepriseBillingState(user.id, mergedState);
      void saveEntrepriseBillingStateRemote(user.id, mergedState);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!billingState) return;
    if (isEntrepriseTabLockedByBilling(activeTab, billingState)) {
      setActiveTab("abonnement");
      toast.error("Votre essai gratuit de 30 jours est terminé. Activez un plan pour débloquer cette rubrique.");
    }
  }, [activeTab, billingState]);

  useEffect(() => {
    if (!user || !billingState) return;

    const url = new URL(window.location.href);
    const status = url.searchParams.get("billing_status");
    if (!status) return;

    if (status === "success") {
      const planParam = url.searchParams.get("plan");
      const cycleParam = url.searchParams.get("cycle");
      const nextPlan: BillingPlanId =
        planParam === "boost" || planParam === "premium" || planParam === "starter"
          ? planParam
          : billingState.plan;
      const nextCycle: BillingCycle = cycleParam === "yearly" ? "yearly" : "monthly";
      const invoice = createPaidInvoice(nextPlan, nextCycle, billingState.selectedAddons);
      const nextState: EntrepriseBillingState = {
        ...billingState,
        plan: nextPlan,
        trialPlanLocked: billingState.trialPlanLocked,
        billingCycle: nextCycle,
        subscriptionStatus: "active",
        invoices: [invoice, ...billingState.invoices].slice(0, 20),
        updatedAt: new Date().toISOString(),
      };
      setBillingState(nextState);
      saveEntrepriseBillingState(user.id, nextState);
      void saveEntrepriseBillingStateRemote(user.id, nextState);
      toast.success("Paiement validé. Votre abonnement entreprise est actif.");
    } else if (status === "cancel") {
      toast.message("Paiement annulé. Aucun prélèvement n'a été effectué.");
    }

    url.searchParams.delete("billing_status");
    url.searchParams.delete("plan");
    url.searchParams.delete("cycle");
    const query = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${query ? `?${query}` : ""}`);
  }, [user, billingState]);

  useEffect(() => {
    if (user) {
      const chargerAvatar = async () => {
        const { data: list } = await supabase.storage.from("avatars").list(user.id);
        if (list && list.length > 0) {
          const fichier = list[0];
          const { data } = supabase.storage.from("avatars").getPublicUrl(`${user.id}/${fichier.name}`);
          setAvatarUrl(data.publicUrl + "?t=" + Date.now());
        }
      };
      const chargerStats = async () => {
        const { count: countOffres } = await supabase.from("offres").select("*", { count: "exact", head: true }).eq("entreprise_id", user.id);
        setNbOffres(countOffres || 0);
        const { data: offres } = await supabase.from("offres").select("id").eq("entreprise_id", user.id);
        if (offres && offres.length > 0) {
          const ids = offres.map((o: any) => o.id);
          const { count: countCandidatures } = await supabase.from("candidatures").select("*", { count: "exact", head: true }).in("offre_id", ids);
          setNbCandidatures(countCandidatures || 0);
        }
      };
      const chargerNotifications = async () => {
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("destinataire_id", user.id).eq("lu", false);
        setNbMessagesNonLus(count || 0);
      };
      const chargerNouvellesCandidatures = async () => {
        const { data: offres } = await supabase.from("offres").select("id").eq("entreprise_id", user.id);
        if (!offres || offres.length === 0) {
          setNbNouvellesCandidatures(0);
          return;
        }
        const ids = offres.map((o: any) => o.id);
        const { data: candidatures } = await supabase.from("candidatures").select("id").in("offre_id", ids);
        const seenMap = readEntrepriseSignalMap(candidaturesRecuesSignalKey);
        const count = (candidatures || []).filter((c: any) => !seenMap[c.id]).length;
        setNbNouvellesCandidatures(count);
      };
      chargerAvatar(); chargerStats(); chargerNotifications(); chargerNouvellesCandidatures();
      const interval = setInterval(() => {
        chargerNotifications();
        chargerNouvellesCandidatures();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, candidaturesRecuesSignalKey]);

  const marquerCandidaturesRecuesCommeVues = async () => {
    if (!user || !candidaturesRecuesSignalKey) return;
    const { data: offres } = await supabase.from("offres").select("id").eq("entreprise_id", user.id);
    if (!offres || offres.length === 0) {
      writeEntrepriseSignalMap(candidaturesRecuesSignalKey, {});
      setNbNouvellesCandidatures(0);
      return;
    }
    const ids = offres.map((o: any) => o.id);
    const { data: candidatures } = await supabase.from("candidatures").select("id").in("offre_id", ids);
    const nextSignals = (candidatures || []).reduce((acc: Record<string, boolean>, candidature: any) => {
      acc[candidature.id] = true;
      return acc;
    }, {});
    writeEntrepriseSignalMap(candidaturesRecuesSignalKey, nextSignals);
    setNbNouvellesCandidatures(0);
  };

  if (loading) return (<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Chargement...</div>);
  if (user && !billingState) return (<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Chargement...</div>);

  const candidatureIdFromUrl = params.get("candidature");
  const billingBannerClass =
    billingState?.subscriptionStatus === "expired" || billingState?.subscriptionStatus === "canceled"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : billingState?.subscriptionStatus === "past_due"
        ? "border-orange-500/30 bg-orange-500/10 text-orange-100"
        : "border-amber-500/30 bg-amber-500/10 text-amber-100";
  const billingBannerText =
    billingState?.subscriptionStatus === "expired" || billingState?.subscriptionStatus === "canceled"
      ? "Votre essai gratuit de 30 jours est expiré. Activez un plan dans l'onglet Abonnement pour débloquer les rubriques métier."
      : billingState?.subscriptionStatus === "past_due"
        ? "Un paiement est en attente. Mettez à jour votre moyen de paiement pour garder toutes les rubriques actives."
        : "Essai gratuit actif : vous pouvez tester la plateforme pendant 30 jours avant activation d'un abonnement.";

  return (
    <div className="dashboard-shell min-h-screen lg:flex">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className={`dashboard-sidebar fixed inset-y-0 left-0 z-40 flex h-full w-[17rem] max-w-[86vw] flex-col transition-transform duration-300 lg:w-64 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex items-center justify-between border-b border-border/50 p-4 sm:p-6">
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="gradient-text">Spotted Talent</span>
          </a>
          <button
            type="button"
            className="rounded-xl border border-border/70 p-2 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 border-b border-border/50">
          <div className="dashboard-profile-card flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (<img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={() => setAvatarUrl(null)} />) : (<Building2 className="w-10 h-10 text-accent/60" />)}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center border-2 border-background hover:bg-accent/80 transition-colors cursor-pointer">
                <Camera className="w-3 h-3 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file || !user) return;
                  const ext = file.name.split(".").pop();
                  const path = `${user.id}/avatar.${ext}`;
                  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
                  if (!error) { const { data } = supabase.storage.from("avatars").getPublicUrl(path); setAvatarUrl(data.publicUrl + "?t=" + Date.now()); toast.success("Logo mis à jour !"); }
                }} />
              </label>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">{profile?.full_name || user?.email}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">Entreprise</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const tabLocked = isEntrepriseTabLockedByBilling(id, billingState);
            return (
            <button
              key={id}
              onClick={() => {
                if (tabLocked) {
                  setActiveTab("abonnement");
                  setMobileNavOpen(false);
                  toast.error("Essai gratuit expiré. Activez un plan pour accéder à cette section.");
                  return;
                }
                setActiveTab(id);
                setMobileNavOpen(false);
                if (id === "messagerie") setNbMessagesNonLus(0);
                if (id === "candidats") void marquerCandidaturesRecuesCommeVues();
              }}
              className={`dashboard-nav-item ${activeTab === id ? "dashboard-nav-item-accent-active" : ""} ${tabLocked ? "cursor-not-allowed opacity-55" : ""}`}
              title={tabLocked ? "Essai expiré - activez un plan" : undefined}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{label}</span>
              {id === "messagerie" && nbMessagesNonLus > 0 && (<span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{nbMessagesNonLus}</span>)}
              {id === "candidats" && nbNouvellesCandidatures > 0 && (<span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">{nbNouvellesCandidatures}</span>)}
              {tabLocked && <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">Bloqué</span>}
            </button>
          )})}
        </nav>
        <div className="p-4 border-t border-border/50">
          <Button variant="ghost-glow" size="sm" className="w-full" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </aside>
      <main className="dashboard-main min-h-screen flex-1 px-4 pb-8 pt-20 sm:px-6 lg:ml-64 lg:p-8">
        {billingState?.subscriptionStatus !== "active" && (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${billingBannerClass}`}>{billingBannerText}</div>
        )}
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-card/80 text-foreground shadow-sm transition-colors hover:border-accent/30"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Espace entreprise</p>
            <p className="truncate text-sm font-semibold text-foreground">{activeTabLabel}</p>
          </div>
        </div>
        {activeTab === "dashboard" && <DashboardHome profile={profile} nbOffres={nbOffres} nbCandidatures={nbCandidatures} user={user} onNavigate={setActiveTab} />}
        {activeTab === "profil" && <ProfilEntrepriseTab profile={profile} user={user} avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />}
        {activeTab === "offres" && <OffresTab user={user} onOffrePubliee={() => { setNbOffres(n => n + 1); setOffresRefreshToken((token) => token + 1); setActiveTab("mes-offres"); }} />}
        {activeTab === "mes-offres" && <MesOffresTab user={user} refreshToken={offresRefreshToken} onOffresChanged={setNbOffres} />}
        {activeTab === "abonnement" && user && billingState && (
          <AbonnementEntrepriseTab
            user={user}
            billingState={billingState}
            onBillingChange={setBillingState}
          />
        )}
        {activeTab === "candidats" && <CandidatsTab user={user} />}
        {activeTab === "messagerie" && <MessagerieTab user={user} candidatureIdFromUrl={candidatureIdFromUrl} />}
        {activeTab === "documents" && <DocumentsEntrepriseTab />}
      </main>
    </div>
  );
};

const AbonnementEntrepriseTab = ({
  user,
  billingState,
  onBillingChange,
}: {
  user: any;
  billingState: EntrepriseBillingState;
  onBillingChange: (next: EntrepriseBillingState) => void;
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<BillingPlanId>(billingState.plan);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(billingState.billingCycle);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(billingState.selectedAddons);
  const [billingProfileDraft, setBillingProfileDraft] = useState<BillingProfile>(billingState.billingProfile);
  const [checkoutPlanId, setCheckoutPlanId] = useState<BillingPlanId | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    setSelectedPlanId(billingState.plan);
    setBillingCycle(billingState.billingCycle);
    setSelectedAddons(billingState.selectedAddons);
    setBillingProfileDraft(billingState.billingProfile);
  }, [
    billingState.plan,
    billingState.billingCycle,
    billingState.selectedAddons,
    billingState.billingProfile,
  ]);

  const planEnCours = getPlanById(billingState.plan);
  const trialEndsAtDate = new Date(billingState.trialEndsAt);
  const trialDaysLeft = Math.max(0, Math.ceil((trialEndsAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isTrialExpired = billingState.subscriptionStatus === "expired";
  const isActive = billingState.subscriptionStatus === "active";
  const isPastDue = billingState.subscriptionStatus === "past_due";
  const trialLockedPlanId = billingState.trialPlanLocked;
  const trialLockedPlanLabel = trialLockedPlanId ? getPlanById(trialLockedPlanId).name : null;

  const totals = useMemo(
    () => computeBillingTotals(selectedPlanId, billingCycle, selectedAddons),
    [selectedPlanId, billingCycle, selectedAddons],
  );

  const renderPaymentLogo = (methodId: string, label: string) => {
    if (methodId === "visa") {
      return (
        <div className="inline-flex h-8 min-w-[72px] items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 px-2.5 text-[11px] font-black tracking-[0.14em] text-white">
          {label}
        </div>
      );
    }

    if (methodId === "mastercard") {
      return (
        <div className="relative h-8 w-12">
          <span className="absolute left-0 top-0 h-8 w-8 rounded-full bg-red-500/95" />
          <span className="absolute left-4 top-0 h-8 w-8 rounded-full bg-orange-400/95 mix-blend-screen" />
        </div>
      );
    }

    if (methodId === "apple-pay") {
      return (
        <div className="inline-flex h-8 items-center justify-center rounded-md border border-white/15 bg-zinc-900 px-2.5 text-[11px] font-bold tracking-wide text-zinc-100">
          APPLE PAY
        </div>
      );
    }

    if (methodId === "google-pay") {
      return (
        <div className="inline-flex h-8 items-center justify-center rounded-md border border-white/15 bg-gradient-to-r from-emerald-400/20 via-sky-400/20 to-orange-300/20 px-2.5 text-[11px] font-bold tracking-wide text-foreground">
          GOOGLE PAY
        </div>
      );
    }

    return (
      <div className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/80 bg-secondary/50 px-2.5 text-[11px] font-bold tracking-wide text-foreground">
        <Euro className="h-3.5 w-3.5 text-primary" />
        <span>{label}</span>
      </div>
    );
  };

  const buildNextState = (
    overrides?: Partial<EntrepriseBillingState>,
    planIdOverride?: BillingPlanId,
  ): EntrepriseBillingState => {
    const base: EntrepriseBillingState = {
      ...billingState,
      plan: planIdOverride || selectedPlanId,
      billingCycle,
      selectedAddons,
      billingProfile: billingProfileDraft,
      updatedAt: new Date().toISOString(),
    };
    return { ...base, ...(overrides || {}) };
  };

  const persistBillingState = (next: EntrepriseBillingState) => {
    onBillingChange(next);
    saveEntrepriseBillingState(user.id, next);
    void saveEntrepriseBillingStateRemote(user.id, next);
  };

  const enregistrerFacturation = () => {
    if (!billingProfileDraft.legalName.trim()) {
      toast.error("Renseignez la raison sociale de l'entreprise.");
      return;
    }
    if (!billingProfileDraft.billingEmail.trim()) {
      toast.error("Renseignez un e-mail de facturation.");
      return;
    }
    const next = buildNextState();
    persistBillingState(next);
    toast.success("Coordonnées de facturation enregistrées.");
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => (
      prev.includes(addonId)
        ? prev.filter((item) => item !== addonId)
        : [...prev, addonId]
    ));
  };

  const demarrerCheckoutStripe = async (planId: BillingPlanId) => {
    if (!billingProfileDraft.legalName.trim()) {
      toast.error("Ajoutez d'abord la raison sociale dans la section facturation B2B.");
      return;
    }
    if (!billingProfileDraft.billingEmail.trim()) {
      toast.error("Ajoutez d'abord un e-mail de facturation.");
      return;
    }

    const draft = buildNextState(undefined, planId);
    persistBillingState(draft);

    setCheckoutPlanId(planId);
    try {
      const successUrl = `${window.location.origin}/entreprise/dashboard?tab=abonnement&billing_status=success&plan=${planId}&cycle=${billingCycle}`;
      const cancelUrl = `${window.location.origin}/entreprise/dashboard?tab=abonnement&billing_status=cancel`;
      const { data, error } = await supabase.functions.invoke("stripe-create-checkout-session", {
        body: {
          planId,
          billingCycle,
          addons: selectedAddons,
          billingProfile: billingProfileDraft,
          successUrl,
          cancelUrl,
        },
      });
      if (error) {
        throw error;
      }
      if (!data?.url || typeof data.url !== "string") {
        throw new Error("checkout_session_missing_url");
      }
      window.location.href = data.url;
    } catch (error: any) {
      console.error("stripe_checkout_error", error);
      toast.error("Checkout Stripe indisponible. Utilisez le mode test en attendant la connexion serveur.");
    } finally {
      setCheckoutPlanId(null);
    }
  };

  const activerModeTest = (planId: BillingPlanId) => {
    if (billingState.subscriptionStatus !== "trial") {
      toast.error("L'essai gratuit n'est plus disponible sur ce compte.");
      return;
    }

    if (trialLockedPlanId) {
      toast.error(`Essai gratuit déjà validé sur ${trialLockedPlanLabel}. Impossible d'activer un second essai.`);
      return;
    }

    const invoice = createPaidInvoice(planId, billingCycle, selectedAddons);
    const next: EntrepriseBillingState = {
      ...buildNextState({ trialPlanLocked: planId }, planId),
      subscriptionStatus: "active",
      invoices: [invoice, ...billingState.invoices].slice(0, 20),
    };
    persistBillingState(next);
    toast.success("Plan activé en mode test. Aucun débit réel n'est appliqué.");
  };

  const ouvrirPortailStripe = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-create-customer-portal", {
        body: {
          returnUrl: `${window.location.origin}/entreprise/dashboard?tab=abonnement`,
        },
      });
      if (error) {
        throw error;
      }
      if (!data?.url || typeof data.url !== "string") {
        throw new Error("portal_session_missing_url");
      }
      window.location.href = data.url;
    } catch (error: any) {
      console.error("stripe_portal_error", error);
      toast.error("Portail Stripe indisponible pour le moment.");
    } finally {
      setOpeningPortal(false);
    }
  };

  const priceSuffix = billingCycle === "yearly" ? "/an" : "/mois";
  const selectedPlan = getPlanById(selectedPlanId);
  const selectedPlanYearlySavingsCents = getPlanYearlySavingsCents(selectedPlanId);
  const selectedAddonsYearlySavingsCents = selectedAddons.reduce((sum, addonId) => {
    const addon = getAddonById(addonId);
    if (!addon) return sum;
    return sum + Math.max(0, addon.monthlyPriceCents * 12 - addon.yearlyPriceCents);
  }, 0);
  const totalYearlySavingsCents = billingCycle === "yearly" ? selectedPlanYearlySavingsCents + selectedAddonsYearlySavingsCents : 0;
  const canLaunchCheckout = Boolean(
    billingProfileDraft.legalName.trim() && billingProfileDraft.billingEmail.trim(),
  );
  const isTrialModeAvailable = billingState.subscriptionStatus === "trial" && !trialLockedPlanId;
  const statusLabel = isActive
    ? "Actif"
    : isPastDue
      ? "Paiement en retard"
      : isTrialExpired
        ? "Bloqué"
        : "Essai";
  const statusColor = isActive
    ? "text-emerald-300"
    : isPastDue
      ? "text-orange-300"
      : isTrialExpired
        ? "text-red-300"
        : "text-amber-300";
  const sortedInvoices = [...billingState.invoices].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
  );

  const updateBillingProfileField = (field: keyof BillingProfile, value: string) => {
    setBillingProfileDraft((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <CreditCard className="h-3.5 w-3.5" />
              Facturation entreprise
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Abonnement et options</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Choisissez votre formule, ajoutez vos options métier et lancez votre paiement sécurisé.
            </p>
          </div>
          <div className="dashboard-subcard p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Plan actif</p>
            <p className="mt-3 text-xl font-semibold text-foreground">{planEnCours.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatEuroFromCents(getPlanPriceCents(billingState.plan, billingState.billingCycle))} {billingState.billingCycle === "yearly" ? "/an" : "/mois"}
            </p>
            {billingState.billingCycle === "yearly" && (
              <p className="mt-1 text-xs text-emerald-300">
                Soit {formatEuroFromCents(getYearlyEquivalentMonthlyCents(getPlanPriceCents(billingState.plan, "yearly")))} /mois
                • Économie {formatEuroFromCents(getPlanYearlySavingsCents(billingState.plan))} /an
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {billingState.updatedAt
                ? `Dernière mise à jour : ${new Date(billingState.updatedAt).toLocaleDateString("fr-FR")}`
                : "Aucun changement récent enregistré."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-stat-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Annonces actives incluses</p>
          <p className="text-3xl font-bold">{billingState.plan === "starter" ? "1" : billingState.plan === "boost" ? "5" : "Illimitées"}</p>
          <p className="text-xs text-muted-foreground mt-1">Selon votre formule actuelle.</p>
        </div>
        <div className="dashboard-stat-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Essai gratuit</p>
          <p className="text-3xl font-bold">{isActive ? "Terminé" : `${trialDaysLeft} j`}</p>
          <p className="text-xs text-muted-foreground mt-1">Fin prévue : {trialEndsAtDate.toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="dashboard-stat-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Mode de paiement</p>
          <p className="text-3xl font-bold">Stripe</p>
          <p className="text-xs text-muted-foreground mt-1">Checkout sécurisé + portail client.</p>
        </div>
        <div className="dashboard-stat-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">État facturation</p>
          <p className={`text-3xl font-bold ${statusColor}`}>
            {statusLabel}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isActive
              ? "Abonnement actif."
              : isPastDue
                ? "Un règlement est attendu pour éviter le blocage."
              : isTrialExpired
                ? "Essai expiré: activez un plan pour débloquer."
                : "Essai en cours, sans prélèvement réel."}
          </p>
        </div>
      </div>

      <div className={`dashboard-panel p-5 sm:p-6 ${isTrialExpired ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
        <p className="text-sm font-semibold text-foreground">Essai gratuit 30 jours</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {isActive
            ? "Votre entreprise est sortie du mode essai et utilise un plan actif."
            : isTrialExpired
              ? "Votre essai est terminé. Les rubriques métier sont bloquées automatiquement jusqu'à l'activation d'un plan."
              : `Votre essai est actif. Il reste ${trialDaysLeft} jour(s) avant blocage automatique des rubriques métier.`}
        </p>
        {billingState.subscriptionStatus === "trial" && (
          <p className="mt-2 text-xs text-amber-200">
            Essai unique par compte entreprise: un seul abonnement peut utiliser l'essai gratuit.
          </p>
        )}
      </div>

      <div className="dashboard-panel p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Cycle de facturation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Passez en annuel pour réduire le coût: {formatEuroFromCents(selectedPlanYearlySavingsCents)} d'économie sur le plan.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-border bg-secondary/40 p-1">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                billingCycle === "monthly" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                billingCycle === "yearly" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel (-20%)
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {ABONNEMENT_PLANS.map((plan) => {
          const actif = plan.id === billingState.plan && isActive && billingState.billingCycle === billingCycle;
          const planPriceCents = getPlanPriceCents(plan.id, billingCycle);
          const yearlyReferenceCents = getPlanYearlyReferenceCents(plan.id);
          const yearlySavingsCents = getPlanYearlySavingsCents(plan.id);
          const yearlyEquivalentMonthlyCents = getYearlyEquivalentMonthlyCents(planPriceCents);
          const checkoutLoading = checkoutPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`dashboard-panel p-5 sm:p-6 ${actif ? "border-primary/40 bg-primary/5 shadow-[0_18px_40px_-28px_hsl(var(--primary)/0.9)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-foreground">{plan.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                {actif && <span className="rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">Actif</span>}
              </div>
              <p className="mt-5 text-2xl font-bold text-foreground">{formatEuroFromCents(planPriceCents)} {priceSuffix}</p>
              {billingCycle === "yearly" && (
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-emerald-300">
                    Soit {formatEuroFromCents(yearlyEquivalentMonthlyCents)} /mois • Économie {formatEuroFromCents(yearlySavingsCents)} /an
                  </p>
                  <p className="text-xs text-muted-foreground line-through">
                    Prix mensuel cumulé: {formatEuroFromCents(yearlyReferenceCents)} /an
                  </p>
                </div>
              )}
              <div className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <p key={feature} className="text-sm text-muted-foreground">- {feature}</p>
                ))}
              </div>
              <div className="mt-6 space-y-2">
                <Button
                  variant={actif ? "secondary" : "glow"}
                  className="w-full"
                  disabled={checkoutLoading || !canLaunchCheckout}
                  onClick={() => demarrerCheckoutStripe(plan.id)}
                >
                  {checkoutLoading
                    ? "Ouverture du paiement..."
                    : actif
                        ? "Plan actuellement actif"
                        : "Paiement sécurisé"}
                </Button>
                {isTrialModeAvailable ? (
                  <ConfirmActionDialog
                    title={`Activer l'essai gratuit sur ${plan.name} ?`}
                    description="Cet essai gratuit est unique pour votre compte entreprise. Après validation, vous ne pourrez plus changer de formule d'essai."
                    confirmLabel="Oui, valider cet essai"
                    cancelLabel="Annuler"
                    confirmVariant="glow"
                    onConfirm={() => activerModeTest(plan.id)}
                  >
                    <Button variant="ghost-glow" className="w-full">
                      Activer en mode test
                    </Button>
                  </ConfirmActionDialog>
                ) : (
                  <Button variant="ghost-glow" className="w-full" disabled>
                    {trialLockedPlanId ? `Essai déjà validé sur ${trialLockedPlanLabel}` : "Essai indisponible"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-panel p-5 sm:p-6">
        <p className="text-sm font-semibold text-foreground">Add-ons intelligents</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Activez uniquement les options utiles à votre campagne en cours.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {BILLING_ADDONS.map((addon) => {
            const selected = selectedAddons.includes(addon.id);
            const addonPrice = getAddonPriceCents(addon.id, billingCycle);
            const addonYearlySavingsCents = Math.max(0, addon.monthlyPriceCents * 12 - addon.yearlyPriceCents);
            const addonYearlyEquivalentMonthlyCents = getYearlyEquivalentMonthlyCents(addon.yearlyPriceCents);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => toggleAddon(addon.id)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  selected
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/60 bg-secondary/20 hover:border-primary/25"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{addon.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{addon.description}</p>
                  </div>
                  <span className="rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-xs font-semibold text-foreground">
                    {formatEuroFromCents(addonPrice)} {priceSuffix}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  {selected ? "Activé" : "Cliquer pour activer"}
                </p>
                {billingCycle === "yearly" && (
                  <p className="mt-1 text-[11px] text-emerald-300">
                    Soit {formatEuroFromCents(addonYearlyEquivalentMonthlyCents)} /mois • Économie {formatEuroFromCents(addonYearlySavingsCents)} /an
                  </p>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Paiements acceptés</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {BILLING_PAYMENT_METHODS.map((method) => (
              <div
                key={method.id}
                className="rounded-2xl border border-border/70 bg-background/55 px-3 py-3 shadow-[0_12px_25px_-22px_hsl(var(--primary)/0.9)]"
              >
                <div className="flex items-center gap-2">
                  {renderPaymentLogo(method.id, method.label)}
                  {method.id !== "visa" && method.id !== "apple-pay" && method.id !== "google-pay" && (
                    <span className="text-xs font-semibold text-foreground">{method.label}</span>
                  )}
                </div>
                <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{method.caption}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-border/70 bg-background/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Fiabilité paiement</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {BILLING_GUARANTEES.map((item) => (
              <p key={item} className="rounded-xl border border-border/60 bg-secondary/35 px-3 py-2 text-xs text-muted-foreground">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="dashboard-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Coordonnées de facturation B2B</p>
            <span className="rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1 text-[11px] text-muted-foreground">Entreprise</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={billingProfileDraft.legalName}
              onChange={(e) => updateBillingProfileField("legalName", e.target.value)}
              className="rounded-xl border border-border bg-secondary/45 px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="Raison sociale"
            />
            <input
              value={billingProfileDraft.billingEmail}
              onChange={(e) => updateBillingProfileField("billingEmail", e.target.value)}
              className="rounded-xl border border-border bg-secondary/45 px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="E-mail facturation"
            />
            <input
              value={billingProfileDraft.vatNumber}
              onChange={(e) => updateBillingProfileField("vatNumber", e.target.value)}
              className="rounded-xl border border-border bg-secondary/45 px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="N° TVA intracom (optionnel)"
            />
            <input
              value={billingProfileDraft.addressLine1}
              onChange={(e) => updateBillingProfileField("addressLine1", e.target.value)}
              className="rounded-xl border border-border bg-secondary/45 px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="Adresse"
            />
            <input
              value={billingProfileDraft.postalCode}
              onChange={(e) => updateBillingProfileField("postalCode", e.target.value)}
              className="rounded-xl border border-border bg-secondary/45 px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="Code postal"
            />
            <input
              value={billingProfileDraft.city}
              onChange={(e) => updateBillingProfileField("city", e.target.value)}
              className="rounded-xl border border-border bg-secondary/45 px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="Ville"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost-glow" onClick={enregistrerFacturation}>
              Enregistrer la fiche B2B
            </Button>
            <Button variant="secondary" onClick={ouvrirPortailStripe} disabled={openingPortal}>
              {openingPortal ? "Ouverture..." : "Portail facturation Stripe"}
            </Button>
          </div>
        </div>

        <div className="dashboard-panel p-5 sm:p-6">
          <p className="text-sm font-semibold text-foreground">Récapitulatif</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{selectedPlan.name} ({billingCycle === "yearly" ? "annuel" : "mensuel"})</span>
              <span className="font-semibold">{formatEuroFromCents(totals.planHtCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Add-ons ({selectedAddons.length})</span>
              <span className="font-semibold">{formatEuroFromCents(totals.addonsHtCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-muted-foreground">Total HT</span>
              <span className="font-semibold">{formatEuroFromCents(totals.subtotalHtCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">TVA 20%</span>
              <span className="font-semibold">{formatEuroFromCents(totals.vatCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-3 text-base">
              <span className="font-semibold text-foreground">Total TTC</span>
              <span className="font-bold text-primary">{formatEuroFromCents(totals.totalTtcCents)}</span>
            </div>
            {billingCycle === "yearly" && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                <span className="text-emerald-200">Économie annuelle totale</span>
                <span className="font-semibold text-emerald-300">{formatEuroFromCents(totalYearlySavingsCents)}</span>
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Vous pourrez télécharger les factures PDF après le premier paiement confirmé.
          </p>
        </div>
      </div>

      <div className="dashboard-panel p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Historique des factures</p>
            <p className="text-xs text-muted-foreground">Suivi de vos paiements et justificatifs.</p>
          </div>
          <span className="rounded-full border border-border/60 bg-secondary/30 px-3 py-1 text-xs text-muted-foreground">
            {sortedInvoices.length} facture(s)
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {sortedInvoices.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground">
              Aucune facture pour le moment. La première apparaîtra après un paiement confirmé.
            </div>
          ) : (
            sortedInvoices.map((invoice: BillingInvoice) => (
              <div key={invoice.id} className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.periodLabel} • Émise le {new Date(invoice.issuedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-foreground">{formatEuroFromCents(invoice.amountTtcCents)}</p>
                    <p className="text-xs text-muted-foreground">{invoice.status === "paid" ? "Payée" : invoice.status}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardHome = ({ profile, nbOffres, nbCandidatures, user, onNavigate }: any) => {
  const [stats, setStats] = useState({ acceptees: 0, refusees: 0, enAttente: 0, enEntretien: 0, messagesNonLus: 0, offreTop: "" });
  useEffect(() => {
    const chargerStats = async () => {
      if (!user) return;
      const { data: offres } = await supabase.from("offres").select("id, titre").eq("entreprise_id", user.id);
      if (!offres || offres.length === 0) return;
      const ids = offres.map((o: any) => o.id);
      const { data: cands } = await supabase.from("candidatures").select("statut, offre_id").in("offre_id", ids);
      const { count: msgs } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("destinataire_id", user.id).eq("lu", false);
      const compteParOffre: Record<string, number> = {};
      cands?.forEach((c: any) => { compteParOffre[c.offre_id] = (compteParOffre[c.offre_id] || 0) + 1; });
      const topId = Object.entries(compteParOffre).sort((a, b) => b[1] - a[1])[0]?.[0];
      const offreTop = offres.find((o: any) => o.id === topId)?.titre || "";
      setStats({
        acceptees: cands?.filter((c: any) => c.statut === "acceptee").length || 0,
        refusees: cands?.filter((c: any) => c.statut === "refusee").length || 0,
        enAttente: cands?.filter((c: any) => c.statut === "envoyee").length || 0,
        enEntretien: cands?.filter((c: any) => c.statut === "entretien").length || 0,
        messagesNonLus: msgs || 0,
        offreTop,
      });
    };
    chargerStats();
  }, [user]);
  const totalReponses = stats.acceptees + stats.refusees;
  const tauxAcceptation = totalReponses > 0 ? Math.round((stats.acceptees / totalReponses) * 100) : 0;
  const responseRate = nbCandidatures > 0 ? Math.round(((stats.acceptees + stats.refusees + stats.enEntretien) / nbCandidatures) * 100) : 0;
  const primaryAlert = stats.messagesNonLus > 0
    ? `${stats.messagesNonLus} message(s) méritent une réponse rapide.`
    : stats.enAttente > 0
      ? `${stats.enAttente} candidature(s) sont encore en attente de décision.`
      : "Votre espace est à jour pour le moment.";
  const quickActions = [
    {
      title: "Créer une offre",
      description: "Rédigez puis publiez une nouvelle annonce avec l'IA.",
      icon: Wand2,
      action: () => onNavigate?.("offres"),
      cta: "Créer maintenant",
    },
    {
      title: "Voir les candidatures",
      description: "Triez les profils reçus et passez à la décision.",
      icon: Users,
      action: () => onNavigate?.("candidats"),
      cta: "Ouvrir le suivi",
    },
    {
      title: "Reprendre la messagerie",
      description: "Relancez les échanges avec les talents prioritaires.",
      icon: MessageSquare,
      action: () => onNavigate?.("messagerie"),
      cta: "Ouvrir les messages",
    },
    {
      title: "Gérer l'abonnement",
      description: "Choisissez la formule entreprise et préparez la facturation.",
      icon: CreditCard,
      action: () => onNavigate?.("abonnement"),
      cta: "Voir l'abonnement",
    },
  ];
  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              <BarChart3 className="h-3.5 w-3.5" />
              Cockpit entreprise
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">Pilotage <span className="gradient-text">Entreprise</span></h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Gardez une vue claire sur vos annonces, vos candidatures et vos échanges pour prioriser les bons profils au bon moment.
            </p>
          </div>
          <div className="dashboard-subcard p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Entreprise active</p>
                <p className="text-sm font-semibold text-foreground">{profile?.full_name || "Votre entreprise"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">Priorité du moment</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{primaryAlert}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="dashboard-subcard px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Réponses traitées</p>
                <p className="mt-2 text-2xl font-bold">{responseRate}%</p>
              </div>
              <div className="dashboard-subcard px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Offre la plus vue</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{stats.offreTop || "Aucune donnée encore"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="dashboard-stat-card p-5">
          <div className="w-11 h-11 rounded-2xl bg-accent/12 flex items-center justify-center mb-4"><Briefcase className="w-5 h-5 text-accent" /></div>
          <p className="text-muted-foreground text-xs mb-1">Offres actives</p>
          <p className="text-3xl font-bold gradient-text">{nbOffres}</p>
          <p className="text-xs text-muted-foreground mt-1">Publiées sur la plateforme</p>
        </div>
        <div className="dashboard-stat-card p-5">
          <div className="w-11 h-11 rounded-2xl bg-accent/12 flex items-center justify-center mb-4"><Users className="w-5 h-5 text-accent" /></div>
          <p className="text-muted-foreground text-xs mb-1">Candidatures reçues</p>
          <p className="text-3xl font-bold gradient-text">{nbCandidatures}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.enAttente} en attente</p>
        </div>
        <div className="dashboard-stat-card p-5">
          <div className="w-11 h-11 rounded-2xl bg-red-500/12 flex items-center justify-center mb-4"><MessageSquare className="w-5 h-5 text-red-400" /></div>
          <p className="text-muted-foreground text-xs mb-1">Messages non lus</p>
          <p className="text-3xl font-bold gradient-text">{stats.messagesNonLus}</p>
          <p className="text-xs text-muted-foreground mt-1">À traiter rapidement</p>
        </div>
        <div className="dashboard-stat-card p-5">
          <div className="w-11 h-11 rounded-2xl bg-green-500/12 flex items-center justify-center mb-4"><CheckCircle className="w-5 h-5 text-green-400" /></div>
          <p className="text-muted-foreground text-xs mb-1">Taux d'acceptation</p>
          <p className="text-3xl font-bold gradient-text">{tauxAcceptation}%</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.acceptees} acceptées / {stats.refusees} refusées</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="dashboard-panel p-6">
          <p className="text-sm font-semibold mb-4">Répartition des candidatures</p>
          <div className="space-y-3">
            <div><div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">En attente</span><span className="text-primary">{stats.enAttente}</span></div><div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-2 bg-primary rounded-full" style={{ width: nbCandidatures > 0 ? `${(stats.enAttente / nbCandidatures) * 100}%` : "0%" }} /></div></div>
            <div><div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">En entretien</span><span className="text-blue-400">{stats.enEntretien}</span></div><div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-2 bg-blue-500 rounded-full" style={{ width: nbCandidatures > 0 ? `${(stats.enEntretien / nbCandidatures) * 100}%` : "0%" }} /></div></div>
            <div><div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Acceptées</span><span className="text-green-400">{stats.acceptees}</span></div><div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-2 bg-green-500 rounded-full" style={{ width: nbCandidatures > 0 ? `${(stats.acceptees / nbCandidatures) * 100}%` : "0%" }} /></div></div>
            <div><div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Refusées</span><span className="text-red-400">{stats.refusees}</span></div><div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-2 bg-red-500 rounded-full" style={{ width: nbCandidatures > 0 ? `${(stats.refusees / nbCandidatures) * 100}%` : "0%" }} /></div></div>
          </div>
        </div>

        <div className="dashboard-panel p-6">
          <p className="text-sm font-semibold mb-4">Actions prioritaires</p>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.title} className="dashboard-subcard flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/12">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{action.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost-glow" size="sm" className="w-full sm:w-auto" onClick={action.action}>
                    {action.cta}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilEntrepriseTab = ({ profile, user, avatarUrl, setAvatarUrl }: any) => {
  const [nomEntreprise, setNomEntreprise] = useState(profile?.full_name || "");
  const [secteur, setSecteur] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const chargerProfil = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) { setNomEntreprise(data.full_name || ""); setSecteur(data.secteur || ""); setLocalisation(data.localisation || ""); setDescription(data.bio || ""); }
    };
    chargerProfil();
  }, [user]);

  const sauvegarder = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: nomEntreprise, secteur, localisation, bio: description }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profil entreprise sauvegardé !");
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const completion = [nomEntreprise, secteur, localisation, description].filter((value) => String(value || "").trim()).length;
  const completionPercent = Math.round((completion / 4) * 100);

  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              <Building2 className="h-3.5 w-3.5" />
              Identité entreprise
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Mon Entreprise</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Présentez votre entreprise clairement pour inspirer confiance, rendre vos offres plus cohérentes
              et garder un espace recruteur à votre image.
            </p>
          </div>
          <div className="dashboard-subcard p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Profil complété</p>
            <p className="mt-3 text-3xl font-bold">{completionPercent}%</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Un profil mieux renseigné rend vos annonces plus crédibles et facilite la compréhension de votre activité par les talents.
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-panel max-w-5xl p-5 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-4">
            <div className="dashboard-subcard p-5">
              <div className="flex flex-col gap-5">
                <div className="relative w-fit">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-accent/40 bg-accent/20">
                    {avatarUrl ? <img src={avatarUrl} alt="logo" className="h-full w-full object-cover" onError={() => setAvatarUrl(null)} /> : <Building2 className="h-12 w-12 text-accent/60" />}
                  </div>
                  <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-accent transition-colors hover:bg-accent/80">
                    <Camera className="h-4 w-4 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file || !user) return;
                      const ext = file.name.split(".").pop();
                      const path = `${user.id}/avatar.${ext}`;
                      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
                      if (!error) { const { data } = supabase.storage.from("avatars").getPublicUrl(path); setAvatarUrl(data.publicUrl + "?t=" + Date.now()); toast.success("Logo mis à jour !"); }
                    }} />
                  </label>
                </div>

                <div>
                  <h3 className="text-xl font-bold">{nomEntreprise || profile?.full_name || "Votre entreprise"}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
                  <span className="mt-2 inline-block rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-xs text-accent">Entreprise</span>
                </div>
              </div>
            </div>

            <div className="dashboard-subcard p-5">
              <p className="text-sm font-semibold">Conseil de présentation</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Une entreprise bien présentée aide les talents à mieux comprendre votre activité, votre secteur et le contexte de vos offres.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="dashboard-subcard p-5">
              <p className="text-sm font-semibold">Informations de base</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Nom de l'entreprise</label>
                  <input value={nomEntreprise} onChange={(e) => setNomEntreprise(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none" placeholder="Ex. : Transport Martin" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Email</label>
                  <input defaultValue={user?.email || ""} disabled className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm text-muted-foreground">Secteur d'activité</label>
                  <SecteurSelect value={secteur} onChange={setSecteur} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm text-muted-foreground">Localisation</label>
                  <LocationAutocompleteInput
                    value={localisation}
                    onChange={setLocalisation}
                    placeholder="Tapez une ville ou un code postal..."
                  />
                </div>
              </div>
            </div>

            <div className="dashboard-subcard p-5">
              <label className="mb-1 block text-sm text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
                placeholder="Décrivez votre entreprise, votre activité et l'environnement proposé aux talents..."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="glow" className="w-full sm:w-auto sm:min-w-[220px]" onClick={sauvegarder} disabled={saving}>
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OffresTab = ({ user, onOffrePubliee }: any) => {
  const [poste, setPoste] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [competences, setCompetences] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [contrat, setContrat] = useState("CDI");
  const [secteurOffre, setSecteurOffre] = useState("");
  const [diplome, setDiplome] = useState("Sans diplôme");
  const [salaireMin, setSalaireMin] = useState("");
  const [salaireMax, setSalaireMax] = useState("");
  const [avantages, setAvantages] = useState<string[]>([]);
  const [offre, setOffre] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [permisRequis, setPermisRequis] = useState<string[]>([]);

  const listeAvantages = ["Mutuelle", "Tickets restaurant", "Télétravail", "Véhicule de fonction", "Prime annuelle", "RTT", "Formation continue", "Participation aux bénéfices", "Logement de fonction", "13e mois"];
  const toggleAvantage = (a: string) => { setAvantages(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]); };

  const genererOffre = async () => {
    if (!poste) return toast.error("Remplissez le poste");
    setLoading(true);
    try {
      const salaire = salaireMin && salaireMax ? `Salaire: ${salaireMin}EUR - ${salaireMax}EUR brut/mois.` : "";
      const avantagesStr = avantages.length > 0 ? `Avantages: ${avantages.join(", ")}.` : "";
      const diplomeStr = diplome !== "Sans diplôme" ? `Diplome requis: ${diplome}.` : "";
      const secteurStr = secteurOffre ? `Secteur: ${secteurOffre}.` : "";
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: "Tu es un expert RH qui redige des offres d emploi attractives et professionnelles en francais." }, { role: "user", content: `Redige une offre d emploi complete pour le poste de ${poste} ${entreprise ? `chez ${entreprise}` : ""}. Contrat: ${contrat}. Localisation: ${localisation || "France"}. ${secteurStr} Competences: ${competences || "a definir"}. ${diplomeStr} ${salaire} ${avantagesStr} Inclure: description, missions, profil recherche, avantages.` }], temperature: 0.7, max_tokens: 1200 }),
      });
      const data = await response.json();
      setOffre(data.choices[0].message.content);
      toast.success("Offre générée !");
    } catch (err) { toast.error("Erreur lors de la génération."); } finally { setLoading(false); }
  };

  const notifierTalentsParEmail = async (offreId: string, nomEntreprise: string | null) => {
    const { data: talents, error } = await supabase.rpc("get_matching_talent_email_recipients_for_offer", {
      p_offre_id: offreId,
    });
    if (error) throw error;

    const destinataires = (talents || []).filter((talent: any) => Boolean(talent.email));
    if (destinataires.length === 0) return 0;

    await Promise.allSettled(
      destinataires.map((talent: any) =>
        emailNouvelleOffreTalent(
          talent.email,
          poste,
          nomEntreprise,
          localisation || null,
          contrat || null,
        )
      )
    );

    return destinataires.length;
  };

  const publierOffre = async () => {
    if (!offre || !poste) return toast.error("Générez d'abord une offre.");
    setPublishing(true);
    try {
      const { data: offrePubliee, error } = await supabase.from("offres").insert({
        entreprise_id: user.id,
        titre: poste,
        contrat,
        secteur: secteurOffre || null,
        localisation,
        description: offre,
        competences,
        diplome,
        salaire_min: salaireMin ? parseInt(salaireMin) : null,
        salaire_max: salaireMax ? parseInt(salaireMax) : null,
        avantages: avantages.join(", "),
        permis_requis: permisRequis.join(", "),
        urgent,
        statut: "active",
      }).select("id").single();
      if (error) throw error;
      toast.success("Offre publiée !");
      let nomEntrepriseEmail = entreprise || null;
      try {
        const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("user_id", user.id).single();
        if (!nomEntrepriseEmail) nomEntrepriseEmail = profile?.full_name || null;
        if (profile?.email) await envoyerEmail(profile.email, `Votre offre "${poste}" est publiée !`, `<div style="font-family:sans-serif;max-width:600px;margin:auto"><h2 style="color:#8b5cf6">Votre offre est en ligne !</h2><p>Votre offre <strong>${poste}</strong> est maintenant visible par les talents.</p><p>Consultez vos candidatures sur <a href="https://www.spottedtalent.fr/entreprise">www.spottedtalent.fr</a></p><br/><p style="color:#888;font-size:12px">© 2026 Spotted Talent</p></div>`);
      } catch (err) { console.error("Erreur email:", err); }
      if (offrePubliee?.id) {
        void notifierTalentsParEmail(offrePubliee.id, nomEntrepriseEmail)
          .then((count) => {
            if (count > 0) toast.success(`${count} talent(s) ont reçu cette nouvelle offre par email.`);
          })
          .catch((err) => console.error("Erreur notifications offres:", err));
      }
      onOffrePubliee();
    } catch (err: any) { toast.error(err.message); } finally { setPublishing(false); }
  };

  const completionFields = [poste, contrat, localisation, secteurOffre, diplome, competences, offre].filter((value) => String(value || "").trim()).length;
  const completionPercent = Math.round((completionFields / 7) * 100);
  const salaryLabel = salaireMin && salaireMax
    ? `${salaireMin} € - ${salaireMax} € / mois`
    : salaireMin
      ? `À partir de ${salaireMin} € / mois`
      : salaireMax
        ? `Jusqu'à ${salaireMax} € / mois`
        : "À définir";
  const selectedAdvantages = avantages.length > 0 ? avantages.join(", ") : "Aucun avantage sélectionné";
  const selectedPermis = permisRequis.length > 0 ? permisRequis.join(", ") : "Aucun permis spécifique";
  const offerStatusLabel = offre ? "Prête à être relue" : "À générer";

  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              <Wand2 className="h-3.5 w-3.5" />
              Génération assistée par l'IA
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Créer une offre avec l'IA</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Structurez votre besoin, laissez l'IA rédiger une base crédible, puis relisez et publiez une annonce
              plus claire pour attirer de meilleurs profils.
            </p>
          </div>
          <div className="dashboard-subcard p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Vue rapide</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {offre ? "Votre annonce est prête à être relue puis publiée." : "Complétez les éléments clés pour lancer une génération propre."}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-accent transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="dashboard-subcard px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Complétion</p>
                <p className="mt-2 text-2xl font-bold">{completionPercent}%</p>
              </div>
              <div className="dashboard-subcard px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">État</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{offerStatusLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-stat-card border border-accent/20 bg-accent/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Contrat</p>
              <p className="mt-2 text-lg font-bold">{formatDisplayLabel(contrat) || "À définir"}</p>
            </div>
            <Briefcase className="h-5 w-5 text-accent" />
          </div>
        </div>
        <div className="dashboard-stat-card border border-border/60 bg-secondary/25 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Localisation</p>
              <p className="mt-2 text-lg font-bold">{localisation || "À préciser"}</p>
            </div>
            <MapPin className="h-5 w-5 text-accent" />
          </div>
        </div>
        <div className="dashboard-stat-card border border-border/60 bg-secondary/25 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Salaire</p>
              <p className="mt-2 text-lg font-bold">{salaryLabel}</p>
            </div>
            <Euro className="h-5 w-5 text-accent" />
          </div>
        </div>
        <div className={`dashboard-stat-card p-4 ${urgent ? "border border-red-500/20 bg-red-500/10" : "border border-border/60 bg-secondary/25"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${urgent ? "text-red-300" : "text-muted-foreground"}`}>Priorité</p>
              <p className={`mt-2 text-lg font-bold ${urgent ? "text-red-300" : "text-foreground"}`}>{urgent ? "Urgente" : "Standard"}</p>
            </div>
            <Sparkles className={`h-5 w-5 ${urgent ? "text-red-300" : "text-accent"}`} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="dashboard-panel max-h-none space-y-5 overflow-visible p-5 sm:p-6 xl:max-h-[84vh] xl:overflow-y-auto">
          <div className="dashboard-subcard p-5">
            <p className="text-sm font-semibold text-foreground">1. Base de l'annonce</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Donnez d'abord le poste, l'entreprise et le contexte principal. C'est ce qui guide le ton et la précision du texte généré.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted-foreground">Poste *</label>
                <input value={poste} onChange={(e) => setPoste(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none" placeholder="Ex. : Chauffeur PL, Cuisinier, Préparateur de commandes..." />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Nom de l'entreprise</label>
                <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none" placeholder="Ex. : Transport Martin" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Type de contrat</label>
                <select value={contrat} onChange={(e) => setContrat(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none">
                  {CONTRATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted-foreground">Localisation</label>
                <LocationAutocompleteInput
                  value={localisation}
                  onChange={setLocalisation}
                  placeholder="Tapez une ville ou un code postal..."
                />
              </div>
            </div>
          </div>

          <div className="dashboard-subcard p-5">
            <p className="text-sm font-semibold text-foreground">2. Profil recherché</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Indiquez le secteur, le niveau attendu et les compétences clés pour aider l'IA à rédiger un profil crédible.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Secteur d'activité</label>
                <SecteurSelect value={secteurOffre} onChange={setSecteurOffre} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Niveau de diplôme requis</label>
                <select value={diplome} onChange={(e) => setDiplome(e.target.value)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none">
                  <option>Sans diplôme</option>
                  <option>CAP / BEP</option>
                  <option>Bac</option>
                  <option>Bac +2 (BTS, DUT)</option>
                  <option>Bac +3 (Licence)</option>
                  <option>Bac +4 (Maîtrise)</option>
                  <option>Bac +5 (Master, Ingénieur)</option>
                  <option>Bac +8 (Doctorat)</option>
                  <option>Permis B</option>
                  <option>Permis C / CE</option>
                  <option>CACES</option>
                  <option>Habilitation électrique</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted-foreground">Compétences requises</label>
                <textarea value={competences} onChange={(e) => setCompetences(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none" placeholder="Ex. : 2 ans d'expérience, relation client, permis B, manutention, esprit d'équipe..." />
              </div>
            </div>
          </div>

          <div className="dashboard-subcard p-5">
            <p className="text-sm font-semibold text-foreground">3. Conditions et avantages</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Précisez la fourchette salariale, les avantages et les permis attendus pour obtenir une annonce plus complète.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-muted-foreground">Salaire brut mensuel (EUR)</label>
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={salaireMin} onChange={(e) => setSalaireMin(e.target.value)} type="number" className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none" placeholder="Min. ex. : 1800" />
                  <input value={salaireMax} onChange={(e) => setSalaireMax(e.target.value)} type="number" className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none" placeholder="Max. ex. : 2500" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-muted-foreground">Avantages proposés</label>
                <div className="flex flex-wrap gap-2">
                  {listeAvantages.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAvantage(a)}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-all ${avantages.includes(a) ? "border-accent/40 bg-accent/20 text-accent" : "border-border bg-secondary text-muted-foreground hover:border-accent/30"}`}
                    >
                      {avantages.includes(a) && <Check className="h-3 w-3" />}
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-muted-foreground">Permis requis</label>
                <div className="flex flex-wrap gap-2">
                  {["Permis B", "Permis C", "Permis CE", "Permis D", "Permis DE", "FIMO", "FCO", "ADR", "CACES", "Habilitation électrique"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPermisRequis((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-all ${permisRequis.includes(p) ? "border-accent/40 bg-accent/20 text-accent" : "border-border bg-secondary text-muted-foreground hover:border-accent/30"}`}
                    >
                      {permisRequis.includes(p) && <Check className="h-3 w-3" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-left"
              onClick={() => setUrgent(!urgent)}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${urgent ? "border-red-500 bg-red-500" : "border-red-400"}`}>
                {urgent && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm font-medium text-red-400">Offre urgente</span>
              {urgent && <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">URGENT</span>}
            </button>
          </div>

          <Button variant="glow" className="w-full" onClick={genererOffre} disabled={loading}>
            <Wand2 className="mr-2 h-4 w-4" />
            {loading ? "Génération en cours..." : "Générer avec l'IA"}
          </Button>
        </div>

        <div className="dashboard-panel flex flex-col p-5 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Aperçu de l'annonce</p>
              <h3 className="mt-2 text-xl font-bold">Offre générée</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Relisez, ajustez le ton si besoin, puis publiez quand le rendu vous semble clair.
              </p>
            </div>
            {offre && (
              <Button className="w-full sm:w-auto" variant="glow" size="sm" onClick={publierOffre} disabled={publishing}>
                <CheckCircle className="mr-1 h-4 w-4" />
                {publishing ? "Publication..." : "Publier l'offre"}
              </Button>
            )}
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="dashboard-subcard p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Résumé</p>
              <p className="mt-2 font-semibold">{poste || "Poste à préciser"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{localisation || "Localisation à préciser"}</p>
            </div>
            <div className="dashboard-subcard p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Profil et cadre</p>
              <p className="mt-2 text-sm font-semibold">{formatDisplayLabel(secteurOffre) || "Secteur à préciser"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatDisplayLabel(diplome) || "Niveau à préciser"}</p>
            </div>
            <div className="dashboard-subcard p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Salaire</p>
              <p className="mt-2 text-sm font-semibold">{salaryLabel}</p>
            </div>
            <div className="dashboard-subcard p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avantages et permis</p>
              <p className="mt-2 text-sm font-semibold">{selectedAdvantages}</p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedPermis}</p>
            </div>
          </div>

          {offre ? (
            <div className="dashboard-subcard flex min-h-[360px] flex-1 flex-col p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Texte généré</p>
                <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                  Modifiable
                </span>
              </div>
              <textarea
                value={offre}
                onChange={(e) => setOffre(e.target.value)}
                className="min-h-[320px] flex-1 resize-none rounded-lg border border-border bg-secondary px-3 py-3 text-sm leading-6 focus:border-accent/50 focus:outline-none sm:min-h-[420px]"
              />
            </div>
          ) : (
            <div className="dashboard-subcard flex min-h-[360px] flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              <div className="max-w-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                  <FileText className="h-8 w-8 text-accent" />
                </div>
                <p className="text-base font-semibold text-foreground">Votre offre apparaîtra ici</p>
                <p className="mt-2 leading-6">
                  Renseignez le formulaire, cliquez sur <span className="font-semibold text-foreground">Générer avec l'IA</span>,
                  puis relisez tranquillement le texte avant publication.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Formulaire de modification inline ───────────────────────────────────────
const FormulaireModification = ({ offre, onSave, onCancel }: { offre: any; onSave: () => void; onCancel: () => void }) => {
  const [titre, setTitre] = useState(offre.titre || "");
  const [contrat, setContrat] = useState(offre.contrat || "CDI");
  const [localisation, setLocalisation] = useState(offre.localisation || "");
  const [salaireMin, setSalaireMin] = useState(offre.salaire_min?.toString() || "");
  const [salaireMax, setSalaireMax] = useState(offre.salaire_max?.toString() || "");
  const [competences, setCompetences] = useState(offre.competences || "");
  const [description, setDescription] = useState(offre.description || "");
  const [urgent, setUrgent] = useState(offre.urgent || false);
  const [saving, setSaving] = useState(false);

  const sauvegarder = async () => {
    if (!titre) return toast.error("Le titre est obligatoire");
    setSaving(true);
    try {
      const { error } = await supabase.from("offres").update({
        titre,
        contrat,
        localisation,
        salaire_min: salaireMin ? parseInt(salaireMin) : null,
        salaire_max: salaireMax ? parseInt(salaireMax) : null,
        competences,
        description,
        urgent,
      }).eq("id", offre.id);
      if (error) throw error;
      toast.success("Offre mise à jour !");
      onSave();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
      <p className="text-sm font-semibold text-accent">Modifier l'offre</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Titre du poste</label><input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Contrat</label><select value={contrat} onChange={(e) => setContrat(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50">{CONTRATS.map(c => <option key={c}>{c}</option>)}</select></div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Localisation</label>
          <LocationAutocompleteInput
            value={localisation}
            onChange={setLocalisation}
            placeholder="Tapez une ville ou un code postal..."
          />
        </div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Salaire min (EUR)</label><input value={salaireMin} onChange={(e) => setSalaireMin(e.target.value)} type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" /></div>
        <div><label className="text-xs text-muted-foreground mb-1 block">Salaire max (EUR)</label><input value={salaireMax} onChange={(e) => setSalaireMax(e.target.value)} type="number" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" /></div>
        <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Compétences</label><input value={competences} onChange={(e) => setCompetences(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" /></div>
        <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50 resize-none" /></div>
        <div className="col-span-2 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg cursor-pointer" onClick={() => setUrgent(!urgent)}>
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${urgent ? "bg-red-500 border-red-500" : "border-red-400"}`}>{urgent && <Check className="w-3 h-3 text-white" />}</div>
          <span className="text-sm font-medium text-red-400">Offre urgente</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <Button variant="glow" size="sm" onClick={sauvegarder} disabled={saving} className="w-full sm:flex-1">{saving ? "Sauvegarde..." : "Sauvegarder les modifications"}</Button>
        <Button variant="ghost-glow" size="sm" onClick={onCancel} className="w-full sm:w-auto">Annuler</Button>
      </div>
    </div>
  );
};

const MesOffresTab = ({ user, refreshToken = 0, onOffresChanged }: any) => {
  const [offres, setOffres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offreEnEdition, setOffreEnEdition] = useState<string | null>(null);
  const [offreOuverte, setOffreOuverte] = useState<string | null>(null);

  useEffect(() => { chargerOffres(); }, [user, refreshToken]);

  const chargerOffres = async () => {
    if (!user) return;
    const { data } = await supabase.from("offres").select("*").eq("entreprise_id", user.id).order("created_at", { ascending: false });
    setOffres(data || []);
    if (typeof onOffresChanged === "function") {
      onOffresChanged(data?.length || 0);
    }
    setLoading(false);
  };

  const toggleStatut = async (id: string, statut: string) => {
    const newStatut = statut === "active" ? "inactive" : "active";
    await supabase.from("offres").update({ statut: newStatut }).eq("id", id);
    chargerOffres();
    toast.success(newStatut === "active" ? "Offre activée" : "Offre désactivée");
  };

  const supprimerOffre = async (id: string) => {
    await supabase.from("offres").delete().eq("id", id);
    toast.success("Offre supprimée.");
    chargerOffres();
  };

  const formatterDescriptionOffre = (description?: string | null) => {
    if (!description) return "";

    return description
      .replace(/\*\*/g, "")
      .replace(
        /\s+(Offre d'emploi|Entreprise|Type de contrat|Lieu de travail|Secteur d'activite|Secteur d'activité|Description|Competences|Compétences|Diplome|Diplôme|Permis requis|Avantages)\s*:/gi,
        "\n$1 :",
      )
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const descriptionCourte = (description?: string | null) =>
    formatterDescriptionOffre(description).replace(/\n+/g, " ");

  if (loading) return <div className="text-muted-foreground">Chargement...</div>;

  const stats = {
    total: offres.length,
    actives: offres.filter((offre) => offre.statut === "active").length,
    inactives: offres.filter((offre) => offre.statut !== "active").length,
    urgentes: offres.filter((offre) => Boolean(offre.urgent)).length,
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              <Wand2 className="h-3.5 w-3.5" />
              Vos annonces publiées
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Mes offres</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Retrouvez toutes vos annonces dans un seul espace, gardez un œil sur leur visibilité
              et reprenez une offre en un instant pour la corriger, la masquer ou la rouvrir.
            </p>
          </div>
          <div className="dashboard-subcard p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Vue rapide</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {stats.actives > 0
                ? `${stats.actives} offre${stats.actives > 1 ? "s" : ""} active${stats.actives > 1 ? "s" : ""}`
                : "Aucune offre active pour le moment"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {stats.urgentes > 0
                ? `${stats.urgentes} annonce${stats.urgentes > 1 ? "s" : ""} est marquée${stats.urgentes > 1 ? "s" : ""} comme urgente${stats.urgentes > 1 ? "s" : ""}.`
                : "Toutes vos annonces restent accessibles ici, même lorsqu'elles sont mises en pause."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-stat-card border border-accent/20 bg-accent/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Total</p>
          <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Toutes vos annonces enregistrées.</p>
        </div>
        <div className="dashboard-stat-card border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-300">Actives</p>
          <p className="mt-2 text-3xl font-bold text-green-300">{stats.actives}</p>
          <p className="mt-1 text-xs text-muted-foreground">Annonces visibles par les talents.</p>
        </div>
        <div className="dashboard-stat-card border border-secondary/60 bg-secondary/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">En pause</p>
          <p className="mt-2 text-3xl font-bold">{stats.inactives}</p>
          <p className="mt-1 text-xs text-muted-foreground">Offres temporairement masquées.</p>
        </div>
        <div className="dashboard-stat-card border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-300">Urgentes</p>
          <p className="mt-2 text-3xl font-bold text-red-300">{stats.urgentes}</p>
          <p className="mt-1 text-xs text-muted-foreground">Annonces marquées prioritaires.</p>
        </div>
      </div>

      {offres.length === 0 ? (
        <div className="dashboard-empty-card p-12"><Wand2 className="w-16 h-16 text-accent/30 mb-4" /><h3 className="font-bold text-lg mb-2">Aucune offre publiée</h3><p className="text-muted-foreground text-sm">Créez votre première offre avec l'IA.</p></div>
      ) : (
        <div className="space-y-4">
          {offres.map((offre) => (
            <div key={offre.id} className="dashboard-panel p-5 sm:p-6">
              <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-lg">{offre.titre}</h3>
                    {offre.urgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">URGENT</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${offre.statut === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-secondary text-muted-foreground border-border"}`}>{offre.statut === "active" ? "Active" : "Inactive"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{formatDisplayLabel(offre.contrat)}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mb-2 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {offre.localisation || "Non précisée"}</span>
                    {offre.salaire_min && offre.salaire_max && <span className="flex items-center gap-1"><Euro className="w-3 h-3" /> {offre.salaire_min} - {offre.salaire_max}</span>}
                    {offre.diplome && !["Sans diplome", "Sans diplôme"].includes(offre.diplome) && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {formatDisplayLabel(offre.diplome)}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(offre.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {offre.avantages && <p className="text-xs text-green-400 mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {formatDisplayList(offre.avantages)}</p>}
                  {offreEnEdition !== offre.id && <p className="text-sm text-muted-foreground line-clamp-2">{descriptionCourte(offre.description)}</p>}
                </div>

                <div className="dashboard-subcard p-4 sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Gestion de l'annonce</p>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {offre.statut === "active" ? "Visible pour les talents" : "Annonce en pause"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {offre.statut === "active"
                      ? "Cette offre peut recevoir de nouvelles candidatures. Vous pouvez l'éditer, l'ouvrir en détail ou la mettre en pause."
                      : "Cette offre reste enregistrée dans votre espace, mais elle n'apparaît plus aux talents tant que vous ne la réactivez pas."}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {offreEnEdition !== offre.id && (
                      <button
                        onClick={() => setOffreOuverte(offreOuverte === offre.id ? null : offre.id)}
                        className="dashboard-inline-link justify-center rounded-xl border border-accent/20 bg-accent/10 px-3 py-2"
                      >
                        {offreOuverte === offre.id ? "Réduire la fiche" : "Voir l'offre complète"}
                      </button>
                    )}
                    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                      <Button
                        variant="ghost-glow"
                        size="sm"
                        onClick={() => {
                          setOffreOuverte(null);
                          setOffreEnEdition(offreEnEdition === offre.id ? null : offre.id);
                        }}
                        className={`justify-center ${offreEnEdition === offre.id ? "text-accent border-accent/40" : ""}`}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        {offreEnEdition === offre.id ? "Fermer l'édition" : "Modifier"}
                      </Button>
                      <Button variant="ghost-glow" size="sm" onClick={() => toggleStatut(offre.id, offre.statut)} className="justify-center">
                        {offre.statut === "active" ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                        {offre.statut === "active" ? "Mettre en pause" : "Réactiver"}
                      </Button>
                      <ConfirmActionDialog
                        title="Supprimer cette annonce ?"
                        description="L'annonce sera retirée de vos offres et ne sera plus visible pour les candidats. Vous pouvez encore annuler maintenant."
                        onConfirm={() => supprimerOffre(offre.id)}
                      >
                        <button className="flex items-center justify-center gap-1 rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-400 transition-colors hover:border-red-400/40 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </ConfirmActionDialog>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulaire de modification inline */}
              {offreEnEdition === offre.id && (
                <FormulaireModification
                  offre={offre}
                  onSave={() => { setOffreEnEdition(null); chargerOffres(); }}
                  onCancel={() => setOffreEnEdition(null)}
                />
              )}

              {offreOuverte === offre.id && offreEnEdition !== offre.id && (
                <div className="mt-5 rounded-2xl border border-accent/15 bg-secondary/20 p-5">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="dashboard-subcard p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Contrat</p>
                      <p className="mt-2 font-semibold">{formatDisplayLabel(offre.contrat) || "Non précisé"}</p>
                    </div>
                    <div className="dashboard-subcard p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Secteur</p>
                      <p className="mt-2 font-semibold">{formatDisplayLabel(offre.secteur) || "Non précisé"}</p>
                    </div>
                    <div className="dashboard-subcard p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Salaire</p>
                      <p className="mt-2 font-semibold">
                        {offre.salaire_min && offre.salaire_max ? `${offre.salaire_min} - ${offre.salaire_max}` : "Non précisé"}
                      </p>
                    </div>
                    <div className="dashboard-subcard p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Permis requis</p>
                      <p className="mt-2 font-semibold">{formatDisplayList(offre.permis_requis) || "Aucun"}</p>
                    </div>
                  </div>

                  <div className="dashboard-subcard mt-4 p-4">
                    <p className="text-sm font-semibold">Description complète</p>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {formatterDescriptionOffre(offre.description) || "Aucune description renseignée."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CandidatsTab = ({ user }: any) => {
  const navigate = useNavigate();
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [searchCandidatures, setSearchCandidatures] = useState("");

  useEffect(() => { chargerCandidatures(); }, [user]);

  const chargerCandidatures = async () => {
    if (!user) return;
    const { data: offres } = await supabase.from("offres").select("id, titre, contrat, localisation").eq("entreprise_id", user.id);
    if (!offres || offres.length === 0) { setLoading(false); return; }
    const ids = offres.map((o: any) => o.id);
    const { data: cands } = await supabase.from("candidatures").select("*, offre:offre_id(titre, contrat, localisation)").in("offre_id", ids).order("created_at", { ascending: false });
    const candsAvecProfil = await Promise.all((cands || []).map(async (c: any) => {
      const { data: talentProfil } = await supabase.from("profiles").select("full_name, poste, localisation, competences, bio, email").eq("user_id", c.talent_id).single();
      let talentAvatarUrl = null;
      try {
        const { data: avatarList } = await supabase.storage.from("avatars").list(c.talent_id);
        if (avatarList && avatarList.length > 0) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(`${c.talent_id}/${avatarList[0].name}`);
          talentAvatarUrl = data.publicUrl + "?t=" + Date.now();
        }
      } catch (err) { /* pas de photo */ }
      return { ...c, talentProfil, talentAvatarUrl };
    }));
    setCandidatures(candsAvecProfil);
    setLoading(false);
  };

  const changerStatut = async (id: string, statut: string) => {
    await supabase.from("candidatures").update({ statut }).eq("id", id);
    setCandidatures(prev => prev.map(c => c.id === id ? { ...c, statut } : c));
    toast.success("Statut mis à jour !");
    try {
      const candidature = candidatures.find(c => c.id === id);
      if (candidature) {
        const { data: talentProfile } = await supabase.from("profiles").select("email").eq("user_id", candidature.talent_id).single();
        if (talentProfile?.email) await emailCandidatureStatut(talentProfile.email, candidature.offre?.titre || "", statut);
      }
    } catch (err) { console.error("Erreur email statut:", err); }
  };

  const noterTalent = async (id: string, note: number) => {
    await supabase.from("candidatures").update({ note }).eq("id", id);
    setCandidatures(prev => prev.map(c => c.id === id ? { ...c, note } : c));
    toast.success("Note enregistrée !");
  };

  const optionsStatut = [
    { value: "tous", label: "Toutes" },
    { value: "envoyee", label: "En attente" },
    { value: "entretien", label: "En entretien" },
    { value: "acceptee", label: "Acceptées" },
    { value: "refusee", label: "Refusées" },
  ];

  const counts = {
    tous: candidatures.length,
    envoyee: candidatures.filter((c) => c.statut === "envoyee").length,
    entretien: candidatures.filter((c) => c.statut === "entretien").length,
    acceptee: candidatures.filter((c) => c.statut === "acceptee").length,
    refusee: candidatures.filter((c) => c.statut === "refusee").length,
  };
  const tauxAcceptation = counts.tous ? Math.round((counts.acceptee / counts.tous) * 100) : 0;

  const candidaturesFiltrees = candidatures
    .filter((c) => filtreStatut === "tous" || c.statut === filtreStatut)
    .filter((c) => {
      if (!searchCandidatures.trim()) return true;
      const query = searchCandidatures.toLowerCase();
      return [
        c.offre?.titre,
        c.offre?.contrat,
        c.offre?.localisation,
        c.talentProfil?.full_name,
        c.talentProfil?.poste,
        c.talentProfil?.email,
        c.talentProfil?.competences,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

  if (loading) return <div className="text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              <Users className="h-3.5 w-3.5" />
              Pilotage des candidatures
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Candidatures reçues</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Tout le suivi candidat reste ici : tri, priorités, décisions, documents et bascule
              rapide vers le profil complet ou la messagerie.
            </p>
          </div>
          <div className="dashboard-subcard p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Vue rapide</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {counts.envoyee > 0
                ? `${counts.envoyee} candidature${counts.envoyee > 1 ? "s" : ""} à traiter`
                : "Aucune candidature en attente"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {counts.acceptee > 0
                ? `${counts.acceptee} dossier${counts.acceptee > 1 ? "s" : ""} est déjà accepté${counts.acceptee > 1 ? "s" : ""}, avec un taux d'acceptation de ${tauxAcceptation}%.`
                : "Dès qu'un candidat avance, vous gardez ici une vue claire sur le statut, la note et les prochaines actions."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button onClick={() => setFiltreStatut("tous")} className={`dashboard-stat-card p-4 text-left transition-all ${filtreStatut === "tous" ? "border-accent/40 bg-accent/10" : "hover:border-accent/20"}`}>
          <p className="text-xs font-medium text-muted-foreground mb-1">Toutes</p>
          <p className="text-3xl font-bold">{counts.tous}</p>
          <p className="text-xs text-muted-foreground mt-1">Vue globale</p>
        </button>
        <button onClick={() => setFiltreStatut("envoyee")} className={`dashboard-stat-card p-4 text-left transition-all ${filtreStatut === "envoyee" ? "border-primary/40 bg-primary/10" : "hover:border-primary/20"}`}>
          <p className="text-xs font-medium text-muted-foreground mb-1">En attente</p>
          <p className="text-3xl font-bold text-primary">{counts.envoyee}</p>
          <p className="text-xs text-muted-foreground mt-1">À traiter</p>
        </button>
        <button onClick={() => setFiltreStatut("entretien")} className={`dashboard-stat-card p-4 text-left transition-all ${filtreStatut === "entretien" ? "border-blue-500/40 bg-blue-500/10" : "hover:border-blue-500/20"}`}>
          <p className="text-xs font-medium text-muted-foreground mb-1">En entretien</p>
          <p className="text-3xl font-bold text-blue-400">{counts.entretien}</p>
          <p className="text-xs text-muted-foreground mt-1">Suivi actif</p>
        </button>
        <button onClick={() => setFiltreStatut("acceptee")} className={`dashboard-stat-card p-4 text-left transition-all ${filtreStatut === "acceptee" ? "border-green-500/40 bg-green-500/10" : "hover:border-green-500/20"}`}>
          <p className="text-xs font-medium text-muted-foreground mb-1">Acceptées</p>
          <p className="text-3xl font-bold text-green-400">{counts.acceptee}</p>
          <p className="text-xs text-muted-foreground mt-1">Documents à suivre</p>
        </button>
        <button onClick={() => setFiltreStatut("refusee")} className={`dashboard-stat-card p-4 text-left transition-all ${filtreStatut === "refusee" ? "border-red-500/40 bg-red-500/10" : "hover:border-red-500/20"}`}>
          <p className="text-xs font-medium text-muted-foreground mb-1">Refusées</p>
          <p className="text-3xl font-bold text-red-400">{counts.refusee}</p>
          <p className="text-xs text-muted-foreground mt-1">Archivées</p>
        </button>
      </div>

      <div className="dashboard-panel p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="dashboard-subcard p-4">
            <p className="text-sm font-semibold text-foreground">Rechercher un candidat ou une offre</p>
            <div className="relative mt-3">
              <input
                value={searchCandidatures}
                onChange={(e) => setSearchCandidatures(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-accent/50"
                placeholder="Nom, poste, email, offre ou localisation..."
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              {searchCandidatures && (
                <button onClick={() => setSearchCandidatures("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                  Effacer
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-subcard p-4">
            <p className="text-sm font-semibold text-foreground">Affichage actuel</p>
            <p className="mt-3 text-2xl font-bold">{candidaturesFiltrees.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              candidature{candidaturesFiltrees.length > 1 ? "s" : ""} affichée{candidaturesFiltrees.length > 1 ? "s" : ""} sur {candidatures.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {optionsStatut.map((option) => {
          const count = counts[option.value as keyof typeof counts];

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFiltreStatut(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                filtreStatut === option.value
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border bg-secondary text-muted-foreground hover:border-accent/30 hover:text-foreground"
              }`}
            >
              {option.label} ({count})
            </button>
          );
        })}
      </div>
      {candidatures.length === 0 ? (
        <div className="dashboard-empty-card p-12"><Users className="w-16 h-16 text-accent/30 mb-4" /><h3 className="font-bold text-lg mb-2">Aucune candidature pour l'instant</h3><p className="text-muted-foreground text-sm max-w-md">Les candidatures apparaîtront ici quand des talents postuleront à vos offres.</p></div>
      ) : candidaturesFiltrees.length === 0 ? (
        <div className="dashboard-empty-card p-12">
          <Search className="w-16 h-16 text-accent/30 mb-4" />
          <h3 className="font-bold text-lg mb-2">Aucune candidature trouvée</h3>
          <p className="text-muted-foreground text-sm max-w-md">Essayez un autre filtre ou une autre recherche pour retrouver le bon candidat.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidaturesFiltrees.map((c) => (
            <div key={c.id} className={`dashboard-panel p-5 sm:p-6 ${c.statut === "acceptee" ? "border-green-500/25" : c.statut === "entretien" ? "border-blue-500/25" : ""}`}>
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold">{c.offre?.titre || "Offre"}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      c.statut === "acceptee" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      c.statut === "refusee" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      c.statut === "entretien" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-primary/10 text-primary border-primary/20"
                    }`}>{getDisplayCandidatureStatus(c.statut)}</span>
                    {(c.statut === "entretien" || c.statut === "acceptee") && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-accent/20 bg-accent/10 text-accent">
                        Dossier documents prioritaire
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {formatDisplayLabel(c.offre?.contrat)}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.offre?.localisation || "Non précisée"}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {c.talentProfil ? (
                    <div className="mt-3 space-y-2 rounded-lg border border-border/50 bg-secondary/50 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {c.talentAvatarUrl ? (
                              <img src={c.talentAvatarUrl} alt="photo talent" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <Users className="w-6 h-6 text-accent/60" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{c.talentProfil.full_name || "Talent"}</p>
                            {c.talentProfil.poste && <p className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="w-3 h-3" /> {c.talentProfil.poste}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const params = new URLSearchParams({
                              candidature: c.id,
                              returnTo: "/entreprise/dashboard?tab=candidats",
                              backLabel: "Retour aux candidatures",
                            });
                            navigate(`/talent/profil/${c.talent_id}?${params.toString()}`);
                          }}
                          className="dashboard-action-link self-start sm:self-auto"
                        >
                          Voir le profil complet
                        </button>
                      </div>
                      {c.talentProfil.localisation && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.talentProfil.localisation}</p>}
                      {c.talentProfil.competences && <p className="text-xs text-muted-foreground flex items-center gap-1"><Wrench className="w-3 h-3" /> {c.talentProfil.competences}</p>}
                      {(() => {
                        const availability = parseTalentAvailabilityFromBio(c.talentProfil.bio);
                        const availabilityLabel = formatTalentAvailabilityLabel(availability.type, availability.detail);
                        const cleanBio = stripTalentAvailabilityMetadata(c.talentProfil.bio);
                        return (
                          <>
                            {availabilityLabel && (
                              <p className="text-xs font-medium text-emerald-300">
                                Disponibilité : {availabilityLabel}
                              </p>
                            )}
                            {cleanBio && <p className="text-xs text-muted-foreground italic">{cleanBio}</p>}
                          </>
                        );
                      })()}
                      {c.talentProfil.email && <p className="text-xs text-primary flex items-center gap-1"><Mail className="w-3 h-3" /> {c.talentProfil.email}</p>}
                      {c.statut === "acceptee" && <p className="text-xs text-green-400 font-medium">Candidature acceptée : le dossier partagé devient votre zone de suivi principal.</p>}
                      {c.statut === "entretien" && <p className="text-xs text-blue-400 font-medium">Candidature en entretien : vous pouvez déjà préparer les échanges de documents si besoin.</p>}
                    </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">Profil non complété</p>
                    )}
                  </div>
                <div className="dashboard-subcard p-4 sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Décision et suivi</p>
                  <p className="mt-3 text-sm font-semibold text-foreground">{getDisplayCandidatureStatus(c.statut)}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {c.statut === "acceptee"
                      ? "Le dossier est validé. Les documents liés à cette candidature deviennent votre zone de suivi principale."
                      : c.statut === "entretien"
                        ? "Le candidat est en phase active. Vous pouvez poursuivre les échanges et préparer les documents si besoin."
                        : c.statut === "refusee"
                          ? "La candidature est clôturée. Vous pouvez la remettre en attente si vous souhaitez réouvrir le dossier."
                          : "Ce dossier attend votre premier retour. Vous pouvez le faire avancer en un clic."}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {c.statut === "envoyee" && (
                      <Button variant="ghost-glow" size="sm" className="w-full justify-center text-blue-400 border-blue-500/30 hover:bg-blue-500/10" onClick={() => changerStatut(c.id, "entretien")}>En entretien</Button>
                    )}
                    {(c.statut === "envoyee" || c.statut === "entretien") && (
                      <Button variant="glow" size="sm" className="w-full justify-center" onClick={() => changerStatut(c.id, "acceptee")}><Check className="w-3 h-3 mr-1" /> Accepter</Button>
                    )}
                    {(c.statut === "envoyee" || c.statut === "entretien") && (
                      <Button variant="ghost-glow" size="sm" className="w-full justify-center" onClick={() => changerStatut(c.id, "refusee")}><X className="w-3 h-3 mr-1" /> Refuser</Button>
                    )}
                    {(c.statut === "acceptee" || c.statut === "refusee" || c.statut === "entretien") && (
                      <Button variant="ghost-glow" size="sm" className="w-full justify-center text-xs" onClick={() => changerStatut(c.id, "envoyee")}>Remettre en attente</Button>
                    )}
                  </div>
                  <div className="mt-4 rounded-xl border border-border/60 bg-secondary/20 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Note interne</p>
                    <div className="mt-2 flex gap-0.5">
                      {[1,2,3,4,5].map((etoile) => (
                        <button key={etoile} onClick={() => noterTalent(c.id, etoile)} className={`text-xl transition-colors ${c.note >= etoile ? "text-amber-400" : "text-muted-foreground hover:text-amber-300"}`}>★</button>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-amber-400">{c.note ? `${c.note}/5` : "Pas encore noté"}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MessagerieTab = ({ user, candidatureIdFromUrl }: any) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [convActive, setConvActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [nouveau, setNouveau] = useState("");
  const [loading, setLoading] = useState(true);
  const [nonLusParConv, setNonLusParConv] = useState<Record<string, number>>({});
  const [rechercheConversation, setRechercheConversation] = useState("");

  useEffect(() => { chargerConversations(); }, [user]);
  useEffect(() => { if (conversations.length > 0 && candidatureIdFromUrl) { const conv = conversations.find((c: any) => c.id === candidatureIdFromUrl); if (conv) setConvActive(conv); } }, [conversations, candidatureIdFromUrl]);
  useEffect(() => { if (convActive) chargerMessages(convActive.id); }, [convActive]);

  const chargerConversations = async () => {
    if (!user) return;
    const { data: offres } = await supabase.from("offres").select("id").eq("entreprise_id", user.id);
    if (!offres || offres.length === 0) { setLoading(false); return; }
    const ids = offres.map((o: any) => o.id);
    const { data: cands } = await supabase.from("candidatures").select("*, offre:offre_id(titre)").in("offre_id", ids).order("created_at", { ascending: false });
    const candsAvecNom = await Promise.all((cands || []).map(async (c: any) => {
      const { data: profil } = await supabase.from("profiles").select("full_name").eq("user_id", c.talent_id).single();
      return { ...c, talentNom: profil?.full_name || "Talent" };
    }));
    setConversations(candsAvecNom);
    const counts: Record<string, number> = {};
    for (const c of candsAvecNom) {
      const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("candidature_id", c.id).eq("destinataire_id", user.id).eq("lu", false);
      counts[c.id] = count || 0;
    }
    setNonLusParConv(counts);
    setLoading(false);
  };

  const chargerMessages = async (candidatureId: string) => {
    const { data } = await supabase.from("messages").select("*").eq("candidature_id", candidatureId).order("created_at", { ascending: true });
    setMessages(data || []);
    await supabase.from("messages").update({ lu: true }).eq("candidature_id", candidatureId).eq("destinataire_id", user.id);
    setNonLusParConv(prev => ({ ...prev, [candidatureId]: 0 }));
  };

  const envoyerMessage = async () => {
    if (!nouveau.trim() || !convActive) return;
    const { error } = await supabase.from("messages").insert({ expedition_id: user.id, destinataire_id: convActive.talent_id, candidature_id: convActive.id, contenu: nouveau.trim() });
    if (!error) { setNouveau(""); chargerMessages(convActive.id); }
  };

  if (loading) return <div className="text-muted-foreground">Chargement...</div>;

  const totalNonLus = Object.values(nonLusParConv).reduce((sum, count) => sum + count, 0);
  const needle = rechercheConversation.trim().toLowerCase();
  const conversationsFiltrees = needle
    ? conversations.filter((conversation) => {
        const titre = String(conversation.offre?.titre || "").toLowerCase();
        const talentNom = String(conversation.talentNom || "").toLowerCase();
        const statut = String(conversation.statut || "").toLowerCase();
        return titre.includes(needle) || talentNom.includes(needle) || statut.includes(needle);
      })
    : conversations;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Messagerie</h2>
      <p className="text-muted-foreground mb-6">Retrouvez ici vos échanges avec chaque candidat, avec un suivi plus lisible sur mobile comme sur desktop.</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="dashboard-stat-card p-4 border border-accent/20 bg-accent/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Conversations</p>
              <p className="mt-2 text-2xl font-bold">{conversations.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Candidatures avec échanges actifs.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card p-4 border border-blue-500/20 bg-blue-500/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Messages non lus</p>
              <p className="mt-2 text-2xl font-bold">{totalNonLus}</p>
              <p className="mt-1 text-xs text-muted-foreground">À consulter en priorité.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/12 text-blue-200">
              <Mail className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card p-4 border border-border/60 bg-secondary/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vue active</p>
              <p className="mt-2 text-sm font-semibold">{convActive ? convActive.talentNom : "Aucune conversation sélectionnée"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{convActive?.offre?.titre || "Choisissez un dossier pour afficher les messages."}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/40 text-muted-foreground">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:h-[600px] lg:grid-cols-3 lg:gap-6">
        <div className={`dashboard-panel max-h-[360px] overflow-y-auto p-4 lg:max-h-none ${convActive ? "hidden lg:block" : ""}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Conversations</h3>
            <span className="rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1 text-xs text-muted-foreground">
              {conversationsFiltrees.length}
            </span>
          </div>
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/20 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={rechercheConversation}
              onChange={(e) => setRechercheConversation(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="Rechercher un candidat ou une offre..."
            />
          </div>
          {conversations.length === 0 ? (<p className="text-xs text-muted-foreground text-center py-4">Aucune candidature reçue</p>) : conversationsFiltrees.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun résultat.</p>
          ) : (
            <div className="space-y-2">
              {conversationsFiltrees.map((c) => (
                <button key={c.id} onClick={() => setConvActive(c)} className={`w-full text-left p-4 rounded-2xl border transition-all ${convActive?.id === c.id ? "border-accent/25 bg-accent/12 shadow-[0_18px_42px_-30px_rgba(6,182,212,0.85)]" : "border-border/50 bg-secondary/25 hover:border-accent/20 hover:bg-secondary/60"}`}>
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{c.offre?.titre || "Offre"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{c.talentNom}</p>
                    </div>
                    {nonLusParConv[c.id] > 0 && (<span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">{nonLusParConv[c.id]}</span>)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {getDisplayCandidatureStatus(c.statut)}
                    </span>
                    {c.offre?.titre && (
                      <span className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 text-[11px] text-accent">
                        Dossier candidat
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="dashboard-panel flex min-h-[420px] flex-col lg:col-span-2 lg:min-h-0">
          {convActive ? (
            <>
              <div className="border-b border-border/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => setConvActive(null)}
                      className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-accent/25 hover:text-foreground lg:hidden"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Retour aux conversations
                    </button>
                    <h3 className="font-semibold">{convActive.offre?.titre}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{convActive.talentNom}</p>
                  </div>
                  <span className="w-fit rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    Conversation active
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageSquare className="mb-3 h-12 w-12 text-accent/20" />
                    <p className="text-sm font-medium">Aucun message pour le moment</p>
                    <p className="mt-1 text-xs text-muted-foreground">Envoyez le premier message pour lancer l'échange avec ce talent.</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.expedition_id === user.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-sm ${m.expedition_id === user.id ? "bg-accent text-white shadow-[0_18px_45px_-36px_rgba(6,182,212,0.65)]" : "bg-secondary/60 border border-border/50 text-foreground"}`}>
                        {m.contenu}
                        <p className="text-xs opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-border/50 p-4">
                <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                     <input value={nouveau} onChange={(e) => setNouveau(e.target.value)} onKeyDown={(e) => e.key === "Enter" && envoyerMessage()} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" placeholder="Écrivez un message..." />
                    <Button className="w-full sm:w-auto" variant="glow" size="sm" onClick={envoyerMessage}><Send className="w-4 h-4 sm:mr-1" /> <span className="sm:inline hidden">Envoyer</span></Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm"><div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Sélectionnez une conversation</p></div></div>
          )}
        </div>
      </div>
    </div>
  );
};

const DocumentsEntrepriseTab = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [sharedFolders, setSharedFolders] = useState<any[]>([]);
  const [searchDocuments, setSearchDocuments] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [requestSelections, setRequestSelections] = useState<Record<string, string>>({});
  const [requestingFolder, setRequestingFolder] = useState<string | null>(null);
  const [documentsRequestsReady, setDocumentsRequestsReady] = useState(true);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const internalCategories = [
    { id: "rh", label: "Documents RH", icon: FileText, desc: "Documents internes à votre entreprise uniquement" },
  ];
  const sharedCategories = [
    { id: "shared-contrat", label: "Contrats", icon: FileText, desc: "Documents contractuels partagés avec le talent" },
    { id: "shared-fiche-paie", label: "Fiches de paie", icon: FileText, desc: "Documents de paie liés à ce talent uniquement" },
    { id: "shared-interim", label: "Documents d'intérim", icon: FileText, desc: "Documents liés au suivi ou à la mission d'intérim" },
  ];
  useEffect(() => {
    if (!user) return;
    void chargerDocuments();
    const interval = window.setInterval(() => { void chargerDocuments(); }, 20000);
    return () => window.clearInterval(interval);
  }, [user]);
  useEffect(() => {
    if (sharedFolders.length === 0) {
      setExpandedFolderId(null);
      return;
    }
    if (expandedFolderId && sharedFolders.some((folder) => folder.id === expandedFolderId)) return;
    const withPendingRequest = sharedFolders.find((folder) => (folder.documentRequests || []).some((request: any) => request.status === "requested"));
    setExpandedFolderId(withPendingRequest?.id || sharedFolders[0].id);
  }, [sharedFolders, expandedFolderId]);
  const chargerDocuments = async () => {
    if (!user) return;
    const result: Record<string, any[]> = {};
    for (const cat of internalCategories) {
      const { data } = await supabase.storage.from("documents").list(`${user.id}/${cat.id}`);
      result[cat.id] = data || [];
    }
    setDocuments(result);

    const { data: candidatures } = await supabase
      .from("candidatures")
      .select("id, statut, talent_id, offre:offre_id(titre)")
      .eq("statut", "acceptee")
      .in("offre_id", (await supabase.from("offres").select("id").eq("entreprise_id", user.id)).data?.map((offre: any) => offre.id) || []);

    const candidatureIds = (candidatures || []).map((candidature: any) => candidature.id);
    const requestsByCandidature: Record<string, any[]> = {};
    if (candidatureIds.length > 0) {
      const { data: requests, error: requestsError } = await supabase
        .from("document_requests")
        .select("*")
        .in("candidature_id", candidatureIds)
        .order("requested_at", { ascending: false });

      if (requestsError) {
        setDocumentsRequestsReady(false);
        console.error("document_requests_select_error", requestsError);
      } else {
        setDocumentsRequestsReady(true);
        (requests || []).forEach((request: any) => {
          if (!requestsByCandidature[request.candidature_id]) requestsByCandidature[request.candidature_id] = [];
          requestsByCandidature[request.candidature_id].push(request);
        });
      }
    } else {
      setDocumentsRequestsReady(true);
    }

    const dossiers = await Promise.all((candidatures || []).map(async (candidature: any) => {
      let talentNom = "Talent";
      let talentPoste = "";

      if (candidature.talent_id) {
        const { data: profilTalent } = await supabase
          .from("profiles")
          .select("full_name, poste")
          .eq("user_id", candidature.talent_id)
          .maybeSingle();
        talentNom = profilTalent?.full_name || "Talent";
        talentPoste = profilTalent?.poste || "";
      }

      const categories = await Promise.all(sharedCategories.map(async (cat) => {
        const { data: ownDocs } = await supabase.storage.from("documents").list(`${user.id}/${cat.id}/${candidature.id}`);
        let partnerDocs: any[] = [];

        if (candidature.talent_id) {
          const { data } = await supabase.storage.from("documents").list(`${candidature.talent_id}/${cat.id}/${candidature.id}`);
          partnerDocs = data || [];
        }

        return {
          ...cat,
          ownDocs: (ownDocs || []).map((doc) => ({ ...doc, ownerId: user.id, sender: "entreprise" })),
          partnerDocs: (partnerDocs || []).map((doc) => ({ ...doc, ownerId: candidature.talent_id, sender: "talent" })),
        };
      }));

      return {
        ...candidature,
        talentNom,
        talentPoste,
        categories,
        documentRequests: requestsByCandidature[candidature.id] || [],
      };
    }));

    setSharedFolders(dossiers);
  };
  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>, categorie: string) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    setUploading(categorie);
    try {
      const nomPropre = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${categorie}/${Date.now()}_${nomPropre}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) throw error;
      toast.success("Document ajouté !"); chargerDocuments();
    } catch (err: any) { toast.error(err.message); } finally { setUploading(null); e.target.value = ""; }
  };
  const uploadSharedDocument = async (e: React.ChangeEvent<HTMLInputElement>, categorie: string, candidatureId: string) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    const uploadKey = `${categorie}-${candidatureId}`;
    setUploading(uploadKey);
    try {
      const nomPropre = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${categorie}/${candidatureId}/${Date.now()}_${nomPropre}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) throw error;
      toast.success("Document partagé ajouté !");
      chargerDocuments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };
  const telechargerDocument = async (ownerId: string, categorie: string, nom: string, candidatureId?: string) => {
    if (!ownerId) return;
    const basePath = candidatureId ? `${ownerId}/${categorie}/${candidatureId}/${nom}` : `${ownerId}/${categorie}/${nom}`;
    const { data } = await supabase.storage.from("documents").createSignedUrl(basePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };
  const ouvrirCheminStockage = async (storagePath: string | null | undefined) => {
    if (!storagePath) return;
    const { data } = await supabase.storage.from("documents").createSignedUrl(storagePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };
  const supprimerDocument = async (categorie: string, nom: string, candidatureId?: string) => {
    if (!user) return;
    const basePath = candidatureId ? `${user.id}/${categorie}/${candidatureId}/${nom}` : `${user.id}/${categorie}/${nom}`;
    const { error } = await supabase.storage.from("documents").remove([basePath]);
    if (!error) { toast.success("Document supprimé."); chargerDocuments(); } else toast.error("Erreur lors de la suppression.");
  };
  const demanderDocument = async (folder: any) => {
    if (!user) return;
    const selectedKey = requestSelections[folder.id];
    const selectedDocument = REQUESTABLE_DOCUMENTS.find((document) => document.key === selectedKey);
    if (!selectedDocument) return toast.error("Choisissez un document à demander.");

    setRequestingFolder(folder.id);
    try {
      const { error } = await supabase.from("document_requests").insert({
        candidature_id: folder.id,
        entreprise_id: user.id,
        talent_id: folder.talent_id,
        requested_by: user.id,
        document_key: selectedDocument.key,
        document_label: selectedDocument.label,
      });
      if (error) throw error;
      toast.success("Document demandé au candidat !");
      setRequestSelections((prev) => ({ ...prev, [folder.id]: "" }));
      await chargerDocuments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRequestingFolder(null);
    }
  };

  const filteredSharedFolders = sharedFolders.filter((folder) => {
    if (!searchDocuments.trim()) return true;
    const query = searchDocuments.toLowerCase();
    return [
      folder.talentNom,
      folder.talentPoste,
      folder.offre?.titre,
      folder.statut,
      ...(folder.documentRequests || []).map((request: any) => request.document_label),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const totalInternalDocuments = internalCategories.reduce((sum, category) => sum + (documents[category.id]?.length || 0), 0);
  const totalPendingRequests = sharedFolders.reduce((sum, folder) => sum + ((folder.documentRequests || []).filter((request: any) => request.status === "requested").length), 0);
  const totalReceivedRequests = sharedFolders.reduce((sum, folder) => sum + ((folder.documentRequests || []).filter((request: any) => request.status === "uploaded").length), 0);
  const totalSharedFolders = sharedFolders.length;

  return (
    <div>
      <div className="space-y-6">
        <div className="dashboard-panel p-6 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                <FileText className="h-3.5 w-3.5" />
                Documents et dossiers candidats
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl">Documents</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Séparez vos documents internes des dossiers partagés avec chaque talent pour garder
                une lecture claire, professionnelle et exploitable rapidement.
              </p>
            </div>
            <div className="dashboard-subcard p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Vue rapide</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {totalPendingRequests > 0
                  ? `${totalPendingRequests} pièce${totalPendingRequests > 1 ? "s" : ""} encore attendue${totalPendingRequests > 1 ? "s" : ""}`
                  : "Aucune pièce urgente en attente"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Les documents RH restent internes, tandis que les contrats, paies et documents d'intérim
                restent rattachés à la bonne relation entreprise-talent.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="dashboard-stat-card border border-accent/20 bg-accent/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Docs internes</p>
            <p className="mt-2 text-2xl font-bold">{totalInternalDocuments}</p>
            <p className="mt-1 text-xs text-muted-foreground">Fichiers gardés dans votre espace entreprise.</p>
          </div>
          <div className="dashboard-stat-card border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Demandes en attente</p>
            <p className="mt-2 text-2xl font-bold">{totalPendingRequests}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pièces encore attendues de vos talents.</p>
          </div>
          <div className="dashboard-stat-card border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Pièces reçues</p>
            <p className="mt-2 text-2xl font-bold">{totalReceivedRequests}</p>
            <p className="mt-1 text-xs text-muted-foreground">Documents déjà récupérés sur les dossiers actifs.</p>
          </div>
          <div className="dashboard-stat-card border border-primary/20 bg-primary/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Dossiers actifs</p>
            <p className="mt-2 text-2xl font-bold">{totalSharedFolders}</p>
            <p className="mt-1 text-xs text-muted-foreground">Relations entreprise-talent ouvertes avec partage.</p>
          </div>
        </div>

        <div className="dashboard-panel p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[0.8fr_0.8fr_1.1fr]">
            <div className="dashboard-subcard p-4">
              <p className="text-sm font-semibold text-foreground">Documents internes entreprise</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ces documents restent dans votre espace entreprise. Ils ne sont jamais visibles par les talents.
              </p>
              <div className="mt-4 rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                Idéal pour vos documents RH, modèles ou pièces de suivi interne.
              </div>
            </div>

            <div className="dashboard-subcard p-4">
              <p className="text-sm font-semibold text-foreground">Pilotage des demandes</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Suivez en un coup d'œil les pièces administratives encore attendues et celles déjà reçues.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  {totalPendingRequests} en attente
                </span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {totalReceivedRequests} reçue{totalReceivedRequests > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="dashboard-subcard p-4">
              <p className="text-sm font-semibold text-foreground">Rechercher un dossier talent</p>
              <div className="relative mt-3">
                <input
                  value={searchDocuments}
                  onChange={(e) => setSearchDocuments(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-accent/40"
                  placeholder="Nom, poste, offre ou document demandé..."
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                {searchDocuments && (
                  <button
                    onClick={() => setSearchDocuments("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
        {internalCategories.map(({ id, label, icon: Icon, desc }) => {
          const docs = documents[id] || [];
          return (
            <div key={id} className="dashboard-panel p-5 sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Icon className="w-5 h-5 text-accent" /></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{label}</h3>
                      <span className="rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1 text-[11px] text-muted-foreground">{docs.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <div>
                  <input type="file" id={`upload-ent-${id}`} className="hidden" accept=".pdf,.doc,.docx,.png,.jpg" onChange={(e) => uploadDocument(e, id)} />
                  <Button className="w-full sm:w-auto" variant="ghost-glow" size="sm" disabled={uploading === id} onClick={() => document.getElementById(`upload-ent-${id}`)?.click()}><Plus className="w-3 h-3 mr-1" />{uploading === id ? "Ajout..." : "Ajouter"}</Button>
                </div>
              </div>
              {docs.length > 0 ? (
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <div key={doc.name} className="dashboard-subcard flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm break-all sm:flex-1 sm:truncate">{doc.name.replace(/^\d+_/, "")}</span>
                      <div className="flex gap-2 self-start sm:ml-2 sm:self-auto">
                        <Button variant="ghost-glow" size="sm" onClick={() => telechargerDocument(user.id, id, doc.name)}>Télécharger</Button>
                        <ConfirmActionDialog
                          title="Supprimer ce document ?"
                          description="Le fichier sera retiré de votre espace entreprise. Si vous changez d'avis, vous pouvez encore annuler maintenant."
                          onConfirm={() => supprimerDocument(id, doc.name)}
                        >
                          <button className="text-red-400 hover:text-red-300 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                        </ConfirmActionDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (<p className="text-xs text-muted-foreground text-center py-2">Aucun document, cliquez sur « Ajouter ».</p>)}
            </div>
          );
        })}
        </div>

        <div className="dashboard-panel p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Dossiers partagés avec les talents</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Les dossiers partagés apparaissent uniquement pour les candidatures acceptées. Les contrats, fiches de paie et documents d'intérim restent liés à la bonne relation entreprise-talent.
              </p>
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {totalSharedFolders} dossier{totalSharedFolders > 1 ? "s" : ""} actif{totalSharedFolders > 1 ? "s" : ""}
            </span>
          </div>
          {!documentsRequestsReady && (
            <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              Les demandes de documents ne sont pas encore actives dans la base. Exécutez le SQL ajouté pour que les demandes apparaissent côté talent.
            </p>
          )}
        </div>

        {sharedFolders.length === 0 ? (
          <div className="dashboard-empty-card p-8">
            <Users className="w-12 h-12 text-accent/20 mx-auto mb-3" />
            <p className="font-semibold mb-1">Aucun dossier partagé actif pour le moment</p>
            <p className="text-sm text-muted-foreground">Les dossiers apparaîtront ici dès qu'une candidature sera acceptée.</p>
          </div>
        ) : filteredSharedFolders.length === 0 ? (
          <div className="dashboard-empty-card p-8">
            <Search className="w-12 h-12 text-accent/20 mx-auto mb-3" />
            <p className="font-semibold mb-1">Aucun candidat trouvé</p>
            <p className="text-sm text-muted-foreground">Essayez un nom, un prénom, un poste ou le titre de l'offre.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSharedFolders.map((folder) => {
              const isExpanded = expandedFolderId === folder.id;
              const pendingRequests = (folder.documentRequests || []).filter((request: any) => request.status === "requested");
              const receivedRequests = (folder.documentRequests || []).filter((request: any) => request.status === "uploaded");
              const sentDocumentsCount = (folder.categories || []).reduce((sum: number, category: any) => sum + (category.ownDocs?.length || 0), 0);
              const receivedDocumentsCount = (folder.categories || []).reduce((sum: number, category: any) => sum + (category.partnerDocs?.length || 0), 0);

              return (
              <div key={folder.id} className="dashboard-panel p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{folder.talentNom}</h3>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {folder.offre?.titre || "Candidature"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Dossier partagé actif pour cette relation entreprise-talent.</p>
                    {folder.talentPoste && <p className="text-xs text-muted-foreground mt-1">{folder.talentPoste}</p>}
                  </div>
                  <span className="w-fit rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                    Candidature acceptée
                  </span>
                </div>

                <div className="mb-4 grid gap-3 xl:grid-cols-4">
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Demandes en attente</p>
                    <p className="mt-2 text-2xl font-bold">{pendingRequests.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Pièces encore attendues du candidat</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Pièces reçues</p>
                    <p className="mt-2 text-2xl font-bold">{receivedRequests.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Demandes déjà complétées</p>
                  </div>
                  <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Envoyés par l'entreprise</p>
                    <p className="mt-2 text-2xl font-bold">{sentDocumentsCount}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Contrats, paie et intérim déjà transmis</p>
                  </div>
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Reçus du talent</p>
                    <p className="mt-2 text-2xl font-bold">{receivedDocumentsCount}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Documents partagés par le candidat</p>
                  </div>
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Vue détaillée du dossier</p>
                    <p className="text-xs text-muted-foreground mt-1">Ouvrez ce dossier pour demander des pièces et consulter les documents partagés avec ce talent.</p>
                  </div>
                  <Button variant="ghost-glow" size="sm" className="w-full sm:w-auto" onClick={() => setExpandedFolderId(isExpanded ? null : folder.id)}>
                    {isExpanded ? <ChevronDown className="w-4 h-4 mr-1 rotate-180" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    {isExpanded ? "Fermer le dossier" : "Ouvrir le dossier"}
                  </Button>
                </div>

                {isExpanded && (
                  <>
                <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold">1. Pièces administratives à demander</p>
                      <p className="mt-1 text-sm text-muted-foreground">Ajoutez ici les pièces dont vous avez besoin. Le talent ne peut répondre qu'aux demandes créées dans ce bloc.</p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
                      <select
                        value={requestSelections[folder.id] || ""}
                        onChange={(e) => setRequestSelections((prev) => ({ ...prev, [folder.id]: e.target.value }))}
                        className="w-full rounded-xl border border-border bg-background/70 px-3 py-2 text-sm focus:outline-none focus:border-accent/40"
                      >
                        <option value="">Choisir un document</option>
                        {REQUESTABLE_DOCUMENTS
                          .filter((document) => !folder.documentRequests.some((request: any) => request.document_key === document.key))
                          .map((document) => (
                            <option key={document.key} value={document.key}>{document.label}</option>
                          ))}
                      </select>
                      <Button className="w-full sm:w-auto" variant="glow" size="sm" disabled={!requestSelections[folder.id] || requestingFolder === folder.id} onClick={() => demanderDocument(folder)}>
                        <Plus className="w-3 h-3 mr-1" />
                              {requestingFolder === folder.id ? "Ajout..." : "Demander"}
                      </Button>
                    </div>
                  </div>

                  {folder.documentRequests.length === 0 ? (
                     <p className="mt-4 text-sm text-muted-foreground">Aucun document n'a encore été demandé à ce candidat.</p>
                  ) : (
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-2xl border border-amber-500/20 bg-background/40 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-amber-300">En attente du candidat</p>
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                            {pendingRequests.length}
                          </span>
                        </div>
                        {pendingRequests.length === 0 ? (
                           <p className="text-sm text-muted-foreground">Aucune pièce en attente. Tout ce qui a été demandé a déjà été reçu.</p>
                        ) : (
                          <div className="space-y-3">
                            {pendingRequests.map((request: any) => {
                              const statusMeta = getRequestStatusMeta(request.status);
                              return (
                                <div key={request.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold">{request.document_label}</p>
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                      {statusMeta.label}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-xs text-muted-foreground">Demandé le {new Date(request.requested_at).toLocaleDateString("fr-FR")}</p>
                                  <p className="mt-3 text-xs font-medium text-amber-300">Le candidat n'a pas encore envoyé cette pièce.</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-emerald-500/20 bg-background/40 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-emerald-300">Reçues et prêtes à consulter</p>
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                            {receivedRequests.length}
                          </span>
                        </div>
                        {receivedRequests.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucune pièce reçue pour le moment.</p>
                        ) : (
                          <div className="space-y-3">
                            {receivedRequests.map((request: any) => {
                              const statusMeta = getRequestStatusMeta(request.status);
                              return (
                                <div key={request.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold">{request.document_label}</p>
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                          {statusMeta.label}
                                        </span>
                                      </div>
                                      <p className="mt-2 text-xs text-muted-foreground">Demandé le {new Date(request.requested_at).toLocaleDateString("fr-FR")}</p>
                                      {request.file_name && (
                                        <p className="mt-1 text-xs text-emerald-300">Fichier reçu : {request.file_name}</p>
                                      )}
                                    </div>
                                    <Button className="w-full sm:w-auto" variant="ghost-glow" size="sm" onClick={() => ouvrirCheminStockage(request.storage_path)}>
                                      Ouvrir
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">2. Documents partagés pour cette candidature</p>
                    <p className="text-xs text-muted-foreground mt-1">Vous envoyez ici les contrats, paies ou documents d'intérim propres à ce talent.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {folder.categories.map((category: any) => {
                    const inputId = `upload-shared-ent-${folder.id}-${category.id}`;
                    const uploadKey = `${category.id}-${folder.id}`;
                    const ownDocs = category.ownDocs || [];
                    const partnerDocs = category.partnerDocs || [];

                    return (
                      <div key={category.id} className="rounded-2xl border border-border/50 bg-background/40 p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                              <category.icon className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-semibold">{category.label}</p>
                              <p className="text-xs text-muted-foreground">{category.desc}</p>
                            </div>
                          </div>
                          <div className="w-full sm:w-auto">
                            <input type="file" id={inputId} className="hidden" accept=".pdf,.doc,.docx,.png,.jpg" onChange={(e) => uploadSharedDocument(e, category.id, folder.id)} />
                            <Button className="w-full sm:w-auto" variant="ghost-glow" size="sm" disabled={uploading === uploadKey} onClick={() => document.getElementById(inputId)?.click()}>
                              <Plus className="w-3 h-3 mr-1" />
                              {uploading === uploadKey ? "Ajout..." : "Ajouter un document"}
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">Envoyés par l'entreprise</p>
                            {ownDocs.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Aucun document envoyé pour cette catégorie.</p>
                            ) : (
                              ownDocs.map((doc: any) => (
                                <div key={doc.name} className="mb-2 flex flex-col gap-3 rounded-lg bg-secondary/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="text-sm break-all sm:flex-1 sm:truncate">{doc.name.replace(/^\d+_/, "")}</span>
                                  <div className="flex gap-2 self-start sm:ml-2 sm:self-auto">
                                    <Button variant="ghost-glow" size="sm" onClick={() => telechargerDocument(user.id, category.id, doc.name, folder.id)}>Ouvrir</Button>
                                    <ConfirmActionDialog
                                      title="Supprimer ce document partagé ?"
                                      description="Ce document ne sera plus disponible dans ce dossier candidat. Vous pouvez encore annuler avant validation."
                                      onConfirm={() => supprimerDocument(category.id, doc.name, folder.id)}
                                    >
                                      <button className="text-red-400 p-1 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                    </ConfirmActionDialog>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Envoyés par le talent</p>
                            {partnerDocs.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Aucun document reçu du talent pour le moment.</p>
                            ) : (
                              partnerDocs.map((doc: any) => (
                                <div key={doc.name} className="mb-2 flex flex-col gap-3 rounded-lg bg-secondary/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="text-sm break-all sm:flex-1 sm:truncate">{doc.name.replace(/^\d+_/, "")}</span>
                                  <div className="flex gap-2 self-start sm:ml-2 sm:self-auto">
                                    <Button variant="ghost-glow" size="sm" onClick={() => telechargerDocument(doc.ownerId, category.id, doc.name, folder.id)}>Ouvrir</Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                  </>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntrepriseDashboard;
