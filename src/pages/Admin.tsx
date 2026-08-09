import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Users, Building2, Target, FileText, LogOut, BarChart3, Lock, Mail, ShieldAlert, Ban, CheckCircle, RotateCcw, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/authMessages";
import { formatStoredMessageText } from "@/lib/utils";
import AccountSecurityPanel from "@/components/AccountSecurityPanel";
import PlatformSecurityAdminPanel from "@/components/PlatformSecurityAdminPanel";
import type { User } from "@supabase/supabase-js";
import { ACCOUNT_DELETION_REASON_LABELS, type AccountDeletionReason } from "@/lib/accountDeletion";

const ADMIN_EMAIL = "contact@spottedtalent.fr";

type AccountDeletionSummary = {
  departure_reason: string;
  deletion_count: number;
};

type RecentAccountDeletionFeedback = {
  requested_at: string;
  departure_reason: string;
  departure_feedback: string | null;
  result: string;
};

const getDepartureReasonLabel = (reason: string) =>
  ACCOUNT_DELETION_REASON_LABELS[reason as AccountDeletionReason] || "Motif non renseigné";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connecte, setConnecte] = useState(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState({ talents: 0, entreprises: 0, offres: 0, candidatures: 0, messages: 0 });
  const [talents, setTalents] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [offres, setOffres] = useState<any[]>([]);
  const [offerReports, setOfferReports] = useState<any[]>([]);
  const [moderationReasons, setModerationReasons] = useState<Record<string, string>>({});
  const [moderatingReportId, setModeratingReportId] = useState<string | null>(null);
  const [deletionSummary, setDeletionSummary] = useState<AccountDeletionSummary[]>([]);
  const [recentDeletionFeedback, setRecentDeletionFeedback] = useState<RecentAccountDeletionFeedback[]>([]);

  useEffect(() => {
    const verifierAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === ADMIN_EMAIL) {
        setAdminUser(user);
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAdminUser(data.user);
      setConnecte(true);
      chargerTout();
      toast.success("Connexion admin réussie");
    } catch (err: any) {
      toast.error("Email ou mot de passe incorrect");
    } finally {
      setLoginLoading(false);
    }
  };

  const reinitialiserMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      toast.error("Saisissez l'adresse administrateur autorisée.");
      return;
    }

    setLoginLoading(true);
    try {
      const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      const baseUrl = isLocalhost
        ? window.location.origin
        : (import.meta.env.VITE_SITE_URL || "https://www.spottedtalent.fr");

      const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, {
        redirectTo: `${baseUrl.replace(/\/$/, "")}/reset-password?role=admin`,
      });
      if (error) throw error;

      toast.success("Lien de réinitialisation envoyé. Vérifiez aussi les courriers indésirables.");
      setShowForgotPassword(false);
    } catch (err: any) {
      toast.error(translateAuthError(err?.message));
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
    const { data: reportsData, error: reportsError } = await supabase
      .from("offer_reports")
      .select("*, offer:offer_id(id,titre,entreprise_id,statut,moderation_status,public_reference,moderation_reason)")
      .order("created_at", { ascending: false });
    if (reportsError) console.error("offer_reports_admin_load_error", reportsError);
    setOfferReports(reportsData || []);
    const [summaryResponse, recentFeedbackResponse] = await Promise.all([
      supabase.rpc("get_account_deletion_feedback_summary", { p_days: 90 }),
      supabase.rpc("get_recent_account_deletion_feedback", { p_limit: 20 }),
    ]);
    if (summaryResponse.error) console.error("account_deletion_summary_load_error", summaryResponse.error);
    if (recentFeedbackResponse.error) console.error("account_deletion_feedback_load_error", recentFeedbackResponse.error);
    setDeletionSummary((summaryResponse.data || []) as AccountDeletionSummary[]);
    setRecentDeletionFeedback((recentFeedbackResponse.data || []) as RecentAccountDeletionFeedback[]);
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

  const decideOfferReport = async (report: any, decision: "suspend" | "dismiss" | "reinstate") => {
    const reason = String(moderationReasons[report.id] || "").trim();
    if (reason.length < 10) {
      toast.error("Expliquez la décision en au moins 10 caractères.");
      return;
    }
    setModeratingReportId(report.id);
    const { error } = await supabase.rpc("admin_decide_offer_report", {
      p_report_id: report.id,
      p_decision: decision,
      p_reason: reason,
    });
    setModeratingReportId(null);
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }
    toast.success(decision === "suspend" ? "Offre suspendue et décision journalisée." : decision === "reinstate" ? "Offre rétablie et décision journalisée." : "Signalement classé avec motif.");
    setModerationReasons((current) => ({ ...current, [report.id]: "" }));
    await chargerTout();
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
          <h1 className="text-xl font-bold">
            {showForgotPassword ? "Réinitialiser le mot de passe" : "Espace Administration"}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {showForgotPassword
              ? "Recevez un lien sécurisé sur l'adresse administrateur."
              : "Accès réservé au personnel autorisé"}
          </p>
        </div>
        <form onSubmit={showForgotPassword ? reinitialiserMotDePasse : seConnecter} className="glass-card p-8 space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" placeholder="Email admin" value={email} onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-secondary border-border" required />
          </div>
          {!showForgotPassword && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-secondary border-border" required />
            </div>
          )}
          <Button variant="glow" className="w-full" disabled={loginLoading}>
            {loginLoading
              ? showForgotPassword ? "Envoi en cours..." : "Connexion..."
              : showForgotPassword
                ? "Recevoir le lien de réinitialisation"
                : "Se connecter"}
          </Button>
          <button
            type="button"
            onClick={() => setShowForgotPassword((current) => !current)}
            className="w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {showForgotPassword ? "Retour à la connexion" : "Mot de passe oublié ?"}
          </button>
        </form>
      </div>
    </div>
  );

  const tabs = [
    { id: "stats", label: "Vue globale", icon: BarChart3 },
    { id: "talents", label: `Talents (${stats.talents})`, icon: Users },
    { id: "entreprises", label: `Entreprises (${stats.entreprises})`, icon: Building2 },
    { id: "offres", label: `Offres (${stats.offres})`, icon: Target },
    { id: "moderation", label: `Modération (${offerReports.filter((report) => ["pending", "under_review"].includes(report.status)).length})`, icon: ShieldAlert },
    { id: "departures", label: "Motifs de départ", icon: MessageSquareText },
    { id: "security", label: "Sécurité", icon: Lock },
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
          <Button variant="ghost-glow" size="sm" className="w-full" onClick={async () => { await supabase.auth.signOut(); setAdminUser(null); setConnecte(false); }}>
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
                <h3 className="font-semibold mb-4">Dernières entreprises inscrites</h3>
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
                        <h3 className="font-semibold text-sm">{formatStoredMessageText(o.titre)}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${o.statut === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-secondary text-muted-foreground border-border"}`}>
                          {o.statut === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatStoredMessageText(o.localisation) || "Non précisé"} - {formatStoredMessageText(o.contrat)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{o.public_reference || "Référence en préparation"}</p>
                      <p className="mt-1">Modération : {o.moderation_status === "suspended" ? "Suspendue" : "Publiée"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "moderation" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Signalements et décisions</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Chaque signalement est examiné humainement. Une annonce n’est jamais retirée sur le seul déclenchement d’un signalement et chaque décision exige un motif conservé dans le journal.</p>
            </div>
            {offerReports.length === 0 ? (
              <div className="glass-card p-10 text-center"><CheckCircle className="mx-auto h-10 w-10 text-emerald-500" /><p className="mt-3 font-semibold">Aucun signalement</p><p className="mt-1 text-sm text-muted-foreground">La file de modération est vide.</p></div>
            ) : (
              <div className="space-y-4">
                {offerReports.map((report: any) => {
                  const company = entreprises.find((entry) => entry.user_id === report.offer?.entreprise_id);
                  const reasonLabels: Record<string, string> = {
                    discrimination: "Contenu discriminatoire",
                    misleading: "Offre trompeuse ou fictive",
                    paid_application: "Candidature payante ou redirection abusive",
                    fraud: "Fraude ou usurpation",
                    expired: "Offre expirée ou déjà pourvue",
                    other: "Autre motif",
                  };
                  const isOpen = ["pending", "under_review"].includes(report.status);
                  const isSuspended = report.offer?.moderation_status === "suspended";
                  return (
                    <div key={report.id} className="glass-card p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{formatStoredMessageText(report.offer?.titre) || "Offre indisponible"}</h3>
                            <span className={`rounded-full border px-2 py-0.5 text-xs ${isOpen ? "border-amber-500/30 bg-amber-500/10 text-amber-500" : "border-border bg-secondary text-muted-foreground"}`}>{isOpen ? "À examiner" : report.status === "dismissed" ? "Classé" : "Traité"}</span>
                            {isSuspended && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-400">Suspendue</span>}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{company?.company_name || company?.full_name || "Entreprise"} · {report.offer?.public_reference || "Sans référence"}</p>
                          <p className="mt-3 text-sm font-semibold">{reasonLabels[report.reason] || report.reason}</p>
                          {report.details && <p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{formatStoredMessageText(report.details)}</p>}
                          <p className="mt-2 text-xs text-muted-foreground">Signalé le {new Date(report.created_at).toLocaleString("fr-FR")}</p>
                          {report.decision_reason && <div className="mt-3 rounded-lg border border-border/60 bg-secondary/40 p-3 text-sm"><strong>Décision motivée :</strong> {formatStoredMessageText(report.decision_reason)}</div>}
                        </div>
                        <div className="w-full shrink-0 xl:w-96">
                          <label className="text-xs font-semibold text-muted-foreground">Motif obligatoire de la décision</label>
                          <textarea value={moderationReasons[report.id] || ""} onChange={(event) => setModerationReasons((current) => ({ ...current, [report.id]: event.target.value }))} rows={3} maxLength={1500} className="mt-2 w-full resize-none rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary/50" placeholder="Constats vérifiés, décision et possibilité de contestation..." />
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {isOpen && <Button size="sm" variant="ghost-glow" disabled={moderatingReportId === report.id} onClick={() => void decideOfferReport(report, "dismiss")}><CheckCircle className="mr-1.5 h-4 w-4" /> Classer</Button>}
                            {isOpen && !isSuspended && <Button size="sm" className="border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20" disabled={moderatingReportId === report.id} onClick={() => void decideOfferReport(report, "suspend")}><Ban className="mr-1.5 h-4 w-4" /> Suspendre</Button>}
                            {isSuspended && <Button size="sm" variant="ghost-glow" className="sm:col-span-2" disabled={moderatingReportId === report.id} onClick={() => void decideOfferReport(report, "reinstate")}><RotateCcw className="mr-1.5 h-4 w-4" /> Rétablir après vérification</Button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "departures" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Pourquoi les talents quittent la plateforme</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Retours facultatifs et pseudonymisés recueillis lors d'une suppression effective de compte. Aucun nom, e-mail ou identifiant de compte n'est affiché ici.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {deletionSummary.length === 0 ? (
                <div className="glass-card p-6 sm:col-span-2 xl:col-span-3">
                  <p className="font-semibold">Aucun départ enregistré sur les 90 derniers jours</p>
                  <p className="mt-1 text-sm text-muted-foreground">Les tendances apparaîtront ici dès qu'un talent partagera un motif.</p>
                </div>
              ) : deletionSummary.map((entry) => (
                <div key={entry.departure_reason} className="glass-card p-5">
                  <p className="text-sm leading-5 text-muted-foreground">{getDepartureReasonLabel(entry.departure_reason)}</p>
                  <p className="mt-3 text-3xl font-bold gradient-text">{entry.deletion_count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">sur les 90 derniers jours</p>
                </div>
              ))}
            </div>

            <div className="glass-card mt-6 p-6">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Précisions récentes</h3>
              </div>
              {recentDeletionFeedback.filter((entry) => entry.departure_feedback).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune précision écrite n'a encore été transmise.</p>
              ) : (
                <div className="space-y-3">
                  {recentDeletionFeedback.filter((entry) => entry.departure_feedback).map((entry, index) => (
                    <div key={`${entry.requested_at}-${index}`} className="rounded-xl border border-border/60 bg-secondary/35 p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold">{getDepartureReasonLabel(entry.departure_reason)}</p>
                        <time className="text-xs text-muted-foreground" dateTime={entry.requested_at}>
                          {new Date(entry.requested_at).toLocaleDateString("fr-FR")}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {formatStoredMessageText(entry.departure_feedback || "")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "security" && adminUser && (
          <div>
            <h1 className="mb-2 text-3xl font-bold">Sécurité de la plateforme</h1>
            <p className="mb-8 text-muted-foreground">
              Surveillez les incidents, verrouillez les accès sensibles et protégez le compte administrateur.
            </p>
            <PlatformSecurityAdminPanel />
            <h2 className="mb-2 text-2xl font-bold">Sécurité du compte administrateur</h2>
            <p className="mb-5 text-muted-foreground">
              La double authentification est obligatoire pour activer ou désactiver le mode incident.
            </p>
            <AccountSecurityPanel user={adminUser} role="admin" />
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
