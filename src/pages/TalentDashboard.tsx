import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";
import { Switch } from "@/components/ui/switch";
import { Sparkles, FileText, Target, FolderOpen, LogOut, User, BarChart3, Mail, Plus, Camera, Upload, CheckCircle, Trash2, Send, MessageSquare, ChevronDown, ChevronUp, Search, ClipboardList, Menu, X, MapPin, ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emailNouvelleCandiature, emailNouveauMessage, emailNotificationEntreprise } from "@/lib/emails";
import { REQUESTABLE_DOCUMENTS, getRequestStatusMeta } from "@/lib/documentRequests";
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

// ─── Tabs (sans badge offres) ─────────────────────────────────────────────────
const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "profile", label: "Mon Profil", icon: User },
  { id: "cv", label: "Mon CV", icon: FileText },
  { id: "offres", label: "Offres matchées", icon: Target },
  { id: "mes-candidatures", label: "Mes candidatures", icon: ClipboardList },
  { id: "messagerie", label: "Messagerie", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "lettre", label: "Lettre de motivation", icon: Mail },
];

const getPermisArray = (permis: any): string[] => {
  if (!permis) return [];
  if (Array.isArray(permis)) return permis.filter((p: string) => p.trim() !== "");
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(permis);
  } catch {
    parsed = null;
  }
  if (Array.isArray(parsed)) return parsed.filter((p: string) => p.trim() !== "");
  return permis.split(",").map((p: string) => p.trim()).filter((p: string) => p !== "");
};

