import { emailCandidatureStatut, emailNouveauMessage, emailOffrePubliee } from "@/lib/emails";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DOCUMENT_ACCEPT_ATTRIBUTE, formatStoredMessageText, sanitizeStorageFileName, validateDocumentFile } from "@/lib/utils";
import { deletePrivateDocument, logDocumentAccess, openPrivateDocument, uploadPrivateDocument } from "@/lib/documentSecurity";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";
import AccountSecurityPanel from "@/components/AccountSecurityPanel";
import ThemeToggle from "@/components/ThemeToggle";
import OfferDescription, { getOfferDescriptionPreview } from "@/components/OfferDescription";
import { Sparkles, Wand2, Users, BarChart3, LogOut, Building2, Plus, FileText, Camera, Trash2, CheckCircle, Eye, EyeOff, Send, MessageSquare, ChevronDown, ChevronUp, Search, MapPin, Euro, GraduationCap, Calendar, Briefcase, Wrench, Mail, Check, X, Pencil, Menu, ArrowLeft, CreditCard, Lock, Download, ShieldCheck, Image as ImageIcon } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emailNouvelleOffreTalent } from "@/lib/emails";
import { requestAiContent } from "@/lib/aiAssistant";
import { translateAppError } from "@/lib/authMessages";
import { isCandidateExchangeClosed } from "@/lib/candidateExchange";
import { COMPANY_COVER_FILE_NAME, getCompanyCoverPath, getCompanyCoverPublicUrl, validateCompanyCoverImage } from "@/lib/companyMedia";
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
  BillingPlanEntitlements,
  BillingProfile,
  EntrepriseBillingState,
  computeBillingTotals,
  formatEuroFromCents,
  getAddonById,
  getAddonPriceCents,
  getBillingPlanEntitlements,
  getEffectiveBillingPlanId,
  getPlanById,
  getPlanPriceCents,
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
  const cleaned = formatStoredMessageText(value);
  return DISPLAY_LABELS[cleaned] || cleaned;
};

const formatDisplayList = (value?: string | null) => {
  if (!value) return "";
  return formatStoredMessageText(value)
    .split(",")
    .map((item) => formatDisplayLabel(item.trim()))
    .join(", ");
};

const normalizeChoiceKey = (value: string) =>
  formatStoredMessageText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const splitStoredChoices = (value?: string | null) =>
  formatStoredMessageText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const serializeStoredChoices = (choices: string[]) => {
  const seen = new Set<string>();
  return choices
    .map((item) => formatDisplayLabel(item).trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeChoiceKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
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

const SecteursMultiSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = useMemo(() => splitStoredChoices(value), [value]);
  const selectedKeys = useMemo(() => new Set(selected.map(normalizeChoiceKey)), [selected]);
  const searchKey = normalizeChoiceKey(recherche);
  const filtres = SECTEURS.filter((secteurOption) => normalizeChoiceKey(secteurOption).includes(searchKey));
  const canAddCustom = Boolean(searchKey) && !selectedKeys.has(searchKey) && !SECTEURS.some((secteurOption) => normalizeChoiceKey(secteurOption) === searchKey);

  const updateChoices = (choices: string[]) => onChange(serializeStoredChoices(choices));

  const toggleChoice = (choice: string) => {
    const key = normalizeChoiceKey(choice);
    const nextChoices = selectedKeys.has(key)
      ? selected.filter((item) => normalizeChoiceKey(item) !== key)
      : [...selected, choice];
    updateChoices(nextChoices);
  };

  const removeChoice = (choice: string) => {
    const key = normalizeChoiceKey(choice);
    updateChoices(selected.filter((item) => normalizeChoiceKey(item) !== key));
  };

  const addCustomChoice = () => {
    const customChoice = recherche.trim();
    if (!customChoice) return;
    updateChoices([...selected, customChoice]);
    setRecherche("");
  };

  return (
    <div ref={ref} className="relative">
      <div className="rounded-lg border border-border bg-secondary p-2 transition-colors focus-within:border-accent/50">
        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selected.map((choice) => (
              <span key={normalizeChoiceKey(choice)} className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                {formatDisplayLabel(choice)}
                <button type="button" onClick={() => removeChoice(choice)} className="rounded-full p-0.5 text-accent/70 hover:bg-accent/10 hover:text-accent" aria-label={`Retirer ${formatDisplayLabel(choice)}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-sm focus:outline-none">
          <span className={selected.length ? "text-foreground" : "text-muted-foreground"}>
            {selected.length ? `${selected.length} secteur(s) sélectionné(s)` : "Ajouter un ou plusieurs secteurs..."}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-xl">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="w-full rounded-md bg-secondary py-1.5 pl-8 pr-3 text-sm focus:outline-none"
                placeholder="Rechercher ou ajouter un secteur..."
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {canAddCustom && (
              <button type="button" onClick={addCustomChoice} className="w-full border-b border-border/50 px-3 py-2 text-left text-sm font-semibold text-accent hover:bg-secondary">
                Ajouter "{recherche.trim()}"
              </button>
            )}
            {selected.length > 0 && (
              <button type="button" onClick={() => updateChoices([])} className="w-full px-3 py-2 text-left text-xs text-muted-foreground hover:bg-secondary">
                Effacer tous les secteurs
              </button>
            )}
            {filtres.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">Aucun résultat</p>
            ) : (
              filtres.map((secteurOption) => {
                const selectedOption = selectedKeys.has(normalizeChoiceKey(secteurOption));
                return (
                  <button
                    key={secteurOption}
                    type="button"
                    onClick={() => toggleChoice(secteurOption)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary ${selectedOption ? "bg-accent/5 text-accent" : ""}`}
                  >
                    <span className="flex h-4 w-4 items-center justify-center">
                      {selectedOption && <Check className="h-3.5 w-3.5" />}
                    </span>
                    {formatDisplayLabel(secteurOption)}
                  </button>
                );
              })
            )}
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
  { id: "messagerie", label: "Échanges candidats", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
];

const ENTREPRISE_ACTIVE_TAB_STORAGE_KEY = "spotted-talent:entreprise-active-tab";

const isEntrepriseTabId = (value: string | null) =>
  Boolean(value && tabs.some((tab) => tab.id === value));

