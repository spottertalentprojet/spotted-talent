import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import {
  formatTalentAvailabilityLabel,
  parseTalentAvailabilityFromBio,
  stripTalentAvailabilityMetadata,
} from "@/lib/talentAvailability";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  FileText,
  Home,
  Mail,
  MapPin,
  Phone,
  Shield,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";

const TalentProfil = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profil, setProfil] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [lettreUrl, setLettreUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const charger = async () => {
      if (!id) return;

      const { data: profilData } = await supabase.from("profiles").select("*").eq("user_id", id).single();

      if (profilData) {
        setProfil(profilData);

        const { data: avatarList } = await supabase.storage.from("avatars").list(id);
        if (avatarList && avatarList.length > 0) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(`${id}/${avatarList[0].name}`);
          setAvatarUrl(data.publicUrl);
        }

        const { data: cvList } = await supabase.storage.from("documents").list(`${id}/cv`);
        if (cvList && cvList.length > 0) {
          const { data } = await supabase.storage.from("documents").createSignedUrl(`${id}/cv/${cvList[0].name}`, 3600);
          if (data?.signedUrl) setCvUrl(data.signedUrl);
        }

        const { data: lettreList } = await supabase.storage.from("documents").list(`${id}/lettre`);
        if (lettreList && lettreList.length > 0) {
          const { data } = await supabase.storage.from("documents").createSignedUrl(`${id}/lettre/${lettreList[0].name}`, 3600);
          if (data?.signedUrl) setLettreUrl(data.signedUrl);
        }
      }

      setLoading(false);
    };

    void charger();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Chargement du profil...
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Profil introuvable</p>
          <Button variant="glow" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const availability = parseTalentAvailabilityFromBio(profil.bio);
  const availabilityLabel = formatTalentAvailabilityLabel(availability.type, availability.detail);
  const cleanBio = stripTalentAvailabilityMetadata(profil.bio);

  const searchParams = new URLSearchParams(window.location.search);
  const candidatureId = searchParams.get("candidature");
  const returnTo = searchParams.get("returnTo");
  const backLabel = searchParams.get("backLabel") || "Retour";

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/entreprise/dashboard?tab=candidats", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:inline-flex">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="gradient-text font-bold">Spotted Talent</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
        <div className="dashboard-hero-card relative mb-6 overflow-hidden">
          <div className="absolute -right-8 top-0 h-32 w-32 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-accent/12 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex flex-col items-center gap-3 lg:w-48 lg:items-start">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-primary/35 bg-primary/14 shadow-[0_18px_40px_-28px_hsl(var(--primary)/0.8)]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="h-full w-full object-cover"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <User className="h-14 w-14 text-primary/60" />
                )}
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary/85">
                Profil candidat
              </span>
            </div>

            <div className="flex-1 space-y-5">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{profil.full_name || "Talent"}</h1>
                {profil.poste && (
                  <p className="flex items-center gap-2 text-base font-medium text-primary">
                    <Briefcase className="h-4 w-4" /> {profil.poste}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {profil.localisation && (
                    <span className="rounded-full border border-border/70 bg-secondary/40 px-3 py-1.5">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {profil.localisation}
                      </span>
                    </span>
                  )}
                  {profil.contrat && (
                    <span className="rounded-full border border-border/70 bg-secondary/40 px-3 py-1.5">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        Recherche : {profil.contrat}
                      </span>
                    </span>
                  )}
                  {availabilityLabel && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {availabilityLabel}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {profil.email && (
                  <div className="dashboard-subcard space-y-2">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary" /> Email
                    </span>
                    <p className="break-all text-sm font-medium text-foreground">{profil.email}</p>
                  </div>
                )}

                {profil.telephone && (
                  <div className="dashboard-subcard space-y-2">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary" /> Téléphone
                    </span>
                    <p className="text-sm font-medium text-foreground">{profil.telephone}</p>
                    {profil.telephone2 && <p className="text-xs text-muted-foreground">Second numéro : {profil.telephone2}</p>}
                  </div>
                )}

                {profil.adresse && (
                  <div className="dashboard-subcard space-y-2 md:col-span-2">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      <Home className="h-3.5 w-3.5 text-primary" /> Adresse
                    </span>
                    <p className="text-sm font-medium text-foreground">{profil.adresse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {cleanBio && (
          <div className="dashboard-panel mb-6 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" /> Présentation
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{cleanBio}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {profil.competences && (
            <div className="dashboard-panel p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Wrench className="h-4 w-4 text-primary" /> Compétences
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {profil.competences.split(",").map((c: string, i: number) => (
                  <span key={i} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                    {c.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profil.permis && (
            <div className="dashboard-panel p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Shield className="h-4 w-4 text-primary" /> Permis et diplômes
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {profil.permis.split(",").map((p: string, i: number) => (
                  <span key={i} className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
                    {p.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-panel mt-6 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" /> Documents
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="dashboard-subcard flex flex-col items-center gap-3 text-center">
              <FileText className="h-9 w-9 text-primary" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">CV</p>
                <p className="text-sm text-muted-foreground">
                  {cvUrl ? "Document disponible pour consultation" : "Aucun CV uploadé"}
                </p>
              </div>
              {cvUrl ? (
                <Button variant="glow" size="sm" className="w-full max-w-xs" onClick={() => window.open(cvUrl, "_blank")}>
                  Voir le CV
                </Button>
              ) : null}
            </div>

            <div className="dashboard-subcard flex flex-col items-center gap-3 text-center">
              <Mail className="h-9 w-9 text-primary" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">Lettre de motivation</p>
                <p className="text-sm text-muted-foreground">
                  {lettreUrl ? "Document disponible pour consultation" : "Aucune lettre uploadée"}
                </p>
              </div>
              {lettreUrl ? (
                <Button variant="glow" size="sm" className="w-full max-w-xs" onClick={() => window.open(lettreUrl, "_blank")}>
                  Voir la lettre
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="dashboard-panel mt-6 p-6 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Intéressé par ce candidat ? Contactez-le directement via la messagerie.
          </p>
          <Button
            variant="glow"
            size="lg"
            onClick={() => {
              window.location.href = `/entreprise/dashboard?tab=messagerie&candidature=${candidatureId}`;
            }}
          >
            <Mail className="mr-2 h-4 w-4" /> Contacter via la messagerie
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TalentProfil;
