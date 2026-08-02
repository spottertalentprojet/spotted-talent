import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DOCUMENT_ACCEPT_ATTRIBUTE, formatStoredMessageText, sanitizeStorageFileName, validateDocumentFile } from "@/lib/utils";
import { deletePrivateDocument, openPrivateDocument, uploadPrivateDocument } from "@/lib/documentSecurity";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";
import AccountSecurityPanel from "@/components/AccountSecurityPanel";
import ThemeToggle from "@/components/ThemeToggle";
import OfferDescription, { getOfferDescriptionPreview } from "@/components/OfferDescription";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  FileText,
  Target,
  Crosshair,
  Heart,
  FolderOpen,
  LogOut,
  User,
  BarChart3,
  Mail,
  Plus,
  Camera,
  Upload,
  CheckCircle,
  Trash2,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Search,
  ClipboardList,
  Menu,
  X,
  MapPin,
  ArrowLeft,
  Building2,
  ShieldCheck,
  Eye,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emailNouvelleCandiature, emailNouveauMessage, emailNotificationEntreprise } from "@/lib/emails";
import { requestAiContent } from "@/lib/aiAssistant";
import { extractCvTextFromFile } from "@/lib/cvTextExtraction";
import { translateAppError } from "@/lib/authMessages";
import { getCompanyCoverPublicUrl } from "@/lib/companyMedia";
import { REQUESTABLE_DOCUMENTS, getRequestStatusMeta } from "@/lib/documentRequests";
import { canTalentReplyToExchange, isCandidateExchangeClosed } from "@/lib/candidateExchange";
import {
  TALENT_AVAILABILITY_OPTIONS,
  buildTalentBioWithAvailability,
  formatTalentAvailabilityLabel,
  parseTalentAvailabilityFromBio,
  stripTalentAvailabilityMetadata,
  type TalentAvailabilityType,
} from "@/lib/talentAvailability";

// ─── Formatage de date relative en français ───────────────────────────────────
const formatDateRelative = (date: string): string => {
  const aujourdHui = new Date();
  const jourAujourdhui = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), aujourdHui.getDate());
  const d = new Date(date);
  const jourDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffJours = Math.round((jourAujourdhui.getTime() - jourDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffJours === 0) return "Nouveau";
  if (diffJours === 1) return "Hier";
  if (diffJours <= 7) return `Il y a ${diffJours} jours`;
  if (diffJours <= 30) {
    const s = Math.floor(diffJours / 7);
    return `Il y a ${s} semaine${s > 1 ? "s" : ""}`;
  }
  const m = Math.floor(diffJours / 30);
  return `Il y a ${m} mois`;
};

// ─── Secteurs ─────────────────────────────────────────────────────────────────
const SECTEURS = [
  "Aéronautique & Spatial", "Agriculture & Ressources naturelles", "Agroalimentaire",
  "Architecture & Urbanisme", "Artisanat", "Arts, Culture & Loisirs", "Assurance",
  "Audit & Conseil", "Automobile", "BTP & Construction", "Chimie & Matériaux",
  "Coiffure & Esthétique", "Commerce & Distribution", "Communication & Médias",
  "Cybersécurité", "Défense & Sécurité", "E-commerce", "Éducation & Formation",
  "Énergie & Environnement", "Événementiel", "Finance & Banque",
  "Gouvernance & Administration publique", "Hôtellerie & Tourisme", "Immobilier",
  "Import & Export", "Industrie manufacturière", "Informatique & Technologie",
  "Intelligence artificielle & Data", "Juridique & Droit", "Logistique & Supply chain",
  "Luxe & Mode", "Maintenance & Facility management", "Marine & Pêche",
  "Marketing & Publicité", "Nucléaire", "ONG & Associations", "Pétrole & Gaz",
  "Pharmacie & Biotechnologie", "Recherche & Développement", "Ressources humaines & Recrutement",
  "Restauration", "Santé & Médical", "Sécurité privée", "Services à la personne",
  "Services funéraires", "Sport & Bien-être", "Télécommunications", "Textile & Habillement",
  "Transport & Mobilité", "Vétérinaire & Animalerie",
];

const DEPARTEMENTS_FR = [
  "01 - Ain", "02 - Aisne", "03 - Allier", "04 - Alpes-de-Haute-Provence", "05 - Hautes-Alpes",
  "06 - Alpes-Maritimes", "07 - Ardèche", "08 - Ardennes", "09 - Ariège", "10 - Aube",
  "11 - Aude", "12 - Aveyron", "13 - Bouches-du-Rhône", "14 - Calvados", "15 - Cantal",
  "16 - Charente", "17 - Charente-Maritime", "18 - Cher", "19 - Corrèze", "2A - Corse-du-Sud",
  "2B - Haute-Corse", "21 - Côte-d'Or", "22 - Côtes-d'Armor", "23 - Creuse", "24 - Dordogne",
  "25 - Doubs", "26 - Drôme", "27 - Eure", "28 - Eure-et-Loir", "29 - Finistère",
  "30 - Gard", "31 - Haute-Garonne", "32 - Gers", "33 - Gironde", "34 - Hérault",
  "35 - Ille-et-Vilaine", "36 - Indre", "37 - Indre-et-Loire", "38 - Isère", "39 - Jura",
  "40 - Landes", "41 - Loir-et-Cher", "42 - Loire", "43 - Haute-Loire", "44 - Loire-Atlantique",
  "45 - Loiret", "46 - Lot", "47 - Lot-et-Garonne", "48 - Lozère", "49 - Maine-et-Loire",
  "50 - Manche", "51 - Marne", "52 - Haute-Marne", "53 - Mayenne", "54 - Meurthe-et-Moselle",
  "55 - Meuse", "56 - Morbihan", "57 - Moselle", "58 - Nièvre", "59 - Nord",
  "60 - Oise", "61 - Orne", "62 - Pas-de-Calais", "63 - Puy-de-Dôme", "64 - Pyrénées-Atlantiques",
  "65 - Hautes-Pyrénées", "66 - Pyrénées-Orientales", "67 - Bas-Rhin", "68 - Haut-Rhin", "69 - Rhône",
  "70 - Haute-Saône", "71 - Saône-et-Loire", "72 - Sarthe", "73 - Savoie", "74 - Haute-Savoie",
  "75 - Paris", "76 - Seine-Maritime", "77 - Seine-et-Marne", "78 - Yvelines", "79 - Deux-Sèvres",
  "80 - Somme", "81 - Tarn", "82 - Tarn-et-Garonne", "83 - Var", "84 - Vaucluse",
  "85 - Vendée", "86 - Vienne", "87 - Haute-Vienne", "88 - Vosges", "89 - Yonne",
  "90 - Territoire de Belfort", "91 - Essonne", "92 - Hauts-de-Seine", "93 - Seine-Saint-Denis",
  "94 - Val-de-Marne", "95 - Val-d'Oise", "971 - Guadeloupe", "972 - Martinique", "973 - Guyane",
  "974 - La Réunion", "976 - Mayotte",
];

type SuggestionOption = {
  label: string;
  value?: string;
  aliases?: string[];
};

type AddressSuggestion = {
  label: string;
  value: string;
  city: string;
  postcode: string;
  context: string;
};

const VILLES_SUGGESTIONS_FR: SuggestionOption[] = [
  { label: "Chambéry (73000 - Savoie)", value: "Chambéry", aliases: ["73", "73000", "savoie", "chambery", "chambéry"] },
  { label: "Aix-les-Bains (73100 - Savoie)", value: "Aix-les-Bains", aliases: ["73", "73100", "savoie", "aix les bains", "aix-les-bains"] },
  { label: "Annecy (74000 - Haute-Savoie)", value: "Annecy", aliases: ["74", "74000", "haute savoie", "annecy"] },
  { label: "Lyon (69000 - Rhône)", value: "Lyon", aliases: ["69", "69000", "rhone", "rhône", "lyon"] },
  { label: "Paris (75000 - Paris)", value: "Paris", aliases: ["75", "75000", "paris"] },
  { label: "Bordeaux (33000 - Gironde)", value: "Bordeaux", aliases: ["33", "33000", "gironde", "bordeaux"] },
  { label: "Marseille (13000 - Bouches-du-Rhône)", value: "Marseille", aliases: ["13", "13000", "bouches du rhone", "bouches-du-rhone", "marseille"] },
  { label: "Toulouse (31000 - Haute-Garonne)", value: "Toulouse", aliases: ["31", "31000", "haute garonne", "haute-garonne", "toulouse"] },
  { label: "Lille (59000 - Nord)", value: "Lille", aliases: ["59", "59000", "nord", "lille"] },
  { label: "Nantes (44000 - Loire-Atlantique)", value: "Nantes", aliases: ["44", "44000", "loire atlantique", "loire-atlantique", "nantes"] },
  { label: "Nice (06000 - Alpes-Maritimes)", value: "Nice", aliases: ["06", "06000", "alpes maritimes", "alpes-maritimes", "nice"] },
  { label: "Strasbourg (67000 - Bas-Rhin)", value: "Strasbourg", aliases: ["67", "67000", "bas rhin", "bas-rhin", "strasbourg"] },
  { label: "Montpellier (34000 - Hérault)", value: "Montpellier", aliases: ["34", "34000", "herault", "hérault", "montpellier"] },
  { label: "Grenoble (38000 - Isère)", value: "Grenoble", aliases: ["38", "38000", "isere", "isère", "grenoble"] },
  { label: "Rouen (76000 - Seine-Maritime)", value: "Rouen", aliases: ["76", "76000", "seine maritime", "seine-maritime", "rouen"] },
  { label: "Reims (51100 - Marne)", value: "Reims", aliases: ["51", "51100", "marne", "reims"] },
  { label: "Dijon (21000 - Côte-d'Or)", value: "Dijon", aliases: ["21", "21000", "cote d'or", "côte-d'or", "dijon"] },
  { label: "Clermont-Ferrand (63000 - Puy-de-Dôme)", value: "Clermont-Ferrand", aliases: ["63", "63000", "puy de dome", "puy-de-dome", "clermont ferrand", "clermont-ferrand"] },
  { label: "Saint-Étienne (42000 - Loire)", value: "Saint-Étienne", aliases: ["42", "42000", "loire", "saint etienne", "saint-étienne"] },
  { label: "Le Havre (76600 - Seine-Maritime)", value: "Le Havre", aliases: ["76", "76600", "seine maritime", "seine-maritime", "le havre"] },
];

const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const dedupeSuggestions = (values: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  return values.reduce<string[]>((acc, value) => {
    const trimmed = value?.trim();
    if (!trimmed) return acc;
    const key = normalizeSearchValue(trimmed);
    if (!key || seen.has(key)) return acc;
    seen.add(key);
    acc.push(trimmed);
    return acc;
  }, []);
};

const dedupeSuggestionOptions = (values: Array<string | SuggestionOption | null | undefined>) => {
  const seen = new Set<string>();
  return values.reduce<SuggestionOption[]>((acc, value) => {
    if (!value) return acc;
    const option = typeof value === "string" ? { label: value, value } : value;
    if (!option?.label && !option?.value) return acc;
    const key = normalizeSearchValue(option.value || option.label);
    if (!key || seen.has(key)) return acc;
    seen.add(key);
    acc.push(option);
    return acc;
  }, []);
};

const buildFranceLocationApiUrl = (query: string) => {
  const trimmed = query.trim();
  const base = "https://geo.api.gouv.fr/communes?fields=departement,codesPostaux&boost=population&limit=10";

  if (/^\d{5}$/.test(trimmed)) {
    return `${base}&codePostal=${encodeURIComponent(trimmed)}`;
  }

  if (/^(?:\d{2,3}|2A|2B)$/i.test(trimmed)) {
    return `${base}&codeDepartement=${encodeURIComponent(trimmed)}`;
  }

  return `${base}&nom=${encodeURIComponent(trimmed)}`;
};

const formatFranceLocationSuggestion = (commune: any): SuggestionOption | null => {
  const city = commune?.nom?.trim();
  if (!city) return null;

  const postalCodes = Array.isArray(commune?.codesPostaux)
    ? commune.codesPostaux.filter(Boolean)
    : [];
  const postalCode = postalCodes[0] || "";
  const departmentName = commune?.departement?.nom?.trim() || "";
  const departmentCode = commune?.departement?.code?.trim() || "";

  return {
    label: `${city}${postalCode ? ` (${postalCode})` : ""}${departmentName ? ` - ${departmentName}` : ""}`,
    value: postalCode ? `${city} (${postalCode})` : city,
    aliases: dedupeSuggestions([
      city,
      postalCode,
      departmentName,
      departmentCode,
      ...postalCodes,
    ]),
  };
};

const normalizeSuggestionOptions = (suggestions: Array<string | SuggestionOption | null | undefined>) =>
  suggestions.reduce<Array<{ label: string; value: string; aliases: string[] }>>((acc, suggestion) => {
    if (!suggestion) return acc;

    if (typeof suggestion === "string") {
      const trimmed = suggestion.trim();
      if (!trimmed) return acc;
      acc.push({ label: trimmed, value: trimmed, aliases: [trimmed] });
      return acc;
    }

    const label = String(suggestion.label ?? "").trim();
    const value = String(suggestion.value ?? suggestion.label ?? "").trim();
    if (!label && !value) return acc;

    acc.push({
      label: label || value,
      value: value || label,
      aliases: dedupeSuggestions([
        label,
        value,
        ...(suggestion.aliases || []),
      ]),
    });

    return acc;
  }, []);

const getFilteredSuggestionOptions = (
  suggestions: Array<string | SuggestionOption>,
  value: string,
) => {
  const query = normalizeSearchValue(value);
  const deptPrefix = query.match(/^\d{2,5}/)?.[0]?.slice(0, 2) ?? "";
  const normalizedSuggestions = normalizeSuggestionOptions(suggestions);

  return normalizedSuggestions
    .filter((suggestion) => {
      if (!query) return false;
      const normalizedAliases = suggestion.aliases.map((alias) => normalizeSearchValue(alias));
      return (
        normalizedAliases.some((alias) => alias.includes(query)) ||
        (!!deptPrefix && normalizedAliases.some((alias) => alias.startsWith(deptPrefix)))
      );
    })
    .sort((a, b) => {
      const aNorms = a.aliases.map((alias) => normalizeSearchValue(alias));
      const bNorms = b.aliases.map((alias) => normalizeSearchValue(alias));
      const aStarts = aNorms.some((alias) => alias.startsWith(query) || (!!deptPrefix && alias.startsWith(deptPrefix)));
      const bStarts = bNorms.some((alias) => alias.startsWith(query) || (!!deptPrefix && alias.startsWith(deptPrefix)));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.label.localeCompare(b.label, "fr");
    });
};

const extractLocationQueries = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const postalCode = trimmed.match(/\b\d{5}\b/)?.[0] ?? "";
  const departmentCode = trimmed.match(/\b(?:\d{2,3}|2A|2B)\b/i)?.[0] ?? "";
  const withoutPostal = trimmed
    .replace(/\(\s*\d{5}\s*\)/g, " ")
    .replace(/\s+-\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const meaningfulTokens = withoutPostal
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter((part) => normalizeSearchValue(part).length > 2);

  return dedupeSuggestions([
    trimmed,
    withoutPostal,
    postalCode,
    departmentCode,
    ...meaningfulTokens,
  ])
    .map((item) => normalizeSearchValue(item))
    .filter(Boolean);
};

