import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_COVER_FILE_NAME, getCompanyCoverPublicUrl } from "@/lib/companyMedia";
import { formatStoredMessageText } from "@/lib/utils";

type PublicCompanyProfile = {
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  secteur: string | null;
  localisation: string | null;
  bio: string | null;
  role: "talent" | "entreprise";
};

type PublicCompanyOffer = {
  id: string;
  titre: string;
  contrat: string | null;
  localisation: string | null;
  secteur: string | null;
  created_at: string;
};

const EntrepriseProfil = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<PublicCompanyProfile | null>(null);
  const [offers, setOffers] = useState<PublicCompanyOffer[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverAvailable, setCoverAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    let active = true;

    const loadCompany = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const [{ data: companyData }, { data: offersData }, { data: mediaFiles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, full_name, company_name, secteur, localisation, bio, role")
          .eq("user_id", id)
          .eq("role", "entreprise")
          .maybeSingle(),
        supabase
          .from("offres")
          .select("id, titre, contrat, localisation, secteur, created_at")
          .eq("entreprise_id", id)
          .eq("statut", "active")
          .order("created_at", { ascending: false }),
        supabase.storage.from("avatars").list(id),
      ]);

      if (!active) return;

      setCompany((companyData as PublicCompanyProfile | null) || null);
      setOffers((offersData as PublicCompanyOffer[] | null) || []);

      const avatarFile = (mediaFiles || []).find((file) => file.name.startsWith("avatar."));
      if (avatarFile) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(`${id}/${avatarFile.name}`);
        setLogoUrl(data.publicUrl);
      }
      setCoverAvailable(Boolean((mediaFiles || []).some((file) => file.name === COMPANY_COVER_FILE_NAME)));
      setLoading(false);
    };

    void loadCompany();
    return () => {
      active = false;
    };
  }, [id]);

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/talent/dashboard?tab=offres", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Chargement de l'entreprise...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center text-card-foreground">
          <Building2 className="mx-auto h-10 w-10 text-primary/60" />
          <h1 className="mt-4 text-xl font-bold">Entreprise introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cette fiche n'est pas disponible ou n'est plus active.</p>
          <Button className="mt-5" variant="ghost-glow" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux offres
          </Button>
        </div>
      </div>
    );
  }

  const companyName = formatStoredMessageText(company.company_name || company.full_name || "Entreprise");
  const description = formatStoredMessageText(company.bio || "");
  const sectors = formatStoredMessageText(company.secteur || "")
    .split(",")
    .map((sector) => sector.trim())
    .filter(Boolean);

  const openOffer = (offerId: string) => {
    navigate(`/talent/dashboard?tab=offres&offer=${encodeURIComponent(offerId)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux offres
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 font-bold text-primary sm:flex">
              <Sparkles className="h-5 w-5" />
              Spotted Talent
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-[0_20px_60px_-48px_rgba(24,32,71,0.38)]">
          <div className="relative h-40 bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--accent)/0.1),hsl(var(--secondary)))] sm:h-56">
            {coverAvailable && id ? (
              <img
                src={getCompanyCoverPublicUrl(id)}
                alt={`Couverture de ${companyName}`}
                className="h-full w-full object-cover"
                onError={() => setCoverAvailable(false)}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Building2 className="h-16 w-16 text-primary/20" />
              </div>
            )}
          </div>

          <div className="relative px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-primary/10 shadow-lg sm:h-28 sm:w-28">
                {logoUrl ? (
                  <img src={logoUrl} alt={`Logo de ${companyName}`} className="h-full w-full object-cover" onError={() => setLogoUrl(null)} />
                ) : (
                  <Building2 className="h-11 w-11 text-primary/65" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Profil entreprise
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{companyName}</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {company.localisation && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/45 px-3 py-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {formatStoredMessageText(company.localisation)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/45 px-3 py-1.5">
                    <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" />
                    {offers.length} offre{offers.length > 1 ? "s" : ""} active{offers.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <section className="rounded-2xl border border-border/80 bg-card p-5 text-card-foreground sm:p-6">
            <h2 className="text-lg font-bold">À propos de l'entreprise</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {description || "Cette entreprise n'a pas encore ajouté de présentation publique."}
            </p>
          </section>

          <section className="rounded-2xl border border-border/80 bg-card p-5 text-card-foreground sm:p-6">
            <h2 className="text-lg font-bold">Secteurs d'activité</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {sectors.length > 0 ? sectors.map((sector) => (
                <span key={sector} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  {sector}
                </span>
              )) : (
                <span className="text-sm text-muted-foreground">Secteur non renseigné.</span>
              )}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-border/80 bg-card p-5 text-card-foreground sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Offres actuellement disponibles</h2>
              <p className="mt-1 text-sm text-muted-foreground">Consultez les postes publiés par {companyName}.</p>
            </div>
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-5 divide-y divide-border/70">
            {offers.length > 0 ? offers.map((offer) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => openOffer(offer.id)}
                className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-primary/[0.025]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{formatStoredMessageText(offer.titre)}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {[offer.localisation, offer.contrat, offer.secteur].filter(Boolean).map(formatStoredMessageText).join(" · ")}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Voir l'offre
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            )) : (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold">Aucune offre active actuellement</p>
                <p className="mt-1 text-xs text-muted-foreground">Revenez plus tard pour découvrir de nouvelles opportunités.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default EntrepriseProfil;