const getInitialEntrepriseTab = () => {
  if (typeof window === "undefined") return "dashboard";

  const queryTab = new URLSearchParams(window.location.search).get("tab");
  if (isEntrepriseTabId(queryTab)) return queryTab as string;

  const storedTab = window.localStorage.getItem(ENTREPRISE_ACTIVE_TAB_STORAGE_KEY);
  if (isEntrepriseTabId(storedTab)) return storedTab as string;

  return "dashboard";
};

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
  const [activeTab, setActiveTab] = useState(getInitialEntrepriseTab);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [nbOffres, setNbOffres] = useState(0);
  const [nbCandidatures, setNbCandidatures] = useState(0);
  const [nbMessagesNonLus, setNbMessagesNonLus] = useState(0);
  const [nbNouvellesCandidatures, setNbNouvellesCandidatures] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [offresRefreshToken, setOffresRefreshToken] = useState(0);
  const [billingState, setBillingState] = useState<EntrepriseBillingState | null>(null);
  const candidaturesRecuesSignalKey = user ? `spotted-talent:entreprise-candidatures:${user.id}` : "";
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || "Dashboard";
  const effectivePlanId = billingState ? getEffectiveBillingPlanId(billingState) : "starter";
  const planEntitlements = getBillingPlanEntitlements(effectivePlanId);

  useEffect(() => { if (!loading && !user) navigate("/entreprise/connexion"); }, [loading, user, navigate]);

  useEffect(() => {
    if (typeof window === "undefined" || !isEntrepriseTabId(activeTab)) return;

    window.localStorage.setItem(ENTREPRISE_ACTIVE_TAB_STORAGE_KEY, activeTab);

    const url = new URL(window.location.href);
    if (activeTab === "dashboard") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", activeTab);
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [activeTab]);

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
      toast.error(
        billingState.subscriptionStatus === "trial" && !billingState.trialPlanLocked
          ? "Enregistrez votre carte pour activer les 30 jours d'essai."
          : "Votre essai gratuit de 30 jours est terminé. Activez un plan pour débloquer cette rubrique.",
      );
    }
  }, [activeTab, billingState]);

  useEffect(() => {
    if (!user) return;

    const url = new URL(window.location.href);
    const status = url.searchParams.get("billing_status");
    if (!status) return;

    url.searchParams.delete("billing_status");
    url.searchParams.delete("plan");
    url.searchParams.delete("cycle");
    const query = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${query ? `?${query}` : ""}`);

    if (status === "cancel") {
      toast.message("Paiement annulé. Aucun prélèvement n'a été effectué.");
      return;
    }

    if (status !== "success") return;

    let cancelled = false;
    toast.success("Carte enregistrée. Nous confirmons votre abonnement avec Stripe.");

    void (async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 1000));
        }
        const remoteState = await fetchEntrepriseBillingStateRemote(user.id);
        if (cancelled || !remoteState) continue;

        const stripeConfirmed =
          remoteState.subscriptionStatus !== "trial" || Boolean(remoteState.trialPlanLocked);
        if (!stripeConfirmed && attempt < 5) continue;

        const localState = loadEntrepriseBillingState(user.id);
        const mergedState = mergeEntrepriseBillingStates(localState, remoteState);
        setBillingState(mergedState);
        saveEntrepriseBillingState(user.id, mergedState);
        if (stripeConfirmed) {
          toast.success("Abonnement confirmé. Un e-mail récapitulatif vous a été envoyé.");
        }
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      const chargerAvatar = async () => {
        const { data: list } = await supabase.storage.from("avatars").list(user.id);
        if (list && list.length > 0) {
          const avatarFile = list.find((fichier) => fichier.name.startsWith("avatar."));
          if (avatarFile) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(`${user.id}/${avatarFile.name}`);
            setAvatarUrl(data.publicUrl + "?t=" + Date.now());
          }

          const coverFile = list.find((fichier) => fichier.name === COMPANY_COVER_FILE_NAME);
          if (coverFile) {
            setCoverUrl(getCompanyCoverPublicUrl(user.id, Date.now()));
          }
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

  const candidatureIdFromUrl =
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("candidature");
  const billingTrialDaysLeft = billingState
    ? Math.max(0, Math.ceil((new Date(billingState.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const billingNeedsCheckout = billingState?.subscriptionStatus === "trial" && !billingState.trialPlanLocked;
  const billingTrialEndingSoon =
    billingState?.subscriptionStatus === "trial" && Boolean(billingState.trialPlanLocked) && billingTrialDaysLeft <= 7;
  const billingBannerClass =
    billingState?.subscriptionStatus === "expired" ||
    billingState?.subscriptionStatus === "canceled" ||
    billingState?.subscriptionStatus === "past_due"
      ? "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-200"
      : billingTrialEndingSoon
        ? "border-orange-500/35 bg-orange-500/10 text-orange-700 dark:text-orange-100"
        : "border-zinc-900/25 bg-zinc-950/[0.04] text-zinc-950 dark:border-zinc-100/20 dark:text-zinc-100";
  const billingBannerText =
    billingState?.subscriptionStatus === "expired" || billingState?.subscriptionStatus === "canceled"
      ? "Votre essai gratuit de 30 jours est expiré. Activez un plan dans l'onglet Abonnement pour débloquer les rubriques métier."
      : billingState?.subscriptionStatus === "past_due"
        ? "Un paiement est en attente. Mettez à jour votre moyen de paiement pour garder toutes les rubriques actives."
        : billingNeedsCheckout
          ? "Votre essai n'est pas encore activé. Choisissez une formule et enregistrez votre carte avec Stripe pour démarrer les 30 jours."
          : billingTrialEndingSoon
            ? `Votre essai expire bientôt : il reste ${billingTrialDaysLeft} jour(s) avant le premier paiement.`
            : "Essai gratuit actif : votre carte est enregistrée et aucun débit n'aura lieu avant la fin des 30 jours.";

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
                  toast.error(billingNeedsCheckout
                    ? "Enregistrez votre carte pour activer les 30 jours d'essai."
                    : "Essai gratuit expiré. Activez un plan pour accéder à cette section.");
                  return;
                }
                setActiveTab(id);
                setMobileNavOpen(false);
                if (id === "messagerie") setNbMessagesNonLus(0);
                if (id === "candidats") void marquerCandidaturesRecuesCommeVues();
              }}
              className={`dashboard-nav-item ${activeTab === id ? "dashboard-nav-item-accent-active" : ""} ${tabLocked ? "cursor-not-allowed opacity-55" : ""}`}
              title={tabLocked ? (billingNeedsCheckout ? "Carte requise pour activer l'essai" : "Essai expiré - activez un plan") : undefined}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{label}</span>
              {id === "messagerie" && nbMessagesNonLus > 0 && (<span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{nbMessagesNonLus}</span>)}
              {id === "candidats" && nbNouvellesCandidatures > 0 && (<span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">{nbNouvellesCandidatures}</span>)}
              {tabLocked && <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">Bloqué</span>}
            </button>
          )})}
        </nav>
        <div className="border-t border-border/50 p-4">
          <div className="mb-2 flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">Apparence</span>
            <ThemeToggle className="border-0 bg-transparent p-0 shadow-none [&_button]:h-7 [&_button]:w-7" />
          </div>
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
        {activeTab === "profil" && <ProfilEntrepriseTab profile={profile} user={user} avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} coverUrl={coverUrl} setCoverUrl={setCoverUrl} />}
        {activeTab === "offres" && <OffresTab user={user} planId={effectivePlanId} entitlements={planEntitlements} onOffrePubliee={() => { setNbOffres(n => n + 1); setOffresRefreshToken((token) => token + 1); setActiveTab("mes-offres"); }} />}
        {activeTab === "mes-offres" && <MesOffresTab user={user} planId={effectivePlanId} entitlements={planEntitlements} refreshToken={offresRefreshToken} onOffresChanged={setNbOffres} onOpenDraft={() => setActiveTab("offres")} />}
        {activeTab === "abonnement" && user && billingState && (
          <AbonnementEntrepriseTab
            user={user}
            billingState={billingState}
            onBillingChange={setBillingState}
          />
        )}
        {activeTab === "candidats" && <CandidatsTab user={user} planId={effectivePlanId} entitlements={planEntitlements} />}
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
  const [verifyingSiret, setVerifyingSiret] = useState(false);
  const lastAutomaticSiretAttempt = useRef("");
  const lastAutomaticBillingSyncKey = useRef("");

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

  useEffect(() => {
    if (!billingState.stripeCustomerId || !billingState.trialPlanLocked) return;

    const syncKey = [
      billingState.stripeCustomerId,
      billingProfileDraft.siretVerifiedAt || "unverified",
      billingProfileDraft.vatNumber || "no-vat-number",
    ].join(":");
    if (lastAutomaticBillingSyncKey.current === syncKey) return;

    lastAutomaticBillingSyncKey.current = syncKey;
    void (async () => {
      const { error } = await supabase.functions.invoke("stripe-sync-billing", { body: {} });
      if (error) {
        console.error("stripe_billing_sync_error", error);
        return;
      }

      const remoteState = await fetchEntrepriseBillingStateRemote(user.id);
      if (!remoteState) return;
      const mergedState = mergeEntrepriseBillingStates(billingState, remoteState);
      onBillingChange(mergedState);
      saveEntrepriseBillingState(user.id, mergedState);
    })();
  }, [
    billingState.stripeCustomerId,
    billingState.trialPlanLocked,
    billingProfileDraft.siretVerifiedAt,
    billingProfileDraft.vatNumber,
  ]);

  const planEnCours = getPlanById(billingState.plan);
  const trialEndsAtDate = new Date(billingState.trialEndsAt);
  const trialDaysLeft = Math.max(0, Math.ceil((trialEndsAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isTrialExpired = billingState.subscriptionStatus === "expired";
  const isActive = billingState.subscriptionStatus === "active";
  const isPastDue = billingState.subscriptionStatus === "past_due";
  const isCanceled = billingState.subscriptionStatus === "canceled";
  const trialLockedPlanId = billingState.trialPlanLocked;
  const trialLockedPlanLabel = trialLockedPlanId ? getPlanById(trialLockedPlanId).name : null;
  const isConfirmedTrial = billingState.subscriptionStatus === "trial" && Boolean(trialLockedPlanId);
  const isTrialEndingSoon = isConfirmedTrial && trialDaysLeft <= 7;

  const totals = useMemo(
    () => computeBillingTotals(selectedPlanId, billingCycle, []),
    [selectedPlanId, billingCycle],
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

  const readFunctionErrorPayload = async (error: any, data: any) => {
    if (data && typeof data === "object") return data;
    const response = error?.context;
    if (response && typeof response.json === "function") {
      try {
        return await response.json();
      } catch {
        // The generic error message below remains the fallback.
      }
    }
    return null;
  };

  const readFunctionErrorCode = async (error: any, data: any) => {
    const payload = await readFunctionErrorPayload(error, data);
    if (typeof payload?.error === "string") return payload.error;
    return typeof error?.message === "string" ? error.message : "unknown_error";
  };

  const readFunctionErrorMessage = async (error: any, data: any, fallback: string) => {
    const payload = await readFunctionErrorPayload(error, data);
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }
    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message;
    }
    return fallback;
  };

  const verifierSiret = async (siretValue?: string) => {
    const siret = String(siretValue ?? billingProfileDraft.siret).replace(/\D/g, "").slice(0, 14);
    if (siret.length !== 14) {
      toast.error("Le SIRET doit contenir exactement 14 chiffres.");
      return;
    }

    setVerifyingSiret(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-company-siret", {
        body: { siret },
      });
      if (error || !data?.company) {
        const errorCode = await readFunctionErrorCode(error, data);
        const messages: Record<string, string> = {
          invalid_siret: "Le numéro SIRET n'est pas valide.",
          siret_not_found: "Ce SIRET n'a pas été trouvé dans l'Annuaire des Entreprises.",
          company_establishment_inactive: "Cet établissement est déclaré fermé ou inactif.",
          siret_already_registered: "Ce SIRET est déjà lié à un autre compte Spotted Talent.",
          verified_siret_is_locked: "Le SIRET vérifié de ce compte ne peut plus être remplacé.",
          official_company_service_unavailable: "Le service officiel est momentanément indisponible. Réessayez dans quelques instants.",
        };
        throw new Error(messages[errorCode] || "La vérification du SIRET a échoué.");
      }

      const company = data.company;
      const nextProfile: BillingProfile = {
        ...billingProfileDraft,
        siret: company.siret,
        siretVerifiedAt: company.verifiedAt,
        legalName: company.legalName || billingProfileDraft.legalName,
        billingEmail: billingProfileDraft.billingEmail || user.email || "",
        addressLine1: company.addressLine1 || billingProfileDraft.addressLine1,
        postalCode: company.postalCode || billingProfileDraft.postalCode,
        city: company.city || billingProfileDraft.city,
        country: company.country || "France",
      };
      const nextState: EntrepriseBillingState = {
        ...billingState,
        billingProfile: nextProfile,
        updatedAt: new Date().toISOString(),
      };
      setBillingProfileDraft(nextProfile);
      persistBillingState(nextState);
      toast.success("Entreprise vérifiée. Les coordonnées officielles ont été ajoutées.");
    } catch (error: any) {
      console.error("siret_verification_error", error);
      toast.error(translateAppError(error?.message, "La vérification du SIRET a échoué."));
    } finally {
      setVerifyingSiret(false);
    }
  };

  useEffect(() => {
    const siret = billingProfileDraft.siret.replace(/\D/g, "");
    if (billingProfileDraft.siretVerifiedAt || siret.length !== 14 || verifyingSiret) return;
    if (lastAutomaticSiretAttempt.current === siret) return;
    lastAutomaticSiretAttempt.current = siret;
    void verifierSiret(siret);
  }, [billingProfileDraft.siret, billingProfileDraft.siretVerifiedAt, verifyingSiret]);

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

  const demarrerCheckoutStripe = async (planId: BillingPlanId) => {
    if (!billingProfileDraft.legalName.trim() || !billingProfileDraft.addressLine1.trim() || !billingProfileDraft.postalCode.trim() || !billingProfileDraft.city.trim()) {
      toast.error("Complétez le nom et l'adresse de l'entreprise avant le paiement.");
      return;
    }
    setCheckoutPlanId(planId);
    try {
      const checkoutBillingProfile = {
        ...billingProfileDraft,
        billingEmail: billingProfileDraft.billingEmail.trim() || user.email || "",
      };
      const successUrl = `${window.location.origin}/entreprise/dashboard?tab=abonnement&billing_status=success&plan=${planId}&cycle=${billingCycle}`;
      const cancelUrl = `${window.location.origin}/entreprise/dashboard?tab=abonnement&billing_status=cancel`;
      const { data, error } = await supabase.functions.invoke("stripe-create-checkout-session", {
        body: {
          planId,
          billingCycle,
          addons: [],
          billingProfile: checkoutBillingProfile,
          successUrl,
          cancelUrl,
        },
      });
      if (error) {
        const errorCode = await readFunctionErrorCode(error, data);
        if (errorCode === "company_verification_required") {
          throw new Error("Le SIRET doit être vérifié avant le paiement.");
        }
        throw error;
      }
      if (!data?.url || typeof data.url !== "string") {
        throw new Error("checkout_session_missing_url");
      }
      window.location.href = data.url;
    } catch (error: any) {
      console.error("stripe_checkout_error", error);
      toast.error(translateAppError(error?.message, "Checkout Stripe indisponible pour le moment. Réessayez dans quelques instants."));
    } finally {
      setCheckoutPlanId(null);
    }
  };

  const ouvrirPortailStripe = async (fallbackPlanId?: BillingPlanId) => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-create-customer-portal", {
        body: {
          returnUrl: `${window.location.origin}/entreprise/dashboard?tab=abonnement`,
        },
      });
      if (error) {
        const payload = await readFunctionErrorPayload(error, data);
        if (payload?.error === "stripe_subscription_not_found") {
          setOpeningPortal(false);
          toast.message("Aucun abonnement Stripe actif. Ouverture du paiement sécurisé.");
          await demarrerCheckoutStripe(fallbackPlanId || billingState.plan);
          return;
        }
        throw new Error(await readFunctionErrorMessage(error, data, "Portail Stripe indisponible pour le moment."));
      }
      if (!data?.url || typeof data.url !== "string") {
        throw new Error("portal_session_missing_url");
      }
      window.location.href = data.url;
    } catch (error: any) {
      console.error("stripe_portal_error", error);
      toast.error(translateAppError(error?.message, "Portail Stripe indisponible pour le moment."));
    } finally {
      setOpeningPortal(false);
    }
  };

  const telechargerFactureTest = async (invoice: BillingInvoice) => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 48;
      const vatCents = Math.max(0, invoice.amountTtcCents - invoice.amountHtCents);
      const issuedAt = new Date(invoice.issuedAt).toLocaleDateString("fr-FR");

      doc.setFillColor(24, 24, 27);
      doc.rect(0, 0, pageWidth, 96, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("SPOTTED TALENT", margin, 58);
      doc.setFontSize(16);
      doc.text("FACTURE TEST", pageWidth - margin, 58, { align: "right" });

      doc.setTextColor(153, 27, 27);
      doc.setFontSize(10);
      doc.text("DOCUMENT DE SIMULATION - AUCUNE VALEUR COMPTABLE", margin, 124);

      doc.setTextColor(24, 24, 27);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Numéro : ${invoice.invoiceNumber}`, margin, 162);
      doc.setFont("helvetica", "normal");
      doc.text(`Date d'émission : ${issuedAt}`, margin, 182);
      doc.text(`Période : ${invoice.periodLabel}`, margin, 202);

      doc.setFont("helvetica", "bold");
      doc.text("CLIENT", margin, 248);
      doc.setFont("helvetica", "normal");
      const clientLines = [
        billingProfileDraft.legalName || user.email || "Entreprise test",
        billingProfileDraft.addressLine1,
        billingProfileDraft.addressLine2,
        [billingProfileDraft.postalCode, billingProfileDraft.city].filter(Boolean).join(" "),
        billingProfileDraft.siret ? `SIRET : ${billingProfileDraft.siret}` : "",
        billingProfileDraft.billingEmail || user.email || "",
      ].filter(Boolean);
      clientLines.forEach((line, index) => doc.text(String(line), margin, 270 + index * 18));

      const tableTop = 390;
      doc.setFillColor(244, 244, 245);
      doc.rect(margin, tableTop, pageWidth - margin * 2, 34, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Description", margin + 12, tableTop + 22);
      doc.text("Montant", pageWidth - margin - 12, tableTop + 22, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(invoice.periodLabel, margin + 12, tableTop + 58);
      doc.text(formatEuroFromCents(invoice.amountHtCents), pageWidth - margin - 12, tableTop + 58, { align: "right" });

      const totalsX = pageWidth - margin - 190;
      doc.text("Total HT", totalsX, tableTop + 108);
      doc.text(formatEuroFromCents(invoice.amountHtCents), pageWidth - margin, tableTop + 108, { align: "right" });
      doc.text("TVA", totalsX, tableTop + 132);
      doc.text(formatEuroFromCents(vatCents), pageWidth - margin, tableTop + 132, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Total TTC", totalsX, tableTop + 162);
      doc.text(formatEuroFromCents(invoice.amountTtcCents), pageWidth - margin, tableTop + 162, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      doc.text("Spotted Talent - www.spottedtalent.fr", margin, 770);
      doc.text("Ce document sert uniquement à tester l'affichage et le téléchargement des factures.", margin, 788);
      doc.save(`${invoice.invoiceNumber}-facture-test.pdf`);
    } catch (error) {
      console.error("test_invoice_pdf_error", error);
      toast.error("Le PDF test n'a pas pu être généré.");
    }
  };

  const priceSuffix = billingCycle === "yearly" ? "HT /an" : "HT /mois";
  const selectedPlan = getPlanById(selectedPlanId);
  const isStripeTrialAvailable = billingState.subscriptionStatus === "trial" && !trialLockedPlanId;
  const hasStripeCustomerLink = Boolean(billingState.stripeCustomerId);
  const hasManagedStripeSubscription = hasStripeCustomerLink && (isActive || isConfirmedTrial || isPastDue);
  const needsStripeCheckoutRepair = !hasStripeCustomerLink && (isActive || isConfirmedTrial || isPastDue);
  const statusLabel = isActive
    ? "Actif"
    : isPastDue
      ? "Paiement en retard"
      : isTrialExpired || isCanceled
        ? "Expiré"
        : isTrialEndingSoon
          ? "Expire bientôt"
          : "Essai";
  const statusColor = isActive
    ? "text-emerald-600 dark:text-emerald-400"
    : isTrialEndingSoon
      ? "text-orange-500"
      : isPastDue || isTrialExpired || isCanceled
        ? "text-red-600 dark:text-red-400"
        : "text-zinc-950 dark:text-zinc-100";
  const statusPanelClass = isActive
    ? "border-emerald-500/35 bg-emerald-500/[0.06]"
    : isTrialEndingSoon
      ? "border-orange-500/40 bg-orange-500/[0.07]"
      : isPastDue || isTrialExpired || isCanceled
        ? "border-red-500/40 bg-red-500/[0.07]"
        : "border-zinc-900/25 bg-zinc-950/[0.03] dark:border-zinc-100/20 dark:bg-zinc-100/[0.04]";
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {isActive || isConfirmedTrial ? "Plan actuel" : "Formule présélectionnée"}
            </p>
            <p className="mt-3 text-xl font-semibold text-foreground">{planEnCours.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatEuroFromCents(getPlanPriceCents(billingState.plan, billingState.billingCycle))} HT {billingState.billingCycle === "yearly" ? "/an" : "/mois"}
            </p>
            {billingState.billingCycle === "yearly" && (
              <p className="mt-1 text-xs text-emerald-300">
                Soit {formatEuroFromCents(getYearlyEquivalentMonthlyCents(getPlanPriceCents(billingState.plan, "yearly")))} HT /mois
                • Facturation annuelle en un paiement
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
          <p className="text-3xl font-bold">{isActive ? "Terminé" : isConfirmedTrial ? `${trialDaysLeft} j` : "À activer"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isConfirmedTrial ? `Fin prévue : ${trialEndsAtDate.toLocaleDateString("fr-FR")}` : "La période commence après l'enregistrement de la carte."}
          </p>
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
              : isTrialExpired || isCanceled
                ? "Essai expiré: activez un plan pour débloquer."
                : isConfirmedTrial
                  ? "Essai en cours avec carte enregistrée."
                  : "Choisissez un plan pour enregistrer votre carte avec Stripe."}
          </p>
        </div>
      </div>

      <div className={`dashboard-panel p-5 sm:p-6 ${statusPanelClass}`}>
        <p className="text-sm font-semibold text-foreground">Essai gratuit 30 jours</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {isActive
            ? "Votre entreprise est sortie du mode essai et utilise un plan actif."
            : isTrialExpired || isCanceled
              ? "Votre essai est terminé. Les rubriques métier sont bloquées automatiquement jusqu'à l'activation d'un plan."
              : isConfirmedTrial
                ? `Votre essai est actif. Il reste ${trialDaysLeft} jour(s) avant le premier paiement.`
                : "Choisissez une formule ci-dessous. Stripe demandera votre carte avant d'activer les 30 jours d'essai."}
        </p>
        {billingState.subscriptionStatus === "trial" && (
          <p className={`mt-2 text-xs ${isTrialEndingSoon ? "text-orange-600 dark:text-orange-300" : "text-zinc-800 dark:text-zinc-200"}`}>
            Essai unique par compte entreprise: un seul abonnement peut utiliser l'essai gratuit.
          </p>
        )}
      </div>

      <div className="dashboard-panel p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Cycle de facturation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Le cycle annuel correspond à 12 mois facturés en un paiement, sans réduction permanente.
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
              Annuel
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {ABONNEMENT_PLANS.map((plan) => {
          const actif = plan.id === billingState.plan && isActive && billingState.billingCycle === billingCycle;
          const currentTrial = plan.id === trialLockedPlanId && isConfirmedTrial && billingState.billingCycle === billingCycle;
          const currentPastDue = plan.id === billingState.plan && isPastDue && billingState.billingCycle === billingCycle;
          const currentSubscription = actif || currentTrial || currentPastDue;
          const planPriceCents = getPlanPriceCents(plan.id, billingCycle);
          const yearlyEquivalentMonthlyCents = getYearlyEquivalentMonthlyCents(planPriceCents);
          const checkoutLoading = checkoutPlanId === plan.id;
          const currentPlanClass = actif
            ? "border-emerald-500/40 bg-emerald-500/[0.05]"
            : currentTrial
              ? isTrialEndingSoon
                ? "border-orange-500/45 bg-orange-500/[0.06]"
                : "border-zinc-900/35 bg-zinc-950/[0.03] dark:border-zinc-100/25"
              : currentPastDue
                ? "border-red-500/45 bg-red-500/[0.06]"
                : "";
          return (
            <div
              key={plan.id}
              className={`dashboard-panel p-5 sm:p-6 ${currentPlanClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-foreground">{plan.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                {actif && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Actif</span>}
                {currentTrial && <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${isTrialEndingSoon ? "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-300" : "border-zinc-900/30 bg-zinc-950/[0.06] text-zinc-950 dark:border-zinc-100/25 dark:text-zinc-100"}`}>{isTrialEndingSoon ? "Expire bientôt" : "Essai"}</span>}
                {currentPastDue && <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">Paiement requis</span>}
              </div>
              <p className="mt-5 text-2xl font-bold text-foreground">{formatEuroFromCents(planPriceCents)} {priceSuffix}</p>
              {billingCycle === "yearly" && (
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-emerald-300">
                    Soit {formatEuroFromCents(yearlyEquivalentMonthlyCents)} HT /mois, facturé annuellement.
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
                  variant={currentSubscription ? "secondary" : "glow"}
                  className="w-full"
                  disabled={checkoutLoading || openingPortal}
                  onClick={() => hasManagedStripeSubscription ? ouvrirPortailStripe(plan.id) : demarrerCheckoutStripe(plan.id)}
                >
                  {checkoutLoading
                    ? "Ouverture du paiement..."
                    : hasManagedStripeSubscription
                        ? openingPortal
                          ? "Ouverture du portail..."
                          : currentPastDue && currentSubscription
                            ? "Régulariser le paiement"
                            : currentSubscription
                              ? "Gérer la carte et l'abonnement"
                              : "Changer de formule dans Stripe"
                        : isStripeTrialAvailable
                          ? "Essai 30 jours avec carte"
                          : needsStripeCheckoutRepair && currentSubscription
                            ? "Recréer le lien Stripe sécurisé"
                          : "Paiement sécurisé"}
                </Button>
                {billingState.subscriptionStatus === "trial" && (
                  <p className="text-center text-xs text-muted-foreground">
                    {needsStripeCheckoutRepair && currentSubscription
                      ? "Le compte indique un essai, mais aucun client Stripe n'est relié. Stripe redemandera la carte pour recréer le lien sécurisé."
                      : isStripeTrialAvailable
                      ? "Essai unique: Stripe demandera une carte, sans débit avant la fin des 30 jours."
                      : `Essai déjà choisi sur ${trialLockedPlanLabel}. Tout changement de formule passe par le portail Stripe.`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {getEffectiveBillingPlanId(billingState) === "premium" && hasManagedStripeSubscription && (
        <div className="dashboard-panel border border-emerald-500/20 bg-emerald-500/[0.04] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Support prioritaire Premium</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Votre demande est identifiée comme prioritaire. Indiquez l'entreprise, le problème rencontré et, si possible, une capture d'écran.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost-glow"
              className="w-full sm:w-auto"
              onClick={() => {
                const subject = encodeURIComponent(`Support prioritaire Premium - ${billingProfileDraft.legalName || "Entreprise"}`);
                window.location.href = `mailto:spotter.talent.projet@gmail.com?subject=${subject}`;
              }}
            >
              <Mail className="mr-2 h-4 w-4" /> Contacter le support
            </Button>
          </div>
        </div>
      )}

      <div className="dashboard-panel p-5 sm:p-6">
        <p className="text-sm font-semibold text-foreground">Add-ons intelligents</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ces options sont en préparation. Elles ne peuvent pas encore être achetées ni facturées.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {BILLING_ADDONS.map((addon) => {
            const addonPrice = getAddonPriceCents(addon.id, billingCycle);
            const addonYearlyEquivalentMonthlyCents = getYearlyEquivalentMonthlyCents(addon.yearlyPriceCents);
            return (
              <button
                key={addon.id}
                type="button"
                disabled
                className="cursor-not-allowed rounded-2xl border border-border/60 bg-secondary/20 p-4 text-left opacity-70"
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
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  Bientôt disponible
                </p>
                {billingCycle === "yearly" && (
                  <p className="mt-1 text-[11px] text-emerald-300">
                    Soit {formatEuroFromCents(addonYearlyEquivalentMonthlyCents)} HT /mois, facturé annuellement.
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
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                <span>Numéro SIRET</span>
                {billingProfileDraft.siretVerifiedAt && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" /> Vérifié et verrouillé
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={billingProfileDraft.siret}
                    onChange={(e) => {
                      const nextSiret = e.target.value.replace(/\D/g, "").slice(0, 14);
                      lastAutomaticSiretAttempt.current = "";
                      updateBillingProfileField("siret", nextSiret);
                    }}
                    disabled={Boolean(billingProfileDraft.siretVerifiedAt) || verifyingSiret}
                    inputMode="numeric"
                    maxLength={14}
                    className="w-full rounded-xl border border-border bg-secondary/45 px-3 py-2 pr-9 text-sm focus:border-primary/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder="14 chiffres"
                  />
                  {billingProfileDraft.siretVerifiedAt && <Lock className="absolute right-3 top-2.5 h-4 w-4 text-emerald-600" />}
                </div>
                {!billingProfileDraft.siretVerifiedAt && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => verifierSiret()}
                    disabled={verifyingSiret || billingProfileDraft.siret.length !== 14}
                  >
                    {verifyingSiret ? "Vérification..." : "Vérifier"}
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
                Le nom et l'adresse sont récupérés depuis l'Annuaire des Entreprises. Un SIRET vérifié ne peut être utilisé que sur un seul compte.
              </p>
            </div>
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
              value={billingProfileDraft.phone}
              onChange={(e) => updateBillingProfileField("phone", e.target.value)}
              className="rounded-xl border border-border bg-secondary/45 px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="Téléphone entreprise"
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
              value={billingProfileDraft.addressLine2}
              onChange={(e) => updateBillingProfileField("addressLine2", e.target.value)}
              className="rounded-xl border border-border bg-secondary/45 px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
              placeholder="Complément d'adresse (optionnel)"
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
            <Button variant="secondary" onClick={() => ouvrirPortailStripe(selectedPlanId)} disabled={openingPortal}>
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
              <span className="text-muted-foreground">Add-ons disponibles</span>
              <span className="font-semibold">0</span>
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
                <span className="text-emerald-200">Facturation annuelle</span>
                <span className="font-semibold text-emerald-300">12 mois en un paiement</span>
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
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <p className="text-sm font-semibold text-foreground">{formatEuroFromCents(invoice.amountTtcCents)}</p>
                    <p className="text-xs text-muted-foreground">{invoice.status === "paid" ? "Payée" : invoice.status}</p>
                    {invoice.pdfUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={invoice.pdfUrl} target="_blank" rel="noreferrer">
                          <FileText className="mr-2 h-4 w-4" />
                          Ouvrir la facture
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => void telechargerFactureTest(invoice)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Télécharger le PDF test
                      </Button>
                    )}
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
      title: "Reprendre les échanges",
      description: "Relancez les échanges avec les talents prioritaires.",
      icon: MessageSquare,
      action: () => onNavigate?.("messagerie"),
      cta: "Ouvrir les échanges",
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
          <p className="text-muted-foreground text-xs mb-1">Réponses non lues</p>
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

const ProfilEntrepriseTab = ({ profile, user, avatarUrl, setAvatarUrl, coverUrl, setCoverUrl }: any) => {
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
    } catch (err: any) { toast.error(translateAppError(err?.message, "Impossible de sauvegarder le profil entreprise.")); } finally { setSaving(false); }
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validationError = validateCompanyCoverImage(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }

    try {
      const path = getCompanyCoverPath(user.id);
      const { error } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      setCoverUrl(getCompanyCoverPublicUrl(user.id, Date.now()));
      toast.success("Couverture entreprise mise à jour !");
    } catch (err: any) {
      toast.error(translateAppError(err?.message, "Impossible d'ajouter cette couverture."));
    } finally {
      e.target.value = "";
    }
  };

  const completion = [nomEntreprise, secteur, localisation, description].filter((value) => String(value || "").trim()).length;
  const completionPercent = Math.round((completion / 4) * 100);

  return (
    <div className="space-y-6">
      <AccountSecurityPanel user={user} role="entreprise" />
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
        <div className="mb-6 overflow-hidden rounded-2xl border border-border/70 bg-secondary/30">
          <div className="relative h-40 sm:h-56">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Couverture entreprise"
                className="h-full w-full object-cover"
                onError={() => setCoverUrl(null)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--accent)/0.16),hsl(var(--secondary)))]">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-10 w-10 text-accent/60" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Couverture entreprise</p>
                  <p className="mt-1 text-xs text-muted-foreground">Ajoutez une image pour présenter votre univers.</p>
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-background/90 via-background/35 to-transparent p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Image publique</p>
                <p className="mt-1 text-sm text-muted-foreground">Visible par les talents sur vos offres.</p>
              </div>
              <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-background/90 px-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-accent/40">
                <Camera className="mr-2 h-4 w-4" />
                {coverUrl ? "Remplacer" : "Ajouter"}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadCover} />
              </label>
            </div>
          </div>
        </div>

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
                  <label className="mb-1 block text-sm text-muted-foreground">Secteurs d'activité</label>
                  <SecteursMultiSelect value={secteur} onChange={setSecteur} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Vous pouvez ajouter plusieurs activités si votre entreprise intervient dans plusieurs domaines.
                  </p>
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
              <label className="mb-1 block text-sm text-muted-foreground">Présentation publique</label>
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                Ce texte peut être lu par les talents sur vos offres. Présentez votre activité, votre ambiance et vos points forts.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
                placeholder="Ex. : équipe familiale, tournées locales, formation interne, matériel récent, valeurs de l'entreprise..."
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

type ScreeningQuestion = {
  id: string;
  label: string;
  required: boolean;
};

const createScreeningQuestion = (): ScreeningQuestion => ({
  id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `question-${Date.now()}`,
  label: "",
  required: true,
});

const OffresTab = ({
  user,
  planId,
  entitlements,
  onOffrePubliee,
}: {
  user: any;
  planId: BillingPlanId;
  entitlements: BillingPlanEntitlements;
  onOffrePubliee: () => void;
}) => {
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
  const [activeOfferCount, setActiveOfferCount] = useState(0);
  const [weeklyNewOfferCount, setWeeklyNewOfferCount] = useState(0);
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([]);
  const [besoin, setBesoin] = useState("");
  const [experience, setExperience] = useState("2 à 5 ans");
  const [creationStep, setCreationStep] = useState<1 | 2 | 3>(1);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [editingGeneratedOffer, setEditingGeneratedOffer] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const offerDraftStorageKey = user?.id ? `spotted-talent:offer-ai-draft:${user.id}` : "";

  useEffect(() => {
    if (!user) return;
    const fetchOfferCounters = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [activeResult, weeklyResult] = await Promise.all([
        supabase
          .from("offres")
          .select("*", { count: "exact", head: true })
          .eq("entreprise_id", user.id)
          .eq("statut", "active"),
        supabase
          .from("offres")
          .select("*", { count: "exact", head: true })
          .eq("entreprise_id", user.id)
          .gte("created_at", sevenDaysAgo),
      ]);

      if (activeResult.error) console.error("Erreur compteur offres actives:", activeResult.error);
      if (weeklyResult.error) console.error("Erreur compteur offres hebdomadaire:", weeklyResult.error);

      setActiveOfferCount(activeResult.count || 0);
      setWeeklyNewOfferCount(weeklyResult.count || 0);
    };

    void fetchOfferCounters();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .select("company_name, full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setEntreprise((current) => current || data?.company_name || data?.full_name || ""));
  }, [user]);

  useEffect(() => {
    if (!offerDraftStorageKey || typeof window === "undefined") return;
    try {
      const storedDraft = window.localStorage.getItem(offerDraftStorageKey);
      if (!storedDraft) return;
      const draft = JSON.parse(storedDraft);
      if (typeof draft.besoin === "string") setBesoin(draft.besoin);
      if (typeof draft.poste === "string") setPoste(draft.poste);
      if (typeof draft.entreprise === "string") setEntreprise(draft.entreprise);
      if (typeof draft.competences === "string") setCompetences(draft.competences);
      if (typeof draft.localisation === "string") setLocalisation(draft.localisation);
      if (typeof draft.contrat === "string") setContrat(draft.contrat);
      if (typeof draft.secteurOffre === "string") setSecteurOffre(draft.secteurOffre);
      if (typeof draft.diplome === "string") setDiplome(draft.diplome);
      if (typeof draft.experience === "string") setExperience(draft.experience);
      if (typeof draft.salaireMin === "string") setSalaireMin(draft.salaireMin);
      if (typeof draft.salaireMax === "string") setSalaireMax(draft.salaireMax);
      if (Array.isArray(draft.avantages)) setAvantages(draft.avantages.filter((value: unknown) => typeof value === "string"));
      if (Array.isArray(draft.permisRequis)) setPermisRequis(draft.permisRequis.filter((value: unknown) => typeof value === "string"));
      if (typeof draft.offre === "string") setOffre(draft.offre);
      if ([1, 2, 3].includes(draft.creationStep)) setCreationStep(draft.creationStep);
      if (Array.isArray(draft.screeningQuestions)) setScreeningQuestions(draft.screeningQuestions.slice(0, 5));
      if (typeof draft.urgent === "boolean") setUrgent(draft.urgent);
      if (typeof draft.updatedAt === "string") setLastDraftSavedAt(draft.updatedAt);
    } catch {
      // Un brouillon local invalide ne doit jamais bloquer la création d'une offre.
    }
  }, [offerDraftStorageKey]);

  const activeOfferLimitReached =
    entitlements.maxActiveOffers !== null && activeOfferCount >= entitlements.maxActiveOffers;
  const weeklyNewOfferLimitReached =
    entitlements.maxWeeklyNewOffers !== null && weeklyNewOfferCount >= entitlements.maxWeeklyNewOffers;

  const addScreeningQuestion = () => {
    if (!entitlements.screeningQuestions || screeningQuestions.length >= 5) return;
    setScreeningQuestions((current) => [...current, createScreeningQuestion()]);
  };

  const updateScreeningQuestion = (id: string, patch: Partial<ScreeningQuestion>) => {
    setScreeningQuestions((current) => current.map((question) => question.id === id ? { ...question, ...patch } : question));
  };

  const listeAvantages = ["Mutuelle", "Tickets restaurant", "Télétravail", "Véhicule de fonction", "Prime annuelle", "RTT", "Formation continue", "Participation aux bénéfices", "Logement de fonction", "13e mois"];
  const toggleAvantage = (a: string) => { setAvantages(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]); };

  const toggleCompetenceSuggestion = (suggestion: string) => {
    setCompetences((current) => {
      const values = current.split(",").map((value) => value.trim()).filter(Boolean);
      return values.includes(suggestion)
        ? values.filter((value) => value !== suggestion).join(", ")
        : [...values, suggestion].join(", ");
    });
  };

  const togglePermisSuggestion = (suggestion: string) => {
    setPermisRequis((current) => current.includes(suggestion)
      ? current.filter((value) => value !== suggestion)
      : [...current, suggestion]);
  };

  const enregistrerBrouillon = () => {
    if (!offerDraftStorageKey || typeof window === "undefined") return;
    const updatedAt = new Date().toISOString();
    window.localStorage.setItem(offerDraftStorageKey, JSON.stringify({
      besoin,
      poste,
      entreprise,
      competences,
      localisation,
      contrat,
      secteurOffre,
      diplome,
      experience,
      salaireMin,
      salaireMax,
      avantages,
      permisRequis,
      offre,
      creationStep,
      screeningQuestions,
      urgent,
      updatedAt,
    }));
    setLastDraftSavedAt(updatedAt);
    toast.success("Brouillon enregistré sur cet appareil.");
  };

  const genererOffre = async () => {
    if (!poste) return toast.error("Remplissez le poste");
    setLoading(true);
    try {
      const contenu = await requestAiContent("generate_offer", {
        poste,
        entreprise,
        contrat,
        localisation,
        secteur: secteurOffre,
        competences,
        besoin,
        experience,
        diplome: diplome !== "Sans diplôme" ? diplome : "",
        salaireMin,
        salaireMax,
        avantages,
        permisRequis,
      });
      setOffre(contenu);
      setCreationStep(3);
      setEditingGeneratedOffer(false);
      toast.success("Offre générée !");
    } catch (err) { toast.error("Erreur lors de la génération."); } finally { setLoading(false); }
  };

  const notifierTalentsParEmail = async (offreId: string) => {
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
          offreId,
        )
      )
    );

    return destinataires.length;
  };

  const publierOffre = async () => {
    if (!offre || !poste) return toast.error("Générez d'abord une offre.");
    if (activeOfferLimitReached) {
      return toast.error(`La formule ${getPlanById(planId).name} autorise ${entitlements.maxActiveOffers} offre(s) active(s). Mettez une offre en pause ou changez de formule.`);
    }
    if (weeklyNewOfferLimitReached) {
      return toast.error(`La formule ${getPlanById(planId).name} autorise ${entitlements.maxWeeklyNewOffers} nouvelle(s) annonce(s) sur 7 jours. Attendez le prochain créneau ou changez de formule.`);
    }
    const normalizedQuestions = screeningQuestions
      .map((question) => ({ ...question, label: question.label.trim() }))
      .filter((question) => question.label);
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
        urgent: entitlements.urgentBadge ? urgent : false,
        questions_preselection: entitlements.screeningQuestions ? normalizedQuestions : [],
        statut: "active",
      }).select("id").single();
      if (error) throw error;
      toast.success("Offre publiée !");
      try {
        const { data: profile } = await supabase.from("profiles").select("email").eq("user_id", user.id).single();
        if (profile?.email && offrePubliee?.id) await emailOffrePubliee(profile.email, offrePubliee.id);
      } catch (err) { console.error("Erreur email:", err); }
      if (offrePubliee?.id) {
        void notifierTalentsParEmail(offrePubliee.id)
          .then((count) => {
            if (count > 0) toast.success(`${count} talent(s) ont reçu cette nouvelle offre par email.`);
          })
          .catch((err) => console.error("Erreur notifications offres:", err));
      }
      setActiveOfferCount((count) => count + 1);
      setWeeklyNewOfferCount((count) => count + 1);
      if (offerDraftStorageKey && typeof window !== "undefined") window.localStorage.removeItem(offerDraftStorageKey);
      onOffrePubliee();
    } catch (err: any) {
      const message = String(err?.message || "");
      if (message.includes("active_offer_limit_reached")) {
        toast.error("La limite d'annonces actives de votre formule est atteinte.");
      } else if (message.includes("weekly_offer_limit_reached")) {
        toast.error("La limite de nouvelles annonces sur 7 jours est atteinte pour votre formule.");
      } else if (message.includes("feature_not_in_plan")) {
        toast.error("Cette option n'est pas incluse dans votre formule actuelle.");
      } else {
        toast.error(translateAppError(message, "Impossible de publier cette offre."));
      }
    } finally { setPublishing(false); }
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            <Wand2 className="h-3.5 w-3.5" /> Création assistée
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">Créer une offre avec l’IA</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Décrivez votre besoin, l’IA prépare une annonce claire et professionnelle.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/20 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent"><FileText className="h-4 w-4" /></div>
          <div>
            <p className="text-xs font-semibold text-foreground">{offre ? "Offre prête à être relue" : lastDraftSavedAt ? "Brouillon enregistré" : "Brouillon en préparation"}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {lastDraftSavedAt ? `Sauvegardé le ${new Date(lastDraftSavedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · ${completionPercent}% complété` : `${completionPercent}% complété`}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-panel overflow-hidden">
        <div className="grid sm:grid-cols-3">
          {([[1, "Le besoin"], [2, "Le profil"], [3, "Aperçu & publication"]] as const).map(([step, label], index) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                if (step === 3 && !offre) return toast.message("Générez d’abord votre offre pour accéder à la publication.");
                setCreationStep(step);
              }}
              className={"relative flex items-center justify-center gap-3 border-b px-4 py-4 text-sm font-semibold transition-colors " + (creationStep === step ? "border-accent bg-accent/5 text-accent" : "border-border/60 text-muted-foreground hover:bg-secondary/30 hover:text-foreground") + (index > 0 ? " sm:border-l" : "")}
            >
              <span className={"flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold " + (creationStep === step ? "bg-accent text-white" : "bg-secondary text-muted-foreground")}>{step}</span>
              <span>{step}. {label}</span>
            </button>
          ))}
        </div>
        <div className="h-1 bg-secondary"><div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: String((creationStep / 3) * 100) + "%" }} /></div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm font-medium text-foreground">L’IA rédige, vous gardez le contrôle.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="dashboard-panel p-5 sm:p-6">
          {creationStep === 1 && (
            <div className="space-y-4">
              <div><h3 className="text-xl font-bold">Décrivez le poste</h3><p className="mt-1 text-sm text-muted-foreground">Quelques informations suffisent pour commencer.</p></div>
              <textarea value={besoin} onChange={(event) => setBesoin(event.target.value)} rows={5} className="w-full resize-none rounded-xl border border-border bg-background/70 px-4 py-3 text-sm leading-6 outline-none transition-colors focus:border-accent/50" placeholder="Ex. : Nous recherchons un chauffeur poids lourd pour des livraisons régionales autour de Chambéry." />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Intitulé du poste *
                  <input value={poste} onChange={(event) => setPoste(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-sm text-foreground outline-none focus:border-accent/50" placeholder="Ex. : Chauffeur poids lourd" />
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Localisation
                  <div className="mt-2"><LocationAutocompleteInput value={localisation} onChange={setLocalisation} placeholder="Ville ou code postal..." /></div>
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Contrat
                  <select value={contrat} onChange={(event) => setContrat(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-sm text-foreground outline-none focus:border-accent/50">{CONTRATS.map((item) => <option key={item}>{item}</option>)}</select>
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Expérience
                  <select value={experience} onChange={(event) => setExperience(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-sm text-foreground outline-none focus:border-accent/50">
                    <option>Débutant accepté</option><option>1 à 2 ans</option><option>2 à 5 ans</option><option>5 ans et plus</option>
                  </select>
                </label>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Suggestions rapides</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...["Permis B", "Permis C", "Permis CE", "Permis D", "Permis DE", "FIMO", "FCO", "ADR"].map((label) => ({
                      label,
                      selected: permisRequis.includes(label),
                      action: () => togglePermisSuggestion(label),
                    })),
                    { label: "Transport régional", selected: competences.split(",").map((item) => item.trim()).includes("Transport régional"), action: () => toggleCompetenceSuggestion("Transport régional") },
                    { label: "Horaires de journée", selected: competences.split(",").map((item) => item.trim()).includes("Horaires de journée"), action: () => toggleCompetenceSuggestion("Horaires de journée") },
                  ].map((suggestion) => (
                    <button key={suggestion.label} type="button" onClick={suggestion.action} className={"rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " + (suggestion.selected ? "border-accent/40 bg-accent/15 text-accent" : "border-border bg-background text-muted-foreground hover:border-accent/30 hover:text-foreground")}>
                      {suggestion.label} <span className="ml-1">{suggestion.selected ? "✓" : "+"}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="glow" className="h-12 w-full" onClick={genererOffre} disabled={loading || !poste.trim()}>
                <Sparkles className="mr-2 h-4 w-4" /> {loading ? "Génération en cours..." : "Générer mon offre"}
              </Button>
              <button type="button" onClick={() => { setCreationStep(2); setShowAdvancedDetails(true); }} className="mx-auto block text-sm font-semibold text-accent underline-offset-4 hover:underline">Ajouter plus de détails</button>
            </div>
          )}

          {creationStep === 2 && (
            <div className="space-y-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Étape 2</p><h3 className="mt-2 text-xl font-bold">Précisez le profil</h3><p className="mt-1 text-sm text-muted-foreground">Ces détails rendent l’offre plus pertinente et évitent les informations inventées.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-muted-foreground">Secteur d’activité<div className="mt-2"><SecteurSelect value={secteurOffre} onChange={setSecteurOffre} /></div></label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Diplôme requis
                  <select value={diplome} onChange={(event) => setDiplome(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-sm text-foreground outline-none focus:border-accent/50">
                    <option>Sans diplôme</option><option>CAP / BEP</option><option>Bac</option><option>Bac +2 (BTS, DUT)</option><option>Bac +3 (Licence)</option><option>Bac +5 (Master, Ingénieur)</option><option>Permis B</option><option>Permis C / CE</option><option>CACES</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs font-semibold text-muted-foreground">Compétences et contraintes importantes<textarea value={competences} onChange={(event) => setCompetences(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-xl border border-border bg-background/70 px-4 py-3 text-sm leading-6 text-foreground outline-none focus:border-accent/50" placeholder="Ex. : relation client, autonomie, manutention, travail le week-end..." /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-muted-foreground">Salaire minimum brut mensuel<input type="number" value={salaireMin} onChange={(event) => setSalaireMin(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-sm text-foreground outline-none focus:border-accent/50" placeholder="Ex. : 2200" /></label>
                <label className="text-xs font-semibold text-muted-foreground">Salaire maximum brut mensuel<input type="number" value={salaireMax} onChange={(event) => setSalaireMax(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-sm text-foreground outline-none focus:border-accent/50" placeholder="Ex. : 2600" /></label>
              </div>

              <button type="button" onClick={() => setShowAdvancedDetails((current) => !current)} className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-secondary/20 px-4 py-3 text-left text-sm font-semibold">
                Options complémentaires {showAdvancedDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {showAdvancedDetails && (
                <div className="space-y-5 rounded-xl border border-border/70 bg-secondary/15 p-4">
                  <label className="block text-xs font-semibold text-muted-foreground">Nom de l’entreprise<input value={entreprise} onChange={(event) => setEntreprise(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-sm text-foreground outline-none focus:border-accent/50" /></label>

                  <div><p className="mb-2 text-xs font-semibold text-muted-foreground">Avantages proposés</p><div className="flex flex-wrap gap-2">
                    {listeAvantages.map((item) => <button key={item} type="button" onClick={() => toggleAvantage(item)} className={"rounded-full border px-3 py-1.5 text-xs transition-colors " + (avantages.includes(item) ? "border-accent/40 bg-accent/15 text-accent" : "border-border bg-background text-muted-foreground hover:text-foreground")}>{avantages.includes(item) && <Check className="mr-1 inline h-3 w-3" />}{item}</button>)}
                  </div></div>

                  <div><p className="mb-2 text-xs font-semibold text-muted-foreground">Permis et habilitations</p><div className="flex flex-wrap gap-2">
                    {["Permis B", "Permis BE", "Permis C1", "Permis C1E", "Permis C", "Permis CE", "Permis D1", "Permis D1E", "Permis D", "Permis DE", "FIMO marchandises", "FIMO voyageurs", "FCO marchandises", "FCO voyageurs", "ADR de base", "ADR citerne", "Carte conducteur", "CACES R482", "CACES R489", "CACES R490", "Habilitation électrique"].map((item) => <button key={item} type="button" onClick={() => togglePermisSuggestion(item)} className={"rounded-full border px-3 py-1.5 text-xs transition-colors " + (permisRequis.includes(item) ? "border-accent/40 bg-accent/15 text-accent" : "border-border bg-background text-muted-foreground hover:text-foreground")}>{permisRequis.includes(item) && <Check className="mr-1 inline h-3 w-3" />}{item}</button>)}
                  </div></div>

                  <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div><p className="text-sm font-semibold">Questions de présélection</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{entitlements.screeningQuestions ? "Ajoutez jusqu’à 5 questions liées au poste." : "Disponible avec les formules Boost et Premium Intérim."}</p></div>
                      <Button type="button" variant="ghost-glow" size="sm" disabled={!entitlements.screeningQuestions || screeningQuestions.length >= 5} onClick={addScreeningQuestion}><Plus className="mr-1 h-4 w-4" /> Ajouter</Button>
                    </div>
                    {entitlements.screeningQuestions && screeningQuestions.length > 0 && <div className="mt-3 space-y-2">
                      {screeningQuestions.map((question, index) => <div key={question.id} className="flex items-start gap-2 rounded-xl border border-border/60 bg-secondary/20 p-3">
                        <div className="min-w-0 flex-1"><input value={question.label} maxLength={240} onChange={(event) => updateScreeningQuestion(question.id, { label: event.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent/50" placeholder={"Question " + (index + 1)} /><label className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={question.required} onChange={(event) => updateScreeningQuestion(question.id, { required: event.target.checked })} /> Réponse obligatoire</label></div>
                        <button type="button" onClick={() => setScreeningQuestions((current) => current.filter((item) => item.id !== question.id))} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10" aria-label="Supprimer la question"><Trash2 className="h-4 w-4" /></button>
                      </div>)}
                    </div>}
                  </div>

                  <button type="button" disabled={!entitlements.urgentBadge} onClick={() => entitlements.urgentBadge && setUrgent((current) => !current)} className={"flex w-full items-center gap-3 rounded-xl border p-3 text-left " + (entitlements.urgentBadge ? "border-red-500/20 bg-red-500/5" : "cursor-not-allowed border-border/60 bg-secondary/20 opacity-60")}>
                    <span className={"flex h-5 w-5 items-center justify-center rounded border-2 " + (urgent ? "border-red-500 bg-red-500" : "border-muted-foreground/40")}>{urgent && <Check className="h-3 w-3 text-white" />}</span>
                    <span className="text-sm font-semibold">Mettre l’offre en urgence</span>{!entitlements.urgentBadge && <span className="ml-auto text-xs text-muted-foreground">Boost ou Premium</span>}
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="ghost-glow" className="sm:w-auto" onClick={() => setCreationStep(1)}>Retour</Button>
                <Button variant="glow" className="flex-1" onClick={genererOffre} disabled={loading || !poste.trim()}><Sparkles className="mr-2 h-4 w-4" /> {loading ? "Génération en cours..." : "Générer mon offre"}</Button>
              </div>
            </div>
          )}

          {creationStep === 3 && (
            <div className="flex min-h-[500px] flex-col justify-between gap-6">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><CheckCircle className="h-7 w-7" /></div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Étape 3</p>
                <h3 className="mt-2 text-2xl font-bold">Votre offre est prête</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Relisez l’aperçu, modifiez le texte si nécessaire puis publiez lorsque tout vous convient.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-secondary/20 p-4"><p className="text-xs text-muted-foreground">Poste</p><p className="mt-1 font-semibold">{poste || "À préciser"}</p></div>
                  <div className="rounded-xl border border-border/70 bg-secondary/20 p-4"><p className="text-xs text-muted-foreground">Contrat</p><p className="mt-1 font-semibold">{contrat}</p></div>
                  <div className="rounded-xl border border-border/70 bg-secondary/20 p-4"><p className="text-xs text-muted-foreground">Localisation</p><p className="mt-1 font-semibold">{localisation || "À préciser"}</p></div>
                  <div className="rounded-xl border border-border/70 bg-secondary/20 p-4"><p className="text-xs text-muted-foreground">Salaire</p><p className="mt-1 font-semibold">{salaryLabel}</p></div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row"><Button variant="ghost-glow" className="flex-1" onClick={() => setCreationStep(1)}>Modifier le besoin</Button><Button variant="ghost-glow" className="flex-1" onClick={() => setCreationStep(2)}>Modifier le profil</Button></div>
            </div>
          )}
        </section>

        <section className="dashboard-panel flex min-h-[620px] flex-col p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Aperçu en direct</p><h3 className="mt-1 text-xl font-bold">Votre annonce</h3></div>
            <span className={"w-fit rounded-full border px-3 py-1.5 text-xs font-semibold " + (completionPercent >= 80 ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300")}>{offre ? "Prête" : "Complétée"} à {completionPercent} %</span>
          </div>

          <div className="mt-4 flex-1 rounded-xl border border-border/70 bg-background/60 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
              <div className="min-w-0"><h4 className="truncate text-xl font-bold sm:text-2xl">{poste || "Intitulé du poste"}</h4><p className="mt-1 text-sm font-semibold text-accent">{entreprise || "Votre entreprise"}</p><p className="mt-1 text-xs text-muted-foreground">{localisation || "Localisation à préciser"} · {contrat} · {salaryLabel}</p></div>
              <button type="button" onClick={() => setCreationStep(1)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Modifier les informations principales"><Pencil className="h-4 w-4" /></button>
            </div>

            {editingGeneratedOffer && offre ? (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold">Texte complet modifiable</p><Button variant="ghost-glow" size="sm" onClick={() => setEditingGeneratedOffer(false)}>Terminer</Button></div>
                <textarea value={offre} onChange={(event) => setOffre(event.target.value)} className="min-h-[390px] w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-accent/50" />
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                <div className="py-4"><div className="flex items-center justify-between gap-3"><h5 className="font-bold">Vos missions</h5><button type="button" onClick={() => offre ? setEditingGeneratedOffer(true) : setCreationStep(1)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button></div><p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{besoin || "Décrivez le besoin et les principales missions pour enrichir cette section."}</p></div>
                <div className="py-4"><div className="flex items-center justify-between gap-3"><h5 className="font-bold">Profil recherché</h5><button type="button" onClick={() => offre ? setEditingGeneratedOffer(true) : setCreationStep(2)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{competences || "Compétences à préciser"} · {experience}{diplome !== "Sans diplôme" ? " · " + diplome : ""}{permisRequis.length > 0 ? " · " + selectedPermis : ""}</p></div>
                <div className="py-4"><div className="flex items-center justify-between gap-3"><h5 className="font-bold">Ce que nous proposons</h5><button type="button" onClick={() => offre ? setEditingGeneratedOffer(true) : setCreationStep(2)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{contrat} · {salaryLabel}{avantages.length > 0 ? " · " + selectedAdvantages : ""}</p></div>
              </div>
            )}

            {offre && !editingGeneratedOffer && <button type="button" onClick={() => setEditingGeneratedOffer(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/10"><Pencil className="h-4 w-4" /> Modifier le texte complet</button>}
          </div>
        </section>
      </div>

      <div className="dashboard-panel sticky bottom-3 z-20 flex flex-col gap-3 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-end">
        <Button variant="ghost-glow" onClick={enregistrerBrouillon}><FileText className="mr-2 h-4 w-4" /> Enregistrer le brouillon</Button>
        <Button variant="ghost-glow" onClick={genererOffre} disabled={loading || !poste.trim()}><Sparkles className="mr-2 h-4 w-4" /> {offre ? "Améliorer avec l’IA" : "Générer avec l’IA"}</Button>
        <Button variant="glow" onClick={publierOffre} disabled={!offre || publishing || activeOfferLimitReached || weeklyNewOfferLimitReached}>
          <Send className="mr-2 h-4 w-4" /> {publishing ? "Publication..." : activeOfferLimitReached ? "Limite atteinte" : weeklyNewOfferLimitReached ? "Quota atteint" : "Publier l’offre"}
        </Button>
      </div>
    </div>
  );
};

// ─── Formulaire de modification inline ───────────────────────────────────────
const FormulaireModification = ({
  offre,
  entitlements,
  onSave,
  onCancel,
}: {
  offre: any;
  entitlements: BillingPlanEntitlements;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const [titre, setTitre] = useState(offre.titre || "");
  const [contrat, setContrat] = useState(offre.contrat || "CDI");
  const [localisation, setLocalisation] = useState(offre.localisation || "");
  const [salaireMin, setSalaireMin] = useState(offre.salaire_min?.toString() || "");
  const [salaireMax, setSalaireMax] = useState(offre.salaire_max?.toString() || "");
  const [competences, setCompetences] = useState(offre.competences || "");
  const [description, setDescription] = useState(offre.description || "");
  const [urgent, setUrgent] = useState(offre.urgent || false);
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>(
    Array.isArray(offre.questions_preselection) ? offre.questions_preselection : [],
  );
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
        urgent: entitlements.urgentBadge ? urgent : false,
        questions_preselection: entitlements.screeningQuestions
          ? screeningQuestions.map((question) => ({ ...question, label: question.label.trim() })).filter((question) => question.label)
          : [],
      }).eq("id", offre.id);
      if (error) throw error;
      toast.success("Offre mise à jour !");
      onSave();
    } catch (err: any) { toast.error(translateAppError(err?.message, "Impossible de sauvegarder cette offre.")); } finally { setSaving(false); }
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
        {entitlements.screeningQuestions && (
          <div className="col-span-2 rounded-xl border border-border/60 bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Questions de présélection</p>
                <p className="mt-1 text-xs text-muted-foreground">Jusqu'à 5 questions avant la candidature.</p>
              </div>
              <Button
                type="button"
                variant="ghost-glow"
                size="sm"
                disabled={screeningQuestions.length >= 5}
                onClick={() => setScreeningQuestions((current) => [...current, createScreeningQuestion()])}
              >
                <Plus className="mr-1 h-4 w-4" /> Ajouter
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {screeningQuestions.map((question, index) => (
                <div key={question.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <input
                      value={question.label}
                      maxLength={240}
                      onChange={(event) => setScreeningQuestions((current) => current.map((item) => item.id === question.id ? { ...item, label: event.target.value } : item))}
                      className="w-full rounded-lg border border-border bg-background/70 px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
                      placeholder={`Question ${index + 1}`}
                    />
                    <label className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(event) => setScreeningQuestions((current) => current.map((item) => item.id === question.id ? { ...item, required: event.target.checked } : item))}
                      />
                      Obligatoire
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreeningQuestions((current) => current.filter((item) => item.id !== question.id))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10"
                    aria-label={`Supprimer la question ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          disabled={!entitlements.urgentBadge}
          className={`col-span-2 flex items-center gap-3 rounded-lg border p-3 ${entitlements.urgentBadge ? "cursor-pointer border-red-500/20 bg-red-500/10" : "cursor-not-allowed border-border/60 bg-secondary/25 opacity-65"}`}
          onClick={() => entitlements.urgentBadge && setUrgent(!urgent)}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${urgent ? "bg-red-500 border-red-500" : "border-red-400"}`}>{urgent && <Check className="w-3 h-3 text-white" />}</div>
          <span className="text-sm font-medium text-red-400">Offre urgente</span>
          {!entitlements.urgentBadge && <span className="ml-auto text-xs text-muted-foreground">Boost ou Premium</span>}
        </button>
      </div>
      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <Button variant="glow" size="sm" onClick={sauvegarder} disabled={saving} className="w-full sm:flex-1">{saving ? "Sauvegarde..." : "Sauvegarder les modifications"}</Button>
        <Button variant="ghost-glow" size="sm" onClick={onCancel} className="w-full sm:w-auto">Annuler</Button>
      </div>
    </div>
  );
};

const MesOffresTab = ({ user, entitlements, refreshToken = 0, onOffresChanged, onOpenDraft }: any) => {
  const [offres, setOffres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offreEnEdition, setOffreEnEdition] = useState<string | null>(null);
  const [offreOuverte, setOffreOuverte] = useState<string | null>(null);
  const [savedDraft, setSavedDraft] = useState<Record<string, any> | null>(null);
  const offerDraftStorageKey = user?.id ? `spotted-talent:offer-ai-draft:${user.id}` : "";

  useEffect(() => { chargerOffres(); }, [user, refreshToken]);

  useEffect(() => {
    if (!offerDraftStorageKey || typeof window === "undefined") return;
    try {
      const rawDraft = window.localStorage.getItem(offerDraftStorageKey);
      setSavedDraft(rawDraft ? JSON.parse(rawDraft) : null);
    } catch {
      setSavedDraft(null);
    }
  }, [offerDraftStorageKey, refreshToken]);

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
    const { error } = await supabase.from("offres").update({ statut: newStatut }).eq("id", id);
    if (error) {
      toast.error(translateAppError(error.message, "Impossible de modifier cette annonce."));
      return;
    }
    chargerOffres();
    toast.success(newStatut === "active" ? "Offre activée" : "Offre désactivée");
  };

  const supprimerOffre = async (id: string) => {
    const { error } = await supabase.from("offres").delete().eq("id", id);
    if (error) {
      toast.error(translateAppError(error.message, "Impossible de supprimer cette offre."));
      return;
    }
    toast.success("Offre supprimée.");
    chargerOffres();
  };

  if (loading) return <div className="text-muted-foreground">Chargement...</div>;

  const stats = {
    total: offres.length,
    actives: offres.filter((offre) => offre.statut === "active").length,
    inactives: offres.filter((offre) => offre.statut !== "active").length,
    urgentes: offres.filter((offre) => Boolean(offre.urgent)).length,
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
              <Wand2 className="h-3.5 w-3.5" />
              Vos annonces publiées
            </div>
            <h2 className="text-xl font-bold sm:text-2xl">Mes offres</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">
              Retrouvez toutes vos annonces dans un seul espace, gardez un œil sur leur visibilité
              et reprenez une offre en un instant pour la corriger, la masquer ou la rouvrir.
            </p>
          </div>
          <div className="dashboard-subcard p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Vue rapide</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {stats.actives > 0
                ? `${stats.actives} offre${stats.actives > 1 ? "s" : ""} active${stats.actives > 1 ? "s" : ""}`
                : "Aucune offre active pour le moment"}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {stats.urgentes > 0
                ? `${stats.urgentes} annonce${stats.urgentes > 1 ? "s" : ""} est marquée${stats.urgentes > 1 ? "s" : ""} comme urgente${stats.urgentes > 1 ? "s" : ""}.`
                : "Toutes vos annonces restent accessibles ici, même lorsqu'elles sont mises en pause."}
            </p>
          </div>
        </div>
      </div>

      {savedDraft && (
        <div className="dashboard-panel border-accent/25 bg-accent/5 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-foreground">Brouillon en cours</p>
                  <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">Non publié</span>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{savedDraft.poste || "Nouvelle offre"}{savedDraft.localisation ? ` · ${savedDraft.localisation}` : ""}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {savedDraft.updatedAt
                    ? `Enregistré le ${new Date(savedDraft.updatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`
                    : "Enregistré sur cet appareil"}
                </p>
              </div>
            </div>
            <Button type="button" variant="glow" onClick={onOpenDraft}>
              <Pencil className="mr-2 h-4 w-4" /> Reprendre le brouillon
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-stat-card border border-accent/20 bg-accent/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Total</p>
          <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Toutes vos annonces enregistrées.</p>
        </div>
        <div className="dashboard-stat-card border border-green-500/20 bg-green-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-300">Actives</p>
          <p className="mt-1 text-2xl font-bold text-green-300">{stats.actives}</p>
          <p className="mt-1 text-xs text-muted-foreground">Annonces visibles par les talents.</p>
        </div>
        <div className="dashboard-stat-card border border-secondary/60 bg-secondary/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">En pause</p>
          <p className="mt-1 text-2xl font-bold">{stats.inactives}</p>
          <p className="mt-1 text-xs text-muted-foreground">Offres temporairement masquées.</p>
        </div>
        <div className="dashboard-stat-card border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-300">Urgentes</p>
          <p className="mt-1 text-2xl font-bold text-red-300">{stats.urgentes}</p>
          <p className="mt-1 text-xs text-muted-foreground">Annonces marquées prioritaires.</p>
        </div>
      </div>

      {offres.length === 0 ? (
        <div className="dashboard-empty-card p-12"><Wand2 className="w-16 h-16 text-accent/30 mb-4" /><h3 className="font-bold text-base mb-2">Aucune offre publiée</h3><p className="text-muted-foreground text-sm">Créez votre première offre avec l'IA.</p></div>
      ) : (
        <div className="space-y-4">
          {offres.map((offre) => (
            <div key={offre.id} className="dashboard-panel p-3 sm:p-4">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-base">{formatDisplayLabel(offre.titre) || "Offre sans titre"}</h3>
                    {offre.urgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">URGENT</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${offre.statut === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-secondary text-muted-foreground border-border"}`}>{offre.statut === "active" ? "Active" : "Inactive"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">{formatDisplayLabel(offre.contrat)}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground mb-1.5 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {formatDisplayLabel(offre.localisation) || "Non précisée"}</span>
                    {offre.salaire_min && offre.salaire_max && <span className="flex items-center gap-1"><Euro className="w-3 h-3" /> {offre.salaire_min} - {offre.salaire_max}</span>}
                    {offre.diplome && !["Sans diplome", "Sans diplôme"].includes(offre.diplome) && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {formatDisplayLabel(offre.diplome)}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(offre.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {offre.avantages && <p className="text-xs text-green-400 mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {formatDisplayList(offre.avantages)}</p>}
                  {offreEnEdition !== offre.id && <p className="text-xs leading-5 text-muted-foreground line-clamp-2">{getOfferDescriptionPreview(offre.description)}</p>}
                </div>

                <div className="dashboard-subcard p-3 sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Gestion de l'annonce</p>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {offre.statut === "active" ? "Visible pour les talents" : "Annonce en pause"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {offre.statut === "active"
                      ? "Cette offre peut recevoir de nouvelles candidatures. Vous pouvez l'éditer, l'ouvrir en détail ou la mettre en pause."
                      : "Cette offre reste enregistrée dans votre espace, mais elle n'apparaît plus aux talents tant que vous ne la réactivez pas."}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {offreEnEdition !== offre.id && (
                      <button
                        onClick={() => setOffreOuverte(offreOuverte === offre.id ? null : offre.id)}
                        className="dashboard-inline-link justify-center rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-1.5 text-xs"
                      >
                        {offreOuverte === offre.id ? "Réduire la fiche" : "Voir l'offre complète"}
                      </button>
                    )}
                    <div className="grid gap-1.5 sm:grid-cols-3 xl:grid-cols-1">
                      <Button
                        variant="ghost-glow"
                        size="sm"
                        onClick={() => {
                          setOffreOuverte(null);
                          setOffreEnEdition(offreEnEdition === offre.id ? null : offre.id);
                        }}
                        className={`h-7 justify-center text-xs ${offreEnEdition === offre.id ? "text-accent border-accent/40" : ""}`}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        {offreEnEdition === offre.id ? "Fermer l'édition" : "Modifier"}
                      </Button>
                      <Button variant="ghost-glow" size="sm" onClick={() => toggleStatut(offre.id, offre.statut)} className="h-7 justify-center text-xs">
                        {offre.statut === "active" ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                        {offre.statut === "active" ? "Mettre en pause" : "Réactiver"}
                      </Button>
                      <ConfirmActionDialog
                        title="Supprimer cette annonce ?"
                        description="L'annonce sera retirée de vos offres et ne sera plus visible pour les candidats. Vous pouvez encore annuler maintenant."
                        onConfirm={() => supprimerOffre(offre.id)}
                      >
                        <button className="flex items-center justify-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:border-red-400/40 hover:text-red-300">
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
                  entitlements={entitlements}
                  onSave={() => { setOffreEnEdition(null); chargerOffres(); }}
                  onCancel={() => setOffreEnEdition(null)}
                />
              )}

              {offreOuverte === offre.id && offreEnEdition !== offre.id && (
                <div className="mt-3 rounded-xl border border-accent/15 bg-secondary/20 p-3">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="dashboard-subcard p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Contrat</p>
                      <p className="mt-2 font-semibold">{formatDisplayLabel(offre.contrat) || "Non précisé"}</p>
                    </div>
                    <div className="dashboard-subcard p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Secteur</p>
                      <p className="mt-2 font-semibold">{formatDisplayLabel(offre.secteur) || "Non précisé"}</p>
                    </div>
                    <div className="dashboard-subcard p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Salaire</p>
                      <p className="mt-2 font-semibold">
                        {offre.salaire_min && offre.salaire_max ? `${offre.salaire_min} - ${offre.salaire_max}` : "Non précisé"}
                      </p>
                    </div>
                    <div className="dashboard-subcard p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Permis requis</p>
                      <p className="mt-2 font-semibold">{formatDisplayList(offre.permis_requis) || "Aucun"}</p>
                    </div>
                  </div>

                  <div className="dashboard-subcard mt-3 p-3">
                    <p className="text-sm font-semibold">Description complète</p>
                    <div className="mt-3"><OfferDescription description={offre.description} compact /></div>
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

const normalizeMatchingValue = (value?: string | null) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const calculateCandidateMatch = (offre: any, profil: any) => {
  if (!offre || !profil) return 0;
  let score = 0;
  if (normalizeMatchingValue(offre.secteur) && normalizeMatchingValue(offre.secteur) === normalizeMatchingValue(profil.secteur)) score += 30;
  if (normalizeMatchingValue(offre.contrat) && normalizeMatchingValue(offre.contrat) === normalizeMatchingValue(profil.contrat)) score += 20;
  if (normalizeMatchingValue(offre.localisation) && normalizeMatchingValue(profil.localisation)) {
    const offerLocation = normalizeMatchingValue(offre.localisation);
    const candidateLocation = normalizeMatchingValue(profil.localisation);
    if (offerLocation.includes(candidateLocation) || candidateLocation.includes(offerLocation)) score += 20;
  }
  const offerSkills = normalizeMatchingValue(offre.competences).split(/[,;\s]+/).filter((item) => item.length > 2);
  const candidateSkills = normalizeMatchingValue(profil.competences).split(/[,;\s]+/).filter((item) => item.length > 2);
  if (offerSkills.length > 0 && candidateSkills.length > 0) {
    const matches = offerSkills.filter((skill) => candidateSkills.some((candidateSkill) => candidateSkill.includes(skill) || skill.includes(candidateSkill)));
    score += Math.min(25, Math.round((matches.length / offerSkills.length) * 25));
  }
  if (normalizeMatchingValue(offre.permis_requis) && normalizeMatchingValue(profil.permis)) {
    const requiredPermits = normalizeMatchingValue(offre.permis_requis).split(/[,;]+/).map((item) => item.trim()).filter(Boolean);
    const candidatePermits = normalizeMatchingValue(profil.permis);
    if (requiredPermits.some((permit) => candidatePermits.includes(permit))) score += 5;
  }
  return Math.min(100, score);
};

const escapeCsvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const CandidatsTab = ({
  user,
  entitlements,
}: {
  user: any;
  planId: BillingPlanId;
  entitlements: BillingPlanEntitlements;
}) => {
  const navigate = useNavigate();
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [searchCandidatures, setSearchCandidatures] = useState("");

  useEffect(() => { chargerCandidatures(); }, [user]);

  const chargerCandidatures = async () => {
    if (!user) return;
    const { data: offres } = await supabase.from("offres").select("id, titre, contrat, localisation, secteur, competences, permis_requis").eq("entreprise_id", user.id);
    if (!offres || offres.length === 0) { setLoading(false); return; }
    const ids = offres.map((o: any) => o.id);
    const { data: cands } = await supabase.from("candidatures").select("*, offre:offre_id(titre, contrat, localisation)").in("offre_id", ids).order("created_at", { ascending: false });
    const candsAvecProfil = await Promise.all((cands || []).map(async (c: any) => {
      const { data: talentProfil } = await supabase.from("profiles").select("full_name, poste, localisation, competences, bio, email, secteur, contrat, permis").eq("user_id", c.talent_id).single();
      let talentAvatarUrl = null;
      try {
        const { data: avatarList } = await supabase.storage.from("avatars").list(c.talent_id);
        if (avatarList && avatarList.length > 0) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(`${c.talent_id}/${avatarList[0].name}`);
          talentAvatarUrl = data.publicUrl + "?t=" + Date.now();
        }
      } catch (err) { /* pas de photo */ }
      return { ...c, talentProfil, talentAvatarUrl, matchScore: calculateCandidateMatch(c.offre, talentProfil) };
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
        if (entitlements.automatedCandidateMessages && talentProfile?.email) {
          await emailCandidatureStatut(talentProfile.email, candidature.id, statut);
        }
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
    })
    .sort((a, b) => entitlements.candidateMatching ? (b.matchScore || 0) - (a.matchScore || 0) : 0);

  const exporterCandidatures = () => {
    if (!entitlements.candidateExport) {
      toast.error("L'export des candidats est réservé à Premium Intérim.");
      return;
    }
    const headers = ["Candidat", "E-mail", "Poste recherché", "Offre", "Statut", "Localisation", "Compétences", "Score de matching"];
    const rows = candidaturesFiltrees.map((c) => [
      c.talentProfil?.full_name,
      c.talentProfil?.email,
      c.talentProfil?.poste,
      c.offre?.titre,
      getDisplayCandidatureStatus(c.statut),
      c.talentProfil?.localisation,
      c.talentProfil?.competences,
      `${c.matchScore || 0}%`,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(";")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `candidatures-spotted-talent-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export des candidatures téléchargé.");
  };

  if (loading) return <div className="text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
              <Users className="h-3.5 w-3.5" />
              Pilotage des candidatures
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Candidatures reçues</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Tout le suivi candidat reste ici : tri, priorités, décisions, documents et bascule
              rapide vers le profil complet ou les échanges de candidature.
            </p>
            <Button
              type="button"
              variant="ghost-glow"
              size="sm"
              disabled={!entitlements.candidateExport || candidatures.length === 0}
              onClick={exporterCandidatures}
              className="mt-4 w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {entitlements.candidateExport ? "Exporter les candidats (CSV)" : "Export CSV inclus avec Premium"}
            </Button>
          </div>
          <div className="dashboard-subcard p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Vue rapide</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {counts.envoyee > 0
                ? `${counts.envoyee} candidature${counts.envoyee > 1 ? "s" : ""} à traiter`
                : "Aucune candidature en attente"}
            </p>
            <p className="mt-1 text-xs leading-4 text-muted-foreground line-clamp-2">
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
            <div key={c.id} className={`dashboard-panel p-3 sm:p-4 ${c.statut === "acceptee" ? "border-green-500/25" : c.statut === "entretien" ? "border-blue-500/25" : ""}`}>
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold">{formatDisplayLabel(c.offre?.titre) || "Offre"}</h3>
                    {entitlements.candidateMatching && (
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        (c.matchScore || 0) >= 70
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : (c.matchScore || 0) >= 40
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-border bg-secondary text-muted-foreground"
                      }`}>
                        {c.matchScore || 0}% de correspondance
                      </span>
                    )}
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
                  <div className="flex gap-3 text-xs text-muted-foreground mb-1.5 flex-wrap">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {formatDisplayLabel(c.offre?.contrat)}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {formatDisplayLabel(c.offre?.localisation) || "Non précisée"}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {c.talentProfil ? (
                    <div className="mt-2 space-y-1.5 rounded-lg border border-border/50 bg-secondary/50 p-2">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {c.talentAvatarUrl ? (
                              <img src={c.talentAvatarUrl} alt="photo talent" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <Users className="w-4 h-4 text-accent/60" />
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
                          className="dashboard-action-link self-start px-2.5 py-1 text-[10px] sm:self-auto"
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
                    {Array.isArray(c.reponses_preselection) && c.reponses_preselection.length > 0 && (
                      <div className="mt-2 rounded-lg border border-accent/15 bg-accent/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Réponses de présélection</p>
                        <div className="mt-2 space-y-2">
                          {c.reponses_preselection.map((response: any, index: number) => (
                            <div key={`${response.questionId || index}-${index}`}>
                              <p className="text-xs font-medium text-foreground">{response.question || `Question ${index + 1}`}</p>
                              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{response.answer || "Aucune réponse"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                <div className="dashboard-subcard p-2.5 sm:p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Décision et suivi</p>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">{getDisplayCandidatureStatus(c.statut)}</p>
                  <p className="mt-1 text-xs leading-4 text-muted-foreground line-clamp-2">
                    {c.statut === "acceptee"
                      ? "Le dossier est validé. Les documents liés à cette candidature deviennent votre zone de suivi principale."
                      : c.statut === "entretien"
                        ? "Le candidat est en phase active. Vous pouvez poursuivre les échanges et préparer les documents si besoin."
                        : c.statut === "refusee"
                          ? "La candidature est clôturée. Vous pouvez la remettre en attente si vous souhaitez réouvrir le dossier."
                          : "Ce dossier attend votre premier retour. Vous pouvez le faire avancer en un clic."}
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {c.statut === "envoyee" && (
                      <Button variant="ghost-glow" size="sm" className="h-7 w-full justify-center text-xs text-blue-400 border-blue-500/30 hover:bg-blue-500/10" onClick={() => changerStatut(c.id, "entretien")}>En entretien</Button>
                    )}
                    {(c.statut === "envoyee" || c.statut === "entretien") && (
                      <Button variant="glow" size="sm" className="h-7 w-full justify-center text-xs" onClick={() => changerStatut(c.id, "acceptee")}><Check className="w-3 h-3 mr-1" /> Accepter</Button>
                    )}
                    {(c.statut === "envoyee" || c.statut === "entretien") && (
                      <Button variant="ghost-glow" size="sm" className="h-7 w-full justify-center text-xs" onClick={() => changerStatut(c.id, "refusee")}><X className="w-3 h-3 mr-1" /> Refuser</Button>
                    )}
                    {(c.statut === "acceptee" || c.statut === "refusee" || c.statut === "entretien") && (
                      <Button variant="ghost-glow" size="sm" className="h-7 w-full justify-center text-xs" onClick={() => changerStatut(c.id, "envoyee")}>Remettre en attente</Button>
                    )}
                  </div>
                  <div className="mt-2 rounded-lg border border-border/60 bg-secondary/20 px-2.5 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Note interne</p>
                    <div className="mt-1 flex gap-0.5">
                      {[1,2,3,4,5].map((etoile) => (
                        <button key={etoile} onClick={() => noterTalent(c.id, etoile)} className={`text-base leading-none transition-colors ${c.note >= etoile ? "text-amber-400" : "text-muted-foreground hover:text-amber-300"}`}>★</button>
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
    const candidatureIds = (cands || []).map((candidature: any) => candidature.id);
    const openedExchangeIds = new Set<string>();
    if (candidatureIds.length > 0) {
      const { data: openingMessages } = await supabase
        .from("messages")
        .select("candidature_id")
        .eq("expedition_id", user.id)
        .eq("automated", false)
        .in("candidature_id", candidatureIds);
      (openingMessages || []).forEach((message: any) => openedExchangeIds.add(message.candidature_id));
    }
    const candsAvecNom = await Promise.all((cands || []).map(async (c: any) => {
      const { data: profil } = await supabase.from("profiles").select("full_name").eq("user_id", c.talent_id).single();
      return { ...c, talentNom: profil?.full_name || "Talent", echangeOuvert: openedExchangeIds.has(c.id) };
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
    if (isCandidateExchangeClosed(convActive.statut)) {
      toast.error("Cette candidature est clôturée. L’échange est disponible en lecture seule.");
      return;
    }
    const { error } = await supabase.from("messages").insert({ expedition_id: user.id, destinataire_id: convActive.talent_id, candidature_id: convActive.id, contenu: nouveau.trim() });
    if (!error) {
      setNouveau("");
      setConvActive((current: any) => current ? { ...current, echangeOuvert: true } : current);
      chargerMessages(convActive.id);
      chargerConversations();
      try {
        const { data: talentProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", convActive.talent_id)
          .maybeSingle();
        if (talentProfile?.email) await emailNouveauMessage(talentProfile.email, convActive.id);
      } catch (emailError) {
        console.error("Erreur email message:", emailError);
      }
    } else {
      toast.error(translateAppError(error.message, "Impossible d’envoyer ce message."));
    }
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
  const openExchangeCount = conversations.filter((conversation) => conversation.echangeOuvert).length;
  const exchangeClosed = Boolean(convActive && isCandidateExchangeClosed(convActive.statut));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Échanges candidats</h2>
      <p className="text-muted-foreground mb-6">Ouvrez un échange depuis une candidature, puis centralisez ici les réponses liées à ce recrutement.</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="dashboard-stat-card p-4 border border-accent/20 bg-accent/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Échanges ouverts</p>
              <p className="mt-2 text-2xl font-bold">{openExchangeCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Initiés par votre équipe.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card p-4 border border-blue-500/20 bg-blue-500/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Réponses non lues</p>
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
              <p className="mt-2 text-sm font-semibold">{convActive ? convActive.talentNom : "Aucune candidature sélectionnée"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{convActive?.offre?.titre || "Choisissez un dossier pour ouvrir ou consulter un échange."}</p>
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
            <h3 className="font-semibold text-sm text-muted-foreground">Candidatures reçues</h3>
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
                      <p className="text-sm font-medium">{formatDisplayLabel(c.offre?.titre) || "Offre"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{c.talentNom}</p>
                    </div>
                    {nonLusParConv[c.id] > 0 && (<span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">{nonLusParConv[c.id]}</span>)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {getDisplayCandidatureStatus(c.statut)}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${isCandidateExchangeClosed(c.statut) ? "border-border bg-secondary/40 text-muted-foreground" : c.echangeOuvert ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "border-accent/20 bg-accent/5 text-accent"}`}>
                      {isCandidateExchangeClosed(c.statut) ? "Lecture seule" : c.echangeOuvert ? "Échange ouvert" : "À ouvrir"}
                    </span>
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
                      Retour aux candidatures
                    </button>
                    <h3 className="font-semibold">{convActive.offre?.titre}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{convActive.talentNom}</p>
                  </div>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${exchangeClosed ? "border-border bg-secondary/40 text-muted-foreground" : convActive.echangeOuvert ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "border-accent/20 bg-accent/10 text-accent"}`}>
                    {exchangeClosed ? "Lecture seule" : convActive.echangeOuvert ? "Échange ouvert" : "À ouvrir par votre équipe"}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageSquare className="mb-3 h-12 w-12 text-accent/20" />
                    <p className="text-sm font-medium">Aucun message pour le moment</p>
                    <p className="mt-1 text-xs text-muted-foreground">Envoyez le premier message professionnel pour ouvrir l’échange avec ce talent.</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.expedition_id === user.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-sm ${m.expedition_id === user.id ? "bg-accent text-white shadow-[0_18px_45px_-36px_rgba(6,182,212,0.65)]" : "bg-secondary/60 border border-border/50 text-foreground"}`}>
                        {m.automated && <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">Message automatique</p>}
                        {formatStoredMessageText(m.contenu)}
                        <p className="text-xs opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-border/50 p-4">
                {exchangeClosed ? (
                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div><p className="text-sm font-semibold">Échange clôturé</p><p className="mt-1 text-xs text-muted-foreground">La candidature a été refusée. L’historique reste disponible en lecture seule.</p></div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3">
                    {!convActive.echangeOuvert && <p className="mb-2 text-xs text-muted-foreground">Ce premier message ouvrira l’échange et permettra au Talent de vous répondre.</p>}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input value={nouveau} onChange={(e) => setNouveau(e.target.value)} onKeyDown={(e) => e.key === "Enter" && envoyerMessage()} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" placeholder={convActive.echangeOuvert ? "Répondre au Talent..." : "Écrire le premier message..."} />
                      <Button className="w-full sm:w-auto" variant="glow" size="sm" onClick={envoyerMessage}><Send className="w-4 h-4 sm:mr-1" /> <span className="sm:inline hidden">{convActive.echangeOuvert ? "Envoyer" : "Ouvrir l’échange"}</span></Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm"><div className="max-w-sm text-center"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="font-semibold text-foreground">Sélectionnez une candidature</p><p className="mt-1 text-xs leading-5">Vous pourrez consulter l’historique ou envoyer le premier message pour ouvrir un échange.</p></div></div>
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
  const [deletingRequest, setDeletingRequest] = useState<string | null>(null);
  const [documentsRequestsReady, setDocumentsRequestsReady] = useState(true);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [hasAutoExpandedFolder, setHasAutoExpandedFolder] = useState(false);
  const [documentsView, setDocumentsView] = useState<"all" | "requests" | "shared">("all");
  const [showRequestComposer, setShowRequestComposer] = useState(false);
  const [showShareComposer, setShowShareComposer] = useState(false);
  const [shareCategory, setShareCategory] = useState("shared-contrat");
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
      setHasAutoExpandedFolder(false);
      return;
    }
    if (expandedFolderId && sharedFolders.some((folder) => folder.id === expandedFolderId)) return;
    if (expandedFolderId) {
      setExpandedFolderId(null);
      return;
    }
    if (hasAutoExpandedFolder) return;
    const withPendingRequest = sharedFolders.find((folder) => (folder.documentRequests || []).some((request: any) => request.status === "requested"));
    setExpandedFolderId(withPendingRequest?.id || sharedFolders[0].id);
    setHasAutoExpandedFolder(true);
  }, [sharedFolders, expandedFolderId, hasAutoExpandedFolder]);
  useEffect(() => {
    setDocumentsView("all");
    setShowRequestComposer(false);
    setShowShareComposer(false);
  }, [expandedFolderId]);
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
    const validationError = validateDocumentFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }
    setUploading(categorie);
    try {
      const nomPropre = sanitizeStorageFileName(file.name);
      const path = `${user.id}/${categorie}/${Date.now()}_${nomPropre}`;
      await uploadPrivateDocument(path, file, { fileName: file.name, metadata: { categorie } });
      toast.success("Document ajouté !"); chargerDocuments();
    } catch (err: any) { toast.error(translateAppError(err?.message, "Impossible d'ajouter ce document.")); } finally { setUploading(null); e.target.value = ""; }
  };
  const uploadSharedDocument = async (e: React.ChangeEvent<HTMLInputElement>, categorie: string, candidatureId: string) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    const validationError = validateDocumentFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }
    const uploadKey = `${categorie}-${candidatureId}`;
    setUploading(uploadKey);
    try {
      const nomPropre = sanitizeStorageFileName(file.name);
      const path = `${user.id}/${categorie}/${candidatureId}/${Date.now()}_${nomPropre}`;
      await uploadPrivateDocument(path, file, { fileName: file.name, metadata: { categorie, candidatureId } });
      toast.success("Document partagé ajouté !");
      chargerDocuments();
    } catch (err: any) {
      toast.error(translateAppError(err?.message, "Impossible d'ajouter ce document partagé."));
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };
  const telechargerDocument = async (ownerId: string, categorie: string, nom: string, candidatureId?: string) => {
    if (!ownerId) return;
    const basePath = candidatureId ? `${ownerId}/${categorie}/${candidatureId}/${nom}` : `${ownerId}/${categorie}/${nom}`;
    try {
      await openPrivateDocument(basePath, { fileName: nom, metadata: { categorie, candidatureId: candidatureId || null } });
    } catch (err: any) {
      toast.error(translateAppError(err?.message, "Impossible d'ouvrir ce document."));
    }
  };
  const ouvrirCheminStockage = async (storagePath: string | null | undefined) => {
    if (!storagePath) return;
    try {
      await openPrivateDocument(storagePath);
    } catch (err: any) {
      toast.error(translateAppError(err?.message, "Impossible d'ouvrir ce document."));
    }
  };
  const supprimerDocument = async (categorie: string, nom: string, candidatureId?: string) => {
    if (!user) return;
    const basePath = candidatureId ? `${user.id}/${categorie}/${candidatureId}/${nom}` : `${user.id}/${categorie}/${nom}`;
    try {
      await deletePrivateDocument(basePath, { fileName: nom, metadata: { categorie, candidatureId: candidatureId || null } });
      toast.success("Document supprimé."); chargerDocuments();
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };
  const demanderDocument = async (folder: any) => {
    if (!user) return;
    const selectedKey = requestSelections[folder.id];
    const selectedDocument = REQUESTABLE_DOCUMENTS.find((document) => document.key === selectedKey);
    if (!selectedDocument) return toast.error("Choisissez un document à demander.");

    setRequestingFolder(folder.id);
    try {
      const { data: createdRequest, error } = await supabase.from("document_requests").insert({
        candidature_id: folder.id,
        entreprise_id: user.id,
        talent_id: folder.talent_id,
        requested_by: user.id,
        document_key: selectedDocument.key,
        document_label: selectedDocument.label,
      }).select("id").single();
      if (error) throw error;
      if (createdRequest?.id) {
        void logDocumentAccess("request_created", null, {
          documentRequestId: createdRequest.id,
          metadata: { candidatureId: folder.id, documentKey: selectedDocument.key },
        });
      }
      toast.success("Document demandé au candidat !");
      setRequestSelections((prev) => ({ ...prev, [folder.id]: "" }));
      await chargerDocuments();
    } catch (err: any) {
      toast.error(translateAppError(err?.message, "Impossible de demander ce document."));
    } finally {
      setRequestingFolder(null);
    }
  };
  const supprimerDemandeDocument = async (request: any) => {
    if (!user) return;
    setDeletingRequest(request.id);
    try {
      await logDocumentAccess("request_deleted", request.storage_path || null, {
        fileName: request.file_name || request.document_label,
        documentRequestId: request.id,
        metadata: { candidatureId: request.candidature_id, documentKey: request.document_key },
      });
      const { error } = await supabase
        .from("document_requests")
        .delete()
        .eq("id", request.id)
        .eq("entreprise_id", user.id);
      if (error) throw error;
      toast.success("Demande de document supprimée.");
      await chargerDocuments();
    } catch (err: any) {
      toast.error(translateAppError(err?.message, "Impossible de supprimer cette demande."));
    } finally {
      setDeletingRequest(null);
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
      ...(folder.categories || []).flatMap((category: any) => [
        ...(category.ownDocs || []).map((document: any) => document.name),
        ...(category.partnerDocs || []).map((document: any) => document.name),
      ]),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const totalInternalDocuments = internalCategories.reduce((sum, category) => sum + (documents[category.id]?.length || 0), 0);
  const totalPendingRequests = sharedFolders.reduce((sum, folder) => sum + ((folder.documentRequests || []).filter((request: any) => request.status === "requested").length), 0);
  const totalReceivedRequests = sharedFolders.reduce((sum, folder) => sum + ((folder.documentRequests || []).filter((request: any) => request.status === "uploaded").length), 0);
  const totalSharedFolders = sharedFolders.length;
  const selectedFolder = filteredSharedFolders.find((folder) => folder.id === expandedFolderId) || filteredSharedFolders[0] || null;
  const compactDocumentRows = selectedFolder ? [
    ...(selectedFolder.documentRequests || []).map((request: any) => ({
      id: `request-${request.id}`,
      name: request.file_name || request.document_label,
      category: "Pièce demandée",
      sharedBy: request.status === "uploaded" ? "Talent" : "Entreprise",
      status: request.status === "uploaded" ? "Reçu" : "En attente",
      statusClass: request.status === "uploaded"
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
        : "border-amber-500/25 bg-amber-500/10 text-amber-300",
      kind: request.status === "uploaded" ? "received-request" : "pending-request",
      request,
    })),
    ...(selectedFolder.categories || []).flatMap((category: any) => [
      ...(category.ownDocs || []).map((document: any) => ({
        id: `${category.id}-entreprise-${document.name}`,
        name: document.name.replace(/^\d+_/, ""),
        category: category.label,
        categoryId: category.id,
        sharedBy: "Entreprise",
        status: "Partagé",
        statusClass: "border-sky-500/25 bg-sky-500/10 text-sky-400",
        kind: "company-document",
        document,
      })),
      ...(category.partnerDocs || []).map((document: any) => ({
        id: `${category.id}-talent-${document.name}`,
        name: document.name.replace(/^\d+_/, ""),
        category: category.label,
        categoryId: category.id,
        sharedBy: "Talent",
        status: "Reçu",
        statusClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
        kind: "talent-document",
        document,
      })),
    ]),
  ] : [];
  const visibleCompactRows = compactDocumentRows.filter((row: any) => {
    if (documentsView === "requests") return row.kind === "pending-request" || row.kind === "received-request";
    if (documentsView === "shared") return row.kind === "company-document" || row.kind === "talent-document";
    return true;
  });

  return (
    <div className="space-y-4">
      <section className="dashboard-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Espace sécurisé</p>
            <h2 className="mt-1 text-2xl font-bold">Documents</h2>
            <p className="mt-1 text-sm text-muted-foreground">Gérez les pièces internes et les échanges avec vos talents.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
            <div className="relative min-w-0 sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchDocuments}
                onChange={(event) => setSearchDocuments(event.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background/70 px-4 pl-10 text-sm outline-none focus:border-accent/50"
                placeholder="Rechercher un talent ou un document..."
              />
            </div>
            <input type="file" id="upload-ent-rh-compact" className="hidden" accept={DOCUMENT_ACCEPT_ATTRIBUTE} onChange={(event) => uploadDocument(event, "rh")} />
            <Button variant="glow" className="whitespace-nowrap" disabled={uploading === "rh"} onClick={() => document.getElementById("upload-ent-rh-compact")?.click()}>
              <Plus className="mr-1.5 h-4 w-4" />
              {uploading === "rh" ? "Ajout..." : "Ajouter un document"}
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-2 text-sm font-medium">
          <Users className="h-4 w-4 text-primary" /> {totalSharedFolders} dossier{totalSharedFolders > 1 ? "s" : ""} actif{totalSharedFolders > 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-amber-300" /> {totalPendingRequests} en attente
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-sm font-medium">
          <CheckCircle className="h-4 w-4 text-emerald-400" /> {totalReceivedRequests} reçu{totalReceivedRequests > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid min-h-[620px] gap-4 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="dashboard-panel flex flex-col p-3 sm:p-4">
          <div className="flex items-center justify-between border-b border-border/60 px-1 pb-3">
            <div>
              <h3 className="font-semibold">Dossiers talents</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Candidatures acceptées</p>
            </div>
            <span className="rounded-full border border-border/70 bg-secondary/30 px-2.5 py-1 text-xs text-muted-foreground">{filteredSharedFolders.length}</span>
          </div>

          <div className="mt-3 space-y-2">
            {filteredSharedFolders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                {sharedFolders.length === 0 ? "Aucun dossier actif pour le moment." : "Aucun dossier ne correspond à la recherche."}
              </div>
            ) : filteredSharedFolders.map((folder) => {
              const isSelected = selectedFolder?.id === folder.id;
              const pendingCount = (folder.documentRequests || []).filter((request: any) => request.status === "requested").length;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setExpandedFolderId(folder.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-colors ${isSelected ? "border-primary/50 bg-primary/10" : "border-border/60 bg-background/35 hover:border-primary/25"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {String(folder.talentNom || "T").split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{folder.talentNom}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{folder.offre?.titre || folder.talentPoste || "Candidature"}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Acceptée</span>
                        {pendingCount > 0 && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">{pendingCount} en attente</span>}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-auto border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Documents internes</p>
                <p className="text-xs text-muted-foreground">Visibles uniquement par votre entreprise</p>
              </div>
              <span className="rounded-full bg-secondary/50 px-2 py-1 text-xs text-muted-foreground">{totalInternalDocuments}</span>
            </div>
            <div className="mt-3 max-h-36 space-y-2 overflow-y-auto">
              {(documents.rh || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">Aucun document interne.</p>
              ) : (documents.rh || []).map((documentItem: any) => (
                <div key={documentItem.name} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-2.5 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-accent" />
                  <button type="button" onClick={() => telechargerDocument(user.id, "rh", documentItem.name)} className="min-w-0 flex-1 truncate text-left text-xs hover:text-accent">
                    {documentItem.name.replace(/^\d+_/, "")}
                  </button>
                  <ConfirmActionDialog title="Supprimer ce document ?" description="Ce fichier interne sera supprimé de votre espace entreprise." onConfirm={() => supprimerDocument("rh", documentItem.name)}>
                    <button type="button" aria-label="Supprimer le document interne" className="p-1 text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  </ConfirmActionDialog>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="dashboard-panel flex min-w-0 flex-col p-4 sm:p-5">
          {!selectedFolder ? (
            <div className="flex flex-1 items-center justify-center py-16 text-center">
              <div>
                <Users className="mx-auto h-12 w-12 text-primary/25" />
                <h3 className="mt-4 font-semibold">Aucun dossier talent à afficher</h3>
                <p className="mt-1 text-sm text-muted-foreground">Un dossier apparaîtra ici lorsqu’une candidature sera acceptée.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold">{selectedFolder.talentNom}</h3>
                    <span className="text-muted-foreground">· {selectedFolder.offre?.titre || selectedFolder.talentPoste || "Candidature"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Dossier sécurisé lié à cette candidature.</p>
                </div>
                <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">Candidature acceptée</span>
              </div>

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex overflow-x-auto border-b border-border/60">
                  {([
                    ["all", "Tous les documents", compactDocumentRows.length],
                    ["requests", "Demandes", compactDocumentRows.filter((row: any) => row.kind.includes("request")).length],
                    ["shared", "Partagés", compactDocumentRows.filter((row: any) => row.kind.includes("document")).length],
                  ] as const).map(([id, label, count]) => (
                    <button key={id} type="button" onClick={() => setDocumentsView(id)} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${documentsView === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                      {label} <span className="ml-1 text-xs opacity-70">{count}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="ghost-glow" size="sm" onClick={() => { setShowRequestComposer((current) => !current); setShowShareComposer(false); }}>
                    <FileText className="mr-1.5 h-4 w-4" /> Demander une pièce
                  </Button>
                  <Button variant="glow" size="sm" onClick={() => { setShowShareComposer((current) => !current); setShowRequestComposer(false); }}>
                    <Plus className="mr-1.5 h-4 w-4" /> Partager un document
                  </Button>
                </div>
              </div>

              {showRequestComposer && (
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-xs font-semibold text-amber-300">Document à demander au candidat</label>
                      <select value={requestSelections[selectedFolder.id] || ""} onChange={(event) => setRequestSelections((current) => ({ ...current, [selectedFolder.id]: event.target.value }))} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-amber-500/40">
                        <option value="">Choisir un document</option>
                        {REQUESTABLE_DOCUMENTS.filter((definition) => !(selectedFolder.documentRequests || []).some((request: any) => request.document_key === definition.key)).map((definition) => (
                          <option key={definition.key} value={definition.key}>{definition.label}</option>
                        ))}
                      </select>
                    </div>
                    <ConfirmActionDialog title="Valider la demande de document ?" description={`Le candidat ${selectedFolder.talentNom} verra cette demande dans son espace Documents.`} confirmLabel="Envoyer la demande" confirmVariant="glow" onConfirm={() => demanderDocument(selectedFolder)}>
                      <button type="button" disabled={!requestSelections[selectedFolder.id] || requestingFolder === selectedFolder.id || !documentsRequestsReady} className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                        {requestingFolder === selectedFolder.id ? "Envoi..." : "Envoyer la demande"}
                      </button>
                    </ConfirmActionDialog>
                  </div>
                  {!documentsRequestsReady && <p className="mt-2 text-xs text-amber-300">Le partage doit d’abord être activé dans Supabase.</p>}
                </div>
              )}

              {showShareComposer && (
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.07] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-xs font-semibold text-primary">Catégorie du document</label>
                      <select value={shareCategory} onChange={(event) => setShareCategory(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40">
                        {sharedCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                      </select>
                    </div>
                    <input type="file" id={`compact-share-${selectedFolder.id}`} className="hidden" accept={DOCUMENT_ACCEPT_ATTRIBUTE} onChange={(event) => uploadSharedDocument(event, shareCategory, selectedFolder.id)} />
                    <Button variant="glow" disabled={uploading === `${shareCategory}-${selectedFolder.id}`} onClick={() => document.getElementById(`compact-share-${selectedFolder.id}`)?.click()}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      {uploading === `${shareCategory}-${selectedFolder.id}` ? "Ajout..." : "Choisir et partager"}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Le document sera visible uniquement par votre entreprise et ce talent.</p>
                </div>
              )}

              <div className="mt-4 overflow-hidden rounded-2xl border border-border/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-secondary/35 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Document</th>
                        <th className="px-4 py-3 font-semibold">Catégorie</th>
                        <th className="px-4 py-3 font-semibold">Partagé par</th>
                        <th className="px-4 py-3 font-semibold">Statut</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {visibleCompactRows.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun document dans cette vue.</td></tr>
                      ) : visibleCompactRows.map((row: any) => (
                        <tr key={row.id} className="bg-background/20 transition-colors hover:bg-secondary/15">
                          <td className="px-4 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
                              <span className="max-w-[280px] truncate text-sm font-medium">{row.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{row.category}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{row.sharedBy}</td>
                          <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${row.statusClass}`}>{row.status}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {row.kind === "received-request" && <Button variant="ghost-glow" size="sm" onClick={() => ouvrirCheminStockage(row.request.storage_path)}>Ouvrir</Button>}
                              {row.kind === "pending-request" && (
                                <ConfirmActionDialog title="Supprimer cette demande ?" description={`La demande « ${row.request.document_label} » sera retirée du dossier du candidat.`} confirmLabel="Supprimer" onConfirm={() => supprimerDemandeDocument(row.request)}>
                                  <button type="button" disabled={deletingRequest === row.request.id} className="inline-flex h-8 items-center rounded-lg border border-red-500/20 px-2.5 text-xs font-semibold text-red-400 hover:text-red-300"><Trash2 className="mr-1 h-3.5 w-3.5" />Supprimer</button>
                                </ConfirmActionDialog>
                              )}
                              {(row.kind === "company-document" || row.kind === "talent-document") && (
                                <Button variant="ghost-glow" size="sm" onClick={() => telechargerDocument(row.kind === "company-document" ? user.id : row.document.ownerId, row.categoryId, row.document.name, selectedFolder.id)}>Ouvrir</Button>
                              )}
                              {row.kind === "company-document" && (
                                <ConfirmActionDialog title="Supprimer ce document partagé ?" description="Le talent ne pourra plus consulter ce document." onConfirm={() => supprimerDocument(row.categoryId, row.document.name, selectedFolder.id)}>
                                  <button type="button" aria-label="Supprimer le document partagé" className="p-1.5 text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                                </ConfirmActionDialog>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-5 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                Les documents sont chiffrés et visibles uniquement par les personnes autorisées.
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default EntrepriseDashboard;