const SecteurSelect = ({ value, onChange, placeholder = "Rechercher un secteur..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) => {
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const filtres = SECTEURS.filter((secteur) => normalizeSearchValue(secteur).includes(normalizeSearchValue(recherche)));
  return (
    <div ref={ref} className="relative z-30 min-w-0">
      <button type="button" onClick={() => setOpen(!open)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:border-primary/50 hover:border-primary/30 transition-colors">
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || placeholder}</span>
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
              <button key={s} onClick={() => { onChange(s); setOpen(false); setRecherche(""); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${value === s ? "text-primary bg-primary/5" : ""}`}>
                {value === s && "v "}{s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AutocompleteFilter = ({
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: Array<string | SuggestionOption>;
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = getFilteredSuggestionOptions(suggestions, value).slice(0, 8);

  return (
    <div ref={ref} className="relative z-[220] min-w-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 pl-10 pr-10 text-sm focus:outline-none focus:border-primary/50"
          placeholder={placeholder}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            X
          </button>
        )}
      </div>
      {open && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[160] mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-background shadow-2xl">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={`${suggestion.label}-${suggestion.value}`}
              type="button"
              onClick={() => {
                onChange(suggestion.value);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LocationAutocompleteFilter = ({
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: Array<string | SuggestionOption>;
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState<SuggestionOption[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fallbackSuggestions = getFilteredSuggestionOptions(suggestions, value).slice(0, 8);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setRemoteSuggestions([]);
      setLoadingSuggestions(false);
      setFetchFailed(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      setFetchFailed(false);

      try {
        const fallbackMatches = getFilteredSuggestionOptions(suggestions, query).slice(0, 8);
        const response = await fetch(buildFranceLocationApiUrl(query), { signal: controller.signal });
        if (!response.ok) throw new Error("location_fetch_failed");

        const communes = await response.json();
        const apiSuggestions = (communes || [])
          .map(formatFranceLocationSuggestion)
          .filter(Boolean) as SuggestionOption[];

        setRemoteSuggestions(
          dedupeSuggestionOptions([
            ...apiSuggestions,
            ...fallbackMatches,
          ]).slice(0, 8),
        );
      } catch (error: any) {
        if (controller.signal.aborted) return;
        setRemoteSuggestions([]);
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

  const visibleSuggestions = remoteSuggestions.length > 0 ? remoteSuggestions : fallbackSuggestions;

  return (
    <div ref={ref} className="relative z-[120] min-w-0">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-primary/50"
          placeholder={placeholder}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
              setRemoteSuggestions([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            X
          </button>
        )}
      </div>
      {open && value.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-[240] mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-background shadow-2xl overscroll-contain">
          {loadingSuggestions ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">Recherche des villes et codes postaux...</p>
          ) : visibleSuggestions.length > 0 ? (
            visibleSuggestions.map((suggestion) => (
              <button
                key={`${suggestion.label}-${suggestion.value}`}
                type="button"
                onClick={() => {
                  onChange(suggestion.value || suggestion.label);
                  setOpen(false);
                }}
                className="w-full border-b border-border/50 px-3 py-2 text-left text-sm text-foreground transition-colors last:border-b-0 hover:bg-secondary"
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

const AddressAutocompleteInput = ({
  address,
  location,
  onAddressChange,
  onLocationChange,
}: {
  address: string;
  location: string;
  onAddressChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = address.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setFetchFailed(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      setFetchFailed(false);

      try {
        const response = await fetch(buildFranceAddressApiUrl(query), { signal: controller.signal });
        if (!response.ok) throw new Error("address_fetch_failed");

        const result = await response.json();
        const nextSuggestions = (result?.features || [])
          .map(formatFranceAddressSuggestion)
          .filter(Boolean) as AddressSuggestion[];

        setSuggestions(nextSuggestions);
      } catch (error: any) {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setFetchFailed(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSuggestions(false);
        }
      }
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [address]);

  const selectAddress = (suggestion: AddressSuggestion) => {
    onAddressChange(suggestion.value);
    if (suggestion.city || suggestion.postcode) {
      onLocationChange(
        suggestion.city && suggestion.postcode
          ? `${suggestion.city} (${suggestion.postcode})`
          : suggestion.city || suggestion.postcode,
      );
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative z-[130]">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={address}
          onChange={(e) => {
            onAddressChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-primary/50"
          placeholder="Tapez votre adresse complète..."
          autoComplete="street-address"
        />
        {address && (
          <button
            type="button"
            onClick={() => {
              onAddressChange("");
              onLocationChange("");
              setSuggestions([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            X
          </button>
        )}
      </div>

      {open && address.trim().length >= 3 && (
        <div className="absolute left-0 right-0 top-full z-[260] mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-background shadow-2xl overscroll-contain">
          {loadingSuggestions ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">Recherche des adresses...</p>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <button
                key={`${suggestion.value}-${suggestion.postcode}`}
                type="button"
                onClick={() => selectAddress(suggestion)}
                className="w-full border-b border-border/50 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-secondary"
              >
                <span className="block text-sm font-medium text-foreground">{suggestion.label}</span>
                {(suggestion.postcode || suggestion.city || suggestion.context) && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {[suggestion.postcode, suggestion.city, suggestion.context].filter(Boolean).join(" - ")}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              {fetchFailed
                ? "La recherche d'adresse est indisponible. Vous pouvez saisir l'adresse manuellement."
                : "Aucune adresse trouvée pour cette recherche."}
            </div>
          )}
        </div>
      )}

      {location && (
        <p className="mt-2 text-xs text-muted-foreground">
          Ville / code postal détecté : <span className="font-semibold text-foreground">{location}</span>
        </p>
      )}
    </div>
  );
};

// ─── Tabs (sans badge offres) ─────────────────────────────────────────────────
const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "profile", label: "Mon Profil", icon: User },
  { id: "mes-candidatures", label: "Mes candidatures", icon: ClipboardList },
  { id: "offres", label: "Offres matchées", icon: Crosshair },
  { id: "offres-enregistrees", label: "Offres enregistrées", icon: Heart },
  { id: "candidature", label: "CV & Lettre", icon: FileText },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "messagerie", label: "Mes échanges", icon: MessageSquare },
] as const;

const TALENT_ACTIVE_TAB_STORAGE_KEY = "spotted-talent:talent-active-tab";
type TalentTabId = (typeof tabs)[number]["id"];

const isTalentTabId = (value: string | null): value is TalentTabId =>
  Boolean(value && tabs.some((tab) => tab.id === value));

const normalizeTalentTabId = (value: string | null): TalentTabId | null => {
  if (value === "cv" || value === "lettre") return "candidature";
  return isTalentTabId(value) ? value : null;
};

const getInitialTalentTab = (): TalentTabId => {
  if (typeof window === "undefined") return "dashboard";

  const queryTab = new URLSearchParams(window.location.search).get("tab");
  const normalizedQueryTab = normalizeTalentTabId(queryTab);
  if (normalizedQueryTab) return normalizedQueryTab;

  const storedTab = window.localStorage.getItem(TALENT_ACTIVE_TAB_STORAGE_KEY);
  const normalizedStoredTab = normalizeTalentTabId(storedTab);
  if (normalizedStoredTab) return normalizedStoredTab;

  return "dashboard";
};

const buildFranceAddressApiUrl = (query: string) => {
  const params = new URLSearchParams({
    q: query.trim(),
    limit: "8",
    autocomplete: "1",
  });

  return `https://data.geopf.fr/geocodage/search?${params.toString()}`;
};

const formatFranceAddressSuggestion = (feature: any): AddressSuggestion | null => {
  const properties = feature?.properties || {};
  const label = String(properties.label || "").trim();
  if (!label) return null;

  return {
    label,
    value: label,
    city: String(properties.city || "").trim(),
    postcode: String(properties.postcode || "").trim(),
    context: String(properties.context || "").trim(),
  };
};

const getPermisArray = (permis: any): string[] => {
  if (!permis) return [];
  if (Array.isArray(permis)) return permis.map((p: string) => formatStoredMessageText(p)).filter((p: string) => p.trim() !== "");
  let parsed: unknown = null;
  const permisText = formatStoredMessageText(String(permis));
  try {
    parsed = JSON.parse(permisText);
  } catch {
    parsed = null;
  }
  if (Array.isArray(parsed)) return parsed.map((p: string) => formatStoredMessageText(p)).filter((p: string) => p.trim() !== "");
  return permisText.split(",").map((p: string) => p.trim()).filter((p: string) => p !== "");
};

const getCompetencesArray = (competences: string | null | undefined): string[] => {
  if (!competences) return [];
  return formatStoredMessageText(competences)
    .split(",")
    .map((competence: string) => competence.trim())
    .filter((competence: string) => competence !== "");
};

const formatSalaireValue = (value: number): string => `${value.toLocaleString("fr-FR")} €`;

const formatSalaireRange = (min?: number | null, max?: number | null): string => {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;

  if (hasMin && hasMax) return `${formatSalaireValue(min)} - ${formatSalaireValue(max)}`;
  if (hasMin) return `À partir de ${formatSalaireValue(min)}`;
  if (hasMax) return `Jusqu'à ${formatSalaireValue(max)}`;
  return "Non précisé";
};

const getEntrepriseDisplayName = (source: any): string => {
  const profile = source?.entrepriseProfile || source?.entreprise_profile || source?.entreprise || null;
  const name = (
    source?.entrepriseNom ||
    source?.company_name ||
    source?.companyName ||
    source?.nom_entreprise ||
    profile?.company_name ||
    profile?.full_name ||
    "Entreprise non pr\u00e9cis\u00e9e"
  );
  return formatStoredMessageText(name) || "Entreprise non pr\u00e9cis\u00e9e";
};

const formatOfferField = (value?: string | null, fallback = ""): string =>
  formatStoredMessageText(value) || fallback;

const CompanyCoverPreview = ({ companyId, className = "" }: { companyId?: string | null; className?: string }) => {
  const [hidden, setHidden] = useState(false);
  const url = getCompanyCoverPublicUrl(companyId);

  if (!companyId || hidden || !url) return null;

  return (
    <img
      src={url}
      alt="Couverture entreprise"
      className={className}
      onError={() => setHidden(true)}
    />
  );
};

const TalentPageHeader = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  aside,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  children?: ReactNode;
}) => (
  <section className="talent-page-header">
    <div className="talent-page-header-layout">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <span className="talent-page-header-icon">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="talent-page-kicker">{eyebrow}</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
      {aside ? <aside className="talent-page-header-aside">{aside}</aside> : null}
    </div>
  </section>
);

const attachEntrepriseProfilesToOffres = async (offres: any[]): Promise<any[]> => {
  const entrepriseIds = Array.from(
    new Set(
      offres
        .map((offre) => offre?.entreprise_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  if (entrepriseIds.length === 0) return offres;

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, company_name, full_name, secteur, localisation, bio")
    .in("user_id", entrepriseIds);

  if (error) {
    console.error("profiles_entreprises_select_error", error);
    return offres;
  }

  const profilesByUserId = new Map((data || []).map((profile: any) => [profile.user_id, profile]));

  return offres.map((offre) => ({
    ...offre,
    entrepriseProfile: profilesByUserId.get(offre?.entreprise_id) || null,
  }));
};

const readLocalSignalMap = (key: string): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeLocalSignalMap = (key: string, value: Record<string, string>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const getTalentSavedOffersStorageKey = (userId: string) =>
  `spotted-talent:saved-offers:${userId}`;

const readTalentSavedOfferIds = (userId: string): string[] => {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = window.localStorage.getItem(getTalentSavedOffersStorageKey(userId));
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const writeTalentSavedOfferIds = (userId: string, offerIds: string[]) => {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(
    getTalentSavedOffersStorageKey(userId),
    JSON.stringify(Array.from(new Set(offerIds))),
  );
};

// ─── TalentDashboard ──────────────────────────────────────────────────────────
const TalentDashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TalentTabId>(getInitialTalentTab);
  const [cvScore, setCvScore] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [nbMessagesNonLus, setNbMessagesNonLus] = useState(0);
  const [nbCandidaturesMaj, setNbCandidaturesMaj] = useState(0);
  const [nbDocumentsDemandes, setNbDocumentsDemandes] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const candidatureSignalKey = user ? `spotted-talent:talen-candidatures:${user.id}` : "";
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || "Dashboard";

  useEffect(() => { if (!loading && !user) navigate("/talent"); }, [loading, user, navigate]);

  useEffect(() => {
    if (typeof window === "undefined" || !isTalentTabId(activeTab)) return;

    window.localStorage.setItem(TALENT_ACTIVE_TAB_STORAGE_KEY, activeTab);

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
    if (typeof window === "undefined") return;

    const restoreActiveTab = () => {
      const queryTab = new URLSearchParams(window.location.search).get("tab");
      const normalizedQueryTab = normalizeTalentTabId(queryTab);
      if (normalizedQueryTab) {
        setActiveTab(normalizedQueryTab);
        return;
      }

      const storedTab = window.localStorage.getItem(TALENT_ACTIVE_TAB_STORAGE_KEY);
      setActiveTab(normalizeTalentTabId(storedTab) || "dashboard");
    };

    window.addEventListener("pageshow", restoreActiveTab);
    window.addEventListener("popstate", restoreActiveTab);
    return () => {
      window.removeEventListener("pageshow", restoreActiveTab);
      window.removeEventListener("popstate", restoreActiveTab);
    };
  }, []);

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
      const chargerNotifications = async () => {
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("destinataire_id", user.id).eq("automated", false).eq("lu", false);
        setNbMessagesNonLus(count || 0);
      };
      const chargerMisesAJourCandidatures = async () => {
        const { data } = await supabase.from("candidatures").select("id, statut").eq("talent_id", user.id);
        const signals = readLocalSignalMap(candidatureSignalKey);
        const count = (data || []).filter((c: any) => c.statut && c.statut !== "envoyee" && signals[c.id] !== c.statut).length;
        setNbCandidaturesMaj(count);
      };
      const chargerDemandesDocuments = async () => {
        const { count } = await supabase
          .from("document_requests")
          .select("*", { count: "exact", head: true })
          .eq("talent_id", user.id)
          .eq("status", "requested");
        setNbDocumentsDemandes(count || 0);
      };
      chargerAvatar();
      chargerNotifications();
      chargerMisesAJourCandidatures();
      chargerDemandesDocuments();
      const interval = setInterval(() => {
        chargerNotifications();
        chargerMisesAJourCandidatures();
        chargerDemandesDocuments();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, candidatureSignalKey]);

  const marquerCandidaturesCommeVues = async () => {
    if (!user || !candidatureSignalKey) return;
    const { data } = await supabase.from("candidatures").select("id, statut").eq("talent_id", user.id);
    const nextSignals = (data || []).reduce((acc: Record<string, string>, candidature: any) => {
      acc[candidature.id] = candidature.statut || "envoyee";
      return acc;
    }, {});
    writeLocalSignalMap(candidatureSignalKey, nextSignals);
    setNbCandidaturesMaj(0);
  };

  if (loading) return (<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Chargement...</div>);

  return (
    <div className="dashboard-shell talent-dashboard-shell min-h-screen lg:flex">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className={`dashboard-sidebar talent-sidebar fixed inset-y-0 left-0 z-40 flex h-full w-[17rem] max-w-[86vw] flex-col transition-transform duration-300 lg:w-[220px] ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex items-center justify-between px-5 py-6">
          <a href="/" className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-primary">
            <Sparkles className="h-7 w-7 stroke-[1.7]" />
            <span>Spotted Talent</span>
          </a>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="rounded-xl border border-border/70 p-2 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} aria-current={activeTab === id ? "page" : undefined} onClick={() => { setActiveTab(id); setMobileNavOpen(false); if (id === "messagerie") setNbMessagesNonLus(0); if (id === "mes-candidatures") void marquerCandidaturesCommeVues(); }}
              className={`dashboard-nav-item min-h-[2.75rem] ${activeTab === id ? "dashboard-nav-item-primary-active" : ""}`}>
              <Icon className="h-[18px] w-[18px] stroke-[1.8]" />
              <span className="flex-1 text-left">{label}</span>
              {id === "messagerie" && nbMessagesNonLus > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{nbMessagesNonLus}</span>
              )}
              {id === "mes-candidatures" && nbCandidaturesMaj > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">{nbCandidaturesMaj}</span>
              )}
              {id === "documents" && nbDocumentsDemandes > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">{nbDocumentsDemandes}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-border/70 p-3">
          <div className="mb-2 hidden items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2 lg:flex">
            <span className="text-xs font-medium text-muted-foreground">Apparence</span>
            <ThemeToggle className="border-0 bg-transparent p-0 shadow-none [&_button]:h-7 [&_button]:w-7" />
          </div>
          <Button variant="ghost-glow" size="sm" className="w-full justify-start text-xs text-muted-foreground hover:text-foreground" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
          </Button>
        </div>
      </aside>
      <main className="dashboard-main talent-polish-shell min-h-screen flex-1 px-4 pb-8 pt-20 sm:px-6 lg:ml-[220px] lg:px-7 lg:py-6">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileNavOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-card/80 text-foreground shadow-sm transition-colors hover:border-primary/30"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Espace talent</p>
            <p className="truncate text-sm font-semibold text-foreground">{activeTabLabel}</p>
          </div>
          <ThemeToggle className="shrink-0 p-1 [&_button]:h-7 [&_button]:w-7" />
        </div>
        <div className="talent-page-frame" data-talent-tab={activeTab}>
          {activeTab === "dashboard" && <DashboardHome profile={profile} cvScore={cvScore} user={user} onNavigateTab={setActiveTab} />}
          {activeTab === "profile" && <ProfileTab profile={profile} user={user} avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />}
          {activeTab === "candidature" && <CandidatureHub userId={user?.id || ""} onScoreUpdate={setCvScore} />}
          {activeTab === "offres" && <OffresTab user={user} />}
          {activeTab === "offres-enregistrees" && <OffresTab user={user} savedOnly />}
          {activeTab === "mes-candidatures" && <MesCandidaturesTab user={user} />}
          {activeTab === "messagerie" && <MessagerieTab user={user} />}
          {activeTab === "documents" && <DocumentsTab />}
        </div>
      </main>
    </div>
  );
};

// ─── DashboardHome ────────────────────────────────────────────────────────────
const DashboardHome = ({ profile, cvScore, user, onNavigateTab }: any) => {
  const [stats, setStats] = useState({ candidatures: 0, acceptees: 0, refusees: 0, messages: 0, offres: 0, saved: 0, documentsDemandes: 0 });
  const [recentCandidatures, setRecentCandidatures] = useState<any[]>([]);
  const [recentOffres, setRecentOffres] = useState<any[]>([]);
  const [savedOffres, setSavedOffres] = useState<any[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<any[]>([]);

  useEffect(() => {
    const chargerStats = async () => {
      if (!user) return;
      const { data: cands } = await supabase
        .from("candidatures")
        .select("id, statut, created_at, offre:offre_id(titre, entreprise_id, contrat, localisation)")
        .eq("talent_id", user.id)
        .order("created_at", { ascending: false });
      const { count: msgs } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("destinataire_id", user.id).eq("automated", false).eq("lu", false);
      const { count: offres, data: offresData } = await supabase
        .from("offres")
        .select("*", { count: "exact" })
        .eq("statut", "active")
        .not("entreprise_id", "is", null)
        .order("priority_rank", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);
      const { count: documentsDemandes, data: documentRequests } = await supabase
        .from("document_requests")
        .select("*", { count: "exact" })
        .eq("talent_id", user.id)
        .eq("status", "requested")
        .order("requested_at", { ascending: false })
        .limit(4);
      const { count: saved, data: savedRows, error: savedOffersError } = await supabase
        .from("saved_offers")
        .select("offre_id, created_at, offre:offre_id(*)", { count: "exact" })
        .eq("talent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      const recentOffresWithProfiles = await attachEntrepriseProfilesToOffres(offresData || []);
      const localSavedOfferIds = readTalentSavedOfferIds(user.id);
      let savedOffersSource = (savedRows || [])
        .map((savedOffer: any) => savedOffer.offre ? { ...savedOffer.offre, saved_at: savedOffer.created_at } : null)
        .filter(Boolean);

      if (savedOffersError && localSavedOfferIds.length > 0) {
        const { data: localSavedOffers } = await supabase
          .from("offres")
          .select("*")
          .in("id", localSavedOfferIds.slice(0, 3))
          .eq("statut", "active");
        savedOffersSource = localSavedOffers || [];
      }

      const savedOffresWithProfiles = await attachEntrepriseProfilesToOffres(savedOffersSource);
      const candidatureOffresWithProfiles = await attachEntrepriseProfilesToOffres(
        (cands || []).map((candidature: any) => candidature.offre).filter(Boolean)
      );
      const profilesByEntrepriseId = new Map(candidatureOffresWithProfiles.map((offre: any) => [offre.entreprise_id, offre.entrepriseProfile]));

      setStats({
        candidatures: cands?.length || 0,
        acceptees: cands?.filter((c) => c.statut === "acceptee").length || 0,
        refusees: cands?.filter((c) => c.statut === "refusee").length || 0,
        messages: msgs || 0,
        offres: offres || 0,
        saved: savedOffersError ? localSavedOfferIds.length : (saved || 0),
        documentsDemandes: documentsDemandes || 0,
      });
      setRecentOffres(recentOffresWithProfiles);
      setSavedOffres(savedOffresWithProfiles);
      setPendingDocuments(documentRequests || []);
      setRecentCandidatures((cands || []).slice(0, 4).map((candidature: any) => ({
        ...candidature,
        offre: candidature.offre
          ? {
              ...candidature.offre,
              entrepriseProfile: profilesByEntrepriseId.get(candidature.offre.entreprise_id) || null,
            }
          : null,
      })));
    };

    chargerStats();
  }, [user]);

  const cvReady = cvScore !== null && cvScore !== undefined;
  const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  const displayName = formatStoredMessageText(
    profile?.prenom || profile?.full_name || user?.email?.split("@")[0] || "",
  ).trim() || "Talent";
  const firstName = displayName.split(/\s+/)[0];

  const profileCompletion = Math.round((
    [
      Boolean(profile?.full_name || profile?.prenom || profile?.nom),
      Boolean(profile?.poste),
      Boolean(profile?.secteur),
      Boolean(profile?.localisation),
    ].filter(Boolean).length / 4
  ) * 100);
  const securityScore = Math.round(([
    emailVerified,
    profileCompletion >= 75,
    cvReady,
    true,
  ].filter(Boolean).length / 4) * 100);
  const nextAction = stats.documentsDemandes > 0
    ? {
        id: "documents",
        eyebrow: "Action prioritaire",
        title: `${stats.documentsDemandes} document${stats.documentsDemandes > 1 ? "s" : ""} à envoyer`,
        description: "Une entreprise attend une pièce pour poursuivre votre candidature.",
        button: "Traiter la demande",
        icon: FolderOpen,
        tone: "bg-orange-500/10 text-orange-500",
      }
    : stats.messages > 0
      ? {
          id: "messagerie",
          eyebrow: "Nouvel échange",
          title: `${stats.messages} message${stats.messages > 1 ? "s" : ""} à lire`,
          description: "Répondez rapidement pour garder le contact avec les recruteurs.",
          button: "Voir mes échanges",
          icon: MessageSquare,
          tone: "bg-fuchsia-500/10 text-fuchsia-500",
        }
      : profileCompletion < 100
        ? {
            id: "profile",
            eyebrow: "Profil à compléter",
            title: `Votre profil est complété à ${profileCompletion}%`,
            description: "Un profil précis aide les entreprises à mieux comprendre votre parcours.",
            button: "Compléter mon profil",
            icon: User,
            tone: "bg-primary/10 text-primary",
          }
        : !cvReady
          ? {
              id: "candidature",
              eyebrow: "Prochaine étape",
              title: "Analysez votre CV",
              description: "Obtenez un score et des conseils concrets avant votre prochaine candidature.",
              button: "Analyser mon CV",
              icon: FileText,
              tone: "bg-blue-500/10 text-blue-500",
            }
          : {
              id: "offres",
              eyebrow: "Tout est prêt",
              title: "Découvrez vos offres matchées",
              description: "Votre espace est à jour : vous pouvez passer aux opportunités disponibles.",
              button: "Voir les offres",
              icon: Target,
              tone: "bg-emerald-500/10 text-emerald-500",
            };
  const NextActionIcon = nextAction.icon;

  const getInitials = (value: string) => {
    const words = formatStoredMessageText(value)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    return words.map((word) => word.charAt(0).toUpperCase()).join("") || "ST";
  };

  const getDashboardStatusLabel = (status?: string) => {
    switch (status) {
      case "entretien": return "Entretien";
      case "acceptee": return "Acceptée";
      case "refusee": return "Refusée";
      case "envoyee":
      default:
        return "En attente";
    }
  };

  const getDashboardStatusClass = (status?: string) => {
    switch (status) {
      case "entretien": return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
      case "acceptee": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
      case "refusee": return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
      case "envoyee":
      default:
        return "border-primary/20 bg-primary/10 text-primary";
    }
  };

  const overviewCards = [
    {
      id: "mes-candidatures",
      title: "Candidatures",
      value: stats.candidatures,
      helper: stats.acceptees > 0 ? `${stats.acceptees} acceptée${stats.acceptees > 1 ? "s" : ""}` : "Suivre mes dossiers",
      icon: ClipboardList,
      tone: "bg-primary/10 text-primary",
    },
    {
      id: "offres",
      title: "Offres matchées",
      value: stats.offres,
      helper: "Sélectionnées pour vous",
      icon: Crosshair,
      tone: "bg-primary/10 text-primary",
    },
    {
      id: "candidature",
      title: "Score CV",
      value: cvReady ? `${cvScore}%` : "--",
      helper: cvReady ? "Très bon" : "Analyse à lancer",
      icon: Target,
      tone: "bg-primary/10 text-primary",
    },
    {
      id: "messagerie",
      title: "Échanges non lus",
      value: stats.messages,
      helper: stats.messages > 0 ? "Réponses reçues" : "Échanges à jour",
      icon: MessageSquare,
      tone: "bg-primary/10 text-primary",
    },
    {
      id: "profile",
      title: "Profil",
      value: `${profileCompletion}%`,
      helper: profileCompletion >= 100 ? "Profil complet" : "Complétion",
      icon: User,
      tone: "bg-primary/10 text-primary",
    },
    {
      id: "documents",
      title: "Documents",
      value: stats.documentsDemandes > 0 ? stats.documentsDemandes : "À jour",
      helper: stats.documentsDemandes > 0 ? "À envoyer" : "Protégés",
      icon: FolderOpen,
      tone: "bg-orange-500/10 text-orange-500",
    },
    {
      id: "offres-enregistrees",
      title: "Offres enregistrées",
      value: stats.saved,
      helper: "Retrouver mes favoris",
      icon: Heart,
      tone: "bg-fuchsia-500/10 text-fuchsia-500",
    },
    {
      id: "candidature",
      title: "Lettre de motivation",
      value: "IA",
      helper: "Génération assistée",
      icon: Mail,
      tone: "bg-sky-500/10 text-sky-500",
    },
    {
      id: "documents",
      title: "Sécurité",
      value: `${securityScore}%`,
      helper: emailVerified ? "Compte vérifié" : "À finaliser",
      icon: ShieldCheck,
      tone: "bg-emerald-500/10 text-emerald-500",
    },
  ];

  const documentsPreview = pendingDocuments.length > 0
    ? pendingDocuments.slice(0, 4).map((request: any) => ({
        title: request.document_label || REQUESTABLE_DOCUMENTS.find((document) => document.key === request.document_key)?.label || "Document demandé",
        helper: request.requested_at ? `Demandé le ${new Date(request.requested_at).toLocaleDateString("fr-FR")}` : "Demandé par une entreprise",
        status: "À envoyer",
        tone: "text-amber-600 dark:text-amber-300",
      }))
    : [
        { title: "Pièce d'identité", helper: "À préparer si une entreprise la demande", status: "Privé", tone: "text-emerald-600 dark:text-emerald-300" },
        { title: "CV", helper: cvReady ? "Analyse disponible" : "Analyse à lancer", status: cvReady ? "À jour" : "À faire", tone: cvReady ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300" },
        { title: "Justificatif", helper: "Ne sera envoyé qu'après validation", status: "Sécurisé", tone: "text-primary" },
      ];

  return (
    <div className="talent-dashboard-mock talent-tab-shell space-y-4 sm:space-y-5">
      <section className="talent-welcome-panel p-0">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-2xl font-bold leading-tight">Dashboard candidat</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Bienvenue {firstName}, voici votre activité et vos opportunités.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
            <Button type="button" variant="ghost-glow" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Actualiser
            </Button>
            <span>Dernière mise à jour : maintenant</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </section>

      <section className="talent-dashboard-kpis grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={`${card.id}-${card.title}`}
              type="button"
              className="talent-overview-card"
              onClick={() => onNavigateTab(card.id)}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{card.title}</span>
                <span className="mt-1 block text-2xl font-bold text-foreground">{card.value}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{card.helper}</span>
              </span>
              <ChevronDown className="-rotate-90 h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </section>

      <div className="talent-dashboard-grid grid gap-4 xl:grid-cols-5">
        <section className="talent-section-card p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Mes candidatures</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Suivez l'avancement de vos dossiers.</p>
            </div>
            <Button variant="ghost-glow" size="sm" onClick={() => onNavigateTab("mes-candidatures")}>Voir tout</Button>
          </div>
          <div className="space-y-3">
            {recentCandidatures.length > 0 ? recentCandidatures.map((candidature) => {
              const companyName = getEntrepriseDisplayName(candidature.offre || {});
              return (
                <button key={candidature.id} type="button" className="talent-row-card" onClick={() => onNavigateTab("mes-candidatures")}>
                  <span className="talent-brand-avatar bg-primary/10 text-primary">{getInitials(companyName)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{candidature.offre?.titre || "Candidature"}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{companyName} · {formatDateRelative(candidature.created_at)}</span>
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getDashboardStatusClass(candidature.statut)}`}>
                    {getDashboardStatusLabel(candidature.statut)}
                  </span>
                </button>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-5 text-center">
                <p className="text-sm font-semibold text-foreground">Aucune candidature pour le moment</p>
                <p className="mt-1 text-xs text-muted-foreground">Consultez les offres matchées pour commencer.</p>
              </div>
            )}
          </div>
        </section>

        <section className="talent-section-card p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Offres matchées</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Les annonces les plus récentes.</p>
            </div>
            <Button variant="ghost-glow" size="sm" onClick={() => onNavigateTab("offres")}>Voir toutes</Button>
          </div>
          <div className="space-y-3">
            {recentOffres.length > 0 ? recentOffres.map((offre) => {
              const companyName = getEntrepriseDisplayName(offre);
              return (
                <button key={offre.id} type="button" className="talent-row-card" onClick={() => onNavigateTab("offres")}>
                  <span className="talent-brand-avatar bg-emerald-500/10 text-emerald-500">{getInitials(companyName)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{formatStoredMessageText(offre.titre) || "Offre"}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{companyName} · {formatOfferField(offre.localisation, "Localisation à préciser")}</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">{formatDateRelative(offre.created_at)}</span>
                </button>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-5 text-center">
                <p className="text-sm font-semibold text-foreground">Aucune offre active</p>
                <p className="mt-1 text-xs text-muted-foreground">Les prochaines offres apparaîtront ici.</p>
              </div>
            )}
          </div>
        </section>

        <section className="talent-section-card p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-orange-500" />
                <h2 className="text-base font-bold text-foreground">Documents à vérifier</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Rien n'est envoyé sans votre action.</p>
            </div>
            <Button variant="ghost-glow" size="sm" onClick={() => onNavigateTab("documents")}>Gérer</Button>
          </div>
          <div className="space-y-3">
            {documentsPreview.map((document) => (
              <button key={`${document.title}-${document.status}`} type="button" className="talent-row-card" onClick={() => onNavigateTab("documents")}>
                <span className="talent-brand-avatar bg-orange-500/10 text-orange-500">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{document.title}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{document.helper}</span>
                </span>
                <span className={`text-xs font-semibold ${document.tone}`}>{document.status}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="talent-section-card p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Offres enregistrées</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Vos offres mises de côté.</p>
            </div>
            <Button variant="ghost-glow" size="sm" onClick={() => onNavigateTab("offres-enregistrees")}>Voir toutes</Button>
          </div>
          <div className="space-y-3">
            {savedOffres.length > 0 ? savedOffres.map((offre) => {
              const companyName = getEntrepriseDisplayName(offre);
              return (
                <button key={offre.id} type="button" className="talent-row-card" onClick={() => onNavigateTab("offres-enregistrees")}>
                  <span className="talent-brand-avatar bg-primary/10 text-primary">{getInitials(companyName)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{formatStoredMessageText(offre.titre) || "Offre"}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{companyName} · {formatOfferField(offre.localisation, "Localisation à préciser")}</span>
                  </span>
                  <Heart className="h-4 w-4 fill-primary text-primary" />
                </button>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-5 text-center">
                <p className="text-sm font-semibold text-foreground">Aucune offre enregistrée</p>
                <button type="button" className="mt-2 text-xs font-semibold text-primary" onClick={() => onNavigateTab("offres")}>
                  Découvrir les offres
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="talent-security-ribbon p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Votre espace est sécurisé</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Vos données restent privées. Aucun document n'est transmis à une entreprise sans votre validation.
              </p>
            </div>
          </div>
          {[
            { id: "profile", title: emailVerified ? "E-mail vérifié" : "E-mail à vérifier", text: `Profil complété à ${profileCompletion}%`, icon: CheckCircle },
            { id: "documents", title: "Documents privés", text: "Partage après validation", icon: ShieldCheck },
            { id: "profile", title: "Vous gardez le contrôle", text: "Réglages à tout moment", icon: User },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.title} type="button" className="talent-security-action" onClick={() => onNavigateTab(item.id)}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-foreground">{item.title}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{item.text}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// ─── ProfileTab ───────────────────────────────────────────────────────────────
const ProfileTab = ({ profile, user, avatarUrl, setAvatarUrl }: any) => {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [poste, setPoste] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [adresse, setAdresse] = useState("");
  const [contrat, setContrat] = useState("CDI");
  const [secteur, setSecteur] = useState("");
  const [competences, setCompetences] = useState("");
  const [bio, setBio] = useState("");
  const [availabilityType, setAvailabilityType] = useState<TalentAvailabilityType>("");
  const [availabilityDetail, setAvailabilityDetail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [telephone2, setTelephone2] = useState("");
  const [showTel2, setShowTel2] = useState(false);
  const [notificationOffresEmail, setNotificationOffresEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const chargerProfil = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        const availability = parseTalentAvailabilityFromBio(data.bio || "");
        setPrenom(data.prenom || "");
        setNom(data.nom || "");
        setPoste(data.poste || "");
        setLocalisation(data.localisation || "");
        setAdresse(data.adresse || "");
        setContrat(data.contrat || "CDI");
        setSecteur(data.secteur || "");
        setCompetences(data.competences || "");
        setBio(availability.bio);
        setAvailabilityType(availability.type);
        setAvailabilityDetail(availability.detail);
        setTelephone(data.telephone || "");
        setTelephone2(data.telephone2 || "");
        setNotificationOffresEmail(data.notification_offres_email !== false);
        if (data.telephone2) setShowTel2(true);
      }
    };
    chargerProfil();
  }, [user]);

  const genererBio = async () => {
    if (!poste && !competences) return toast.error("Remplissez au moins le poste ou les compétences.");
    setGeneratingBio(true);
    try {
      const contenu = await requestAiContent("generate_bio", {
        poste,
        secteur,
        competences,
        localisation,
      });
      setBio(contenu);
      toast.success("Présentation générée !");
    } catch (err) { toast.error("Erreur lors de la génération."); } finally { setGeneratingBio(false); }
  };

  const sauvegarder = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: `${prenom} ${nom}`.trim(),
        prenom,
        nom,
        poste,
        localisation,
        adresse,
        contrat,
        secteur,
        competences,
        bio: buildTalentBioWithAvailability(bio, availabilityType, availabilityDetail),
        telephone,
        telephone2,
        notification_offres_email: notificationOffresEmail,
      }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profil sauvegardé !");
      setIsEditing(false);
    } catch (err: any) { toast.error(translateAppError(err?.message, "Impossible de sauvegarder le profil.")); } finally { setSaving(false); }
  };

  const completionScore = Math.round(
    ([prenom, nom, poste, localisation, adresse, contrat, secteur, competences, bio, telephone, availabilityType]
      .filter((value) => String(value || "").trim() !== "").length / 11) * 100,
  );
  const completionStatus =
    completionScore >= 80
      ? "Profil prêt à être consulté"
      : completionScore >= 50
        ? "Profil à renforcer"
        : "Profil à compléter";
  const availabilityLabel = availabilityType
    ? formatTalentAvailabilityLabel(availabilityType, availabilityDetail)
    : "À définir";
  const displayName = `${prenom} ${nom}`.trim() || profile?.full_name || user?.email?.split("@")[0] || "Talent";
  const displayInitials = displayName
    .split(/\s+/)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const competencesList = getCompetencesArray(competences).slice(0, 8);
  const profileFacts = [
    { label: "Poste visé", value: poste || "À préciser", icon: Target },
    { label: "Disponibilité", value: availabilityLabel, icon: CheckCircle },
    { label: "Contrat", value: contrat || "À définir", icon: FileText },
    { label: "Localisation", value: localisation || "À préciser", icon: MapPin },
  ];
  const profilePriorities = [
    { missing: !poste.trim(), title: "Projet professionnel", text: "Indiquez le poste que vous recherchez.", icon: Target },
    { missing: !adresse.trim() || !localisation.trim(), title: "Adresse", text: "Sélectionnez votre adresse complète.", icon: MapPin },
    { missing: getCompetencesArray(competences).length === 0, title: "Compétences", text: "Ajoutez vos compétences principales.", icon: CheckCircle },
    { missing: !bio.trim(), title: "Présentation", text: "Rédigez une courte présentation.", icon: Sparkles },
    { missing: !telephone.trim(), title: "Téléphone", text: "Ajoutez un numéro pour être contacté.", icon: User },
  ].filter((item) => item.missing).slice(0, 3);

  return (
    <div className="talent-workspace talent-tab-shell space-y-4 sm:space-y-5" data-profile-editing={isEditing}>
      <div className="talent-simple-page-heading">
        <div>
          <h1>Mon Profil</h1>
          <p>Gérez vos informations personnelles et professionnelles.</p>
        </div>
        <Button type="button" variant="ghost-glow" onClick={() => setIsEditing((current) => !current)}>
          <User className="mr-2 h-4 w-4" />
          {isEditing ? "Voir l'aperçu" : "Modifier mon profil"}
        </Button>
      </div>
      <section className="talent-profile-showcase overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-4 sm:p-5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <User className="h-3.5 w-3.5" />
              Mon profil
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-primary/25 bg-primary/10 shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">{displayInitials}</span>
                  )}
              </div>
                <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl border-2 border-background bg-primary text-white shadow-lg transition-colors hover:bg-primary/85">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !user) return; const ext = file.name.split(".").pop(); const path = `${user.id}/avatar.${ext}`; const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true }); if (!error) { const { data } = supabase.storage.from("avatars").getPublicUrl(path); setAvatarUrl(data.publicUrl + "?t=" + Date.now()); toast.success("Photo mise à jour !"); } }} />
              </label>
            </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
                <p className="mt-1 text-base text-muted-foreground">{poste || "Poste à préciser"}</p>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span className="flex min-w-0 items-center gap-2 rounded-2xl border border-border/60 bg-background/65 px-3 py-2">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{user?.email}</span>
                  </span>
                  <span className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/65 px-3 py-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{localisation || "Localisation à préciser"}</span>
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{contrat || "Contrat à définir"}</span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">{availabilityLabel}</span>
                  {secteur && <span className="rounded-full border border-border/60 bg-secondary/55 px-3 py-1 text-xs font-semibold text-muted-foreground">{secteur}</span>}
                </div>
              </div>
            </div>
          </div>

          <aside className="border-t border-border/60 bg-background/55 p-4 sm:p-5 xl:border-l xl:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Complétion du profil</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="text-4xl font-bold text-foreground">{completionScore}%</p>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{completionStatus}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-accent transition-all" style={{ width: `${completionScore}%` }} />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Ces informations seront visibles par les entreprises qui consultent votre candidature.
            </p>
          </aside>
        </div>
      </section>

      <div className="talent-profile-preview-only grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {profileFacts.map((fact) => {
          const Icon = fact.icon;
          return (
            <div key={fact.label} className="talent-overview-card">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{fact.label}</span>
                <span className="mt-1 block truncate text-base font-bold text-foreground">{fact.value}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="talent-profile-content-grid grid gap-4 lg:gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="talent-profile-summary space-y-4">
          <div className="talent-section-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Informations visibles</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Une vue claire de ce que le recruteur verra en premier.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/65 px-4 py-3">
                <span className="text-sm text-muted-foreground">E-mail</span>
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/65 px-4 py-3">
                <span className="text-sm text-muted-foreground">Téléphone</span>
                <span className="text-sm font-semibold text-foreground">{telephone || "À renseigner"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/65 px-4 py-3">
                <span className="text-sm text-muted-foreground">Secteur</span>
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">{secteur || "À préciser"}</span>
              </div>
            </div>
          </div>

          <div className="talent-section-card p-4 sm:p-5">
            <p className="text-sm font-semibold text-foreground">Compétences clés</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {competencesList.length > 0 ? (
                competencesList.map((competence) => (
                  <span key={competence} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {competence}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Ajoutez quelques compétences pour rendre le profil plus convaincant.</p>
              )}
            </div>
          </div>

          <div className="talent-section-card p-4 sm:p-5">
            <p className="text-sm font-semibold text-foreground">Sécurité du compte</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              E-mail confirmé, documents privés et double authentification disponible dans le bloc de sécurité.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">Compte vérifié</span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Documents protégés</span>
            </div>
          </div>
        </div>

        <div className="talent-profile-editor talent-section-card grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
            <div>
              <p className="text-lg font-semibold text-foreground">Compléter mon profil</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Avancez section par section. Les informations sont enregistrées uniquement lorsque vous cliquez sur « Sauvegarder ».
              </p>
            </div>
            <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Profil complété à {completionScore}%
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center gap-3 border-b border-border/60 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">1</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Identité et coordonnées</p>
                <p className="text-xs text-muted-foreground">Vos informations personnelles de contact.</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Prénom</label>
              <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50" placeholder="Ex: Jean" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Nom</label>
              <input value={nom} onChange={(e) => setNom(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50" placeholder="Ex: Dupont" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Votre email</label>
              <input defaultValue={user?.email || ""} disabled className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Téléphone principal</label>
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50" placeholder="Ex: 06 12 34 56 78" />
            </div>
            {!showTel2 ? (
              <button onClick={() => setShowTel2(true)} className="dashboard-inline-link">
                <Plus className="w-4 h-4" /> Ajouter un 2e numéro
              </button>
            ) : (
              <div>
                <label className="text-sm font-medium mb-1 block">Téléphone secondaire</label>
                <input value={telephone2} onChange={(e) => setTelephone2(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50" placeholder="Ex: 07 98 76 54 32" />
              </div>
            )}
            <div className="md:col-span-2 mt-2 flex items-center gap-3 border-b border-border/60 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">2</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Adresse</p>
                <p className="text-xs text-muted-foreground">Commencez à saisir, puis sélectionnez une proposition.</p>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Où habitez-vous ?</label>
              <AddressAutocompleteInput
                address={adresse}
                location={localisation}
                onAddressChange={setAdresse}
                onLocationChange={setLocalisation}
              />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Sélectionnez une adresse dans la liste pour remplir automatiquement la ville et le code postal.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Ville / code postal</label>
              <input
                value={localisation}
                onChange={(e) => setLocalisation(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                placeholder="Rempli automatiquement, modifiable si besoin"
              />
            </div>
            <div className="md:col-span-2 mt-2 flex items-center gap-3 border-b border-border/60 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">3</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Projet professionnel</p>
                <p className="text-xs text-muted-foreground">Précisez ce que vous recherchez pour améliorer les offres proposées.</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quel poste recherchez-vous ?</label>
              <input value={poste} onChange={(e) => setPoste(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50" placeholder="Ex: Chauffeur, Cuisinier..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type de contrat souhaité</label>
              <select value={contrat} onChange={(e) => setContrat(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"><option>CDI</option><option>CDI Cadre</option><option>CDD</option><option>CDD - Court terme (jusqu'à 3 mois)</option><option>CDD - Court terme (jusqu'à 6 mois)</option><option>CDD Renouvelable</option><option>Intérim</option><option>Freelance</option><option>Stage</option><option>Alternance</option><option>Contrat de professionnalisation</option><option>Contrat étudiant</option><option>Service civique</option><option>Intermittent</option></select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Disponibilité</label>
              <div className="grid gap-3 md:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)]">
                <select
                  value={availabilityType}
                  onChange={(e) => setAvailabilityType(e.target.value as TalentAvailabilityType)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                >
                  {TALENT_AVAILABILITY_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {availabilityType === "specific_date" ? (
                  <input
                    type="date"
                    value={availabilityDetail}
                    onChange={(e) => setAvailabilityDetail(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                  />
                ) : availabilityType === "custom" ? (
                  <input
                    value={availabilityDetail}
                    onChange={(e) => setAvailabilityDetail(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                    placeholder="Ex. : soirs et week-ends"
                  />
                ) : (
                  <div className="flex items-center rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm text-muted-foreground">
                    {availabilityType
                      ? formatTalentAvailabilityLabel(availabilityType, availabilityDetail)
                      : "Choisissez un rythme"}
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Secteur d'activité</label>
              <SecteurSelect value={secteur} onChange={setSecteur} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Vos compétences</label>
              <input value={competences} onChange={(e) => setCompetences(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50" placeholder="Ex: Conduite, Cuisine, Informatique..." />
            </div>
            <div className="md:col-span-2 mt-2 flex items-center gap-3 border-b border-border/60 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">4</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Présentation</p>
                <p className="text-xs text-muted-foreground">Expliquez simplement votre expérience et vos points forts.</p>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium block">Présentez-vous en quelques mots</label>
                <button onClick={genererBio} disabled={generatingBio} className="dashboard-inline-link">
                  <Sparkles className="w-3 h-3" />{generatingBio ? "Génération..." : "Générer avec l'IA"}
                </button>
              </div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 resize-none" placeholder="Ex : J'ai 5 ans d'expérience en livraison et je suis sérieux et ponctuel." />
            </div>
          </div>

          <aside className="space-y-4 xl:col-start-2 xl:row-start-2 xl:row-span-2">
            <div className="rounded-2xl border border-border/70 bg-background p-4 xl:sticky xl:top-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">À compléter en priorité</p>
              </div>
              <div className="mt-4 space-y-2">
                {profilePriorities.length > 0 ? profilePriorities.map((priority) => {
                  const Icon = priority.icon;
                  return (
                    <div key={priority.title} className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold text-foreground">{priority.title}</span>
                        <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{priority.text}</span>
                      </span>
                    </div>
                  );
                }) : (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Votre profil est complet</p>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Vous pouvez encore l’enrichir à tout moment.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-border/70 pt-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Vos informations restent privées</p>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Elles ne sont partagées que dans le cadre de vos candidatures.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 xl:col-start-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Alertes opportunités</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Recevez les nouvelles offres utiles pour votre profil.
                </p>
              </div>
              <Switch checked={notificationOffresEmail} onCheckedChange={setNotificationOffresEmail} />
            </div>
          </div>

          <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-end xl:col-span-2">
            <Button type="button" variant="ghost-glow" onClick={() => setIsEditing(false)}>
              Retour à l'aperçu
            </Button>
            <Button variant="glow" size="lg" className="sm:min-w-[230px]" onClick={sauvegarder} disabled={saving}>
              {saving ? "Sauvegarde en cours..." : "Sauvegarder mon profil"}
            </Button>
          </div>
        </div>
      </div>

      <div className="talent-profile-preview-only mt-2">
        <AccountSecurityPanel user={user} role="talent" />
      </div>
    </div>
  );
};

// ─── CVTab ────────────────────────────────────────────────────────────────────
const clampCvScore = (value: any, fallback = 0) => {
  const score = Number(value);
  if (Number.isNaN(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
};

const defaultCvCategories = [
  { nom: "Présentation", score: 50, explication: "La mise en page peut être plus lisible et plus rassurante." },
  { nom: "Contenu", score: 45, explication: "Le recruteur a besoin de plus d'informations concrètes sur votre parcours." },
  { nom: "Compétences", score: 40, explication: "Vos compétences doivent être plus visibles et mieux détaillées." },
  { nom: "Impact recruteur", score: 45, explication: "Votre valeur doit se comprendre plus vite à la lecture." },
];

const normalizeDetailedList = (value: any, fallbackTitle: string) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (typeof item === "string") return { titre: item.trim(), detail: "" };
      if (item && typeof item === "object") {
        const titre = String(item.titre ?? item.nom ?? item.label ?? `${fallbackTitle} ${index + 1}`).trim();
        const detail = String(item.detail ?? item.explication ?? item.description ?? "").trim();
        if (!titre && !detail) return null;
        return { titre: titre || `${fallbackTitle} ${index + 1}`, detail };
      }
      return null;
    })
    .filter(Boolean);
};

const normalizeStringList = (value: any) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return String(item.titre ?? item.nom ?? item.label ?? item.detail ?? item.explication ?? "").trim();
      }
      return "";
    })
    .filter(Boolean);
};

const normalizeCvCategories = (value: any, fallbackScore: number) => {
  if (!Array.isArray(value) || value.length === 0) {
    return defaultCvCategories.map((category) => ({
      ...category,
      score: clampCvScore(category.score + Math.round((fallbackScore - 50) / 3), category.score),
    }));
  }

  return value
    .map((item: any, index: number) => {
      if (!item || typeof item !== "object") return null;
      return {
        nom: String(item.nom ?? defaultCvCategories[index]?.nom ?? `Catégorie ${index + 1}`).trim(),
        score: clampCvScore(item.score, defaultCvCategories[index]?.score ?? fallbackScore),
        explication: String(
          item.explication ??
            item.detail ??
            item.description ??
            defaultCvCategories[index]?.explication ??
            "Cette catégorie peut encore être améliorée."
        ).trim(),
      };
    })
    .filter(Boolean);
};

const normalizeCvAnalysis = (raw: any) => {
  const scoreGlobal = clampCvScore(raw?.score_global, 0);
  const pointsForts = normalizeDetailedList(raw?.points_forts, "Point fort");
  const pointsFaibles = normalizeDetailedList(raw?.points_faibles ?? raw?.ameliorations, "Point faible");
  const actionsPrioritaires = normalizeStringList(raw?.ameliorations_prioritaires ?? raw?.ameliorations);
  const sectionsManquantes = normalizeStringList(raw?.sections_manquantes);
  const motsCles = normalizeStringList(raw?.mots_cles_a_ajouter);
  const exemplesAmelioration = Array.isArray(raw?.exemples_amelioration)
    ? raw.exemples_amelioration
        .map((item: any) => {
          if (!item || typeof item !== "object") return null;
          const avant = String(item.avant ?? "").trim();
          const apres = String(item.apres ?? "").trim();
          if (!avant && !apres) return null;
          return { avant, apres };
        })
        .filter(Boolean)
    : [];

  return {
    score_global: scoreGlobal,
    niveau: String(raw?.niveau ?? "").trim(),
    resume:
      String(raw?.resume ?? "").trim() ||
      "Votre CV a une base intéressante, mais il manque encore des détails pour bien convaincre un recruteur.",
    lecture_recruteur:
      String(raw?.lecture_recruteur ?? "").trim() ||
      "Un recruteur doit comprendre rapidement votre métier, votre expérience et ce que vous apportez.",
    categories: normalizeCvCategories(raw?.categories, scoreGlobal || 50),
    competences_detectees: normalizeStringList(raw?.competences_detectees),
    experiences_detectees: normalizeStringList(raw?.experiences_detectees),
    points_forts:
      pointsForts.length > 0
        ? pointsForts
        : [{ titre: "Base exploitable", detail: "Votre CV contient déjà une structure qui peut être nettement améliorée." }],
    points_faibles:
      pointsFaibles.length > 0
        ? pointsFaibles
        : [{ titre: "Manque de précision", detail: "Certaines expériences et compétences restent trop vagues." }],
    ameliorations_prioritaires:
      actionsPrioritaires.length > 0
        ? actionsPrioritaires
        : [
            "Ajoutez 2 ou 3 missions concrètes sous chaque expérience.",
            "Précisez les outils, logiciels, machines ou compétences que vous maîtrisez.",
            "Ajoutez une accroche claire en haut du CV pour expliquer votre objectif.",
          ],
    sections_manquantes: sectionsManquantes,
    mots_cles_a_ajouter: motsCles,
    exemples_amelioration: exemplesAmelioration,
    conseil_debutant:
      String(raw?.conseil_debutant ?? "").trim() ||
      "Même avec peu d'expérience, vous pouvez valoriser vos stages, missions, formations, permis, certifications et qualités utiles pour le poste.",
  };
};

const getSafeCvCategories = (categories: any) => {
  if (!Array.isArray(categories)) return [];
  return categories
    .filter((category) => category && typeof category === "object")
    .map((category, index) => ({
      nom: String(category.nom ?? `Catégorie ${index + 1}`).trim(),
      score: clampCvScore(category.score, 0),
      explication: String(category.explication ?? "").trim(),
    }))
    .filter((category) => category.nom);
};

const getCvStatus = (score: number) => {
  if (score >= 80) return { label: "CV tres solide", className: "bg-green-500/15 text-green-400 border border-green-500/25" };
  if (score >= 60) return { label: "Bonne base", className: "bg-blue-500/15 text-blue-400 border border-blue-500/25" };
  if (score >= 40) return { label: "Prometteur", className: "bg-amber-500/15 text-amber-400 border border-amber-500/25" };
  return { label: "A renforcer", className: "bg-red-500/15 text-red-400 border border-red-500/25" };
};

const getCvAnalysisErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";

  if (message === "cv_text_too_short") {
    return "Le texte du CV est trop court ou illisible. Utilisez un PDF texte, un fichier DOCX ou un fichier TXT.";
  }

  if (message === "task_not_allowed_for_account") {
    return "L'analyse CV est réservée aux comptes Talent.";
  }

  if (message === "ai_usage_limit_reached") {
    return "Limite d'analyses atteinte pour aujourd'hui. Réessayez plus tard.";
  }

  if (message === "ai_provider_rate_limited") {
    return "Le service IA est temporairement saturé. Réessayez dans quelques minutes.";
  }

  if (message === "ai_provider_unavailable" || message === "ai_service_unavailable") {
    return "Le service d'analyse IA est momentanément indisponible. Réessayez dans quelques minutes.";
  }

  if (message === "ai_response_invalid" || message === "Reponse IA invalide") {
    return "L'analyse IA a renvoyé une réponse invalide. Réessayez avec un CV plus lisible.";
  }

  return message || "Erreur lors de l'analyse.";
};

const parseCvAnalysisContent = (content: string) => {
  const withoutCodeFences = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const jsonMatch = withoutCodeFences.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("ai_response_invalid");

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    try {
      return JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, "$1"));
    } catch {
      throw new Error("ai_response_invalid");
    }
  }
};

type CandidatureCvContext = {
  fileName: string;
  cvText: string;
  analyse: any;
};

const CandidatureHub = ({ userId, onScoreUpdate }: { userId: string; onScoreUpdate: (score: number) => void }) => {
  const { profile } = useAuth();
  const [cvContext, setCvContext] = useState<CandidatureCvContext | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [poste, setPoste] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [targetEditorOpen, setTargetEditorOpen] = useState(false);
  const introStorageKey = userId ? `spotted-talent:candidature-intro-seen:${userId}` : "";

  useEffect(() => {
    const profileJob = String((profile as any)?.poste || "").trim();
    if (!poste && profileJob) setPoste(profileJob);
  }, [profile, poste]);

  useEffect(() => {
    if (!introStorageKey || typeof window === "undefined") return;
    setShowIntro(window.localStorage.getItem(introStorageKey) !== "1");
  }, [introStorageKey]);

  const dismissIntro = () => {
    if (introStorageKey && typeof window !== "undefined") {
      window.localStorage.setItem(introStorageKey, "1");
    }
    setShowIntro(false);
  };

  const score = Number(cvContext?.analyse?.score_global || 0);
  const targetReady = Boolean(poste.trim() && entreprise.trim());

  return (
    <div className="talent-tab-shell space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Ma candidature</h1>
          <p className="mt-1 text-sm text-muted-foreground">Optimisez votre CV et préparez une lettre adaptée à l'offre ciblée.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <p className="text-sm font-medium text-muted-foreground">Dossier prêt à <span className="font-bold text-primary">{score}%</span></p>
          <div className="h-9 w-9 rounded-full p-[4px]" style={{ background: `conic-gradient(hsl(var(--primary)) ${score}%, hsl(var(--secondary)) 0)` }}>
            <div className="h-full w-full rounded-full bg-background" />
          </div>
        </div>
      </div>

      <section className="dashboard-panel px-4 py-3 sm:px-5">
        {targetEditorOpen || !targetReady ? (
          <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardList className="h-5 w-5" /></div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Poste visé</label>
              <input value={poste} onChange={(event) => setPoste(event.target.value)} className="w-full rounded-xl border border-border bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary/50" placeholder="Ex. Développeur Full Stack" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Entreprise</label>
              <input value={entreprise} onChange={(event) => setEntreprise(event.target.value)} className="w-full rounded-xl border border-border bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary/50" placeholder="Ex. TechCorp" />
            </div>
            <Button variant="ghost-glow" size="sm" onClick={() => setTargetEditorOpen(false)} disabled={!targetReady}>Valider</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardList className="h-5 w-5" /></div>
              <p className="min-w-0 truncate text-sm"><span className="font-bold">Candidature ciblée</span><span className="text-muted-foreground"> — {poste} · {entreprise}</span></p>
            </div>
            <button type="button" onClick={() => setTargetEditorOpen(true)} className="whitespace-nowrap text-sm font-semibold text-primary hover:underline">Changer la cible</button>
          </div>
        )}
      </section>

      <div className="grid items-stretch gap-3 xl:grid-cols-[310px_minmax(0,1fr)]">
        <CVTab onScoreUpdate={onScoreUpdate} compact onAnalysisComplete={setCvContext} />
        <LettreTab
          compact
          cvContext={cvContext}
          controlledPoste={poste}
          controlledEntreprise={entreprise}
          onPosteChange={setPoste}
          onEntrepriseChange={setEntreprise}
        />
      </div>

      {showIntro && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="candidature-intro-title">
          <div className="w-full max-w-md rounded-[28px] border border-border bg-background p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <button type="button" onClick={dismissIntro} aria-label="Fermer l'explication" className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 id="candidature-intro-title" className="mt-5 text-xl font-bold">Préparez une candidature complète</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Cette rubrique réunit votre CV et votre lettre pour vous faire gagner du temps.</p>
            <div className="mt-5 space-y-3">
              {[
                ["1", "Ajoutez votre CV", "Lancez l'analyse seulement quand vous êtes prêt."],
                ["2", "Précisez le poste", "Indiquez le poste et l'entreprise que vous ciblez."],
                ["3", "Personnalisez la lettre", "Générez une base, corrigez-la, puis téléchargez le PDF."],
              ].map(([step, title, description]) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="glow" className="mt-5 w-full" onClick={dismissIntro}>J'ai compris, commencer</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const CVTab = ({ onScoreUpdate, compact = false, onAnalysisComplete }: any) => {
  const [fichier, setFichier] = useState<File | null>(null);
  const [analyse, setAnalyse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyserCV = async () => {
    if (!fichier) return toast.error("Ajoutez d'abord votre CV.");
    setLoading(true);
    try {
      const texte = await extractCvTextFromFile(fichier);
      const contenu = await requestAiContent("analyze_cv", { cvText: texte });
      const result = normalizeCvAnalysis(parseCvAnalysisContent(contenu));
      setAnalyse(result);
      onScoreUpdate(result.score_global);
      onAnalysisComplete?.({ fileName: fichier.name, cvText: texte, analyse: result });
      toast.success("CV analysé !");
    } catch (err) { toast.error(getCvAnalysisErrorMessage(err)); } finally { setLoading(false); }
  };

  const handleCvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] || null;
    if (nextFile) {
      const validationError = validateDocumentFile(nextFile);
      if (validationError) {
        toast.error(validationError);
        event.target.value = "";
        return;
      }
    }
    setFichier(nextFile);
    setAnalyse(null);
    onAnalysisComplete?.(null);
  };

  const cvStatus = analyse ? getCvStatus(analyse.score_global) : null;
  const safeCategories = getSafeCvCategories(analyse?.categories);
  const scoreGlobal = analyse?.score_global ?? 0;
  const strongestCategory = safeCategories.length > 0 ? [...safeCategories].sort((a: any, b: any) => b.score - a.score)[0] : null;
  const weakestCategory = safeCategories.length > 0 ? [...safeCategories].sort((a: any, b: any) => a.score - b.score)[0] : null;
  const actionsPrioritaires = analyse?.ameliorations_prioritaires || [];
  const pointsForts = analyse?.points_forts || [];
  const pointsFaibles = analyse?.points_faibles || [];
  const sectionsManquantes = analyse?.sections_manquantes || [];
  const motsCles = analyse?.mots_cles_a_ajouter || [];
  const getCompactCategory = (patterns: string[], fallbackIndex: number) =>
    safeCategories.find((category: any) => patterns.some((pattern) => normalizeSearchValue(category.nom || "").includes(pattern))) || safeCategories[fallbackIndex];
  const compactMetrics = [
    { label: "Expérience et compétences", category: getCompactCategory(["contenu", "experience", "competence"], 0), tone: "text-emerald-600 dark:text-emerald-300" },
    { label: "Lisibilité", category: getCompactCategory(["presentation", "lisibilite", "structure"], 1), tone: "text-amber-600 dark:text-amber-300" },
    { label: "Mots-clés", category: getCompactCategory(["mot", "competence"], 2), tone: "text-emerald-600 dark:text-emerald-300" },
  ].filter((item) => item.category);

  if (compact) {
    return (
      <section className="dashboard-panel flex min-h-[550px] flex-col p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">CV & analyse</h2>
          {cvStatus && <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${cvStatus.className}`}>{cvStatus.label}</span>}
        </div>

        <input id="candidature-cv-upload" type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={handleCvFileChange} />
        {fichier ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500"><FileText className="h-5 w-5" /></div>
            <p className="min-w-0 flex-1 truncate text-xs font-semibold">{fichier.name}</p>
            <button type="button" onClick={() => document.getElementById("candidature-cv-upload")?.click()} className="rounded-lg border border-primary/30 px-2.5 py-1.5 text-[11px] font-semibold text-primary">Remplacer</button>
          </div>
        ) : (
          <button type="button" onClick={() => document.getElementById("candidature-cv-upload")?.click()} className="mt-3 flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/25 bg-primary/[0.04] px-4 py-4 text-center hover:border-primary/45">
            <Upload className="h-7 w-7 text-primary" />
            <p className="text-sm font-semibold">Déposer ou choisir mon CV</p>
            <p className="text-[11px] text-muted-foreground">PDF, DOCX ou TXT</p>
          </button>
        )}

        {analyse ? (
          <div className="mt-4 flex flex-1 flex-col">
            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full p-[9px]" style={{ background: `conic-gradient(hsl(var(--primary)) ${scoreGlobal}%, hsl(var(--secondary)) 0)` }}>
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-background">
                <span className="text-4xl font-bold">{scoreGlobal}<span className="text-2xl">%</span></span>
                <span className="mt-1 text-[11px] text-muted-foreground">Score global</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {compactMetrics.slice(0, 3).map(({ label, category, tone }) => (
                <details key={label} className="rounded-xl border border-border/70 bg-background/50 px-3 py-2.5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold">
                    <span>{label}</span><span className={tone}>{category.score}%</span>
                  </summary>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{category.explication}</p>
                </details>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-border/60 bg-secondary/10 px-4 py-7 text-center">
            <Target className="h-8 w-8 text-primary/35" />
            <p className="mt-3 text-sm font-semibold">Analyse requise</p>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">La lettre utilisera uniquement les compétences et expériences trouvées dans ce CV.</p>
          </div>
        )}

        <Button variant="glow" className="mt-3 w-full" onClick={analyserCV} disabled={!fichier || loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyse en cours..." : analyse ? "Relancer l'analyse" : "Analyser mon CV"}
        </Button>
      </section>
    );
  }

  return (
    <div className="talent-tab-shell space-y-4 sm:space-y-5">
      <TalentPageHeader
        icon={FileText}
        eyebrow="Analyse CV IA"
        title="Mon CV"
        description="Ajoutez votre CV pour obtenir un diagnostic clair, comprendre ce qu'un recruteur voit en premier et repérer les corrections utiles avant vos candidatures."
        aside={(
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Lecture rapide</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {analyse
                ? `${scoreGlobal}/100 - ${cvStatus?.label || "Analyse prête"}`
                : fichier
                  ? "Votre CV est prêt à être analysé"
                  : "Ajoutez un CV pour lancer l'analyse"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {analyse
                ? "Vous voyez ici vos points forts, vos axes d'amélioration et des formulations plus convaincantes."
                : "Le rendu reste simple à lire pour savoir tout de suite quoi renforcer et quoi garder."}
            </p>
          </div>
        )}
      />

      <div className="talent-metric-grid">
        <div className="dashboard-stat-card border border-primary/20 bg-primary/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Score global</p>
          <p className="mt-2 text-2xl font-bold">{analyse ? scoreGlobal : "--"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Synthèse immédiate de votre niveau actuel.</p>
        </div>
        <div className="dashboard-stat-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meilleur point</p>
          <p className="mt-2 text-lg font-bold text-foreground">{strongestCategory?.nom || "À venir"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {strongestCategory ? `${strongestCategory.score}/100` : "L'analyse le mettra en avant automatiquement."}
          </p>
        </div>
        <div className="dashboard-stat-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">À renforcer</p>
          <p className="mt-2 text-lg font-bold text-foreground">{weakestCategory?.nom || "À venir"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {weakestCategory ? `${weakestCategory.score}/100` : "Votre point faible principal ressortira ici."}
          </p>
        </div>
        <div className="dashboard-stat-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions prioritaires</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{actionsPrioritaires.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Conseils concrets à appliquer en premier.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
        <div className="space-y-4">
          <div
            className="dashboard-panel flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/20 p-5 text-center transition-colors hover:border-primary/40"
            onClick={() => document.getElementById("cv-upload")?.click()}
          >
            <input id="cv-upload" type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={(e) => {
              const nextFile = e.target.files?.[0] || null;
              if (nextFile) {
                const validationError = validateDocumentFile(nextFile);
                if (validationError) {
                  toast.error(validationError);
                  e.target.value = "";
                  return;
                }
              }
              setFichier(nextFile);
            }} />
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              {fichier ? <CheckCircle className="h-7 w-7 text-green-400" /> : <Upload className="h-7 w-7 text-primary" />}
            </div>
            <div>
              <p className="text-lg font-semibold">{fichier ? fichier.name : "Cliquez ici pour ajouter votre CV"}</p>
              <p className="mt-2 text-sm text-muted-foreground">Formats acceptés : PDF, Word ou texte simple</p>
            </div>
            <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              {fichier ? "Fichier prêt" : "Import rapide"}
            </span>
          </div>

          {fichier && (
            <Button variant="glow" size="lg" className="w-full" onClick={analyserCV} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Analyse en cours..." : "Analyser mon CV avec l'IA"}
            </Button>
          )}

          <div className="dashboard-subcard p-5">
            <p className="text-sm font-semibold">Ce que l'analyse va vous expliquer</p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>1. Ce que votre CV montre déjà bien à un recruteur.</p>
              <p>2. Ce qui manque ou reste trop flou.</p>
              <p>3. Ce que vous devez corriger en premier.</p>
              <p>4. Des exemples simples pour mieux formuler votre expérience.</p>
            </div>
          </div>

          <div className="dashboard-subcard p-5">
            <p className="text-sm font-semibold">Bon à savoir</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Le score ne juge pas votre valeur. Il indique surtout à quel point votre CV est facile à lire,
              rassurant et convaincant pour un recruteur en quelques secondes.
            </p>
          </div>
        </div>

        <div className="dashboard-panel p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold">Résultat de l'analyse</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Un rendu simple à comprendre pour améliorer votre CV sans vous perdre dans des détails techniques.
              </p>
            </div>
            {cvStatus && (
              <span className={`inline-flex w-fit whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${cvStatus.className}`}>
                {cvStatus.label}
              </span>
            )}
          </div>

          {analyse ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="dashboard-subcard border border-primary/20 bg-primary/5 p-5">
                  <p className="text-sm font-medium text-muted-foreground">Score global</p>
                  <div className="mt-3 flex items-end gap-3">
                    <p className="text-4xl font-bold gradient-text">{scoreGlobal}</p>
                    <p className="pb-1 text-sm text-muted-foreground">sur 100</p>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-background/60">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary via-sky-400 to-cyan-400" style={{ width: `${scoreGlobal}%` }} />
                  </div>
                </div>

                <div className="dashboard-subcard p-5">
                  <p className="mb-2 text-sm font-semibold">Résumé simple de votre CV</p>
                  <p className="text-sm leading-7 text-muted-foreground">{analyse.resume}</p>
                  <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Ce qu'un recruteur comprend</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{analyse.lecture_recruteur}</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-subcard p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Vue d'ensemble du CV</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Les points les plus forts et les plus faibles ressortent ici sans graphique compliqué.
                    </p>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {safeCategories.length} critères
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {safeCategories.map((category: any) => (
                    <div key={category.nom} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{category.nom}</p>
                        <span className="text-sm font-bold text-primary">{category.score}/100</span>
                      </div>
                      <div className="mb-3 h-2 overflow-hidden rounded-full bg-secondary">
                        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${category.score}%` }} />
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{category.explication}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="dashboard-subcard border border-green-500/15 bg-green-500/5 p-5">
                  <p className="mb-3 text-sm font-semibold text-green-400">Points forts</p>
                  <div className="space-y-3">
                    {pointsForts.map((point: any, index: number) => (
                      <div key={`${point.titre}-${index}`} className="rounded-xl bg-background/50 p-3">
                        <p className="text-sm font-medium">{point.titre}</p>
                        {point.detail && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{point.detail}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard-subcard border border-amber-500/15 bg-amber-500/5 p-5">
                  <p className="mb-3 text-sm font-semibold text-amber-400">Points faibles à corriger</p>
                  <div className="space-y-3">
                    {pointsFaibles.map((point: any, index: number) => (
                      <div key={`${point.titre}-${index}`} className="rounded-xl bg-background/50 p-3">
                        <p className="text-sm font-medium">{point.titre}</p>
                        {point.detail && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{point.detail}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="dashboard-subcard border border-primary/15 bg-primary/5 p-5">
                  <p className="mb-3 text-sm font-semibold text-primary">À faire en priorité</p>
                  <div className="space-y-2">
                    {actionsPrioritaires.map((action: string, index: number) => (
                      <p key={`${action}-${index}`} className="text-sm leading-relaxed text-muted-foreground">
                        {index + 1}. {action}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="dashboard-subcard p-5">
                  <p className="mb-3 text-sm font-semibold">Éléments à ajouter</p>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    {sectionsManquantes.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium text-foreground">Sections manquantes</p>
                        <p>{sectionsManquantes.join(" - ")}</p>
                      </div>
                    )}
                    {motsCles.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium text-foreground">Mots-clés utiles</p>
                        <p>{motsCles.join(" - ")}</p>
                      </div>
                    )}
                    {sectionsManquantes.length === 0 && motsCles.length === 0 && (
                      <p>L'analyse n'a pas détecté d'élément manquant prioritaire sur cette partie.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="dashboard-subcard border border-blue-500/15 bg-blue-500/5 p-5">
                <p className="mb-2 text-sm font-semibold text-blue-400">Conseil spécial débutant</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{analyse.conseil_debutant}</p>
              </div>
            </div>
          ) : (
            <div className="dashboard-empty-card">
              <FileText className="mb-3 h-12 w-12 text-primary/20" />
              <p className="text-base font-semibold text-foreground">Votre analyse apparaîtra ici</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Ajoutez votre CV puis lancez l'analyse pour voir un score lisible, vos points forts et vos priorités de correction.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Score matching ───────────────────────────────────────────────────────────
const calculerScore = (offre: any, profil: any): number => {
  if (!profil) return 0;
  let score = 0;
  if (offre.secteur && profil.secteur && offre.secteur.toLowerCase() === profil.secteur.toLowerCase()) score += 35;
  if (offre.contrat && profil.contrat && offre.contrat.toLowerCase() === profil.contrat.toLowerCase()) score += 25;
  if (offre.localisation && profil.localisation && offre.localisation.toLowerCase().includes(profil.localisation.toLowerCase())) score += 20;
  if (offre.permis_requis && profil.permis) {
    const permisOffre = offre.permis_requis.split(",").map((p: string) => p.trim().toLowerCase());
    const permisTalent = typeof profil.permis === "string" ? profil.permis.split(",").map((p: string) => p.trim().toLowerCase()) : (profil.permis || []).map((p: string) => p.toLowerCase());
    const matches = permisOffre.filter((p: string) => permisTalent.includes(p));
    if (permisOffre.length > 0) score += Math.round((matches.length / permisOffre.length) * 15);
  }
  if (offre.competences && profil.competences) {
    const motsOffre = offre.competences.toLowerCase().split(/[,\s]+/);
    const motsTalent = profil.competences.toLowerCase().split(/[,\s]+/);
    const matches = motsOffre.filter((m: string) => m.length > 2 && motsTalent.some((t: string) => t.includes(m) || m.includes(t)));
    if (matches.length > 0) score += Math.min(5, matches.length * 2);
  }
  return Math.min(100, score);
};

const getBadgeScore = (score: number) => {
  if (score >= 70) return { label: `${score}% match`, className: "bg-green-500/20 text-green-400 border border-green-500/30" };
  if (score >= 40) return { label: `${score}% match`, className: "bg-amber-500/20 text-amber-400 border border-amber-500/30" };
  return { label: `${score}% match`, className: "bg-secondary text-muted-foreground border border-border" };
};

// ─── OffresTab ────────────────────────────────────────────────────────────────
const OffresTab = ({ user, savedOnly = false }: any) => {
  const navigate = useNavigate();
  const [offres, setOffres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedOfferIds, setSavedOfferIds] = useState<string[]>([]);
  const [savedOffersLoaded, setSavedOffersLoaded] = useState(false);
  const [savingOfferId, setSavingOfferId] = useState<string | null>(null);
  const [filtre, setFiltre] = useState("Tous");
  const [recherche, setRecherche] = useState("");
  const [filtreSecteur, setFiltreSecteur] = useState("");
  const [filtreVille, setFiltreVille] = useState("");
  const [filtreDiplome, setFiltreDiplome] = useState("Tous");
  const [filtreSalaireMin, setFiltreSalaireMin] = useState("");
  const [filtreSalaireMax, setFiltreSalaireMax] = useState("");
  const [candidatures, setCandidatures] = useState<string[]>([]);
  const [postulant, setPostulant] = useState(false);
  const [offreOuverte, setOffreOuverte] = useState<string | null>(null);
  const [profilTalent, setProfilTalent] = useState<any>(null);
  const [applicationOffer, setApplicationOffer] = useState<any | null>(null);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const contrats = ["Tous", "CDI", "CDI Cadre", "CDD", "CDD - Court terme (jusqu'à 3 mois)", "CDD - Court terme (jusqu'à 6 mois)", "CDD Renouvelable", "Intérim", "Freelance", "Stage", "Alternance", "Contrat de professionnalisation", "Contrat étudiant", "Service civique", "Intermittent"];
  const diplomes = ["Tous", "Sans diplôme", "CAP", "BEP", "Bac Pro", "BTS", "Licence", "Master", "Doctorat"];

  useEffect(() => {
    void Promise.all([
      chargerOffres(),
      chargerCandidatures(),
      chargerProfil(),
      chargerOffresEnregistrees(),
    ]);
  }, [user]);

  useEffect(() => {
    const requestedOfferId = new URLSearchParams(window.location.search).get("offer");
    if (requestedOfferId && offres.some((offre) => offre.id === requestedOfferId)) {
      setOffreOuverte(requestedOfferId);
    }
  }, [offres]);

  const chargerOffres = async () => {
    const { data, error } = await supabase
      .from("offres")
      .select("*")
      .eq("statut", "active")
      .not("entreprise_id", "is", null)
      .order("priority_rank", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("offres_select_error", error);
      setOffres([]);
      setLoading(false);
      return;
    }
    setOffres(await attachEntrepriseProfilesToOffres(data || []));
    setLoading(false);
  };
  const chargerProfil = async () => { if (!user) return; const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single(); if (data) setProfilTalent(data); };
  const chargerCandidatures = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data } = await supabase.from("candidatures").select("offre_id").eq("talent_id", user.id); setCandidatures((data || []).map((c: any) => c.offre_id)); };
  const chargerOffresEnregistrees = async () => {
    if (!user) {
      setSavedOfferIds([]);
      setSavedOffersLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from("saved_offers")
      .select("offre_id")
      .eq("talent_id", user.id);
    if (error) {
      console.error("saved_offers_select_error", error);
      setSavedOfferIds(readTalentSavedOfferIds(user.id));
    } else {
      const remoteIds = (data || []).map((savedOffer) => savedOffer.offre_id);
      setSavedOfferIds(remoteIds);
      writeTalentSavedOfferIds(user.id, remoteIds);
    }
    setSavedOffersLoaded(true);
  };

  const toggleOffreEnregistree = async (offreId: string) => {
    if (!user || savingOfferId) return;
    const wasSaved = savedOfferIds.includes(offreId);
    setSavingOfferId(offreId);
    setSavedOfferIds((current) => (
      wasSaved ? current.filter((id) => id !== offreId) : [...current, offreId]
    ));

    const { error } = wasSaved
      ? await supabase
          .from("saved_offers")
          .delete()
          .eq("talent_id", user.id)
          .eq("offre_id", offreId)
      : await supabase
          .from("saved_offers")
          .insert({ talent_id: user.id, offre_id: offreId });

    if (error) {
      console.error("saved_offer_toggle_error", error);
      const localIds = wasSaved
        ? savedOfferIds.filter((id) => id !== offreId)
        : Array.from(new Set([...savedOfferIds, offreId]));
      setSavedOfferIds(localIds);
      writeTalentSavedOfferIds(user.id, localIds);
      toast.success(wasSaved ? "Offre retirée des favoris." : "Offre enregistrée sur cet appareil.");
    } else {
      const syncedIds = wasSaved
        ? savedOfferIds.filter((id) => id !== offreId)
        : Array.from(new Set([...savedOfferIds, offreId]));
      writeTalentSavedOfferIds(user.id, syncedIds);
      toast.success(wasSaved ? "Offre retirée des favoris." : "Offre enregistrée.");
    }
    setSavingOfferId(null);
  };

  const ouvrirProfilEntreprise = (offre: any) => {
    if (!offre?.entreprise_id) {
      toast.info("La fiche de cette entreprise n'est pas disponible.");
      return;
    }

    const sourceTab = savedOnly ? "offres-enregistrees" : "offres";
    const returnTo = `/talent/dashboard?tab=${sourceTab}&offer=${encodeURIComponent(offre.id)}`;
    navigate(`/entreprise/profil/${offre.entreprise_id}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const reinitialiserFiltres = () => {
    setRecherche("");
    setFiltre("Tous");
    setFiltreSecteur("");
    setFiltreVille("");
    setFiltreDiplome("Tous");
    setFiltreSalaireMin("");
    setFiltreSalaireMax("");
  };

  const postuler = async (offreId: string, responses: Array<{ questionId: string; question: string; answer: string }> = []) => {
    if (postulant) return;
    setPostulant(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setPostulant(false);
      return toast.error("Connectez-vous pour postuler.");
    }
    const { data: candidatureData, error } = await supabase.from("candidatures").insert({
      offre_id: offreId,
      talent_id: currentUser.id,
      statut: "envoyee",
      reponses_preselection: responses,
    }).select("id").single();
    if (error) {
      setPostulant(false);
      if (error.code === "23505") return toast.error("Vous avez déjà postulé à cette offre.");
      return toast.error("Une erreur est survenue pendant la candidature.");
    }
    setCandidatures(prev => [...prev, offreId]);
    setApplicationOffer(null);
    setScreeningAnswers({});
    toast.success("Candidature envoyée.");
    try {
      const { data: offreData } = await supabase.from("offres").select("titre, entreprise_id").eq("id", offreId).single();
      if (offreData && candidatureData?.id) {
        if (currentUser.email) await emailNouvelleCandiature(currentUser.email, candidatureData.id);
        if (offreData.entreprise_id) { const { data: ep } = await supabase.from("profiles").select("email").eq("user_id", offreData.entreprise_id).single(); if (ep?.email) await emailNotificationEntreprise(ep.email, candidatureData.id); }
      }
    } catch (err) { console.error("Erreur email:", err); } finally { setPostulant(false); }
  };

  const commencerCandidature = (offre: any) => {
    const questions = Array.isArray(offre.questions_preselection) ? offre.questions_preselection : [];
    if (questions.length === 0) {
      void postuler(offre.id);
      return;
    }
    setApplicationOffer(offre);
    setScreeningAnswers({});
  };

  const envoyerCandidatureAvecReponses = () => {
    if (!applicationOffer) return;
    const questions = Array.isArray(applicationOffer.questions_preselection) ? applicationOffer.questions_preselection : [];
    const missingRequired = questions.some((question: any) => question.required && !String(screeningAnswers[question.id] || "").trim());
    if (missingRequired) {
      toast.error("Répondez à toutes les questions obligatoires.");
      return;
    }
    const responses = questions.map((question: any) => ({
      questionId: question.id,
      question: question.label,
      answer: String(screeningAnswers[question.id] || "").trim(),
    }));
    void postuler(applicationOffer.id, responses);
  };

  const salaireMinRecherche = filtreSalaireMin ? Number(filtreSalaireMin) : null;
  const salaireMaxRecherche = filtreSalaireMax ? Number(filtreSalaireMax) : null;
  const rechercheNormalisee = normalizeSearchValue(recherche);
  const rechercheMotsSignificatifs = Array.from(
    new Set(
      rechercheNormalisee
        .split(/[\s,&-]+/)
        .filter((token) => token.length > 2 && !/^\d+$/.test(token))
    )
  );
  const filtreSecteurNormalise = normalizeSearchValue(filtreSecteur);
  const filtreVilleRequetes = extractLocationQueries(filtreVille);

  const secteursSuggestions = dedupeSuggestionOptions([
    ...SECTEURS,
    ...offres.map((offre: any) => offre.secteur),
  ]);

  const localisationSuggestions = dedupeSuggestionOptions([
    ...VILLES_SUGGESTIONS_FR,
    ...offres.flatMap((offre: any) => {
      const localisation = offre.localisation?.trim();
      if (!localisation) return [];
      return [
        { label: localisation, value: localisation, aliases: [localisation] },
        ...localisation
          .split(",")
          .map((part: string) => part.trim())
          .filter(Boolean)
          .map((part: string) => ({ label: part, value: part, aliases: [part, localisation] })),
      ];
    }),
    ...DEPARTEMENTS_FR.map((departement) => {
      const [code, ...nomParts] = departement.split(" - ");
      const nom = nomParts.join(" - ");
      return {
        label: departement,
        value: nom || departement,
        aliases: [departement, code, nom],
      };
    }),
  ]);

  const rechercheSuggestions = dedupeSuggestionOptions([
    ...offres.map((offre: any) => offre.titre),
    ...offres.map((offre: any) => getEntrepriseDisplayName(offre)),
    ...offres.map((offre: any) => offre.secteur),
    ...localisationSuggestions,
  ]);

  const offresFiltrees = offres
    .filter((offre) => !savedOnly || savedOfferIds.includes(offre.id))
    .filter(o => filtre === "Tous" || normalizeSearchValue(o.contrat || "") === normalizeSearchValue(filtre))
    .filter((o) => !filtreSecteurNormalise || normalizeSearchValue(o.secteur || "").includes(filtreSecteurNormalise))
    .filter((o) => {
      if (filtreVilleRequetes.length === 0) return true;
      const localisationNormalisee = normalizeSearchValue(o.localisation || "");
      return filtreVilleRequetes.some((requete) => localisationNormalisee.includes(requete));
    })
    .filter((o) => {
      if (filtreDiplome === "Tous") return true;
      const diplomeOffre = normalizeSearchValue(o.diplome || "");
      const diplomeFiltre = normalizeSearchValue(filtreDiplome);
      if (diplomeFiltre === normalizeSearchValue("Sans diplôme")) {
        return !o.diplome || diplomeOffre === normalizeSearchValue("Sans diplôme") || diplomeOffre === normalizeSearchValue("Sans diplome");
      }
      return diplomeOffre === diplomeFiltre;
    })
    .filter((o) => {
      const offreMin = o.salaire_min ?? o.salaire_max ?? null;
      const offreMax = o.salaire_max ?? o.salaire_min ?? null;
      if (salaireMinRecherche && offreMax !== null && offreMax < salaireMinRecherche) return false;
      if (salaireMaxRecherche && offreMin !== null && offreMin > salaireMaxRecherche) return false;
      if ((salaireMinRecherche || salaireMaxRecherche) && offreMin === null && offreMax === null) return false;
      return true;
    })
    .filter((o) => {
      if (!rechercheNormalisee) return true;
      const searchableText = [
        o.titre,
        o.description,
        o.localisation,
        o.competences,
        o.secteur,
        o.diplome,
        getEntrepriseDisplayName(o),
      ]
        .filter(Boolean)
        .map((value) => normalizeSearchValue(value))
        .join(" ");

      return (
        searchableText.includes(rechercheNormalisee) ||
        (rechercheMotsSignificatifs.length > 0 && rechercheMotsSignificatifs.every((mot) => searchableText.includes(mot)))
      );
    })
    .map(o => ({ ...o, _score: calculerScore(o, profilTalent) }))
    .sort((a, b) => (b.priority_rank || 0) - (a.priority_rank || 0) || b._score - a._score);

  // Compteurs bandeaux info
  const il7Jours = new Date(); il7Jours.setDate(il7Jours.getDate() - 7);
  const nbNouvellesAujourdhui = offres.filter(o => new Date(o.created_at) > new Date(new Date().setHours(0, 0, 0, 0))).length;
  const nbNouvellesSemaine = offres.filter(o => new Date(o.created_at) > il7Jours).length;
  const nbMatchsForts = offresFiltrees.filter((offre) => offre._score >= 70).length;
  const nbOffresUrgentes = offresFiltrees.filter((offre) => Boolean(offre.urgent)).length;
  const nbOffresAvecSalaire = offresFiltrees.filter((offre) => offre.salaire_min !== null || offre.salaire_max !== null).length;
  const meilleurScoreVisible = offresFiltrees.length > 0 ? Math.max(...offresFiltrees.map((offre) => offre._score)) : 0;
  const contratActif = filtre === "Tous" ? "Tous les contrats" : filtre;
  const OffersPageIcon = savedOnly ? Heart : Crosshair;

  return (
    <div className="talent-tab-shell space-y-4 sm:space-y-5">
      {applicationOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-labelledby="screening-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Avant d'envoyer votre candidature</p>
                <h3 id="screening-title" className="mt-2 text-xl font-bold">Questions pour {applicationOffer.titre}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Vos réponses seront transmises uniquement à l'entreprise concernée.</p>
              </div>
              <button
                type="button"
                onClick={() => { setApplicationOffer(null); setScreeningAnswers({}); }}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {(applicationOffer.questions_preselection || []).map((question: any, index: number) => (
                <div key={question.id}>
                  <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={`screening-${question.id}`}>
                    {index + 1}. {question.label} {question.required && <span className="text-red-400">*</span>}
                  </label>
                  <textarea
                    id={`screening-${question.id}`}
                    rows={3}
                    maxLength={1000}
                    value={screeningAnswers[question.id] || ""}
                    onChange={(event) => setScreeningAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    className="w-full resize-none rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm focus:border-primary/50 focus:outline-none"
                    placeholder="Votre réponse..."
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost-glow" onClick={() => { setApplicationOffer(null); setScreeningAnswers({}); }}>Annuler</Button>
              <Button type="button" variant="glow" disabled={postulant} onClick={envoyerCandidatureAvecReponses}>
                {postulant ? "Envoi..." : "Envoyer ma candidature"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <TalentPageHeader
        icon={OffersPageIcon}
        eyebrow={savedOnly ? "Vos favoris" : "Offres matchées"}
        title={savedOnly ? "Offres enregistrées" : "Offres matchées"}
        description={
          savedOnly
            ? "Retrouvez les offres mises de côté et postulez lorsque vous êtes prêt."
            : "Des offres sélectionnées pour vous selon votre profil et vos préférences."
        }
        aside={(
          <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
            <div className="talent-header-metric">
              <span>Visibles</span>
              <strong>{offresFiltrees.length}</strong>
            </div>
            <div className="talent-header-metric">
              <span>Meilleur match</span>
              <strong className="text-primary">{meilleurScoreVisible}%</strong>
            </div>
            <div className="talent-header-metric">
              <span>Avec salaire</span>
              <strong>{nbOffresAvecSalaire}</strong>
            </div>
          </div>
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="talent-filter-chip">{contratActif}</span>
          {nbNouvellesAujourdhui > 0 && <span className="talent-filter-chip text-emerald-600 dark:text-emerald-300">{nbNouvellesAujourdhui} aujourd'hui</span>}
          {nbNouvellesSemaine > 0 && <span className="talent-filter-chip text-blue-600 dark:text-blue-300">{nbNouvellesSemaine} cette semaine</span>}
          {nbOffresUrgentes > 0 && <span className="talent-filter-chip text-red-600 dark:text-red-300">{nbOffresUrgentes} urgente{nbOffresUrgentes > 1 ? "s" : ""}</span>}
        </div>
      </TalentPageHeader>

      <div className="dashboard-panel relative z-20 overflow-visible p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Search className="h-4 w-4 text-primary" />
              Recherche intelligente
            </div>
            <p className="text-sm text-muted-foreground">
              Tapez un poste, un secteur, une ville ou un code postal pour afficher les suggestions.
            </p>
          </div>
          <Button variant="ghost-glow" size="sm" onClick={reinitialiserFiltres}>
            Réinitialiser les filtres
          </Button>
        </div>

        <div className="mb-4 rounded-2xl border border-border/60 bg-secondary/10 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Recherche principale</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tapez un poste, un secteur, une ville ou un code postal pour aller droit au but.
              </p>
            </div>
            <div className="rounded-full border border-border/60 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
              {offresFiltrees.length} résultat(s)
            </div>
          </div>
          <AutocompleteFilter
            value={recherche}
            onChange={setRecherche}
            suggestions={rechercheSuggestions}
            placeholder="Rechercher un poste, un secteur, une ville ou un code postal..."
          />
          <p className="text-xs text-muted-foreground">
            Exemple : chauffeur, transport, Chambéry, 73000 ou Savoie.
          </p>
        </div>

        <div className="relative z-30 grid gap-3 md:grid-cols-2 xl:grid-cols-5 xl:items-start">
          <div className="dashboard-subcard space-y-1.5 p-3">
            <label className="block text-sm text-muted-foreground">Secteur d'activité</label>
            <AutocompleteFilter
              value={filtreSecteur}
              onChange={setFiltreSecteur}
              suggestions={secteursSuggestions}
              placeholder="Ex. Transport & Mobilité"
            />
          </div>
          <div className="dashboard-subcard space-y-1.5 p-3">
            <label className="block text-sm text-muted-foreground">Ville, dép. ou code postal</label>
            <LocationAutocompleteFilter
              value={filtreVille}
              onChange={setFiltreVille}
              suggestions={localisationSuggestions}
              placeholder="Tapez une ville ou un code postal..."
            />
          </div>
          <div className="dashboard-subcard space-y-1.5 p-3">
            <label className="block text-sm text-muted-foreground">Niveau de diplôme requis</label>
            <select
              value={filtreDiplome}
              onChange={(e) => setFiltreDiplome(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
            >
              {diplomes.map((diplome) => (
                <option key={diplome} value={diplome}>{diplome}</option>
              ))}
            </select>
          </div>
          <div className="dashboard-subcard space-y-1.5 p-3">
            <label className="block text-sm text-muted-foreground">Salaire minimum</label>
            <input
              value={filtreSalaireMin}
              onChange={(e) => setFiltreSalaireMin(e.target.value)}
              type="number"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
              placeholder="Ex. 1800"
            />
          </div>
          <div className="dashboard-subcard space-y-1.5 p-3">
            <label className="block text-sm text-muted-foreground">Salaire maximum</label>
            <input
              value={filtreSalaireMax}
              onChange={(e) => setFiltreSalaireMax(e.target.value)}
              type="number"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
              placeholder="Ex. 2500"
            />
          </div>
        </div>
      </div>

      <div className="dashboard-panel relative z-10 p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Type de contrat</p>
            <p className="text-xs text-muted-foreground">
              Sélectionnez un contrat pour affiner les offres affichées.
            </p>
          </div>
          <span className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-xs text-muted-foreground">
            Filtre actif : {contratActif}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {contrats.map((c) => (
            <button
              key={c}
              onClick={() => setFiltre(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                filtre === c
                  ? "bg-primary text-white shadow-[0_14px_34px_-22px_hsl(var(--primary)/0.75)]"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {loading || (savedOnly && !savedOffersLoaded) ? (
        <div className="dashboard-empty-card p-12">
          <p className="text-muted-foreground">
            {savedOnly ? "Chargement de vos offres enregistrées..." : "Chargement des offres..."}
          </p>
        </div>
      ) : offresFiltrees.length === 0 ? (
        <div className="dashboard-empty-card p-12">
          <OffersPageIcon className="mb-4 h-16 w-16 text-primary/30" />
          <h3 className="mb-2 text-lg font-bold">
            {savedOnly ? "Aucune offre enregistrée" : "Aucune offre trouvée"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {savedOnly
              ? "Enregistrez les offres qui vous intéressent depuis la rubrique Offres matchées."
              : "Essayez un autre mot-clé, un autre contrat ou une autre localisation."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {offresFiltrees.map((offre) => {
            const isAujourdhui = new Date(offre.created_at) > new Date(new Date().setHours(0, 0, 0, 0));
            const isApplied = candidatures.includes(offre.id);
            const badgeScore = getBadgeScore(offre._score);
            const competences = getCompetencesArray(offre.competences);
            const permis = getPermisArray(offre.permis_requis);
            const scoreBarClass =
              offre._score >= 70
                ? "from-emerald-400 via-cyan-400 to-sky-500"
                : offre._score >= 45
                  ? "from-amber-400 via-orange-400 to-yellow-500"
                  : "from-rose-400 via-orange-400 to-amber-500";
            return (
              <div
                key={offre.id}
                className={`dashboard-panel p-3 sm:p-4 transition-all duration-300 ${
                  offreOuverte === offre.id
                    ? "border-primary/40 shadow-[0_28px_70px_-52px_hsl(var(--primary)/0.45)]"
                    : "hover:-translate-y-0.5 hover:border-primary/20"
                }`}
              >
                <div>
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
                    <div>
                      <div className="space-y-2">
                        <div className="mb-2 flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-base">{formatOfferField(offre.titre, "Offre sans titre")}</h3>
                          {offre.urgent && (
                            <span className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_12px_28px_-18px_rgba(239,68,68,0.9)]">
                              URGENT
                            </span>
                          )}
                          {isAujourdhui && (
                            <span className="rounded-full border border-green-500/30 bg-green-500/15 px-2.5 py-1 text-[11px] font-medium text-green-400">
                              Nouveau
                            </span>
                          )}
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                            {formatOfferField(offre.contrat, "Contrat non précisé")}
                          </span>
                          {profilTalent && (
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeScore.className}`}>
                              {badgeScore.label}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => ouvrirProfilEntreprise(offre)}
                          className="mb-1.5 flex max-w-full items-center gap-1.5 text-left text-xs font-semibold text-foreground/85 transition-colors hover:text-primary"
                          aria-label={`Voir la page de ${getEntrepriseDisplayName(offre)}`}
                        >
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate">{getEntrepriseDisplayName(offre)}</span>
                        </button>

                        <div className="flex gap-3 text-xs text-muted-foreground mb-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {formatOfferField(offre.localisation, "Non précisé")}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <ClipboardList className="h-3.5 w-3.5" />
                            {formatDateRelative(offre.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 text-xs text-muted-foreground mb-1.5 flex-wrap">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {formatOfferField(offre.secteur, "Secteur non précisé")}</span>
                        {offre.salaire_min && offre.salaire_max && (
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {formatSalaireRange(offre.salaire_min, offre.salaire_max)}</span>
                        )}
                        {permis.length > 0 && (
                          <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Permis {permis.join(", ")}</span>
                        )}
                      </div>

                      {offre.avantages && (
                        <p className="text-xs text-green-400 mb-1.5 flex items-center gap-1 line-clamp-1">
                          <CheckCircle className="w-3 h-3 flex-shrink-0" />
                          {formatOfferField(offre.avantages)}
                        </p>
                      )}

                      <p className="text-xs leading-5 text-muted-foreground line-clamp-2">{getOfferDescriptionPreview(offre.description)}</p>
                    </div>
                    <div className="dashboard-subcard p-3 sm:p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Compatibilité</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{badgeScore.label}</p>
                        <span className="text-xl font-bold text-foreground">{offre._score}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
                        <div className={`h-full rounded-full bg-gradient-to-r ${scoreBarClass}`} style={{ width: `${Math.max(10, offre._score)}%` }} />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {isApplied ? "Candidature déjà envoyée." : "Offre disponible pour votre profil."}
                      </p>
                      <div className="mt-3 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
                        <Button className="h-7 justify-center text-xs" variant={isApplied ? "ghost-glow" : "glow"} size="sm" disabled={isApplied || postulant} onClick={() => commencerCandidature(offre)}>
                          {isApplied ? "Déjà postulé" : "Postuler"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost-glow"
                          size="sm"
                          className="h-7 justify-center text-xs"
                          disabled={savingOfferId === offre.id}
                          onClick={() => void toggleOffreEnregistree(offre.id)}
                        >
                          <Heart className={`mr-1 h-3.5 w-3.5 ${savedOfferIds.includes(offre.id) ? "fill-primary text-primary" : ""}`} />
                          {savedOfferIds.includes(offre.id) ? "Enregistrée" : "Enregistrer"}
                        </Button>
                        <Button variant="ghost-glow" size="sm" className="h-7 justify-center text-xs" onClick={() => setOffreOuverte(offreOuverte === offre.id ? null : offre.id)}>
                          {offreOuverte === offre.id ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" />
                              Réduire la fiche
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" />
                              Voir l'offre complète
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {offreOuverte === offre.id && (
                    <div className="mt-3 rounded-xl border border-accent/15 bg-secondary/20 p-3">
                      <div className="mb-3 overflow-hidden rounded-xl border border-border/60 bg-background/70">
                        <button
                          type="button"
                          className="block w-full"
                          onClick={() => ouvrirProfilEntreprise(offre)}
                          aria-label={`Voir la page de ${getEntrepriseDisplayName(offre)}`}
                        >
                          <CompanyCoverPreview companyId={offre.entreprise_id} className="h-28 w-full object-cover sm:h-36" />
                        </button>
                        <div className="p-3">
                          <button
                            type="button"
                            onClick={() => ouvrirProfilEntreprise(offre)}
                            className="flex w-full flex-wrap items-center gap-2 rounded-lg text-left transition-colors hover:text-primary"
                            aria-label={`Ouvrir la page entreprise ${getEntrepriseDisplayName(offre)}`}
                          >
                            <Building2 className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">{getEntrepriseDisplayName(offre)}</p>
                            {offre.entrepriseProfile?.secteur && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                {formatOfferField(offre.entrepriseProfile.secteur)}
                              </span>
                            )}
                            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                              Voir l'entreprise
                              <ChevronDown className="-rotate-90 h-3.5 w-3.5" />
                            </span>
                          </button>
                          {offre.entrepriseProfile?.bio && (
                            <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                              {formatOfferField(offre.entrepriseProfile.bio)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="dashboard-subcard p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Entreprise</p>
                          <p className="mt-1 truncate text-xs font-semibold text-foreground">{getEntrepriseDisplayName(offre)}</p>
                        </div>
                        <div className="dashboard-subcard p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Secteur d'activité</p>
                          <p className="mt-1 text-xs font-semibold text-foreground">{formatOfferField(offre.secteur, "Non précisé")}</p>
                        </div>
                        <div className="dashboard-subcard p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Niveau de diplôme requis</p>
                          <p className="mt-1 text-xs font-semibold text-foreground">{formatOfferField(offre.diplome, "Non précisé")}</p>
                        </div>
                        <div className="dashboard-subcard p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Salaire brut mensuel</p>
                          <p className="mt-1 text-xs font-semibold text-foreground">{formatSalaireRange(offre.salaire_min, offre.salaire_max)}</p>
                        </div>
                        <div className="dashboard-subcard p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Localisation</p>
                          <p className="mt-1 text-xs font-semibold text-foreground">{formatOfferField(offre.localisation, "Non précisé")}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                        <div className="dashboard-subcard p-3">
                          <h4 className="mb-3 text-sm font-semibold text-foreground">L’essentiel de l’offre</h4>
                          <OfferDescription description={offre.description} compact />
                        </div>

                        <div className="space-y-4">
                          {competences.length > 0 && (
                            <div className="dashboard-subcard p-3">
                              <h4 className="mb-2 text-sm font-semibold text-foreground">Compétences requises</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {competences.map((competence, index) => (
                                  <span key={`${competence}-${index}`} className="rounded-full border border-border/60 bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                                    {competence}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {permis.length > 0 && (
                            <div className="dashboard-subcard p-3">
                              <h4 className="mb-2 text-sm font-semibold text-foreground">Permis demandés</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {permis.map((permit) => (
                                  <span key={permit} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                                    {permit}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {!isApplied && (
                            <Button variant="glow" className="h-8 w-full text-xs" disabled={postulant} onClick={() => postuler(offre.id)}>
                              Postuler à cette offre
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── MesCandidaturesTab ───────────────────────────────────────────────────────
const MesCandidaturesTab = ({ user }: any) => {
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offreOuverte, setOffreOuverte] = useState<string | null>(null);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [rechercheCandidature, setRechercheCandidature] = useState("");

  useEffect(() => { chargerCandidatures(); }, [user]);

  const chargerCandidatures = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("candidatures")
      .select("*, offre:offre_id(titre, entreprise_id, contrat, localisation, salaire_min, salaire_max, urgent, description, avantages, competences, permis_requis, diplome, secteur)")
      .eq("talent_id", user.id)
      .order("created_at", { ascending: false });
    const offresAvecProfils = await attachEntrepriseProfilesToOffres((data || []).map((candidature: any) => candidature.offre).filter(Boolean));
    const profilesByEntrepriseId = new Map(offresAvecProfils.map((offre: any) => [offre.entreprise_id, offre.entrepriseProfile]));
    setCandidatures((data || []).map((candidature: any) => ({
      ...candidature,
      offre: candidature.offre
        ? {
            ...candidature.offre,
            entrepriseProfile: profilesByEntrepriseId.get(candidature.offre.entreprise_id) || null,
          }
        : candidature.offre,
    })));
    setLoading(false);
  };

  const supprimerCandidature = async (id: string) => {
    await supabase.from("candidatures").delete().eq("id", id);
    setCandidatures(prev => prev.filter(c => c.id !== id));
    toast.success("Candidature supprimée.");
  };

  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case "acceptee": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "refusee": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "entretien": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "envoyee": return "En attente";
      case "entretien": return "En cours d'étude";
      case "acceptee": return "Acceptée";
      case "refusee": return "Refusée";
      default: return statut;
    }
  };

  const getStatutMessage = (statut: string) => {
    switch (statut) {
      case "entretien":
        return "Votre dossier est en cours d'étude. Consultez vos échanges pour répondre rapidement si l’entreprise vous contacte.";
      case "acceptee":
        return "Bonne nouvelle : votre candidature a été retenue. Vérifiez les documents à fournir et les prochains échanges.";
      case "refusee":
        return "Ce dossier est clôturé. Vous pouvez le conserver comme repère ou le retirer de votre suivi.";
      default:
        return "Votre candidature a bien été envoyée. L'entreprise n'a pas encore répondu.";
    }
  };

  if (loading) return <div className="text-muted-foreground">Chargement...</div>;

  const stats = {
    total: candidatures.length,
    enAttente: candidatures.filter((c) => c.statut === "envoyee").length,
    enCours: candidatures.filter((c) => c.statut === "entretien").length,
    acceptees: candidatures.filter((c) => c.statut === "acceptee").length,
    reponses: candidatures.filter((c) => c.statut !== "envoyee").length,
  };
  const tauxReponse = stats.total ? Math.round((stats.reponses / stats.total) * 100) : 0;
  const needle = rechercheCandidature.trim().toLowerCase();
  const candidaturesFiltrees = candidatures
    .filter((c) => filtreStatut === "tous" || c.statut === filtreStatut)
    .filter((c) => {
      if (!needle) return true;
      return [
        c.offre?.titre,
        c.offre?.contrat,
        c.offre?.localisation,
        c.offre?.secteur,
        c.offre?.diplome,
        getEntrepriseDisplayName(c.offre),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  const filtres = [
    { value: "tous", label: "Toutes", count: stats.total },
    { value: "envoyee", label: "En attente", count: stats.enAttente },
    { value: "entretien", label: "En cours", count: stats.enCours },
    { value: "acceptee", label: "Acceptées", count: stats.acceptees },
    { value: "refusee", label: "Refusées", count: candidatures.filter((c) => c.statut === "refusee").length },
  ];

  return (
    <div className="talent-tab-shell space-y-4 sm:space-y-5">
      <TalentPageHeader
        icon={ClipboardList}
        eyebrow="Suivi des candidatures"
        title="Mes candidatures"
        description="Suivez vos réponses, repérez les dossiers qui avancent et retrouvez chaque offre sans perdre le fil de votre recherche."
        aside={(
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Point de suivi</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {stats.acceptees > 0
                ? `${stats.acceptees} candidature${stats.acceptees > 1 ? "s" : ""} acceptée${stats.acceptees > 1 ? "s" : ""}`
                : stats.enCours > 0
                  ? `${stats.enCours} candidature${stats.enCours > 1 ? "s" : ""} en cours d'étude`
                  : "Aucune réponse reçue pour le moment"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {stats.acceptees > 0
                ? "Vos prochains échanges et vos documents liés à ces dossiers resteront faciles à retrouver ici."
                : "Dès qu'une entreprise répond, cette page devient votre point d'appui pour suivre l'avancement sans chercher dans plusieurs onglets."}
            </p>
          </div>
        )}
      />

      <div className="talent-metric-grid">
        <div className="dashboard-stat-card border border-primary/20 bg-primary/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Candidatures envoyées</p>
          <p className="mt-2 text-2xl font-bold">{stats.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tous vos dossiers en cours ou clôturés.</p>
        </div>
        <div className="dashboard-stat-card border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">En cours</p>
          <p className="mt-2 text-2xl font-bold text-blue-300">{stats.enCours}</p>
          <p className="mt-1 text-xs text-muted-foreground">Dossiers en mouvement chez les entreprises.</p>
        </div>
        <div className="dashboard-stat-card border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Acceptées</p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">{stats.acceptees}</p>
          <p className="mt-1 text-xs text-muted-foreground">Candidatures retenues à suivre de près.</p>
        </div>
        <div className="dashboard-stat-card border border-accent/20 bg-accent/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Taux de réponse</p>
          <p className="mt-2 text-2xl font-bold">{tauxReponse}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Entreprises ayant déjà répondu.</p>
        </div>
      </div>

      <div className="dashboard-panel p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="dashboard-subcard p-4">
            <p className="text-sm font-semibold text-foreground">Rechercher une candidature</p>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={rechercheCandidature}
                onChange={(e) => setRechercheCandidature(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 pl-10 text-sm focus:border-primary/40 focus:outline-none"
                placeholder="Titre d'offre, contrat, ville, secteur..."
              />
              {rechercheCandidature && (
                <button
                  onClick={() => setRechercheCandidature("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-subcard p-4">
            <p className="text-sm font-semibold text-foreground">Vue actuelle</p>
            <p className="mt-3 text-2xl font-bold">{candidaturesFiltrees.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              candidature{candidaturesFiltrees.length > 1 ? "s" : ""} affichée{candidaturesFiltrees.length > 1 ? "s" : ""} sur {stats.total}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filtres.map((filtre) => (
            <button
              key={filtre.value}
              type="button"
              onClick={() => setFiltreStatut(filtre.value)}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-all ${
                filtreStatut === filtre.value
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-secondary/70 text-muted-foreground hover:border-primary/25 hover:text-foreground"
              }`}
            >
              {filtre.label} ({filtre.count})
            </button>
          ))}
        </div>
      </div>

      {candidatures.length === 0 ? (
        <div className="dashboard-empty-card p-8">
          <ClipboardList className="w-16 h-16 text-primary/30 mb-4" />
          <h3 className="font-bold text-lg mb-2">Aucune candidature</h3>
          <p className="text-muted-foreground text-sm">Postulez à des offres pour les voir apparaître ici.</p>
        </div>
      ) : candidaturesFiltrees.length === 0 ? (
        <div className="dashboard-empty-card p-8">
          <Search className="w-16 h-16 text-primary/30 mb-4" />
          <h3 className="font-bold text-lg mb-2">Aucune candidature trouvée</h3>
          <p className="text-muted-foreground text-sm">Essayez un autre filtre ou une autre recherche pour retrouver le bon dossier.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidaturesFiltrees.map((c) => (
            <div key={c.id} className="dashboard-panel p-4 sm:p-5">
              <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-lg">{formatOfferField(c.offre?.titre, "Offre supprimée")}</h3>
                    {c.offre?.urgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">URGENT</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatutStyle(c.statut)}`}>{getStatutLabel(c.statut)}</span>
                  </div>
                  <div className="mb-2 flex max-w-full items-center gap-1.5 text-sm font-semibold text-foreground/85">
                    <Building2 className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{getEntrepriseDisplayName(c.offre)}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground flex-wrap mb-2">
                    {c.offre?.contrat && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {formatOfferField(c.offre.contrat)}</span>}
                    {c.offre?.localisation && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {formatOfferField(c.offre.localisation)}</span>}
                    {/* ✅ Date relative pour la candidature */}
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" /> Postulée {formatDateRelative(c.created_at).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60">
                      Secteur : {formatOfferField(c.offre?.secteur, "Non précisé")}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60">
                      Diplôme : {formatOfferField(c.offre?.diplome, "Non précisé")}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60">
                      Salaire : {formatSalaireRange(c.offre?.salaire_min, c.offre?.salaire_max)}
                    </span>
                  </div>
                  {offreOuverte === c.id && c.offre && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/70">
                        <CompanyCoverPreview companyId={c.offre.entreprise_id} className="h-28 w-full object-cover sm:h-36" />
                        <div className="p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">{getEntrepriseDisplayName(c.offre)}</p>
                            {c.offre.entrepriseProfile?.secteur && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                {formatOfferField(c.offre.entrepriseProfile.secteur)}
                              </span>
                            )}
                          </div>
                          {c.offre.entrepriseProfile?.bio && (
                            <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                              {formatOfferField(c.offre.entrepriseProfile.bio)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Entreprise</p>
                          <p className="mt-2 truncate text-sm font-semibold text-foreground">{getEntrepriseDisplayName(c.offre)}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Secteur d'activité</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatOfferField(c.offre.secteur, "Non précisé")}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Niveau de diplôme requis</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatOfferField(c.offre.diplome, "Non précisé")}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Salaire brut mensuel</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatSalaireRange(c.offre.salaire_min, c.offre.salaire_max)}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Localisation</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatOfferField(c.offre.localisation, "Non précisé")}</p>
                        </div>
                      </div>
                      {c.offre.avantages && (
                        <div className="dashboard-subcard p-4">
                          <p className="text-xs font-medium text-green-400 mb-1">Avantages</p>
                          <p className="text-sm text-muted-foreground leading-6">{formatOfferField(c.offre.avantages)}</p>
                        </div>
                      )}
                      {getPermisArray(c.offre.permis_requis).length > 0 && (
                        <div className="dashboard-subcard p-4">
                          <p className="text-xs font-medium text-amber-400 mb-1">Permis requis</p>
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {getPermisArray(c.offre.permis_requis).map((p: string) => (
                              <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {getCompetencesArray(c.offre.competences).length > 0 && (
                        <div className="dashboard-subcard p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Compétences requises</p>
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {getCompetencesArray(c.offre.competences).map((comp: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60">{comp}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {c.offre.description && (
                        <div className="dashboard-subcard p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                          <div className="mt-3 rounded-lg bg-secondary/30 p-4"><OfferDescription description={c.offre.description} compact /></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="dashboard-subcard p-4 sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Suivi du dossier</p>
                  <p className="mt-3 text-sm font-semibold text-foreground">{getStatutLabel(c.statut)}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{getStatutMessage(c.statut)}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => setOffreOuverte(offreOuverte === c.id ? null : c.id)} className="dashboard-inline-link justify-center rounded-xl border border-primary/20 bg-primary/10 px-3 py-2">
                      {offreOuverte === c.id ? <><ChevronUp className="w-3 h-3" /> Réduire la fiche</> : <><ChevronDown className="w-3 h-3" /> Voir l'offre complète</>}
                    </button>
                  <ConfirmActionDialog
                    title="Supprimer cette candidature ?"
                    description="Cette candidature sera retirée de votre suivi. Vous pouvez encore changer d'avis avant validation."
                    onConfirm={() => supprimerCandidature(c.id)}
                  >
                    <button className="flex w-full items-center justify-center gap-1 rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-400 transition-colors hover:border-red-400/40 hover:text-red-300">
                      <Trash2 className="w-3 h-3" /> Supprimer
                    </button>
                  </ConfirmActionDialog>
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

// ─── MessagerieTab ────────────────────────────────────────────────────────────
const MessagerieTab = ({ user }: any) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [convActive, setConvActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [nouveau, setNouveau] = useState("");
  const [loading, setLoading] = useState(true);
  const [nonLusParConv, setNonLusParConv] = useState<Record<string, number>>({});
  const [statutsNonVusParConv, setStatutsNonVusParConv] = useState<Record<string, boolean>>({});
  const [rechercheConversation, setRechercheConversation] = useState("");
  const candidatureSignalKey = user ? `spotted-talent:talen-candidatures:${user.id}` : "";

  useEffect(() => { chargerConversations(); }, [user]);
  useEffect(() => { if (convActive) chargerMessages(convActive.id); }, [convActive]);
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      chargerConversations();
      if (convActive?.id) chargerMessages(convActive.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [user, convActive?.id]);

  const chargerConversations = async () => {
    if (!user) return;
    const { data: companyMessages } = await supabase
      .from("messages")
      .select("candidature_id, automated")
      .eq("destinataire_id", user.id);
    const openedCandidatureIds = Array.from(new Set(
      (companyMessages || [])
        .filter((message: any) => message.automated !== true)
        .map((message: any) => message.candidature_id)
        .filter(Boolean),
    ));

    if (openedCandidatureIds.length === 0) {
      setConversations([]);
      setConvActive(null);
      setNonLusParConv({});
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("candidatures")
      .select("*, offre:offre_id(titre, entreprise_id, contrat, localisation)")
      .eq("talent_id", user.id)
      .in("id", openedCandidatureIds)
      .order("created_at", { ascending: false });
    const offresAvecProfils = await attachEntrepriseProfilesToOffres((data || []).map((candidature: any) => candidature.offre).filter(Boolean));
    const profilesByEntrepriseId = new Map(offresAvecProfils.map((offre: any) => [offre.entreprise_id, offre.entrepriseProfile]));
    const conversationsData = (data || []).map((conversation: any) => ({
      ...conversation,
      offre: conversation.offre
        ? {
            ...conversation.offre,
            entrepriseProfile: profilesByEntrepriseId.get(conversation.offre.entreprise_id) || null,
          }
        : conversation.offre,
    }));
    setConversations(conversationsData);
    setConvActive((current: any) => current && conversationsData.some((conversation: any) => conversation.id === current.id) ? current : null);
    const counts: Record<string, number> = {};
    for (const c of conversationsData) {
      const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("candidature_id", c.id).eq("destinataire_id", user.id).eq("automated", false).eq("lu", false);
      counts[c.id] = count || 0;
    }
    setNonLusParConv(counts);
    const statusSignals = readLocalSignalMap(candidatureSignalKey);
    const statusFlags = conversationsData.reduce((acc: Record<string, boolean>, conversation: any) => {
      acc[conversation.id] = Boolean(conversation.statut && conversation.statut !== "envoyee" && statusSignals[conversation.id] !== conversation.statut);
      return acc;
    }, {});
    setStatutsNonVusParConv(statusFlags);
    setLoading(false);
  };

  const chargerMessages = async (candidatureId: string) => {
    const { data } = await supabase.from("messages").select("*").eq("candidature_id", candidatureId).order("created_at", { ascending: true });
    setMessages(data || []);
    await supabase.from("messages").update({ lu: true }).eq("candidature_id", candidatureId).eq("destinataire_id", user.id);
    setNonLusParConv(prev => ({ ...prev, [candidatureId]: 0 }));
  };

  const ouvrirConversation = (conversation: any) => {
    setConvActive(conversation);
    if (!candidatureSignalKey || !statutsNonVusParConv[conversation.id]) return;
    const statusSignals = readLocalSignalMap(candidatureSignalKey);
    statusSignals[conversation.id] = conversation.statut || "envoyee";
    writeLocalSignalMap(candidatureSignalKey, statusSignals);
    setStatutsNonVusParConv(prev => ({ ...prev, [conversation.id]: false }));
  };

  const envoyerMessage = async () => {
    if (!nouveau.trim() || !convActive) return;
    if (!canTalentReplyToExchange(messages, user.id, convActive.statut)) {
      toast.error(isCandidateExchangeClosed(convActive.statut)
        ? "Cette candidature est clôturée. L’échange est disponible en lecture seule."
        : "L’entreprise doit ouvrir l’échange avant que vous puissiez répondre.");
      return;
    }
    const { data: offre } = await supabase.from("offres").select("entreprise_id").eq("id", convActive.offre_id).single();
    if (!offre) return;
    const { error } = await supabase.from("messages").insert({ expedition_id: user.id, destinataire_id: offre.entreprise_id, candidature_id: convActive.id, contenu: nouveau.trim() });
    if (!error) {
      setNouveau("");
      chargerMessages(convActive.id);
      try {
        const { data: entrepriseProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", offre.entreprise_id)
          .maybeSingle();
        if (entrepriseProfile?.email) await emailNouveauMessage(entrepriseProfile.email, convActive.id);
      } catch (err) {
        console.error("Erreur email message:", err);
      }
    } else {
      toast.error(translateAppError(error.message, "Impossible d’envoyer votre réponse."));
    }
  };

  if (loading) return <div className="text-muted-foreground">Chargement...</div>;

  const totalNonLus = Object.values(nonLusParConv).reduce((sum, count) => sum + count, 0);
  const totalStatutsARevoir = Object.values(statutsNonVusParConv).filter(Boolean).length;
  const needle = rechercheConversation.trim().toLowerCase();
  const conversationsFiltrees = needle
    ? conversations.filter((conversation) => {
        const titre = String(conversation.offre?.titre || "").toLowerCase();
        const localisation = String(conversation.offre?.localisation || "").toLowerCase();
        const contrat = String(conversation.offre?.contrat || "").toLowerCase();
        const statut = String(conversation.statut || "").toLowerCase();
        const entreprise = String(getEntrepriseDisplayName(conversation.offre)).toLowerCase();
        return (
          titre.includes(needle) ||
          entreprise.includes(needle) ||
          localisation.includes(needle) ||
          contrat.includes(needle) ||
          statut.includes(needle)
        );
      })
    : conversations;
  const canReply = Boolean(convActive && canTalentReplyToExchange(messages, user.id, convActive.statut));
  const exchangeClosed = Boolean(convActive && isCandidateExchangeClosed(convActive.statut));

  return (
    <div className="talent-tab-shell space-y-4 sm:space-y-5">
      <TalentPageHeader
        icon={MessageSquare}
        eyebrow="Suivi des candidatures"
        title="Mes échanges"
        description="Répondez aux entreprises qui ont ouvert un échange au sujet de l’une de vos candidatures."
        aside={(
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">À suivre</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {totalNonLus > 0 ? `${totalNonLus} réponse${totalNonLus > 1 ? "s" : ""} à lire` : "Échanges à jour"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Vous pouvez répondre uniquement après le premier message envoyé par l’entreprise.
            </p>
          </div>
        )}
      />

      <div className="talent-metric-grid sm:grid-cols-3">
        <div className="dashboard-stat-card p-4 border border-primary/20 bg-primary/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Échanges ouverts</p>
              <p className="mt-2 text-2xl font-bold">{conversations.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Ouverts par les entreprises.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
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
        <div className="dashboard-stat-card p-4 border border-amber-500/20 bg-amber-500/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Statuts à vérifier</p>
              <p className="mt-2 text-2xl font-bold">{totalStatutsARevoir}</p>
              <p className="mt-1 text-xs text-muted-foreground">Candidatures mises à jour depuis votre dernier passage.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-200">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:h-[560px] lg:grid-cols-3 lg:gap-6">
        <div className={`dashboard-panel max-h-[360px] overflow-y-auto p-4 lg:max-h-none ${convActive ? "hidden lg:block" : ""}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Échanges de candidature</p>
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
              placeholder="Entreprise, offre ou statut..."
            />
          </div>
          {conversations.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-primary/25" />
              <p className="mt-3 text-sm font-semibold">Aucun échange pour le moment</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Une entreprise pourra vous contacter ici après avoir consulté votre candidature.</p>
            </div>
          ) : conversationsFiltrees.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun résultat.</p>
          ) : (
            conversationsFiltrees.map((c) => (
              <button key={c.id} onClick={() => ouvrirConversation(c)} className={`w-full text-left p-4 rounded-2xl border mb-2 transition-all ${convActive?.id === c.id ? "border-primary/25 bg-primary/12 shadow-[0_18px_42px_-30px_rgba(139,92,246,0.85)]" : "border-border/50 bg-secondary/25 hover:border-primary/20 hover:bg-secondary/60"}`}>
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{formatOfferField(c.offre?.titre, "Offre")}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{getEntrepriseDisplayName(c.offre)}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatOfferField(c.offre?.localisation)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {nonLusParConv[c.id] > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
                        {nonLusParConv[c.id]}
                      </span>
                    )}
                    {nonLusParConv[c.id] === 0 && statutsNonVusParConv[c.id] && (
                      <span className="h-3 w-3 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded-full inline-block ${c.statut === "acceptee" ? "bg-green-500/10 text-green-400" : c.statut === "refusee" ? "bg-red-500/10 text-red-400" : c.statut === "entretien" ? "bg-blue-500/10 text-blue-400" : "bg-primary/10 text-primary"}`}>
                  {c.statut === "envoyee" ? "En attente" : c.statut === "entretien" ? "En cours d'étude" : c.statut === "acceptee" ? "Acceptée" : c.statut === "refusee" ? "Refusée" : c.statut}
                </span>
                {nonLusParConv[c.id] > 0 && (
                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                    Nouveau message
                  </span>
                )}
                </div>
              </button>
            ))
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
                      className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground lg:hidden"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Retour aux candidatures
                    </button>
                    <h3 className="font-semibold">{convActive.offre?.titre}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{getEntrepriseDisplayName(convActive.offre)}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{convActive.offre?.localisation} - {convActive.offre?.contrat}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${convActive.statut === "acceptee" ? "bg-green-500/10 text-green-400" : convActive.statut === "refusee" ? "bg-red-500/10 text-red-400" : convActive.statut === "entretien" ? "bg-blue-500/10 text-blue-400" : "bg-primary/10 text-primary"}`}>
                    {convActive.statut === "envoyee" ? "En attente" : convActive.statut === "entretien" ? "En cours d'étude" : convActive.statut === "acceptee" ? "Acceptée" : convActive.statut === "refusee" ? "Refusée" : convActive.statut}
                  </span>
                </div>
              </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center"><MessageSquare className="w-12 h-12 text-primary/20 mb-3" /><p className="text-sm font-medium">En attente d'un message de l'entreprise</p><p className="mt-1 text-xs text-muted-foreground">L’entreprise doit envoyer le premier message pour ouvrir cet échange.</p></div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.expedition_id === user.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-sm ${m.expedition_id === user.id ? "bg-primary text-white shadow-[0_18px_45px_-36px_rgba(59,130,246,0.65)]" : "bg-secondary/60 border border-border/50"}`}>
                        {m.automated && <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">Message automatique</p>}
                        <p>{formatStoredMessageText(m.contenu)}</p>
                        <p className="mt-1 text-[11px] opacity-70">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {canReply && (
                <div className="border-t border-border/50 p-4">
                  <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input value={nouveau} onChange={(e) => setNouveau(e.target.value)} onKeyDown={(e) => e.key === "Enter" && envoyerMessage()} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none" placeholder="Répondre..." />
                      <Button className="w-full sm:w-auto" variant="glow" size="sm" onClick={envoyerMessage}><Send className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Envoyer</span></Button>
                    </div>
                  </div>
                </div>
              )}
              {!canReply && messages.length > 0 && (
                <div className="border-t border-border/50 p-4">
                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{exchangeClosed ? "Échange clôturé" : "En attente de l’entreprise"}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{exchangeClosed ? "Cette candidature est terminée. L’historique reste disponible en lecture seule." : "Vous pourrez répondre dès que l’entreprise aura ouvert cet échange avec un message."}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm"><div className="max-w-sm text-center"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="font-semibold text-foreground">Sélectionnez un échange</p><p className="mt-1 text-xs leading-5">Les entreprises initient les échanges depuis les candidatures qu’elles ont reçues.</p></div></div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DocumentsTab ─────────────────────────────────────────────────────────────
const DocumentsTab = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [sharedFolders, setSharedFolders] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showDocumentsIntro, setShowDocumentsIntro] = useState(false);
  const [documentsRequestsReady, setDocumentsRequestsReady] = useState(true);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [searchDossiers, setSearchDossiers] = useState("");
  const [pendingRequestedUploads, setPendingRequestedUploads] = useState<Record<string, File>>({});
  const [documentsView, setDocumentsView] = useState<"all" | "requests" | "shared">("all");
  const [showPersonalUpload, setShowPersonalUpload] = useState(false);
  const [personalUploadCategory, setPersonalUploadCategory] = useState("cv");
  const [showShareUpload, setShowShareUpload] = useState(false);
  const [shareUploadCategory, setShareUploadCategory] = useState("shared-contrat");
  const documentsIntroStorageKey = user?.id ? `spotted-talent:documents-intro-seen:${user.id}` : "";
  const personalCategories = [
    { id: "cv", label: "Mon CV", icon: FileText, desc: "Visible par le recruteur depuis votre candidature" },
    { id: "lettre", label: "Lettre de motivation", icon: Mail, desc: "Visible par le recruteur depuis votre candidature" },
  ];
  const sharedCategories = [
    { id: "shared-contrat", label: "Contrats", icon: FolderOpen, desc: "Contrats partagés entre vous et l'entreprise" },
    { id: "shared-fiche-paie", label: "Fiches de paie", icon: FolderOpen, desc: "Documents de paie partagés uniquement avec l'entreprise concernée" },
    { id: "shared-interim", label: "Documents d'intérim", icon: FolderOpen, desc: "Pièces liées à votre mission ou à votre suivi d'intérim" },
  ];
  useEffect(() => {
    if (!user) return;
    void chargerDocuments();
    const interval = window.setInterval(() => { void chargerDocuments(); }, 20000);
    return () => window.clearInterval(interval);
  }, [user]);
  useEffect(() => {
    if (!documentsIntroStorageKey || typeof window === "undefined") return;
    setShowDocumentsIntro(window.localStorage.getItem(documentsIntroStorageKey) !== "1");
  }, [documentsIntroStorageKey]);
  const dismissDocumentsIntro = () => {
    if (documentsIntroStorageKey && typeof window !== "undefined") {
      window.localStorage.setItem(documentsIntroStorageKey, "1");
    }
    setShowDocumentsIntro(false);
  };
  useEffect(() => {
    if (sharedFolders.length === 0) {
      setExpandedFolderId(null);
      return;
    }
    if (expandedFolderId && !sharedFolders.some((folder) => folder.id === expandedFolderId)) {
      setExpandedFolderId(null);
    }
  }, [sharedFolders, expandedFolderId]);
  const chargerDocuments = async () => {
    if (!user) return;
    const result: Record<string, any[]> = {};
    for (const cat of personalCategories) {
      const { data } = await supabase.storage.from("documents").list(`${user.id}/${cat.id}`);
      result[cat.id] = data || [];
    }
    setDocuments(result);

    const { data: candidatures } = await supabase
      .from("candidatures")
      .select("id, statut, offre:offre_id(titre, entreprise_id, contrat, localisation)")
      .eq("talent_id", user.id)
      .eq("statut", "acceptee")
      .order("created_at", { ascending: false });

    const candidatureIds = (candidatures || []).map((candidature: any) => candidature.id);
    const acceptedCandidatureIds = new Set(candidatureIds);
    const requestsByCandidature: Record<string, any[]> = {};
    if (candidatureIds.length > 0) {
      const { data: requests, error: requestsError } = await supabase
        .from("document_requests")
        .select("*")
        .eq("talent_id", user.id)
        .order("requested_at", { ascending: false });

      if (requestsError) {
        setDocumentsRequestsReady(false);
        console.error("document_requests_select_error", requestsError);
      } else {
        setDocumentsRequestsReady(true);
        (requests || []).filter((request: any) => acceptedCandidatureIds.has(request.candidature_id)).forEach((request: any) => {
          if (!requestsByCandidature[request.candidature_id]) requestsByCandidature[request.candidature_id] = [];
          requestsByCandidature[request.candidature_id].push(request);
        });
      }
    } else {
      setDocumentsRequestsReady(true);
    }

    const dossiers = await Promise.all((candidatures || []).map(async (candidature: any) => {
      let entrepriseNom = "Entreprise";
      if (candidature.offre?.entreprise_id) {
        const { data: profilEntreprise } = await supabase
          .from("profiles")
          .select("company_name, full_name")
          .eq("user_id", candidature.offre.entreprise_id)
          .maybeSingle();
        entrepriseNom = profilEntreprise?.company_name || profilEntreprise?.full_name || "Entreprise";
      }

      const categories = await Promise.all(sharedCategories.map(async (cat) => {
        const { data: ownDocs } = await supabase.storage.from("documents").list(`${user.id}/${cat.id}/${candidature.id}`);
        let partnerDocs: any[] = [];

        if (candidature.offre?.entreprise_id) {
          const { data } = await supabase.storage.from("documents").list(`${candidature.offre.entreprise_id}/${cat.id}/${candidature.id}`);
          partnerDocs = data || [];
        }

        return {
          ...cat,
          ownDocs: (ownDocs || []).map((doc) => ({ ...doc, ownerId: user.id, sender: "talent" })),
          partnerDocs: (partnerDocs || []).map((doc) => ({ ...doc, ownerId: candidature.offre?.entreprise_id, sender: "entreprise" })),
        };
      }));

      return {
        ...candidature,
        entrepriseNom,
        categories,
        documentRequests: requestsByCandidature[candidature.id] || [],
      };
    }));

    setSharedFolders(dossiers);
  };
  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>, categorie: string, candidatureId?: string) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    const validationError = validateDocumentFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }
    const uploadKey = candidatureId ? `${categorie}-${candidatureId}` : categorie;
    setUploading(uploadKey);
    try { const nomPropre = sanitizeStorageFileName(file.name); const path = candidatureId ? `${user.id}/${categorie}/${candidatureId}/${Date.now()}_${nomPropre}` : `${user.id}/${categorie}/${Date.now()}_${nomPropre}`; await uploadPrivateDocument(path, file, { fileName: file.name, metadata: { categorie, candidatureId: candidatureId || null } }); toast.success("Document ajouté !"); chargerDocuments(); }
    catch (err: any) { toast.error(translateAppError(err?.message, "Impossible d'ajouter ce document.")); } finally { setUploading(null); e.target.value = ""; }
  };
  const selectRequestedDocument = (e: React.ChangeEvent<HTMLInputElement>, requestId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateDocumentFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }
    setPendingRequestedUploads((current) => ({ ...current, [requestId]: file }));
    e.target.value = "";
  };
  const clearRequestedDocument = (requestId: string) => {
    setPendingRequestedUploads((current) => {
      const next = { ...current };
      delete next[requestId];
      return next;
    });
  };
  const confirmRequestedDocumentUpload = async (request: any) => {
    const file = pendingRequestedUploads[request.id];
    if (!file || !user) return toast.error("Choisissez un fichier avant de valider l'envoi.");
    const uploadKey = `request-${request.id}`;
    setUploading(uploadKey);
    try {
      const nomPropre = sanitizeStorageFileName(file.name);
      const path = `${user.id}/shared-requested/${request.candidature_id}/${request.id}/${Date.now()}_${nomPropre}`;
      await uploadPrivateDocument(path, file, {
        fileName: file.name,
        documentRequestId: request.id,
        metadata: { candidatureId: request.candidature_id, documentKey: request.document_key },
      });
      const { error: updateError } = await supabase
        .from("document_requests")
        .update({
          status: "uploaded",
          storage_path: path,
          file_name: file.name,
          uploaded_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .eq("talent_id", user.id);
      if (updateError) throw updateError;
      toast.success("Document envoyé à l'entreprise !");
      clearRequestedDocument(request.id);
      await chargerDocuments();
    } catch (err: any) {
      toast.error(translateAppError(err?.message, "Impossible d'envoyer ce document."));
    } finally {
      setUploading(null);
    }
  };
  const uploadRequestedDocument = async (e: React.ChangeEvent<HTMLInputElement>, request: any) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    const validationError = validateDocumentFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }
    const uploadKey = `request-${request.id}`;
    setUploading(uploadKey);
    try {
      const nomPropre = sanitizeStorageFileName(file.name);
      const path = `${user.id}/shared-requested/${request.candidature_id}/${request.id}/${Date.now()}_${nomPropre}`;
      await uploadPrivateDocument(path, file, {
        fileName: file.name,
        documentRequestId: request.id,
        metadata: { candidatureId: request.candidature_id, documentKey: request.document_key },
      });
      const { error: updateError } = await supabase
        .from("document_requests")
        .update({
          status: "uploaded",
          storage_path: path,
          file_name: file.name,
          uploaded_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .eq("talent_id", user.id);
      if (updateError) throw updateError;
      toast.success("Document envoyé à l'entreprise !");
      await chargerDocuments();
    } catch (err: any) {
      toast.error(translateAppError(err?.message, "Impossible d'envoyer ce document."));
    } finally {
      setUploading(null);
      e.target.value = "";
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
  const telechargerDocument = async (ownerId: string, categorie: string, nom: string, candidatureId?: string) => {
    if (!ownerId) return;
    const basePath = candidatureId ? `${ownerId}/${categorie}/${candidatureId}/${nom}` : `${ownerId}/${categorie}/${nom}`;
    try {
      await openPrivateDocument(basePath, { fileName: nom, metadata: { categorie, candidatureId: candidatureId || null } });
    } catch (err: any) {
      toast.error(translateAppError(err?.message, "Impossible d'ouvrir ce document."));
    }
  };
  const supprimerDocument = async (categorie: string, nom: string, candidatureId?: string) => {
    if (!user) return;
    const basePath = candidatureId ? `${user.id}/${categorie}/${candidatureId}/${nom}` : `${user.id}/${categorie}/${nom}`;
    try {
      await deletePrivateDocument(basePath, { fileName: nom, metadata: { categorie, candidatureId: candidatureId || null } });
      toast.success("Document supprimé.");
      chargerDocuments();
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };
  const pendingRequests = sharedFolders.flatMap((folder) =>
    (folder.documentRequests || [])
      .filter((request: any) => request.status === "requested")
      .map((request: any) => ({
        ...request,
        entrepriseNom: folder.entrepriseNom,
        offreTitre: folder.offre?.titre || "Candidature",
      })),
  );
  const dossiersFiltres = sharedFolders.filter((folder) => {
    const needle = searchDossiers.trim().toLowerCase();
    if (!needle) return true;

    return [
      folder.entrepriseNom,
      folder.offre?.titre,
      folder.offre?.localisation,
      folder.offre?.contrat,
      ...(folder.documentRequests || []).map((request: any) => request.document_label),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });

  const selectedFolder = expandedFolderId
    ? sharedFolders.find((folder) => folder.id === expandedFolderId) || null
    : null;
  const personalDocumentCount = personalCategories.reduce(
    (sum, category) => sum + (documents[category.id] || []).length,
    0,
  );
  const selectedRequests = selectedFolder?.documentRequests || [];
  const selectedPendingCount = selectedRequests.filter((request: any) => request.status === "requested").length;
  const selectedSharedDocuments = (selectedFolder?.categories || []).flatMap((category: any) => [
    ...(category.ownDocs || []).map((document: any) => ({
      ...document,
      categoryId: category.id,
      categoryLabel: category.label,
      direction: "sent" as const,
    })),
    ...(category.partnerDocs || []).map((document: any) => ({
      ...document,
      categoryId: category.id,
      categoryLabel: category.label,
      direction: "received" as const,
    })),
  ]);
  const formatDocumentName = (name?: string | null) => (name || "Document").replace(/^\d+_/, "");
  const formatDocumentDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
  };

  const renderRequestedDocumentAction = (request: any, entrepriseNom: string) => {
    const inputId = `compact-request-${request.id}`;
    const uploadKey = `request-${request.id}`;
    const selectedFile = pendingRequestedUploads[request.id];

    if (request.storage_path) {
      return (
        <Button variant="ghost-glow" size="sm" onClick={() => ouvrirCheminStockage(request.storage_path)}>
          <Eye className="mr-1.5 h-3.5 w-3.5" /> Ouvrir
        </Button>
      );
    }

    return (
      <div className="flex min-w-[190px] flex-col items-stretch gap-2 sm:items-end">
        <input
          type="file"
          id={inputId}
          className="hidden"
          accept={DOCUMENT_ACCEPT_ATTRIBUTE}
          onChange={(event) => selectRequestedDocument(event, request.id)}
        />
        <Button
          variant={selectedFile ? "ghost-glow" : "glow"}
          size="sm"
          disabled={uploading === uploadKey}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {selectedFile ? "Changer" : "Choisir un fichier"}
        </Button>
        {selectedFile && (
          <div className="w-full rounded-xl border border-primary/20 bg-primary/5 p-2.5 sm:w-[250px]">
            <p className="truncate text-xs font-medium">{selectedFile.name}</p>
            <div className="mt-2 flex gap-2">
              <ConfirmActionDialog
                title="Envoyer ce document ?"
                description={`Le fichier « ${selectedFile.name} » sera partagé uniquement avec ${entrepriseNom}.`}
                confirmLabel="Valider l’envoi"
                confirmVariant="glow"
                onConfirm={() => confirmRequestedDocumentUpload(request)}
              >
                <button
                  type="button"
                  disabled={uploading === uploadKey}
                  className="h-8 flex-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {uploading === uploadKey ? "Envoi..." : "Envoyer"}
                </button>
              </ConfirmActionDialog>
              <button
                type="button"
                className="h-8 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => clearRequestedDocument(request.id)}
              >
                Retirer
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="talent-tab-shell space-y-4 sm:space-y-5">
      <TalentPageHeader
        icon={FolderOpen}
        eyebrow="Espace sécurisé"
        title="Mes documents"
        description="Ajoutez vos pièces personnelles et échangez les documents demandés avec chaque entreprise depuis un seul espace."
        aside={(
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-foreground">Documents chiffrés</p>
              <p className="text-xs text-muted-foreground">Partage uniquement après votre validation</p>
            </div>
          </div>
        )}
      />

      {showDocumentsIntro && (
        <section className="rounded-2xl border border-primary/25 bg-primary/[0.07] p-4 shadow-sm" aria-labelledby="documents-intro-title">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="documents-intro-title" className="text-sm font-bold">Votre espace de documents, simplement</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Ajoutez votre CV et votre lettre pour les rendre disponibles aux recruteurs. Pour les autres pièces, vous choisissez toujours le dossier et l’entreprise destinataire avant l’envoi.
              </p>
              <Button type="button" variant="ghost-glow" size="sm" className="mt-2" onClick={dismissDocumentsIntro}>J’ai compris</Button>
            </div>
            <button type="button" onClick={dismissDocumentsIntro} aria-label="Fermer l’explication" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      <section className="dashboard-panel overflow-hidden">
        <div className="grid border-b border-border/60 sm:grid-cols-3">
          {[
            { label: "Documents personnels", value: personalDocumentCount, helper: "CV et lettre", tone: "text-primary" },
            { label: "Demandes à traiter", value: pendingRequests.length, helper: "Pièces attendues", tone: "text-amber-600 dark:text-amber-300" },
            { label: "Dossiers actifs", value: sharedFolders.length, helper: "Candidatures acceptées", tone: "text-emerald-600 dark:text-emerald-300" },
          ].map((metric, index) => (
            <div key={metric.label} className={`flex items-center justify-between gap-3 px-5 py-4 ${index > 0 ? "border-t border-border/60 sm:border-l sm:border-t-0" : ""}`}>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p>
              </div>
              <span className={`text-2xl font-bold ${metric.tone}`}>{metric.value}</span>
            </div>
          ))}
        </div>

        <div className="grid min-h-[560px] xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="border-b border-border/60 bg-secondary/10 p-4 xl:border-b-0 xl:border-r">
            <button
              type="button"
              onClick={() => { setExpandedFolderId(null); setShowShareUpload(false); }}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${!selectedFolder ? "border-primary/30 bg-primary/10" : "border-transparent hover:border-border hover:bg-background/60"}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><FileText className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Mes documents</p>
                <p className="text-xs text-muted-foreground">CV et lettre de motivation</p>
              </div>
              <span className="rounded-full bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">{personalDocumentCount}</span>
            </button>

            <div className="my-4 border-t border-border/60" />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Dossiers entreprises</p>
              <span className="text-xs text-muted-foreground">{sharedFolders.length}</span>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchDossiers}
                onChange={(event) => setSearchDossiers(event.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background/70 pl-9 pr-9 text-sm outline-none focus:border-primary/40"
                placeholder="Rechercher une entreprise..."
              />
              {searchDossiers && <button type="button" onClick={() => setSearchDossiers("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
            </div>

            <div className="mt-3 space-y-2">
              {dossiersFiltres.map((folder) => {
                const folderPending = (folder.documentRequests || []).filter((request: any) => request.status === "requested").length;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => { setExpandedFolderId(folder.id); setDocumentsView(folderPending > 0 ? "requests" : "all"); setShowPersonalUpload(false); }}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${expandedFolderId === folder.id ? "border-primary/30 bg-primary/10" : "border-transparent hover:border-border hover:bg-background/60"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary"><Building2 className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{folder.entrepriseNom}</p>
                          {folderPending > 0 && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">{folderPending}</span>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{folder.offre?.titre || "Candidature"}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {sharedFolders.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Vos dossiers apparaîtront après l’acceptation d’une candidature.</p>}
              {sharedFolders.length > 0 && dossiersFiltres.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">Aucun dossier trouvé.</p>}
            </div>
          </aside>

          <div className="min-w-0 p-4 sm:p-5">
            {!selectedFolder ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Documents personnels</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Votre CV et votre lettre restent accessibles depuis vos candidatures.</p>
                  </div>
                  <Button variant="glow" size="sm" onClick={() => setShowPersonalUpload((current) => !current)}>
                    <Plus className="mr-1.5 h-4 w-4" /> Ajouter un document
                  </Button>
                </div>

                {showPersonalUpload && (
                  <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-end">
                    <label className="flex-1 text-xs font-semibold text-muted-foreground">
                      Type de document
                      <select value={personalUploadCategory} onChange={(event) => setPersonalUploadCategory(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none">
                        {personalCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                      </select>
                    </label>
                    <input type="file" id="compact-personal-upload" className="hidden" accept={DOCUMENT_ACCEPT_ATTRIBUTE} onChange={(event) => uploadDocument(event, personalUploadCategory)} />
                    <Button variant="glow" size="sm" disabled={uploading === personalUploadCategory} onClick={() => document.getElementById("compact-personal-upload")?.click()}>
                      <Upload className="mr-1.5 h-4 w-4" /> {uploading === personalUploadCategory ? "Ajout..." : "Choisir le fichier"}
                    </Button>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border border-border/70">
                  <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(130px,0.6fr)_150px] gap-3 bg-secondary/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground sm:grid">
                    <span>Document</span><span>Type</span><span className="text-right">Actions</span>
                  </div>
                  {personalDocumentCount === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <FileText className="mx-auto h-9 w-9 text-primary/30" />
                      <p className="mt-3 text-sm font-semibold">Aucun document personnel</p>
                      <p className="mt-1 text-xs text-muted-foreground">Commencez par ajouter votre CV.</p>
                    </div>
                  ) : personalCategories.flatMap((category) => (documents[category.id] || []).map((documentItem: any) => (
                    <div key={`${category.id}-${documentItem.name}`} className="grid gap-3 border-t border-border/60 px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1.5fr)_minmax(130px,0.6fr)_150px] sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><category.icon className="h-4 w-4" /></div>
                        <div className="min-w-0"><p className="truncate text-sm font-semibold">{formatDocumentName(documentItem.name)}</p><p className="text-xs text-muted-foreground">Ajouté le {formatDocumentDate(documentItem.updated_at || documentItem.created_at)}</p></div>
                      </div>
                      <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">{category.label}</span>
                      <div className="flex justify-start gap-2 sm:justify-end">
                        <Button variant="ghost-glow" size="sm" onClick={() => telechargerDocument(user!.id, category.id, documentItem.name)}><Eye className="mr-1 h-3.5 w-3.5" /> Ouvrir</Button>
                        <ConfirmActionDialog title="Supprimer ce document ?" description="Ce fichier sera retiré de vos documents personnels." onConfirm={() => supprimerDocument(category.id, documentItem.name)}>
                          <button type="button" aria-label="Supprimer" className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                        </ConfirmActionDialog>
                      </div>
                    </div>
                  )))}
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/20 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-xs leading-5 text-muted-foreground">Votre CV et votre lettre sont visibles dans le cadre de vos candidatures. Les pièces administratives ne sont jamais envoyées sans votre action.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 border-b border-border/60 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{selectedFolder.entrepriseNom}</h2><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">Candidature acceptée</span></div>
                      <p className="truncate text-sm text-muted-foreground">{selectedFolder.offre?.titre || "Candidature"} · {selectedFolder.offre?.localisation || "Localisation non précisée"}</p>
                    </div>
                  </div>
                  <Button variant="glow" size="sm" onClick={() => setShowShareUpload((current) => !current)}><Upload className="mr-1.5 h-4 w-4" /> Partager un document</Button>
                </div>

                {!documentsRequestsReady && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">Les demandes de documents sont momentanément indisponibles. Vos documents déjà partagés restent accessibles.</div>
                )}

                {showShareUpload && (
                  <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-end">
                    <label className="flex-1 text-xs font-semibold text-muted-foreground">
                      Catégorie
                      <select value={shareUploadCategory} onChange={(event) => setShareUploadCategory(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none">
                        {sharedCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                      </select>
                    </label>
                    <input type="file" id={`compact-shared-upload-${selectedFolder.id}`} className="hidden" accept={DOCUMENT_ACCEPT_ATTRIBUTE} onChange={(event) => uploadDocument(event, shareUploadCategory, selectedFolder.id)} />
                    <Button variant="glow" size="sm" disabled={uploading === `${shareUploadCategory}-${selectedFolder.id}`} onClick={() => document.getElementById(`compact-shared-upload-${selectedFolder.id}`)?.click()}>
                      <Upload className="mr-1.5 h-4 w-4" /> {uploading === `${shareUploadCategory}-${selectedFolder.id}` ? "Envoi..." : "Choisir et partager"}
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {([
                    ["all", "Tous les documents", selectedRequests.length + selectedSharedDocuments.length],
                    ["requests", "Demandes", selectedRequests.length],
                    ["shared", "Échanges", selectedSharedDocuments.length],
                  ] as const).map(([view, label, count]) => (
                    <button key={view} type="button" onClick={() => setDocumentsView(view)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${documentsView === view ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
                      {label} <span className="ml-1 rounded-full bg-background/80 px-1.5 py-0.5">{count}</span>
                    </button>
                  ))}
                  {selectedPendingCount > 0 && <span className="ml-auto self-center rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">{selectedPendingCount} à envoyer</span>}
                </div>

                {(documentsView === "all" || documentsView === "requests") && (
                  <div className="overflow-hidden rounded-xl border border-border/70">
                    <div className="flex items-center justify-between gap-3 bg-secondary/35 px-4 py-3"><div><p className="text-sm font-semibold">Documents demandés</p><p className="text-xs text-muted-foreground">Envoyez uniquement la pièce indiquée.</p></div><span className="text-xs font-semibold text-muted-foreground">{selectedRequests.length}</span></div>
                    {selectedRequests.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune pièce demandée par cette entreprise.</p> : selectedRequests.map((request: any) => {
                      const statusMeta = getRequestStatusMeta(request.status);
                      return (
                        <div key={request.id} className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{request.document_label}</p><span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.className}`}>{statusMeta.label}</span></div><p className="mt-1 text-xs text-muted-foreground">Demandé le {formatDocumentDate(request.requested_at)}{request.file_name ? ` · ${request.file_name}` : ""}</p></div>
                          {renderRequestedDocumentAction(request, selectedFolder.entrepriseNom)}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(documentsView === "all" || documentsView === "shared") && (
                  <div className="overflow-hidden rounded-xl border border-border/70">
                    <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(120px,0.6fr)_120px_120px] gap-3 bg-secondary/35 px-4 py-2.5 text-xs font-semibold text-muted-foreground sm:grid"><span>Document</span><span>Catégorie</span><span>Partagé par</span><span className="text-right">Actions</span></div>
                    {selectedSharedDocuments.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun document échangé dans ce dossier.</p> : selectedSharedDocuments.map((documentItem: any) => (
                      <div key={`${documentItem.direction}-${documentItem.categoryId}-${documentItem.name}`} className="grid gap-3 border-t border-border/60 px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1.35fr)_minmax(120px,0.6fr)_120px_120px] sm:items-center">
                        <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{formatDocumentName(documentItem.name)}</p><p className="text-xs text-muted-foreground">{formatDocumentDate(documentItem.updated_at || documentItem.created_at)}</p></div></div>
                        <span className="text-xs font-medium text-muted-foreground">{documentItem.categoryLabel}</span>
                        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${documentItem.direction === "sent" ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"}`}>{documentItem.direction === "sent" ? "Vous" : "Entreprise"}</span>
                        <div className="flex justify-start gap-2 sm:justify-end">
                          <Button variant="ghost-glow" size="sm" onClick={() => telechargerDocument(documentItem.ownerId, documentItem.categoryId, documentItem.name, selectedFolder.id)}><Eye className="mr-1 h-3.5 w-3.5" /> Ouvrir</Button>
                          {documentItem.direction === "sent" && <ConfirmActionDialog title="Supprimer ce document partagé ?" description="Le document ne sera plus disponible dans ce dossier partagé." onConfirm={() => supprimerDocument(documentItem.categoryId, documentItem.name, selectedFolder.id)}><button type="button" aria-label="Supprimer" className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button></ConfirmActionDialog>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" /><p className="text-xs leading-5 text-muted-foreground">Ces documents sont accessibles uniquement par vous et {selectedFolder.entrepriseNom}. Chaque ouverture et chaque partage sont protégés.</p></div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

// ─── LettreTab ────────────────────────────────────────────────────────────────
const LETTER_ALLOWED_TAGS = new Set([
  "P",
  "DIV",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
  "H2",
  "H3",
  "FONT",
  "SPAN",
]);

const LETTER_ALLOWED_FONTS = ["Arial", "Georgia", "Times New Roman", "Verdana"];

const escapeLetterHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const plainTextToLetterHtml = (value: string) => {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "";

  return normalized
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${escapeLetterHtml(paragraph.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
};

const sanitizeLetterHtml = (value: string) => {
  if (typeof document === "undefined") return value;

  const template = document.createElement("template");
  template.innerHTML = value;

  const cleanNode = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      const originalFont = child.tagName === "FONT" ? child.getAttribute("face") || "" : "";
      const originalSize = child.tagName === "FONT" ? child.getAttribute("size") || "" : "";
      const originalStyle = child.tagName === "SPAN" ? child.getAttribute("style") || "" : "";
      cleanNode(child);

      if (!LETTER_ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        return;
      }

      Array.from(child.attributes).forEach((attribute) => child.removeAttribute(attribute.name));
      if (child.tagName === "FONT") {
        const allowedFont = LETTER_ALLOWED_FONTS.find((font) => font.toLowerCase() === originalFont.toLowerCase());
        if (allowedFont) child.setAttribute("face", allowedFont);
        if (["2", "3", "4", "5"].includes(originalSize)) child.setAttribute("size", originalSize);
      }
      if (child.tagName === "SPAN") {
        const fontMatch = originalStyle.match(/font-family\s*:\s*([^;]+)/i);
        const sizeMatch = originalStyle.match(/font-size\s*:\s*(12px|15px|18px|22px|small|medium|large|x-large)/i);
        const allowedFont = LETTER_ALLOWED_FONTS.find((font) => fontMatch?.[1]?.replace(/["']/g, "").trim().toLowerCase().startsWith(font.toLowerCase()));
        const safeRules = [allowedFont ? `font-family:${allowedFont}` : "", sizeMatch ? `font-size:${sizeMatch[1]}` : ""].filter(Boolean);
        if (safeRules.length) child.setAttribute("style", safeRules.join(";"));
      }
    });
  };

  cleanNode(template.content);
  return template.innerHTML;
};

const letterHtmlToPlainText = (value: string) => {
  if (typeof document === "undefined") return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const container = document.createElement("div");
  container.innerHTML = sanitizeLetterHtml(value);
  return container.innerText.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
};

const LetterRichTextEditor = ({
  html,
  placeholder,
  minHeightClass = "min-h-[300px]",
  wordCount,
  onChange,
}: {
  html: string;
  placeholder: string;
  minHeightClass?: string;
  wordCount: number;
  onChange: (html: string, plainText: string) => void;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    const safeHtml = sanitizeLetterHtml(html);
    if (editor && editor.innerHTML !== safeHtml) editor.innerHTML = safeHtml;
  }, [html]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) selectionRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const safeHtml = sanitizeLetterHtml(editor.innerHTML);
    if (editor.innerHTML !== safeHtml) editor.innerHTML = safeHtml;
    onChange(safeHtml, letterHtmlToPlainText(safeHtml));
    saveSelection();
  };

  const applyCommand = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    emitChange();
  };

  const keepSelection = (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault();

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 text-slate-700">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <select aria-label="Style du texte" title="Style du texte" defaultValue="p" onMouseDown={saveSelection} onFocus={saveSelection} onChange={(event) => applyCommand("formatBlock", event.target.value)} className="rounded-md border-0 bg-slate-100 px-2 py-1.5 font-medium outline-none">
            <option value="p">Paragraphe</option>
            <option value="h3">Sous-titre</option>
            <option value="h2">Titre</option>
          </select>
          <select aria-label="Police d'écriture" title="Police d'écriture" defaultValue="Arial" onMouseDown={saveSelection} onFocus={saveSelection} onChange={(event) => applyCommand("fontName", event.target.value)} className="max-w-[132px] rounded-md border-0 bg-slate-100 px-2 py-1.5 font-medium outline-none">
            {LETTER_ALLOWED_FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
          </select>
          <select aria-label="Taille du texte" title="Taille du texte" defaultValue="3" onMouseDown={saveSelection} onFocus={saveSelection} onChange={(event) => applyCommand("fontSize", event.target.value)} className="rounded-md border-0 bg-slate-100 px-2 py-1.5 font-medium outline-none">
            <option value="2">Petit</option>
            <option value="3">Normal</option>
            <option value="4">Grand</option>
            <option value="5">Très grand</option>
          </select>
          <button type="button" aria-label="Mettre en gras" title="Gras" onMouseDown={keepSelection} onClick={() => applyCommand("bold")} className="rounded-md px-2.5 py-1.5 font-bold hover:bg-slate-100">B</button>
          <button type="button" aria-label="Mettre en italique" title="Italique" onMouseDown={keepSelection} onClick={() => applyCommand("italic")} className="rounded-md px-2.5 py-1.5 italic hover:bg-slate-100">I</button>
          <button type="button" aria-label="Souligner" title="Souligné" onMouseDown={keepSelection} onClick={() => applyCommand("underline")} className="rounded-md px-2.5 py-1.5 underline hover:bg-slate-100">U</button>
          <button type="button" aria-label="Créer une liste à puces" title="Liste à puces" onMouseDown={keepSelection} onClick={() => applyCommand("insertUnorderedList")} className="rounded-md px-2 py-1.5 hover:bg-slate-100">• Liste</button>
        </div>
        <span className="text-[11px] text-slate-500">{wordCount} mots</span>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Texte de la lettre de motivation"
        data-placeholder={placeholder}
        onInput={emitChange}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onFocus={saveSelection}
        onBlur={saveSelection}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
          emitChange();
        }}
        className={`${minHeightClass} flex-1 overflow-y-auto bg-white px-4 py-4 text-[14px] leading-7 text-slate-800 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6`}
      />
    </div>
  );
};

const LettreTab = ({
  compact = false,
  cvContext = null,
  controlledPoste,
  controlledEntreprise,
  onPosteChange,
  onEntrepriseChange,
}: {
  compact?: boolean;
  cvContext?: CandidatureCvContext | null;
  controlledPoste?: string;
  controlledEntreprise?: string;
  onPosteChange?: (value: string) => void;
  onEntrepriseChange?: (value: string) => void;
}) => {
  const { user, profile } = useAuth();
  const [posteState, setPosteState] = useState("");
  const [entrepriseState, setEntrepriseState] = useState("");
  const [points, setPoints] = useState("");
  const [lettre, setLettre] = useState("");
  const [lettreHtml, setLettreHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [styleLettre, setStyleLettre] = useState<"classique" | "terrain" | "motive">("classique");
  const poste = controlledPoste ?? posteState;
  const entreprise = controlledEntreprise ?? entrepriseState;
  const setPoste = (value: string) => {
    setPosteState(value);
    onPosteChange?.(value);
  };
  const setEntreprise = (value: string) => {
    setEntrepriseState(value);
    onEntrepriseChange?.(value);
  };

  const nomCandidat = profile?.full_name?.trim() || user?.email?.split("@")[0] || "";
  const posteCandidat = (profile as any)?.poste || "";
  const localisationCandidat = (profile as any)?.localisation || "";
  const adresseCandidat = (profile as any)?.adresse || "";
  const telephoneCandidat = (profile as any)?.telephone || "";
  const telephoneSecondaire = (profile as any)?.telephone2 || "";
  const secteurCandidat = (profile as any)?.secteur || "";
  const competencesCandidat = (profile as any)?.competences || "";
  const bioCandidat = stripTalentAvailabilityMetadata((profile as any)?.bio || "");
  const contratRecherche = (profile as any)?.contrat || "";
  const draftStorageKey = user?.id ? `spotted-talent:cover-letter-draft:${user.id}` : "";

  useEffect(() => {
    if (!poste && posteCandidat) {
      setPoste(posteCandidat);
    }
  }, [poste, posteCandidat]);

  useEffect(() => {
    if (!compact && !points && competencesCandidat) {
      setPoints(
        competencesCandidat
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
          .slice(0, 5)
          .join(", ")
      );
    }
  }, [compact, points, competencesCandidat]);

  useEffect(() => {
    if (!draftStorageKey || typeof window === "undefined") return;
    try {
      const storedDraft = window.localStorage.getItem(draftStorageKey);
      if (!storedDraft) return;
      const draft = JSON.parse(storedDraft);
      if (typeof draft.poste === "string") setPoste(draft.poste);
      if (typeof draft.entreprise === "string") setEntreprise(draft.entreprise);
      if (typeof draft.points === "string") setPoints(draft.points);
      if (typeof draft.lettreHtml === "string") {
        const safeHtml = sanitizeLetterHtml(draft.lettreHtml);
        setLettreHtml(safeHtml);
        setLettre(letterHtmlToPlainText(safeHtml));
      } else if (typeof draft.lettre === "string") {
        setLettre(draft.lettre);
        setLettreHtml(plainTextToLetterHtml(draft.lettre));
      }
      if (draft.styleLettre === "classique" || draft.styleLettre === "terrain" || draft.styleLettre === "motive") setStyleLettre(draft.styleLettre);
    } catch {
      // Un brouillon local invalide ne doit jamais bloquer l'ouverture de la rubrique.
    }
  }, [draftStorageKey]);

  const nettoyerLettre = (contenu: string) => {
    let texte = contenu.trim();
    texte = texte.replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, "").trim());
    texte = texte.replace(/\[Votre nom\]|\[Nom\]|\[Nom Prenom\]/gi, nomCandidat || "");
    texte = texte.replace(/\[Nom de l'entreprise\]/gi, entreprise);
    texte = texte.replace(/\[Poste\]/gi, poste);
    texte = texte.replace(
      /^\s*objet\s*:\s.*(?:\r?\n)+/i,
      "",
    );
    texte = texte.replace(/\n{3,}/g, "\n\n");
    if (texte && !/^Madame,\s*Monsieur,/i.test(texte)) {
      texte = `Madame, Monsieur,\n\n${texte}`;
    }
    return texte.trim();
  };

  const lettreNettoyee = nettoyerLettre(lettre);
  const paragraphs = lettreNettoyee
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const coordonneesCandidat = [
    adresseCandidat,
    localisationCandidat,
    telephoneCandidat,
    telephoneSecondaire ? `Autre numéro : ${telephoneSecondaire}` : "",
    user?.email || "",
  ].filter(Boolean);
  const pointsProfil = [
    posteCandidat ? `Poste actuel : ${posteCandidat}` : "",
    secteurCandidat ? `Secteur : ${secteurCandidat}` : "",
    contratRecherche ? `Contrat recherché : ${contratRecherche}` : "",
    competencesCandidat ? `Compétences : ${competencesCandidat}` : "",
  ].filter(Boolean);
  const stylesLettre = [
    {
      id: "classique" as const,
      label: compact ? "Professionnel" : "Classique pro",
      desc: "Ton sobre, plus formel et rassurant pour une candidature classique.",
    },
    {
      id: "terrain" as const,
      label: compact ? "Direct" : "Terrain / intérim",
      desc: "Ton plus direct, concret et orienté action pour les métiers terrain.",
    },
    {
      id: "motive" as const,
      label: "Motivé",
      desc: "Ton positif et enthousiaste, tout en restant crédible et professionnel.",
    },
  ];

  const genererLettre = async () => {
    if (!poste || !entreprise) return toast.error("Remplissez le poste et l'entreprise.");
    if (!cvContext?.cvText || !cvContext?.analyse) return toast.error("Analysez d'abord votre CV pour créer une lettre fidèle à votre parcours.");
    setLoading(true);
    try {
      const contenu = await requestAiContent("cover_letter", {
        nomCandidat,
        poste,
        entreprise,
        posteCandidat,
        localisation: localisationCandidat,
        secteur: secteurCandidat,
        contrat: contratRecherche,
        competences: compact ? "" : competencesCandidat,
        bio: compact ? "" : bioCandidat,
        pointsForts: points,
        style: styleLettre,
        cvText: (cvContext?.cvText || "").slice(0, 12000),
        cvResume: cvContext?.analyse?.resume || "",
        cvPointsForts: (cvContext?.analyse?.points_forts || []).map((item: any) => item?.titre || item).filter(Boolean).join(", "),
      });
      const lettreGeneree = nettoyerLettre(contenu);
      setLettre(lettreGeneree);
      setLettreHtml(plainTextToLetterHtml(lettreGeneree));
      toast.success("Lettre générée !");
    } catch (err) { toast.error("Impossible de générer la lettre pour le moment."); } finally { setLoading(false); }
  };

  const telechargerPDF = async () => {
    if (!lettreNettoyee.trim() || exportingPdf) return;

    const isMobileBrowser =
      typeof window !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
    const previewWindow = isMobileBrowser ? window.open("", "_blank", "noopener,noreferrer") : null;

    setExportingPdf(true);
    let pdfContainer: HTMLDivElement | null = null;

    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const dateFr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
      const formattedLetter = sanitizeLetterHtml(lettreHtml || plainTextToLetterHtml(lettreNettoyee));
      const visibleCoordinates = coordonneesCandidat.map((line) => `<div>${escapeLetterHtml(String(line))}</div>`).join("");

      pdfContainer = document.createElement("div");
      pdfContainer.setAttribute("aria-hidden", "true");
      pdfContainer.style.cssText = [
        "position:fixed",
        "left:-10000px",
        "top:0",
        "box-sizing:border-box",
        "width:720px",
        "min-height:1018px",
        "padding:62px 64px",
        "background:#ffffff",
        "color:#1a1a20",
        "font-family:Arial,sans-serif",
        "font-size:15px",
        "line-height:1.65",
      ].join(";");
      pdfContainer.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:36px;padding-bottom:24px;border-bottom:1px solid #dce2eb;color:#585c6c;font-size:13px;line-height:1.55">
          <div style="max-width:330px">
            <div style="color:#1a1a20;font-size:22px;font-weight:700">${escapeLetterHtml(nomCandidat || "Candidat")}</div>
            ${posteCandidat ? `<div style="margin-top:3px">${escapeLetterHtml(posteCandidat)}</div>` : ""}
            <div style="margin-top:10px">${visibleCoordinates}</div>
          </div>
          <div style="max-width:210px;text-align:right">
            <div style="color:#1a1a20;font-weight:700">${escapeLetterHtml(entreprise)}</div>
            <div>Service recrutement</div>
            <div style="margin-top:10px">${escapeLetterHtml(dateFr)}</div>
          </div>
        </div>
        <div style="margin:24px 0 26px;color:#6256e8;font-size:15px;font-weight:700">Objet : Candidature au poste de ${escapeLetterHtml(poste)} chez ${escapeLetterHtml(entreprise)}</div>
        <div class="spotted-letter-pdf">${formattedLetter}</div>
      `;
      const pdfStyle = document.createElement("style");
      pdfStyle.textContent = `
        .spotted-letter-pdf p { margin: 0 0 17px; }
        .spotted-letter-pdf h2 { margin: 22px 0 12px; font-size: 22px; line-height: 1.35; }
        .spotted-letter-pdf h3 { margin: 18px 0 10px; font-size: 17px; line-height: 1.4; }
        .spotted-letter-pdf ul, .spotted-letter-pdf ol { margin: 10px 0 18px; padding-left: 25px; }
        .spotted-letter-pdf li { margin: 5px 0; }
      `;
      pdfContainer.prepend(pdfStyle);
      document.body.appendChild(pdfContainer);

      await doc.html(pdfContainer, {
        autoPaging: "text",
        margin: [0, 0, 0, 0],
        width: doc.internal.pageSize.getWidth(),
        windowWidth: 720,
        html2canvas: {
          backgroundColor: "#ffffff",
          logging: false,
          scale: 1,
          useCORS: true,
        },
      });

      const safeEntreprise = entreprise.toLowerCase().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
      const fileName = `lettre_motivation_${safeEntreprise || "entreprise"}.pdf`;
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);

      if (previewWindow) {
        previewWindow.location.href = blobUrl;
        toast.success("Le PDF s'est ouvert dans un nouvel onglet.");
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("PDF téléchargé !");
      }

      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      if (previewWindow && !previewWindow.closed) previewWindow.close();
      toast.error("Impossible d'exporter le PDF pour le moment.");
    } finally {
      pdfContainer?.remove();
      setExportingPdf(false);
    }
  };

  const selectedStyle = stylesLettre.find((style) => style.id === styleLettre) || stylesLettre[0];
  const coordonneesVisibles = coordonneesCandidat.slice(0, 4);
  const wordCount = lettreNettoyee ? lettreNettoyee.split(/\s+/).filter(Boolean).length : 0;
  const lectureEstimee = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 170)) : 0;
  const checklistAvantEnvoi = [
    poste ? "Le poste visé est bien précisé." : "Ajoutez le poste visé pour cadrer la lettre.",
    entreprise ? "Le nom de l'entreprise est bien repris." : "Ajoutez le nom de l'entreprise ciblée.",
    points.trim() ? "Vos points forts personnels sont intégrés." : "Ajoutez 2 ou 3 points forts pour personnaliser.",
  ];

  const enregistrerBrouillon = () => {
    if (!draftStorageKey || typeof window === "undefined") return;
    window.localStorage.setItem(draftStorageKey, JSON.stringify({ poste, entreprise, points, lettre, lettreHtml, styleLettre }));
    toast.success("Brouillon enregistré sur cet appareil.");
  };

  if (compact) {
    return (
      <section className="dashboard-panel flex min-h-[550px] flex-col p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">Lettre de motivation</h2>
          <div className="flex overflow-hidden rounded-xl border border-border/70 bg-background/50">
            {stylesLettre.map((style, index) => (
              <button key={style.id} type="button" onClick={() => setStyleLettre(style.id)} className={`flex-1 whitespace-nowrap px-3 py-2 text-[11px] font-semibold transition-colors ${index > 0 ? "border-l border-border/70" : ""} ${styleLettre === style.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-3 rounded-xl border px-3.5 py-3 ${cvContext ? "border-emerald-500/25 bg-emerald-500/[0.08]" : "border-amber-500/25 bg-amber-500/[0.07]"}`}>
          <div className="flex items-center gap-2.5">
            {cvContext ? <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" /> : <ShieldCheck className="h-5 w-5 shrink-0 text-amber-500" />}
            <p className="text-xs font-medium">
              {cvContext
                ? "Votre CV est utilisé pour personnaliser cette lettre. Seules les compétences présentes dans le CV seront reprises."
                : "Analysez votre CV à gauche avant de générer la lettre."}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-1 flex-col">
          <LetterRichTextEditor
            html={lettreHtml}
            wordCount={wordCount}
            placeholder={cvContext ? "Cliquez sur « Générer avec l’IA ». La lettre restera entièrement modifiable ici." : "Analysez d'abord votre CV pour créer une lettre fidèle à votre parcours."}
            onChange={(html, plainText) => {
              setLettreHtml(html);
              setLettre(plainText);
            }}
          />
        </div>

        <details className="mt-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-2.5">
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Ajouter une précision personnelle (facultatif)</summary>
          <textarea value={points} onChange={(event) => setPoints(event.target.value)} rows={2} className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs leading-5 outline-none focus:border-primary/50" placeholder="Ajoutez uniquement une information exacte que vous souhaitez mettre en avant." />
        </details>

        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(190px,1fr)_auto_auto]">
          <Button variant="glow" onClick={genererLettre} disabled={loading || !cvContext || !poste.trim() || !entreprise.trim()}>
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? "Génération..." : lettreNettoyee ? "Générer à nouveau" : "Générer avec l'IA"}
          </Button>
          <Button variant="ghost-glow" onClick={enregistrerBrouillon} disabled={!lettre.trim()}>Enregistrer</Button>
          <Button variant="ghost-glow" onClick={telechargerPDF} disabled={!lettreNettoyee || exportingPdf}>
            <FolderOpen className="mr-1.5 h-4 w-4" />{exportingPdf ? "PDF..." : "Télécharger PDF"}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="talent-tab-shell space-y-4 sm:space-y-5">
      <TalentPageHeader
        icon={Mail}
        eyebrow="Candidature assistée"
        title="Lettre de motivation"
        description="Préparez une lettre claire, personnalisez-la facilement, puis exportez-la dans un format propre avant l'envoi."
        aside={(
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Préparation</p>
            <p className="mt-2 text-base font-semibold text-foreground">{lettreNettoyee ? "Lettre prête à relire" : "Renseignez le poste ciblé"}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Le PDF reprend vos coordonnées et conserve une mise en page propre pour l'envoi.
            </p>
          </div>
        )}
      />
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[410px_minmax(0,1fr)]">
        <div className="glass-card self-start space-y-4 p-4 sm:p-5 xl:sticky xl:top-24">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                  <p className="text-sm font-semibold">Une lettre claire et prête à envoyer</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  L'IA prépare une lettre plus crédible, avec un ton adapté, une meilleure lisibilité et un PDF plus propre.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium">Style de lettre</label>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {stylesLettre.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setStyleLettre(style.id)}
                  className={`min-h-[112px] rounded-2xl border p-4 text-left transition-all ${
                    styleLettre === style.id
                      ? "border-primary/40 bg-primary/10 shadow-[0_20px_48px_-34px_rgba(139,92,246,0.78)]"
                      : "border-border/60 bg-secondary/20 hover:border-primary/20"
                  }`}
                >
                  <p className="text-base font-semibold">{style.label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Pour quel poste ?</label>
              <input
                value={poste}
                onChange={(e) => setPoste(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
                placeholder="Ex. : Conducteur de car, préparateur de commandes..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Nom de l'entreprise</label>
              <input
                value={entreprise}
                onChange={(e) => setEntreprise(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
                placeholder="Ex. : Société Martin, Transavoie..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Vos points forts (optionnel)</label>
              <textarea
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-xl border border-border bg-secondary px-4 py-3 text-sm leading-6 focus:border-primary/50 focus:outline-none"
                placeholder="Ex. : conduite urbaine, relation usagers, ponctualité, sécurité, sang-froid..."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Profil utilisé pour générer la lettre</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pointsProfil.length > 0 ? pointsProfil.map((item) => (
                <span key={item} className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
                  {item}
                </span>
              )) : (
                <span className="text-sm text-muted-foreground">Complétez votre profil talent pour enrichir automatiquement la lettre.</span>
              )}
            </div>
          </div>

          <Button variant="glow" size="lg" className="w-full" onClick={genererLettre} disabled={loading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? "Génération en cours..." : "Générer ma lettre avec l'IA"}
          </Button>
        </div>

        <div className="dashboard-panel flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold">Votre lettre</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Relisez le rendu, ajustez le texte si besoin, puis exportez un PDF propre et lisible.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {selectedStyle.label}
                </span>
                <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  Poste : {poste || "à préciser"}
                </span>
                <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                  Entreprise : {entreprise || "à préciser"}
                </span>
              </div>
            </div>
            {lettreNettoyee && (
              <Button
                className="w-full lg:w-auto"
                variant="ghost-glow"
                size="sm"
                onClick={telechargerPDF}
                disabled={exportingPdf}
              >
                <FolderOpen className="mr-1 h-4 w-4" />
                {exportingPdf ? "Préparation du PDF..." : "Télécharger le PDF"}
              </Button>
            )}
          </div>

          <div className="talent-metric-grid">
            <div className="dashboard-stat-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Style</p>
              <p className="mt-2 text-lg font-semibold">{selectedStyle.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{selectedStyle.desc}</p>
            </div>
            <div className="dashboard-stat-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Longueur</p>
              <p className="mt-2 text-lg font-semibold">{wordCount} mots</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {wordCount ? `${lectureEstimee} min de lecture environ` : "Le compteur apparaîtra après génération."}
              </p>
            </div>
            <div className="dashboard-stat-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Structure</p>
              <p className="mt-2 text-lg font-semibold">{paragraphs.length} paragraphe(s)</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {paragraphs.length ? "Le rendu reste aéré et facile à relire." : "Le plan sera visible dès que la lettre sera générée."}
              </p>
            </div>
            <div className="dashboard-stat-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Export</p>
              <p className="mt-2 text-lg font-semibold">{lettreNettoyee ? "PDF prêt" : "En attente"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lettreNettoyee ? "Téléchargement propre avant envoi." : "Générez la lettre pour préparer le PDF."}
              </p>
            </div>
          </div>

          {lettreNettoyee ? (
            <>
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="dashboard-subcard overflow-hidden border-primary/10 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_34%),linear-gradient(180deg,hsl(var(--background)/0.84),hsl(var(--secondary)/0.26))] p-4 sm:p-6">
                  <div className="mx-auto max-w-[760px] rounded-[32px] border border-slate-200/80 bg-white p-6 text-slate-900 shadow-[0_28px_80px_-38px_rgba(15,23,42,0.45)] sm:p-8">
                    <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-[520px]">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Objet</p>
                        <p className="mt-2 text-lg font-semibold leading-8 text-slate-900">
                          Candidature au poste de {poste || "votre poste"} chez {entreprise || "l'entreprise"}
                        </p>
                        <span className="mt-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                          {styleLettre === "terrain" ? "Style terrain / intérim" : "Style classique professionnel"}
                        </span>
                      </div>
                      <div className="text-sm leading-7 text-slate-500 sm:max-w-[220px] sm:text-right">
                        <p className="font-semibold text-slate-900">{nomCandidat || "Candidat"}</p>
                        {coordonneesVisibles.map((ligne) => (
                          <p key={ligne}>{ligne}</p>
                        ))}
                      </div>
                    </div>
                    <div
                      className="mt-6 space-y-5 text-[15px] leading-8 text-slate-800 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
                      dangerouslySetInnerHTML={{ __html: sanitizeLetterHtml(lettreHtml || plainTextToLetterHtml(lettreNettoyee)) }}
                    />
                    <div className="mt-8 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                      Astuce : relisez une dernière fois le ton, le nom de l'entreprise et la formule finale avant l'envoi.
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="dashboard-subcard p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Avant l'envoi</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Vérifiez les informations-clés pour garder un rendu crédible et propre.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {checklistAvantEnvoi.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dashboard-subcard p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Informations reprises</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Le PDF utilise vos coordonnées et les éléments de profil déjà disponibles.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {pointsProfil.length > 0 ? pointsProfil.map((item) => (
                        <span key={item} className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
                          {item}
                        </span>
                      )) : (
                        <span className="text-sm text-muted-foreground">
                          Complétez votre profil talent pour enrichir encore la lettre.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-subcard p-4 sm:p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Texte modifiable</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ajustez une phrase, raccourcissez un passage ou personnalisez la formule finale avant l'envoi.
                    </p>
                  </div>
                  <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                    Aperçu + édition
                  </span>
                </div>
                <LetterRichTextEditor
                  html={lettreHtml}
                  wordCount={wordCount}
                  minHeightClass="min-h-[320px]"
                  placeholder="Écrivez ou personnalisez votre lettre ici."
                  onChange={(html, plainText) => {
                    setLettreHtml(html);
                    setLettre(plainText);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="dashboard-subcard overflow-hidden border-primary/10 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_34%),linear-gradient(180deg,hsl(var(--background)/0.84),hsl(var(--secondary)/0.26))] p-4 sm:p-6">
                <div className="mx-auto w-full max-w-[760px] rounded-[32px] border border-slate-200/80 bg-white p-6 text-slate-900 shadow-[0_28px_80px_-38px_rgba(15,23,42,0.45)] sm:p-8">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Aperçu final</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">Votre lettre apparaîtra ici</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Mail className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="h-4 w-40 rounded-full bg-slate-200" />
                    <div className="h-6 w-4/5 rounded-full bg-slate-300/90" />
                    <div className="space-y-3 pt-4">
                      <div className="h-4 w-full rounded-full bg-slate-200" />
                      <div className="h-4 w-[96%] rounded-full bg-slate-200" />
                      <div className="h-4 w-[90%] rounded-full bg-slate-200" />
                      <div className="h-4 w-[94%] rounded-full bg-slate-200" />
                      <div className="h-4 w-[82%] rounded-full bg-slate-200" />
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-sm text-slate-500">
                      Remplissez le formulaire à gauche puis cliquez sur <span className="font-semibold text-slate-700">Générer ma lettre avec l'IA</span>.
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="dashboard-subcard p-5">
                  <p className="text-sm font-semibold">Pour un rendu vraiment lisible</p>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                    <div className="rounded-xl border border-primary/10 bg-background/40 px-4 py-3">
                      <span className="font-semibold text-foreground">1.</span> Choisissez le ton qui correspond au poste.
                    </div>
                    <div className="rounded-xl border border-primary/10 bg-background/40 px-4 py-3">
                      <span className="font-semibold text-foreground">2.</span> Ajoutez le poste, l'entreprise et vos points forts.
                    </div>
                    <div className="rounded-xl border border-primary/10 bg-background/40 px-4 py-3">
                      <span className="font-semibold text-foreground">3.</span> Relisez puis exportez le PDF prêt à envoyer.
                    </div>
                  </div>
                </div>
                <div className="dashboard-subcard p-5">
                  <p className="text-sm font-semibold">Ce qui sera repris automatiquement</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pointsProfil.length > 0 ? pointsProfil.map((item) => (
                      <span key={item} className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
                        {item}
                      </span>
                    )) : (
                      <span className="text-sm text-muted-foreground">Votre profil complété permettra d'obtenir une lettre encore plus précise.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalentDashboard;