const getCompetencesArray = (competences: string | null | undefined): string[] => {
  if (!competences) return [];
  return competences
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

const getOfferPreviewText = (description?: string | null, limit = 220): string => {
  if (!description) return "Le descriptif du poste apparaîtra ici une fois l'offre ouverte.";
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trimEnd()}...`;
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

// ─── TalentDashboard ──────────────────────────────────────────────────────────
const TalentDashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [cvScore, setCvScore] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [nbMessagesNonLus, setNbMessagesNonLus] = useState(0);
  const [nbCandidaturesMaj, setNbCandidaturesMaj] = useState(0);
  const [nbDocumentsDemandes, setNbDocumentsDemandes] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const candidatureSignalKey = user ? `spotted-talent:talen-candidatures:${user.id}` : "";
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || "Dashboard";

  useEffect(() => { if (!loading && !user) navigate("/talent"); }, [loading, user, navigate]);

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
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("destinataire_id", user.id).eq("lu", false);
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
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (<img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={() => setAvatarUrl(null)} />) : (<User className="w-10 h-10 text-primary/60" />)}
            </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background hover:bg-primary/80 transition-colors cursor-pointer">
              <Camera className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file || !user) return;
                const ext = file.name.split(".").pop();
                const path = `${user.id}/avatar.${ext}`;
                const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
                if (!error) { const { data } = supabase.storage.from("avatars").getPublicUrl(path); setAvatarUrl(data.publicUrl + "?t=" + Date.now()); toast.success("Photo mise à jour !"); }
              }} />
            </label>
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">{profile?.full_name || user?.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Talent</span>
          </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setActiveTab(id); setMobileNavOpen(false); if (id === "messagerie") setNbMessagesNonLus(0); if (id === "mes-candidatures") void marquerCandidaturesCommeVues(); }}
              className={`dashboard-nav-item ${activeTab === id ? "dashboard-nav-item-primary-active" : ""}`}>
              <Icon className="w-4 h-4" />
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
        <div className="p-4 border-t border-border/50">
          <Button variant="ghost-glow" size="sm" className="w-full" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </aside>
      <main className="dashboard-main min-h-screen flex-1 px-4 pb-8 pt-20 sm:px-6 lg:ml-64 lg:p-8">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-card/80 text-foreground shadow-sm transition-colors hover:border-primary/30"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Espace talent</p>
            <p className="truncate text-sm font-semibold text-foreground">{activeTabLabel}</p>
          </div>
        </div>
        {activeTab === "dashboard" && <DashboardHome profile={profile} cvScore={cvScore} user={user} onNavigateTab={setActiveTab} />}
        {activeTab === "profile" && <ProfileTab profile={profile} user={user} avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />}
        {activeTab === "cv" && <CVTab onScoreUpdate={setCvScore} />}
        {activeTab === "offres" && <OffresTab user={user} />}
        {activeTab === "mes-candidatures" && <MesCandidaturesTab user={user} />}
        {activeTab === "messagerie" && <MessagerieTab user={user} />}
        {activeTab === "documents" && <DocumentsTab />}
        {activeTab === "lettre" && <LettreTab />}
      </main>
    </div>
  );
};

// ─── DashboardHome ────────────────────────────────────────────────────────────
const DashboardHome = ({ profile, cvScore, user, onNavigateTab }: any) => {
  const [stats, setStats] = useState({ candidatures: 0, acceptees: 0, refusees: 0, messages: 0, offres: 0, documentsDemandes: 0 });

  useEffect(() => {
    const chargerStats = async () => {
      if (!user) return;
      const { data: cands } = await supabase.from("candidatures").select("statut").eq("talent_id", user.id);
      const { count: msgs } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("destinataire_id", user.id).eq("lu", false);
      const { count: offres } = await supabase
        .from("offres")
        .select("*", { count: "exact", head: true })
        .eq("statut", "active")
        .not("entreprise_id", "is", null);
      const { count: documentsDemandes } = await supabase
        .from("document_requests")
        .select("*", { count: "exact", head: true })
        .eq("talent_id", user.id)
        .eq("status", "requested");

      setStats({
        candidatures: cands?.length || 0,
        acceptees: cands?.filter((c) => c.statut === "acceptee").length || 0,
        refusees: cands?.filter((c) => c.statut === "refusee").length || 0,
        messages: msgs || 0,
        offres: offres || 0,
        documentsDemandes: documentsDemandes || 0,
      });
    };

    chargerStats();
  }, [user]);

  const reponsesTraitees = stats.acceptees + stats.refusees;
  const tauxReponse = stats.candidatures > 0 ? Math.round((reponsesTraitees / stats.candidatures) * 100) : 0;
  const primaryAlert = stats.documentsDemandes > 0
    ? `${stats.documentsDemandes} document(s) sont attendus par une entreprise.`
    : stats.messages > 0
      ? `${stats.messages} message(s) méritent une réponse rapide.`
      : stats.acceptees > 0
        ? `${stats.acceptees} candidature(s) acceptée(s) ouvrent vos dossiers partagés.`
        : "Votre espace est à jour pour le moment.";

  const actions = [
    {
      id: "documents",
      title: "Documents demandés",
      value: stats.documentsDemandes,
      description: stats.documentsDemandes > 0 ? "Des pièces sont attendues par une entreprise." : "Aucune pièce urgente à envoyer pour le moment.",
      button: stats.documentsDemandes > 0 ? "Envoyer maintenant" : "Voir mes documents",
      icon: FolderOpen,
      tone: "text-amber-600 dark:text-amber-300 border-amber-500/20 bg-amber-500/10",
    },
    {
      id: "messagerie",
      title: "Messages non lus",
      value: stats.messages,
      description: stats.messages > 0 ? "Des entreprises attendent peut-être votre réponse." : "Votre messagerie est à jour.",
      button: "Ouvrir la messagerie",
      icon: MessageSquare,
      tone: "text-sky-600 dark:text-sky-300 border-sky-500/20 bg-sky-500/10",
    },
    {
      id: "mes-candidatures",
      title: "Candidatures acceptées",
      value: stats.acceptees,
      description: stats.acceptees > 0 ? "Vos dossiers partagés sont actifs pour ces candidatures." : "Aucune candidature acceptée pour le moment.",
      button: "Voir mes candidatures",
      icon: ClipboardList,
      tone: "text-emerald-600 dark:text-emerald-300 border-emerald-500/20 bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <BarChart3 className="h-3.5 w-3.5" />
              Cockpit talent
            </div>
            <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
              Bienvenue, <span className="gradient-text">{profile?.full_name || "Talent"}</span>
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Votre espace personnel pour suivre vos candidatures, garder vos documents à jour et avancer plus vite dans votre recherche.
            </p>
          </div>
          <div className="dashboard-subcard p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Profil actif</p>
                <p className="text-sm font-semibold text-foreground">{profile?.poste || "Profil en cours de complétion"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">Priorité du moment</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{primaryAlert}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="dashboard-subcard px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Contrat visé</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{profile?.contrat || "À définir"}</p>
              </div>
              <div className="dashboard-subcard px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Localisation</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{profile?.localisation || "À préciser"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="dashboard-stat-card p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <p className="mb-1 text-xs text-muted-foreground">Score de votre CV</p>
          <p className="text-3xl font-bold gradient-text">{cvScore ?? "--"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{cvScore ? "Sur 100 points" : "Ajoutez votre CV pour obtenir un score"}</p>
        </div>

        <div className="dashboard-stat-card p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <p className="mb-1 text-xs text-muted-foreground">Candidatures envoyées</p>
          <p className="text-3xl font-bold gradient-text">{stats.candidatures}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.acceptees} acceptée(s) · {stats.refusees} refusée(s)</p>
        </div>

        <div className="dashboard-stat-card p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <p className="mb-1 text-xs text-muted-foreground">Offres disponibles</p>
          <p className="text-3xl font-bold gradient-text">{stats.offres}</p>
          <p className="mt-1 text-xs text-muted-foreground">Offres actives sur la plateforme</p>
        </div>
        <div className="dashboard-stat-card p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mb-1 text-xs text-muted-foreground">Taux de réponse</p>
          <p className="text-3xl font-bold gradient-text">{tauxReponse}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Des entreprises ont répondu à vos candidatures</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="dashboard-panel p-6">
          <p className="mb-4 text-sm font-semibold">Suivi de votre recherche</p>
          <div className="space-y-4">
            <div className="dashboard-subcard p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Messages non lus</p>
                  <p className="mt-2 text-2xl font-bold">{stats.messages}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {stats.messages > 0 ? "Des réponses vous attendent dans la messagerie." : "Votre messagerie est à jour."}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10">
                  <MessageSquare className="h-5 w-5 text-red-400" />
                </div>
              </div>
            </div>
            <div className="dashboard-subcard p-4">
              <p className="text-sm font-semibold">État de vos candidatures</p>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Acceptées</span>
                    <span className="text-emerald-300">{stats.acceptees}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: stats.candidatures > 0 ? `${(stats.acceptees / stats.candidatures) * 100}%` : "0%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Refusées</span>
                    <span className="text-red-300">{stats.refusees}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-red-500" style={{ width: stats.candidatures > 0 ? `${(stats.refusees / stats.candidatures) * 100}%` : "0%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Documents demandés</span>
                    <span className="text-amber-300">{stats.documentsDemandes}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: stats.candidatures > 0 ? `${Math.min((stats.documentsDemandes / Math.max(stats.candidatures, 1)) * 100, 100)}%` : "0%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel p-6">
          <div className="mb-4">
            <p className="text-lg font-semibold">Priorités du moment</p>
            <p className="text-sm text-muted-foreground">Les prochaines actions utiles pour avancer rapidement sans chercher dans tous les onglets.</p>
          </div>
          <div className="space-y-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.id} className="dashboard-subcard flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${action.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{action.title}</p>
                      <p className="mt-1 text-2xl font-bold">{action.value}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost-glow" size="sm" className="w-full sm:w-auto" onClick={() => onNavigateTab(action.id)}>
                    {action.button}
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
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: "Tu es un expert RH. Redige une courte presentation professionnelle en 2-3 phrases maximum, a la premiere personne, en francais simple." }, { role: "user", content: `Redige une presentation pour: Prenom: ${prenom}, Poste: ${poste}, Secteur: ${secteur}, Competences: ${competences}, Localisation: ${localisation}` }], temperature: 0.7, max_tokens: 200 }) });
      const data = await response.json();
      setBio(data.choices[0].message.content);
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
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
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

  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <User className="h-3.5 w-3.5" />
              Identité talent
            </div>
            <h2 className="mb-2 text-2xl font-bold sm:text-3xl">Mon Profil</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Ces informations seront visibles par les entreprises qui consultent votre candidature et votre dossier.
            </p>
          </div>
          <div className="dashboard-subcard p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Complétion du profil</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{completionScore}%</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{completionStatus}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-accent transition-all" style={{ width: `${completionScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-stat-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Poste visé</p>
          <p className="mt-2 text-lg font-bold">{poste || "À préciser"}</p>
        </div>
        <div className="dashboard-stat-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Disponibilité</p>
          <p className="mt-2 text-lg font-bold">{availabilityLabel}</p>
        </div>
        <div className="dashboard-stat-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Contrat</p>
          <p className="mt-2 text-lg font-bold">{contrat || "À définir"}</p>
        </div>
        <div className="dashboard-stat-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Localisation</p>
          <p className="mt-2 text-lg font-bold">{localisation || "À préciser"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="dashboard-panel space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-foreground">Coordonnées et identité</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              C'est la partie que les entreprises voient en premier. Gardez-la claire et rassurante.
            </p>
          </div>
          <div className="flex flex-col gap-4 border-b border-border/50 pb-5 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-primary/60" />}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background cursor-pointer hover:bg-primary/80 transition-colors">
                <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !user) return; const ext = file.name.split(".").pop(); const path = `${user.id}/avatar.${ext}`; const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true }); if (!error) { const { data } = supabase.storage.from("avatars").getPublicUrl(path); setAvatarUrl(data.publicUrl + "?t=" + Date.now()); toast.success("Photo mise à jour !"); } }} />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-bold">{prenom} {nom || profile?.full_name || "Votre nom"}</h3>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {contrat || "Contrat à définir"}
                </span>
                {secteur && (
                  <span className="rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {secteur}
                  </span>
                )}
                {availabilityType && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {formatTalentAvailabilityLabel(availabilityType, availabilityDetail)}
                  </span>
                )}
              </div>
              <p className="text-xs text-primary mt-1">Cliquez sur la photo pour la changer</p>
            </div>
          </div>

          <div className="space-y-4">
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
            <div>
              <label className="text-sm font-medium mb-1 block">Ou habitez-vous ?</label>
              <input value={localisation} onChange={(e) => setLocalisation(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50" placeholder="Ex: Lyon, Grenoble..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Adresse complète</label>
              <input value={adresse} onChange={(e) => setAdresse(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50" placeholder="Ex: 12 rue de la Paix, 75001 Paris" />
            </div>
          </div>
        </div>

        <div className="dashboard-panel space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold text-foreground">Positionnement professionnel</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Aidez les recruteurs à comprendre rapidement ce que vous cherchez, votre rythme et vos points forts.
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Des opportunités à la hauteur de votre talent</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recevez les nouvelles opportunités correspondant à votre talent, à votre profil et à vos objectifs professionnels.
                </p>
              </div>
              <Switch checked={notificationOffresEmail} onCheckedChange={setNotificationOffresEmail} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium block">Présentez-vous en quelques mots</label>
                <button onClick={genererBio} disabled={generatingBio} className="dashboard-inline-link">
                  <Sparkles className="w-3 h-3" />{generatingBio ? "Génération..." : "Générer avec l'IA"}
                </button>
              </div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={8} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 resize-none" placeholder="Ex : J'ai 5 ans d'expérience en livraison et je suis sérieux et ponctuel." />
            </div>
          </div>

          <div className="dashboard-subcard p-4">
            <p className="text-sm font-semibold">Ce que voit une entreprise</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Votre poste, votre secteur, vos compétences, votre localisation, votre disponibilité et votre présentation aident les recruteurs à comprendre rapidement votre profil.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Poste clair</span>
              <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs font-semibold text-muted-foreground">Compétences visibles</span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Disponibilité lisible</span>
            </div>
          </div>

          <Button variant="glow" size="lg" className="w-full" onClick={sauvegarder} disabled={saving}>{saving ? "Sauvegarde en cours..." : "Sauvegarder mon profil"}</Button>
        </div>
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

const CVTab = ({ onScoreUpdate }: any) => {
  const [fichier, setFichier] = useState<File | null>(null);
  const [analyse, setAnalyse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyserCV = async () => {
    if (!fichier) return toast.error("Ajoutez d'abord votre CV.");
    setLoading(true);
    try {
      const texte = await fichier.text();
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                'Tu es un expert RH et coach CV. Reponds UNIQUEMENT en JSON valide avec cette structure: {"score_global":75,"niveau":"Prometteur","resume":"resume simple et pedagogique en 2 ou 3 phrases","lecture_recruteur":"ce qu un recruteur comprend en quelques secondes","categories":[{"nom":"Presentation","score":80,"explication":"explication simple"},{"nom":"Contenu","score":60,"explication":"explication simple"},{"nom":"Competences","score":55,"explication":"explication simple"},{"nom":"Impact recruteur","score":58,"explication":"explication simple"}],"points_forts":[{"titre":"titre court","detail":"explication concrete"}],"points_faibles":[{"titre":"titre court","detail":"explication concrete"}],"ameliorations_prioritaires":["action concrete 1","action concrete 2","action concrete 3"],"sections_manquantes":["section 1","section 2"],"mots_cles_a_ajouter":["mot 1","mot 2"],"exemples_amelioration":[],"conseil_debutant":"conseil rassurant et utile pour un candidat debutant"}. Les explications doivent etre simples, humaines, precises et actionnables. Les exemples doivent toujours rester lies au contenu reel du CV. Si tu n as pas d exemple fiable et concret, renvoie un tableau vide.',
            },
            {
              role: "user",
              content: `Analyse ce CV et explique clairement ce qui est bien, ce qui est faible et ce qu il faut ameliorer en priorite: ${texte.slice(0, 5000)}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1600,
        }),
      });
      const data = await response.json();
      const contenu = data?.choices?.[0]?.message?.content || "";
      const jsonMatch = contenu.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Reponse IA invalide");
      const result = normalizeCvAnalysis(JSON.parse(jsonMatch[0]));
      setAnalyse(result);
      onScoreUpdate(result.score_global);
      toast.success("CV analysé !");
    } catch (err) { toast.error("Erreur lors de l'analyse."); } finally { setLoading(false); }
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
  return (
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <FileText className="h-3.5 w-3.5" />
              Analyse CV IA
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Mon CV</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Ajoutez votre CV pour obtenir un diagnostic clair, savoir ce qu'un recruteur comprend
              vraiment et repérer les corrections les plus utiles avant d'envoyer vos candidatures.
            </p>
          </div>

          <div className="dashboard-subcard p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Lecture rapide</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-stat-card border border-primary/20 bg-primary/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Score global</p>
          <p className="mt-2 text-3xl font-bold">{analyse ? scoreGlobal : "--"}</p>
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
          <p className="mt-2 text-3xl font-bold text-foreground">{actionsPrioritaires.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Conseils concrets à appliquer en premier.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
        <div className="space-y-4">
          <div
            className="dashboard-panel flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed border-primary/20 p-8 text-center transition-colors hover:border-primary/40"
            onClick={() => document.getElementById("cv-upload")?.click()}
          >
            <input id="cv-upload" type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={(e) => setFichier(e.target.files?.[0] || null)} />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {fichier ? <CheckCircle className="h-8 w-8 text-green-400" /> : <Upload className="h-8 w-8 text-primary" />}
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

        <div className="dashboard-panel p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold">Résultat de l'analyse</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Un rendu simple à comprendre pour améliorer votre CV sans vous perdre dans des détails techniques.
              </p>
            </div>
            {cvStatus && (
              <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${cvStatus.className}`}>
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
                    <p className="text-5xl font-bold gradient-text">{scoreGlobal}</p>
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
const OffresTab = ({ user }: any) => {
  const [offres, setOffres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  const contrats = ["Tous", "CDI", "CDI Cadre", "CDD", "CDD - Court terme (jusqu'à 3 mois)", "CDD - Court terme (jusqu'à 6 mois)", "CDD Renouvelable", "Intérim", "Freelance", "Stage", "Alternance", "Contrat de professionnalisation", "Contrat étudiant", "Service civique", "Intermittent"];
  const diplomes = ["Tous", "Sans diplôme", "CAP", "BEP", "Bac Pro", "BTS", "Licence", "Master", "Doctorat"];

  useEffect(() => { chargerOffres(); chargerCandidatures(); chargerProfil(); }, []);

  const chargerOffres = async () => {
    const { data } = await supabase
      .from("offres")
      .select("*")
      .eq("statut", "active")
      .not("entreprise_id", "is", null)
      .order("created_at", { ascending: false });
    setOffres(data || []);
    setLoading(false);
  };
  const chargerProfil = async () => { if (!user) return; const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single(); if (data) setProfilTalent(data); };
  const chargerCandidatures = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data } = await supabase.from("candidatures").select("offre_id").eq("talent_id", user.id); setCandidatures((data || []).map((c: any) => c.offre_id)); };

  const reinitialiserFiltres = () => {
    setRecherche("");
    setFiltre("Tous");
    setFiltreSecteur("");
    setFiltreVille("");
    setFiltreDiplome("Tous");
    setFiltreSalaireMin("");
    setFiltreSalaireMax("");
  };

  const postuler = async (offreId: string) => {
    if (postulant) return;
    setPostulant(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setPostulant(false);
      return toast.error("Connectez-vous pour postuler.");
    }
    const { error } = await supabase.from("candidatures").insert({ offre_id: offreId, talent_id: currentUser.id, statut: "envoyee" });
    if (error) {
      setPostulant(false);
      if (error.code === "23505") return toast.error("Vous avez déjà postulé à cette offre.");
      return toast.error("Une erreur est survenue pendant la candidature.");
    }
    setCandidatures(prev => [...prev, offreId]);
    toast.success("Candidature envoyée.");
    try {
      const { data: offreData } = await supabase.from("offres").select("titre, entreprise_id").eq("id", offreId).single();
      if (offreData) {
        if (currentUser.email) await emailNouvelleCandiature(currentUser.email, offreData.titre);
        if (offreData.entreprise_id) { const { data: ep } = await supabase.from("profiles").select("email").eq("user_id", offreData.entreprise_id).single(); if (ep?.email) await emailNotificationEntreprise(ep.email, offreData.titre); }
      }
    } catch (err) { console.error("Erreur email:", err); } finally { setPostulant(false); }
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
    ...offres.map((offre: any) => offre.secteur),
    ...localisationSuggestions,
  ]);

  const offresFiltrees = offres
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
    .sort((a, b) => b._score - a._score);

  // Compteurs bandeaux info
  const il7Jours = new Date(); il7Jours.setDate(il7Jours.getDate() - 7);
  const nbNouvellesAujourdhui = offres.filter(o => new Date(o.created_at) > new Date(new Date().setHours(0, 0, 0, 0))).length;
  const nbNouvellesSemaine = offres.filter(o => new Date(o.created_at) > il7Jours).length;
  const nbMatchsForts = offresFiltrees.filter((offre) => offre._score >= 70).length;
  const nbOffresUrgentes = offresFiltrees.filter((offre) => Boolean(offre.urgent)).length;
  const nbOffresAvecSalaire = offresFiltrees.filter((offre) => offre.salaire_min !== null || offre.salaire_max !== null).length;
  const meilleurScoreVisible = offresFiltrees.length > 0 ? Math.max(...offresFiltrees.map((offre) => offre._score)) : 0;
  const contratActif = filtre === "Tous" ? "Tous les contrats" : filtre;

  return (
    <div className="space-y-6">
      <div className="dashboard-hero-card relative overflow-hidden">
        <div className="absolute -left-16 top-6 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-accent/12 blur-3xl" />
        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_340px] xl:items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Offres matchées
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold sm:text-3xl">Les opportunités les plus pertinentes pour votre profil</h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                Repérez plus vite les annonces qui collent à votre contrat, votre secteur, votre localisation
                et vos compétences.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {nbNouvellesAujourdhui > 0 && (
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
                  {nbNouvellesAujourdhui} nouvelle(s) aujourd'hui
                </span>
              )}
              {nbNouvellesSemaine > 0 && (
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                  {nbNouvellesSemaine} ajoutée(s) cette semaine
                </span>
              )}
              {nbOffresUrgentes > 0 && (
                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
                  {nbOffresUrgentes} offre(s) urgentes
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="dashboard-stat-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Offres visibles</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{offresFiltrees.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Après application de vos filtres.</p>
            </div>
            <div className="dashboard-stat-card p-4 border-primary/20 bg-primary/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Match le plus fort</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-3xl font-bold text-primary">{meilleurScoreVisible}%</p>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {contratActif}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Meilleure compatibilité parmi les annonces visibles.</p>
            </div>
            <div className="dashboard-stat-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Avec salaire</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{nbOffresAvecSalaire}</p>
              <p className="mt-1 text-xs text-muted-foreground">Annonces avec une indication salariale.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-panel relative z-20 overflow-visible p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

        <div className="mb-5 rounded-3xl border border-border/60 bg-secondary/10 p-4 sm:p-5">
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

        <div className="relative z-30 grid gap-4 md:grid-cols-2 xl:grid-cols-5 xl:items-start">
          <div className="dashboard-subcard space-y-2 p-4">
            <label className="block text-sm text-muted-foreground">Secteur d'activité</label>
            <AutocompleteFilter
              value={filtreSecteur}
              onChange={setFiltreSecteur}
              suggestions={secteursSuggestions}
              placeholder="Ex. Transport & Mobilité"
            />
          </div>
          <div className="dashboard-subcard space-y-2 p-4">
            <label className="block text-sm text-muted-foreground">Ville, dép. ou code postal</label>
            <LocationAutocompleteFilter
              value={filtreVille}
              onChange={setFiltreVille}
              suggestions={localisationSuggestions}
              placeholder="Tapez une ville ou un code postal..."
            />
          </div>
          <div className="dashboard-subcard space-y-2 p-4">
            <label className="block text-sm text-muted-foreground">Niveau de diplôme requis</label>
            <select
              value={filtreDiplome}
              onChange={(e) => setFiltreDiplome(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
            >
              {diplomes.map((diplome) => (
                <option key={diplome} value={diplome}>{diplome}</option>
              ))}
            </select>
          </div>
          <div className="dashboard-subcard space-y-2 p-4">
            <label className="block text-sm text-muted-foreground">Salaire minimum</label>
            <input
              value={filtreSalaireMin}
              onChange={(e) => setFiltreSalaireMin(e.target.value)}
              type="number"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
              placeholder="Ex. 1800"
            />
          </div>
          <div className="dashboard-subcard space-y-2 p-4">
            <label className="block text-sm text-muted-foreground">Salaire maximum</label>
            <input
              value={filtreSalaireMax}
              onChange={(e) => setFiltreSalaireMax(e.target.value)}
              type="number"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
              placeholder="Ex. 2500"
            />
          </div>
        </div>
      </div>

      <div className="dashboard-panel relative z-10 p-4 sm:p-5">
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
        <div className="flex flex-wrap gap-2">
          {contrats.map((c) => (
            <button
              key={c}
              onClick={() => setFiltre(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
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
      {loading ? (
        <div className="dashboard-empty-card p-12">
          <p className="text-muted-foreground">Chargement des offres...</p>
        </div>
      ) : offresFiltrees.length === 0 ? (
        <div className="dashboard-empty-card p-12">
          <Target className="mb-4 h-16 w-16 text-primary/30" />
          <h3 className="mb-2 text-lg font-bold">Aucune offre trouvée</h3>
          <p className="text-sm text-muted-foreground">
            Essayez un autre mot-clé, un autre contrat ou une autre localisation.
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
                className={`dashboard-panel overflow-hidden transition-all duration-300 ${
                  offreOuverte === offre.id
                    ? "border-primary/40 shadow-[0_28px_70px_-52px_hsl(var(--primary)/0.45)]"
                    : "hover:-translate-y-0.5 hover:border-primary/20"
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-90" />
                <div className="p-5 sm:p-6">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-xl font-bold text-foreground">{offre.titre}</h3>
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
                            {offre.contrat || "Contrat non précisé"}
                          </span>
                          {profilTalent && (
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeScore.className}`}>
                              {badgeScore.label}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {offre.localisation || "Non précisé"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <ClipboardList className="h-3.5 w-3.5" />
                            {formatDateRelative(offre.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Secteur</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{offre.secteur || "Non précisé"}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Diplôme</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{offre.diplome || "Non précisé"}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Salaire</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatSalaireRange(offre.salaire_min, offre.salaire_max)}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Permis</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{permis.length > 0 ? permis.join(", ") : "Non précisé"}</p>
                        </div>
                      </div>

                      {offre.avantages && (
                        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-300">Avantages</p>
                          <p className="mt-2 text-sm leading-6 text-green-100/90">{offre.avantages}</p>
                        </div>
                      )}

                      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Aperçu du poste</p>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">{getOfferPreviewText(offre.description)}</p>
                      </div>

                      {competences.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Compétences attendues</p>
                          <div className="flex flex-wrap gap-2">
                            {competences.map((competence: string, index: number) => (
                              <span key={`${competence}-${index}`} className="rounded-full border border-border/60 bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                                {competence}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="dashboard-subcard flex h-full flex-col justify-between gap-5 border-primary/10 bg-primary/5 p-5">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Compatibilité</p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className={`inline-flex rounded-2xl px-3 py-2 text-lg font-bold ${badgeScore.className}`}>
                              {badgeScore.label}
                            </div>
                            <span className="text-2xl font-bold text-foreground">{offre._score}%</span>
                          </div>
                          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background/60">
                            <div className={`h-full rounded-full bg-gradient-to-r ${scoreBarClass}`} style={{ width: `${Math.max(10, offre._score)}%` }} />
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Score basé sur votre profil, le contrat, la localisation et les compétences demandées.
                          </p>
                        </div>
                        <div className="grid gap-3">
                          <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Compétences</p>
                            <p className="mt-2 text-sm font-semibold text-foreground">
                              {competences.length > 0 ? `${competences.length} compétence(s)` : "Profil ouvert"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Candidature</p>
                            <p className="mt-2 text-sm font-semibold text-foreground">
                              {isApplied ? "Déjà envoyée" : "Encore disponible"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Localisation</p>
                            <p className="mt-2 text-sm font-semibold text-foreground">
                              {offre.localisation || "Non précisé"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button className="w-full h-11" variant={isApplied ? "ghost-glow" : "glow"} size="sm" disabled={isApplied || postulant} onClick={() => postuler(offre.id)}>
                          {isApplied ? "Déjà postulé" : "Postuler"}
                        </Button>
                        <Button variant="ghost-glow" size="sm" className="w-full h-11" onClick={() => setOffreOuverte(offreOuverte === offre.id ? null : offre.id)}>
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
                    <div className="mt-6 space-y-5 border-t border-border/50 pt-5">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Secteur d'activité</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{offre.secteur || "Non précisé"}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Niveau de diplôme requis</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{offre.diplome || "Non précisé"}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Salaire brut mensuel</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatSalaireRange(offre.salaire_min, offre.salaire_max)}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Localisation</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{offre.localisation || "Non précisé"}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                        <div className="dashboard-subcard p-5">
                          <h4 className="mb-3 text-base font-semibold text-foreground">Description complète du poste</h4>
                          <div className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                            {offre.description || "La description détaillée sera ajoutée prochainement."}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {competences.length > 0 && (
                            <div className="dashboard-subcard p-5">
                              <h4 className="mb-3 text-base font-semibold text-foreground">Compétences requises</h4>
                              <div className="flex flex-wrap gap-2">
                                {competences.map((competence, index) => (
                                  <span key={`${competence}-${index}`} className="rounded-full border border-border/60 bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                                    {competence}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {permis.length > 0 && (
                            <div className="dashboard-subcard p-5">
                              <h4 className="mb-3 text-base font-semibold text-foreground">Permis demandés</h4>
                              <div className="flex flex-wrap gap-2">
                                {permis.map((permit) => (
                                  <span key={permit} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                                    {permit}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {!isApplied && (
                            <Button variant="glow" className="w-full" disabled={postulant} onClick={() => postuler(offre.id)}>
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
      .select("*, offre:offre_id(titre, contrat, localisation, salaire_min, salaire_max, urgent, description, avantages, competences, permis_requis, diplome, secteur)")
      .eq("talent_id", user.id)
      .order("created_at", { ascending: false });
    setCandidatures(data || []);
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
        return "Votre dossier est en cours d'étude. Gardez votre messagerie ouverte pour répondre rapidement.";
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
    <div className="space-y-6">
      <div className="dashboard-panel p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <ClipboardList className="h-3.5 w-3.5" />
              Suivi de vos candidatures
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Mes candidatures</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Gardez un suivi net de vos réponses, repérez les dossiers qui avancent
              et revenez sur chaque offre sans perdre le fil de votre recherche.
            </p>
          </div>
          <div className="dashboard-subcard p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Point de suivi</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-stat-card border border-primary/20 bg-primary/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Candidatures envoyées</p>
          <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tous vos dossiers en cours ou clôturés.</p>
        </div>
        <div className="dashboard-stat-card border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">En cours</p>
          <p className="mt-2 text-3xl font-bold text-blue-300">{stats.enCours}</p>
          <p className="mt-1 text-xs text-muted-foreground">Dossiers en mouvement chez les entreprises.</p>
        </div>
        <div className="dashboard-stat-card border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Acceptées</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">{stats.acceptees}</p>
          <p className="mt-1 text-xs text-muted-foreground">Candidatures retenues à suivre de près.</p>
        </div>
        <div className="dashboard-stat-card border border-accent/20 bg-accent/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Taux de réponse</p>
          <p className="mt-2 text-3xl font-bold">{tauxReponse}%</p>
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
        <div className="dashboard-empty-card p-12">
          <ClipboardList className="w-16 h-16 text-primary/30 mb-4" />
          <h3 className="font-bold text-lg mb-2">Aucune candidature</h3>
          <p className="text-muted-foreground text-sm">Postulez à des offres pour les voir apparaître ici.</p>
        </div>
      ) : candidaturesFiltrees.length === 0 ? (
        <div className="dashboard-empty-card p-12">
          <Search className="w-16 h-16 text-primary/30 mb-4" />
          <h3 className="font-bold text-lg mb-2">Aucune candidature trouvée</h3>
          <p className="text-muted-foreground text-sm">Essayez un autre filtre ou une autre recherche pour retrouver le bon dossier.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidaturesFiltrees.map((c) => (
            <div key={c.id} className="dashboard-panel p-5 sm:p-6">
              <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-lg">{c.offre?.titre || "Offre supprimée"}</h3>
                    {c.offre?.urgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">URGENT</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatutStyle(c.statut)}`}>{getStatutLabel(c.statut)}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground flex-wrap mb-2">
                    {c.offre?.contrat && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {c.offre.contrat}</span>}
                    {c.offre?.localisation && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {c.offre.localisation}</span>}
                    {/* ✅ Date relative pour la candidature */}
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" /> Postulée {formatDateRelative(c.created_at).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60">
                      Secteur : {c.offre?.secteur || "Non précisé"}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60">
                      Diplôme : {c.offre?.diplome || "Non précisé"}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60">
                      Salaire : {formatSalaireRange(c.offre?.salaire_min, c.offre?.salaire_max)}
                    </span>
                  </div>
                  {offreOuverte === c.id && c.offre && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Secteur d'activité</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{c.offre.secteur || "Non précisé"}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Niveau de diplôme requis</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{c.offre.diplome || "Non précisé"}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Salaire brut mensuel</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatSalaireRange(c.offre.salaire_min, c.offre.salaire_max)}</p>
                        </div>
                        <div className="dashboard-subcard p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Localisation</p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{c.offre.localisation || "Non précisé"}</p>
                        </div>
                      </div>
                      {c.offre.avantages && (
                        <div className="dashboard-subcard p-4">
                          <p className="text-xs font-medium text-green-400 mb-1">Avantages</p>
                          <p className="text-sm text-muted-foreground leading-6">{c.offre.avantages}</p>
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
                          <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/30 rounded-lg p-4">{c.offre.description}</div>
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
    const { data } = await supabase.from("candidatures").select("*, offre:offre_id(titre, contrat, localisation)").eq("talent_id", user.id).order("created_at", { ascending: false });
    const conversationsData = data || [];
    setConversations(conversationsData);
    const counts: Record<string, number> = {};
    for (const c of conversationsData) {
      const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("candidature_id", c.id).eq("destinataire_id", user.id).eq("lu", false);
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
    const { data: offre } = await supabase.from("offres").select("entreprise_id").eq("id", convActive.offre_id).single();
    if (!offre) return;
    const { error } = await supabase.from("messages").insert({ expedition_id: user.id, destinataire_id: offre.entreprise_id, candidature_id: convActive.id, contenu: nouveau.trim() });
    if (!error) { setNouveau(""); chargerMessages(convActive.id); try { await emailNouveauMessage(user.email || "", "Un talent"); } catch (err) { console.error(err); } }
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
        return (
          titre.includes(needle) ||
          localisation.includes(needle) ||
          contrat.includes(needle) ||
          statut.includes(needle)
        );
      })
    : conversations;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Messagerie</h2>
      <p className="text-muted-foreground mb-6">Vos conversations avec les entreprises, avec un suivi plus clair entre messages reçus et changements de statut.</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="dashboard-stat-card p-4 border border-primary/20 bg-primary/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Conversations</p>
              <p className="mt-2 text-2xl font-bold">{conversations.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Candidatures avec échange actif.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="dashboard-stat-card p-4 border border-blue-500/20 bg-blue-500/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Messages non lus</p>
              <p className="mt-2 text-2xl font-bold">{totalNonLus}</p>
              <p className="mt-1 text-xs text-muted-foreground">Réponses reçues des entreprises.</p>
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
      <div className="grid gap-4 lg:h-[600px] lg:grid-cols-3 lg:gap-6">
        <div className={`dashboard-panel max-h-[360px] overflow-y-auto p-4 lg:max-h-none ${convActive ? "hidden lg:block" : ""}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Vos candidatures</p>
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
              placeholder="Rechercher une candidature..."
            />
          </div>
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Aucune candidature envoyée</p>
          ) : conversationsFiltrees.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun résultat.</p>
          ) : (
            conversationsFiltrees.map((c) => (
              <button key={c.id} onClick={() => ouvrirConversation(c)} className={`w-full text-left p-4 rounded-2xl border mb-2 transition-all ${convActive?.id === c.id ? "border-primary/25 bg-primary/12 shadow-[0_18px_42px_-30px_rgba(139,92,246,0.85)]" : "border-border/50 bg-secondary/25 hover:border-primary/20 hover:bg-secondary/60"}`}>
                <div className="mb-1 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{c.offre?.titre || "Offre"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.offre?.localisation || ""}</p>
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
                    Réponse reçue
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
                    <p className="mt-1 text-xs text-muted-foreground">{convActive.offre?.localisation} - {convActive.offre?.contrat}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${convActive.statut === "acceptee" ? "bg-green-500/10 text-green-400" : convActive.statut === "refusee" ? "bg-red-500/10 text-red-400" : convActive.statut === "entretien" ? "bg-blue-500/10 text-blue-400" : "bg-primary/10 text-primary"}`}>
                    {convActive.statut === "envoyee" ? "En attente" : convActive.statut === "entretien" ? "En cours d'étude" : convActive.statut === "acceptee" ? "Acceptée" : convActive.statut === "refusee" ? "Refusée" : convActive.statut}
                  </span>
                </div>
              </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center"><MessageSquare className="w-12 h-12 text-primary/20 mb-3" /><p className="text-sm font-medium">En attente d'un message de l'entreprise</p><p className="mt-1 text-xs text-muted-foreground">La conversation s'affichera ici dès que l'entreprise vous répondra.</p></div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.expedition_id === user.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-sm ${m.expedition_id === user.id ? "bg-primary text-white shadow-[0_18px_45px_-36px_rgba(59,130,246,0.65)]" : "bg-secondary/60 border border-border/50"}`}>
                        <p>{m.contenu}</p>
                        <p className="mt-1 text-[11px] opacity-70">{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {messages.length > 0 && (
                <div className="border-t border-border/50 p-4">
                  <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input value={nouveau} onChange={(e) => setNouveau(e.target.value)} onKeyDown={(e) => e.key === "Enter" && envoyerMessage()} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none" placeholder="Répondre..." />
                      <Button className="w-full sm:w-auto" variant="glow" size="sm" onClick={envoyerMessage}><Send className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Envoyer</span></Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm"><div className="text-center"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Sélectionnez une candidature pour voir les messages</p></div></div>
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
  const [documentsRequestsReady, setDocumentsRequestsReady] = useState(true);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [searchDossiers, setSearchDossiers] = useState("");
  const personalCategories = [
    { id: "cv", label: "Mon CV", icon: FileText, desc: "Votre CV sera visible par les recruteurs" },
    { id: "lettre", label: "Lettre de motivation", icon: Mail, desc: "Votre lettre de motivation" },
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
    const uploadKey = candidatureId ? `${categorie}-${candidatureId}` : categorie;
    setUploading(uploadKey);
    try { const path = candidatureId ? `${user.id}/${categorie}/${candidatureId}/${Date.now()}_${file.name}` : `${user.id}/${categorie}/${Date.now()}_${file.name}`; const { error } = await supabase.storage.from("documents").upload(path, file); if (error) throw error; toast.success("Document ajouté !"); chargerDocuments(); }
    catch (err: any) { toast.error(err.message); } finally { setUploading(null); e.target.value = ""; }
  };
  const uploadRequestedDocument = async (e: React.ChangeEvent<HTMLInputElement>, request: any) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    const uploadKey = `request-${request.id}`;
    setUploading(uploadKey);
    try {
      const nomPropre = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/shared-requested/${request.candidature_id}/${request.id}/${Date.now()}_${nomPropre}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) throw error;
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
      toast.error(err.message);
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };
  const ouvrirCheminStockage = async (storagePath: string | null | undefined) => {
    if (!storagePath) return;
    const { data } = await supabase.storage.from("documents").createSignedUrl(storagePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };
  const telechargerDocument = async (ownerId: string, categorie: string, nom: string, candidatureId?: string) => {
    if (!ownerId) return;
    const basePath = candidatureId ? `${ownerId}/${categorie}/${candidatureId}/${nom}` : `${ownerId}/${categorie}/${nom}`;
    const { data } = await supabase.storage.from("documents").createSignedUrl(basePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };
  const supprimerDocument = async (categorie: string, nom: string, candidatureId?: string) => {
    if (!user) return;
    const basePath = candidatureId ? `${user.id}/${categorie}/${candidatureId}/${nom}` : `${user.id}/${categorie}/${nom}`;
    const { error } = await supabase.storage.from("documents").remove([basePath]);
    if (!error) { toast.success("Document supprimé."); chargerDocuments(); }
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
  return (
    <div className="space-y-6">
      <div className="dashboard-hero-card mb-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold">Mes Documents</h2>
            <p className="max-w-2xl text-muted-foreground">
              Nous séparons vos documents personnels de vos dossiers partagés avec les entreprises pour garder un espace clair, sécurisé et plus simple à piloter.
            </p>
          </div>
          <div className="dashboard-subcard flex items-center gap-4 px-4 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Vue rapide</p>
              <p className="text-lg font-semibold text-foreground">
                {pendingRequests.length > 0
                  ? `${pendingRequests.length} document${pendingRequests.length > 1 ? "s" : ""} à envoyer`
                  : "Aucune pièce urgente à envoyer"}
              </p>
              <p className="text-xs text-muted-foreground">
                {sharedFolders.length} dossier{sharedFolders.length > 1 ? "s" : ""} partagé{sharedFolders.length > 1 ? "s" : ""} actif{sharedFolders.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="dashboard-stat-card border border-primary/20 bg-primary/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Documents personnels</p>
            <p className="mt-2 text-2xl font-bold">{personalCategories.reduce((sum, category) => sum + ((documents[category.id] || []).length > 0 ? 1 : 0), 0)}/{personalCategories.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">CV et lettre disponibles dans votre profil.</p>
          </div>
          <div className="dashboard-stat-card border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Demandes à traiter</p>
            <p className="mt-2 text-2xl font-bold">{pendingRequests.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Pièces administratives attendues par les entreprises.</p>
          </div>
          <div className="dashboard-stat-card border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Dossiers actifs</p>
            <p className="mt-2 text-2xl font-bold">{sharedFolders.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Candidatures acceptées avec partage de documents.</p>
          </div>
        </div>

        <div className="dashboard-panel p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="dashboard-subcard p-4">
              <p className="text-sm font-semibold">Documents personnels</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Conservez ici votre CV et votre lettre de motivation. Ce sont les documents de base de votre profil talent.
              </p>
            </div>

            <div className="dashboard-subcard p-4">
              <p className="text-sm font-semibold">Rechercher un dossier partagé</p>
              <div className="relative mt-3">
                <input
                  value={searchDossiers}
                  onChange={(e) => setSearchDossiers(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-primary/40"
                  placeholder="Entreprise, offre, ville ou document demandé..."
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                {searchDossiers && (
                  <button
                    onClick={() => setSearchDossiers("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {personalCategories.map(({ id, label, icon: Icon, desc }) => {
          const docs = documents[id] || [];
          return (
            <div key={id} className="dashboard-panel p-5 sm:p-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Icon className="w-5 h-5 text-primary" /></div><div><h3 className="font-semibold">{label}</h3><p className="text-xs text-muted-foreground">{desc}</p></div></div>
                <div><input type="file" id={`upload-${id}`} className="hidden" onChange={(e) => uploadDocument(e, id)} /><Button className="w-full sm:w-auto" variant="glow" size="sm" disabled={uploading === id} onClick={() => document.getElementById(`upload-${id}`)?.click()}><Plus className="w-3 h-3 mr-1" />{uploading === id ? "Ajout..." : "Ajouter"}</Button></div>
              </div>
              {docs.length === 0 ? (<p className="text-xs text-muted-foreground py-2">Aucun document, cliquez sur « Ajouter ».</p>) : (
                docs.map((doc) => (
                  <div key={doc.name} className="dashboard-subcard mb-2 flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm break-all sm:flex-1 sm:truncate">{doc.name.replace(/^\d+_/, "")}</span>
                    <div className="flex gap-2 self-start sm:self-auto">
                      <Button variant="ghost-glow" size="sm" onClick={() => telechargerDocument(user.id, id, doc.name)}>Ouvrir</Button>
                      <ConfirmActionDialog
                        title="Supprimer ce document ?"
                        description="Le fichier sera retiré de vos documents personnels. Vous pouvez encore annuler avant validation."
                        onConfirm={() => supprimerDocument(id, doc.name)}
                      >
                        <button className="text-red-400 p-1 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                      </ConfirmActionDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
        </div>

        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-5">
          <p className="text-sm font-semibold">Dossiers partagés avec les entreprises</p>
          <p className="mt-1 text-sm text-muted-foreground">Les dossiers partagés s'activent uniquement quand une candidature est acceptée. Les contrats, fiches de paie et documents d'intérim restent visibles seulement par l'entreprise concernée et par vous.</p>
          {!documentsRequestsReady && (
            <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              La fonctionnalité des documents demandés n'est pas encore activée dans la base. Il faut exécuter le SQL ajouté pour voir les demandes de l'entreprise.
            </p>
          )}
        </div>

        {documentsRequestsReady && pendingRequests.length > 0 && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-300">Documents demandés par les entreprises</p>
                <p className="mt-1 text-sm text-muted-foreground">Vous avez {pendingRequests.length} document(s) à envoyer. Ces demandes apparaissent ici pour que vous les retrouviez tout de suite.</p>
              </div>
              <span className="w-fit rounded-full border border-amber-500/20 bg-background/60 px-3 py-1 text-xs font-medium text-amber-300">
                {pendingRequests.length} à traiter
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {pendingRequests.map((request: any) => {
                const requestDefinition = REQUESTABLE_DOCUMENTS.find((document) => document.key === request.document_key);
                const inputId = `pending-request-${request.id}`;
                const uploadKey = `request-${request.id}`;

                return (
                  <div key={request.id} className="rounded-2xl border border-amber-500/20 bg-background/50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{request.document_label}</p>
                          <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                            En attente
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{requestDefinition?.desc || "Document administratif demandé pour votre dossier."}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{request.entrepriseNom} - {request.offreTitre}</p>
                      </div>
                      <div className="flex w-full items-center gap-2 sm:w-auto">
                        <input type="file" id={inputId} className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => uploadRequestedDocument(e, request)} />
                        <Button className="w-full sm:w-auto" variant="glow" size="sm" disabled={uploading === uploadKey} onClick={() => document.getElementById(inputId)?.click()}>
                          <Upload className="w-3 h-3 mr-1" />
                          {uploading === uploadKey ? "Envoi..." : "Envoyer"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sharedFolders.length === 0 ? (
          <div className="dashboard-empty-card p-8">
            <FolderOpen className="w-12 h-12 text-primary/20 mx-auto mb-3" />
            <p className="font-semibold mb-1">Aucun dossier partagé actif pour le moment</p>
            <p className="text-sm text-muted-foreground">Des dossiers apparaîtront ici dès qu'une entreprise aura accepté votre candidature.</p>
          </div>
        ) : dossiersFiltres.length === 0 ? (
          <div className="dashboard-empty-card p-8">
            <Search className="w-12 h-12 text-primary/20 mx-auto mb-3" />
            <p className="font-semibold mb-1">Aucun dossier trouvé</p>
            <p className="text-sm text-muted-foreground">Essayez un nom d'entreprise, une offre ou une ville.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dossiersFiltres.map((folder) => {
              const isExpanded = expandedFolderId === folder.id;
              const pendingCount = (folder.documentRequests || []).filter((request: any) => request.status === "requested").length;
              const receivedCount = (folder.documentRequests || []).filter((request: any) => request.status === "uploaded").length;
              const entrepriseDocuments = (folder.categories || []).reduce((sum: number, category: any) => sum + (category.partnerDocs?.length || 0), 0);
              const ownDocuments = (folder.categories || []).reduce((sum: number, category: any) => sum + (category.ownDocs?.length || 0), 0);

              return (
              <div key={folder.id} className="dashboard-panel p-6">
                <div className="mb-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
                  <div>
                    <h3 className="text-lg font-bold">{folder.offre?.titre || "Candidature"}</h3>
                    <p className="text-sm text-muted-foreground">{folder.entrepriseNom}</p>
                    <p className="text-xs text-muted-foreground mt-1">{folder.offre?.localisation || "Localisation non précisée"} - {folder.offre?.contrat || "Contrat non précisé"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                        {pendingCount} demande(s) en attente
                      </span>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {receivedCount} pièce(s) déjà envoyée(s)
                      </span>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {entrepriseDocuments} document(s) reçus de l'entreprise
                      </span>
                      <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {ownDocuments} document(s) déjà envoyés
                      </span>
                    </div>
                  </div>

                  <div className="dashboard-subcard p-4 sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Suivi du dossier</p>
                    <p className="mt-3 text-sm font-semibold text-foreground">Candidature acceptée</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Ce dossier centralise vos documents, les pièces demandées par l'entreprise et tous les échanges administratifs liés à cette candidature.
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      <span className="w-fit rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                        Candidature acceptée
                      </span>
                      <Button variant="ghost-glow" size="sm" className="justify-center" onClick={() => setExpandedFolderId(isExpanded ? null : folder.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        {isExpanded ? "Refermer" : "Voir le dossier"}
                      </Button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <>
                <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">Documents demandés par l'entreprise</p>
                      <p className="mt-1 text-sm text-muted-foreground">Vous pouvez envoyer ici uniquement les pièces que l'entreprise vous a explicitement demandées.</p>
                    </div>
                    <span className="w-fit rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-medium text-primary">
                      {folder.documentRequests.length} demande(s)
                    </span>
                  </div>

                  {folder.documentRequests.length === 0 ? (
                      <p className="mt-4 text-sm text-muted-foreground">Aucun document administratif ne vous a encore été demandé.</p>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      {folder.documentRequests.map((request: any) => {
                        const statusMeta = getRequestStatusMeta(request.status);
                        const requestDefinition = REQUESTABLE_DOCUMENTS.find((document) => document.key === request.document_key);
                        const inputId = `request-upload-${request.id}`;
                        const uploadKey = `request-${request.id}`;

                        return (
                          <div key={request.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold">{request.document_label}</p>
                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                    {statusMeta.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">{requestDefinition?.desc || "Document administratif demandé pour finaliser votre dossier."}</p>
                                <p className="mt-2 text-xs text-muted-foreground">Demandé le {new Date(request.requested_at).toLocaleDateString("fr-FR")}</p>
                                {request.file_name && (<p className="mt-1 text-xs text-green-400">Fichier transmis : {request.file_name}</p>)}
                              </div>
                              <div className="flex items-center gap-2">
                                {request.storage_path ? (
                                  <Button variant="ghost-glow" size="sm" onClick={() => ouvrirCheminStockage(request.storage_path)}>
                                    Ouvrir
                                  </Button>
                                ) : (
                                  <>
                                    <input type="file" id={inputId} className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => uploadRequestedDocument(e, request)} />
                                    <Button variant="glow" size="sm" disabled={uploading === uploadKey} onClick={() => document.getElementById(inputId)?.click()}>
                                      <Upload className="w-3 h-3 mr-1" />
                                      {uploading === uploadKey ? "Envoi..." : "Envoyer le document"}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  {folder.categories.map((category: any) => {
                    const ownDocs = category.ownDocs || [];
                    const partnerDocs = category.partnerDocs || [];

                    return (
                      <div key={category.id} className="dashboard-subcard p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <category.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{category.label}</p>
                              <p className="text-xs text-muted-foreground">{category.desc}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-border/60 bg-secondary/30 px-3 py-1 text-xs text-muted-foreground">
                              {ownDocs.length} envoi(s)
                            </span>
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                              {partnerDocs.length} reçu(s)
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Vos envois déjà présents</p>
                            {ownDocs.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Aucun document transmis dans cette catégorie.</p>
                            ) : (
                              ownDocs.map((doc: any) => (
                                <div key={doc.name} className="dashboard-subcard mb-2 flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="text-sm break-all sm:flex-1 sm:truncate">{doc.name.replace(/^\d+_/, "")}</span>
                                  <div className="flex gap-2 self-start sm:ml-2 sm:self-auto">
                                    <Button variant="ghost-glow" size="sm" onClick={() => telechargerDocument(user.id, category.id, doc.name, folder.id)}>Ouvrir</Button>
                                    <ConfirmActionDialog
                                      title="Supprimer ce document partagé ?"
                                      description="Ce document sera retiré de votre dossier partagé avec l'entreprise. Vous pouvez encore annuler maintenant."
                                      onConfirm={() => supprimerDocument(category.id, doc.name, folder.id)}
                                    >
                                      <button className="text-red-400 p-1 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                    </ConfirmActionDialog>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-400">Envoyés par l'entreprise</p>
                            {partnerDocs.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Aucun document reçu de l'entreprise pour le moment.</p>
                            ) : (
                              partnerDocs.map((doc: any) => (
                                <div key={doc.name} className="dashboard-subcard mb-2 flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
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

// ─── LettreTab ────────────────────────────────────────────────────────────────
const LettreTab = () => {
  const { user, profile } = useAuth();
  const [poste, setPoste] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [points, setPoints] = useState("");
  const [lettre, setLettre] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [styleLettre, setStyleLettre] = useState<"classique" | "terrain">("classique");

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

  useEffect(() => {
    if (!poste && posteCandidat) {
      setPoste(posteCandidat);
    }
  }, [poste, posteCandidat]);

  useEffect(() => {
    if (!points && competencesCandidat) {
      setPoints(
        competencesCandidat
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
          .slice(0, 5)
          .join(", ")
      );
    }
  }, [points, competencesCandidat]);

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
      label: "Classique pro",
      desc: "Ton sobre, plus formel et rassurant pour une candidature classique.",
    },
    {
      id: "terrain" as const,
      label: "Terrain / intérim",
      desc: "Ton plus direct, concret et orienté action pour les métiers terrain.",
    },
  ];

  const genererLettre = async () => {
    if (!poste || !entreprise) return toast.error("Remplissez le poste et l'entreprise.");
    setLoading(true);
    try {
      const styleInstruction =
        styleLettre === "terrain"
          ? "Adopte un ton plus direct, concret et terrain. Utilise des phrases plus courtes, valorise la reactivite, la ponctualite, la fiabilite, l envie de travailler et l adaptation rapide aux missions. Garde un rendu professionnel, jamais familier."
          : "Adopte un ton plus classique et professionnel. Utilise une structure sobre, rassurante et bien articulee, adaptee a une candidature traditionnelle.";
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "Tu es un expert RH francophone. Tu rediges des lettres de motivation naturelles, credibles et professionnelles. Tu bannis les formulations trop scolaires, les phrases creuses, les compliments exageres et les tournures artificielles d'IA. Tu n'inventes jamais des annees d'experience, des diplomes ou des missions non fournies. Tu fournis uniquement la lettre finale, sans markdown, sans titre supplementaire et sans commentaire.",
            },
            {
              role: "user",
              content:
                `Redige une lettre de motivation professionnelle pour une candidature.\n` +
                `Candidat : ${nomCandidat || "Candidat"}\n` +
                `Poste vise : ${poste}\n` +
                `Entreprise : ${entreprise}\n` +
                `Poste actuel ou metier du candidat : ${posteCandidat || "Non precise"}\n` +
                `Localisation : ${localisationCandidat || "Non precise"}\n` +
                `Secteur du candidat : ${secteurCandidat || "Non precise"}\n` +
                `Contrat recherche : ${contratRecherche || "Non precise"}\n` +
                `Competences du candidat : ${competencesCandidat || "Non precise"}\n` +
                `Presentation courte du candidat : ${bioCandidat || "Non precise"}\n` +
                `Points forts a valoriser : ${points || "motivation, serieux, envie de bien faire"}\n` +
                `Style souhaite : ${styleLettre === "terrain" ? "Terrain / interim" : "Classique professionnel"}\n\n` +
                `Contraintes :\n` +
                `- 190 a 260 mots maximum\n` +
                `- style professionnel, humain et concret\n` +
                `- 4 paragraphes maximum\n` +
                `- commencer directement par 'Madame, Monsieur,' sans afficher d'objet dans le texte\n` +
                `- montrer une motivation realiste pour le poste et l'entreprise\n` +
                `- expliquer ce que le candidat peut apporter au poste avec des arguments concrets\n` +
                `- rester sobre, credible et directement exploitable pour une vraie candidature\n` +
                `- terminer par une formule de politesse simple et une signature avec le nom du candidat\n` +
                `- ne jamais ecrire [Votre nom] ou un autre placeholder\n` +
                `- ${styleInstruction}`,
            },
          ],
          temperature: 0.35,
          max_tokens: 700,
        }),
      });
      const data = await response.json();
      setLettre(nettoyerLettre(data?.choices?.[0]?.message?.content || ""));
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

    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marge = 52;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const largeurTexte = pageWidth - marge * 2;
      const dateFr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
      let y = 58;

      const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight <= pageHeight - 50) return;
        doc.addPage();
        y = 58;
      };

      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.setTextColor(26, 26, 32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(nomCandidat || "Candidat", marge, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      if (posteCandidat) {
        doc.setTextColor(88, 92, 108);
        doc.text(posteCandidat, marge, y);
        y += 14;
      }

      coordonneesCandidat.forEach((ligne) => {
        doc.text(String(ligne), marge, y);
        y += 14;
      });

      doc.setTextColor(88, 92, 108);
      const recipientLines = doc.splitTextToSize(`${entreprise}\nService recrutement`, 180);
      recipientLines.forEach((line: string, index: number) => {
        doc.text(line, pageWidth - marge - doc.getTextWidth(line), 58 + index * 14);
      });
      doc.text(dateFr, pageWidth - marge - doc.getTextWidth(dateFr), 58 + recipientLines.length * 14 + 8);
      y += 12;

      doc.setDrawColor(220, 226, 235);
      doc.line(marge, y, pageWidth - marge, y);
      y += 24;

      doc.setTextColor(70, 178, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const objet = `Objet : Candidature au poste de ${poste} chez ${entreprise}`;
      const objetLines = doc.splitTextToSize(objet, largeurTexte);
      doc.text(objetLines, marge, y);
      y += objetLines.length * 14 + 18;

      doc.setTextColor(26, 26, 32);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11.5);

      paragraphs.forEach((paragraph) => {
        const lines = doc.splitTextToSize(paragraph, largeurTexte);
        ensureSpace(lines.length * 15 + 10);
        doc.text(lines, marge, y);
        y += lines.length * 15 + 14;
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

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold">Lettre de motivation</h2>
      <p className="mb-6 text-muted-foreground">
        Générez une lettre plus sérieuse, relisez-la facilement, puis exportez-la dans un format propre avant envoi.
      </p>
      <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)] 2xl:grid-cols-[430px_minmax(0,1fr)]">
        <div className="glass-card self-start space-y-5 p-5 sm:p-8 xl:sticky xl:top-24">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold">Une lettre claire et prête à envoyer</p>
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
                  className={`min-h-[132px] rounded-2xl border p-5 text-left transition-all ${
                    styleLettre === style.id
                      ? "border-primary/40 bg-primary/10 shadow-[0_20px_48px_-34px_rgba(139,92,246,0.78)]"
                      : "border-border/60 bg-secondary/20 hover:border-primary/20"
                  }`}
                >
                  <p className="text-lg font-semibold">{style.label}</p>
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
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-base focus:border-primary/50 focus:outline-none"
                placeholder="Ex. : Conducteur de car, préparateur de commandes..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Nom de l'entreprise</label>
              <input
                value={entreprise}
                onChange={(e) => setEntreprise(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-base focus:border-primary/50 focus:outline-none"
                placeholder="Ex. : Société Martin, Transavoie..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Vos points forts (optionnel)</label>
              <textarea
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-xl border border-border bg-secondary px-4 py-3 text-base leading-7 focus:border-primary/50 focus:outline-none"
                placeholder="Ex. : conduite urbaine, relation usagers, ponctualité, sécurité, sang-froid..."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-5">
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

        <div className="dashboard-panel flex flex-col gap-5 p-5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <h3 className="text-2xl font-bold">Votre lettre</h3>
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

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                    <div className="mt-6 space-y-5 text-[15px] leading-8 text-slate-800">
                      {paragraphs.map((paragraph, index) => (
                        <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
                      ))}
                    </div>
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
                <textarea
                  value={lettre}
                  onChange={(e) => setLettre(e.target.value)}
                  className="min-h-[320px] w-full resize-none rounded-2xl border border-border bg-background/70 px-4 py-4 text-sm leading-7 focus:border-primary/50 focus:outline-none"
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
