import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";
import { Sparkles, Users, Building2, Target, FileText, Trash2, LogOut, BarChart3, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAIL = "contact@spottedtalent.fr";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connecte, setConnecte] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState({ talents: 0, entreprises: 0, offres: 0, candidatures: 0, messages: 0 });
  const [talents, setTalents] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [offres, setOffres] = useState<any[]>([]);

  useEffect(() => {
    const verifierAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === ADMIN_EMAIL) {
        setConnecte(true);
        chargerTout();
      }
      setLoading(false);
    };
    verifierAdmin();
  }, []);

  const seConnecter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== ADMIN_EMAIL) {
      toast.error("Accès refusé");
      return;
    }
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setConnecte(true);
      chargerTout();
      toast.success("Connexion admin réussie");
    } catch (err: any) {
      toast.error("Email ou mot de passe incorrect");
    } finally {
      setLoginLoading(false);
    }
  };

  const chargerTout = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const ts = profiles?.filter((p: any) => p.role === "talent") || [];
    const es = profiles?.filter((p: any) => p.role === "entreprise") || [];
    setTalents(ts);
    setEntreprises(es);
    const { data: offresData } = await supabase.from("offres").select("*").order("created_at", { ascending: false });
    setOffres(offresData || []);
    const { count: nbCands } = await supabase.from("candidatures").select("*", { count: "exact", head: true });
    const { count: nbMsgs } = await supabase.from("messages").select("*", { count: "exact", head: true });
    setStats({
      talents: ts.length,
      entreprises: es.length,
      offres: offresData?.length || 0,
      candidatures: nbCands || 0,
      messages: nbMsgs || 0,
    });
  };

  const supprimerOffre = async (id: string) => {
    await supabase.from("offres").delete().eq("id", id);
    toast.success("Offre supprimée");
    chargerTout();
  };

  const toggleOffre = async (id: string, statut: string) => {
    const newStatut = statut === "active" ? "inactive" : "active";
    await supabase.from("offres").update({ statut: newStatut }).eq("id", id);
    toast.success(newStatut === "active" ? "Offre activee" : "Offre desactivee");
    chargerTout();
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Chargement...
    </div>
  );

  if (!connecte) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="gradient-text text-2xl font-bold">Spotted Talent</span>
          </div>
          <h1 className="text-xl font-bold">Espace Administration</h1>
          <p className="text-muted-foreground text-sm mt-2">Acces reserve au personnel autorise</p>
        </div>
        <form onSubmit={seConnecter} className="glass-card p-8 space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" placeholder="Email admin" value={email} onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-secondary border-border" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-secondary border-border" required />
          </div>
          <Button variant="glow" className="w-full" disabled={loginLoading}>
            {loginLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );

  const tabs = [
    { id: "stats", label: "Vue globale", icon: BarChart3 },
    { id: "talents", label: `Talents (${stats.talents})`, icon: Users },
    { id: "entreprises", label: `Entreprises (${stats.entreprises})`, icon: Building2 },
    { id: "offres", label: `Offres (${stats.offres})`, icon: Target },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r border-border/50 bg-background/60 backdrop-blur-xl fixed h-full flex flex-col">
        <div className="p-6 border-b border-border/50">
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="gradient-text">Admin</span>
          </a>
          <p className="text-xs text-muted-foreground mt-1">Spotted Talent</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === id ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}>
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border/50">
          <Button variant="ghost-glow" size="sm" className="w-full" onClick={async () => { await supabase.auth.signOut(); setConnecte(false); }}>
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        {activeTab === "stats" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Tableau de bord <span className="gradient-text">Admin</span></h1>
            <p className="text-muted-foreground mb-8">Vue globale de la plateforme Spotted Talent.</p>
            <div className="grid grid-cols-5 gap-4 mb-8">
              {[
                { label: "Talents", value: stats.talents, icon: Users },
                { label: "Entreprises", value: stats.entreprises, icon: Building2 },
                { label: "Offres", value: stats.offres, icon: Target },
                { label: "Candidatures", value: stats.candidatures, icon: FileText },
                { label: "Messages", value: stats.messages, icon: FileText },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="glass-card p-5 text-center">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold gradient-text">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">Derniers talents inscrits</h3>
                <div className="space-y-2">
                  {talents.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                      <Users className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{t.full_name || "Sans nom"}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">Dernieres entreprises inscrites</h3>
                <div className="space-y-2">
                  {entreprises.slice(0, 5).map((e: any) => (
                    <div key={e.id} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                      <Building2 className="w-4 h-4 text-accent" />
                      <div>
                        <p className="text-sm font-medium">{e.full_name || "Sans nom"}</p>
                        <p className="text-xs text-muted-foreground">{e.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "talents" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Talents inscrits</h2>
            <div className="space-y-3">
              {talents.length === 0 ? (
                <p className="text-muted-foreground">Aucun talent inscrit</p>
              ) : talents.map((t: any) => (
                <div key={t.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.full_name || "Sans nom"}</p>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                      {t.poste && <p className="text-xs text-primary">{t.poste} — {t.localisation}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.telephone && <p className="text-xs text-muted-foreground">{t.telephone}</p>}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Talent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "entreprises" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Entreprises inscrites</h2>
            <div className="space-y-3">
              {entreprises.length === 0 ? (
                <p className="text-muted-foreground">Aucune entreprise inscrite</p>
              ) : entreprises.map((e: any) => (
                <div key={e.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{e.full_name || "Sans nom"}</p>
                      <p className="text-xs text-muted-foreground">{e.email}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">Entreprise</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "offres" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Toutes les offres</h2>
            <div className="space-y-3">
              {offres.length === 0 ? (
                <p className="text-muted-foreground">Aucune offre</p>
              ) : offres.map((o: any) => (
                <div key={o.id} className="glass-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{o.titre}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${o.statut === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-secondary text-muted-foreground border-border"}`}>
                          {o.statut === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">📍 {o.localisation || "Non precise"} — 📋 {o.contrat}</p>
                      <p className="text-xs text-muted-foreground mt-1">📅 {new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost-glow" size="sm" onClick={() => toggleOffre(o.id, o.statut)}>
                        {o.statut === "active" ? "Desactiver" : "Activer"}
                      </Button>
                      <ConfirmActionDialog
                        title="Supprimer cette offre ?"
                        description="Cette offre sera retiree de la plateforme. Vous pourrez encore changer d avis maintenant, mais pas apres validation."
                        onConfirm={() => supprimerOffre(o.id)}
                      >
                        <button className="text-red-400 hover:text-red-300 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </ConfirmActionDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
