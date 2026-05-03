import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { CandidatureRow, DocumentRequestRow, MessageRow, OffreRow } from "../types/database";

type EntrepriseStats = {
  offresPubliees: number;
  candidaturesRecues: number;
  candidaturesEnAttente: number;
  candidaturesAcceptees: number;
  messagesNonLus: number;
  demandesDocumentsEnCours: number;
};

type TabId = "apercu" | "offres" | "candidatures" | "messagerie" | "documents";

type AppItem = {
  id: string;
  offreId: string;
  talentId: string;
  offreTitre: string;
  statut: string | null;
  createdAt: string;
};

type MsgThread = {
  candidatureId: string;
  offreTitre: string;
  lastContent: string;
  lastAt: string;
  unreadCount: number;
};

type ConversationMessage = {
  id: string;
  candidatureId: string;
  contenu: string;
  createdAt: string;
  lu: boolean;
  expeditionId: string;
  destinataireId: string;
};

type DocItem = {
  id: string;
  label: string;
  status: string;
  requestedAt: string;
  uploadedAt: string | null;
};

const DEFAULT_STATS: EntrepriseStats = {
  offresPubliees: 0,
  candidaturesRecues: 0,
  candidaturesEnAttente: 0,
  candidaturesAcceptees: 0,
  messagesNonLus: 0,
  demandesDocumentsEnCours: 0,
};

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "apercu", label: "Apercu" },
  { id: "offres", label: "Offres" },
  { id: "candidatures", label: "Candidatures" },
  { id: "messagerie", label: "Messagerie" },
  { id: "documents", label: "Documents" },
];

function getCompanyName(companyName: string | null, fullName: string | null) {
  if (companyName?.trim()) return companyName;
  if (fullName?.trim()) return fullName;
  return "Entreprise";
}

function formatDate(dateIso: string) {
  try {
    return new Date(dateIso).toLocaleDateString("fr-FR");
  } catch {
    return dateIso;
  }
}

function formatDateTime(dateIso: string) {
  try {
    return new Date(dateIso).toLocaleString("fr-FR");
  } catch {
    return dateIso;
  }
}

function mapOfferStatus(status: string | null) {
  if (!status) return "Active";
  if (status === "active" || status === "actif") return "Active";
  if (status === "draft") return "Brouillon";
  if (status === "closed") return "Fermee";
  return status;
}

function mapCandidatureStatus(status: string | null) {
  if (status === "acceptee") return "Acceptee";
  if (status === "refusee") return "Refusee";
  if (status === "entretien") return "Entretien";
  return "En attente";
}

function mapDocumentStatus(status: string) {
  if (status === "uploaded") return "Recu";
  if (status === "requested") return "En attente";
  return status;
}

function getStatusPillStyle(status: string | null) {
  if (status === "acceptee") return styles.pillAccepted;
  if (status === "refusee") return styles.pillRefused;
  if (status === "entretien") return styles.pillInterview;
  return styles.pillPending;
}

function getDocPillStyle(status: string) {
  if (status === "uploaded") return styles.pillAccepted;
  if (status === "requested") return styles.pillPending;
  return styles.pillInterview;
}

export function EntrepriseHomeScreen() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("apercu");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<EntrepriseStats>(DEFAULT_STATS);
  const [offers, setOffers] = useState<OffreRow[]>([]);
  const [applications, setApplications] = useState<AppItem[]>([]);
  const [threads, setThreads] = useState<MsgThread[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedConversationCandidatureId, setSelectedConversationCandidatureId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationDraft, setConversationDraft] = useState("");
  const [conversationSending, setConversationSending] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;

    setErrorMessage(null);

    try {
      const offersResult = await supabase
        .from("offres")
        .select(
          "id, titre, contrat, localisation, secteur, salaire_min, salaire_max, statut, entreprise_id, created_at",
        )
        .eq("entreprise_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      const offersData = (offersResult.data ?? []) as OffreRow[];
      setOffers(offersData);

      const offerIds = offersData.map((offer) => offer.id);
      let applicationsData: CandidatureRow[] = [];
      if (offerIds.length > 0) {
        const applicationsResult = await supabase
          .from("candidatures")
          .select("id, offre_id, talent_id, statut, note, created_at")
          .in("offre_id", offerIds)
          .order("created_at", { ascending: false })
          .limit(100);
        applicationsData = (applicationsResult.data ?? []) as CandidatureRow[];
      }

      const [messagesResult, docsResult] = await Promise.all([
        supabase
          .from("messages")
          .select("id, candidature_id, expedition_id, destinataire_id, contenu, lu, created_at")
          .or(`destinataire_id.eq.${user.id},expedition_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("document_requests")
          .select(
            "id, candidature_id, entreprise_id, talent_id, document_label, status, requested_at, uploaded_at, created_at",
          )
          .eq("entreprise_id", user.id)
          .order("requested_at", { ascending: false })
          .limit(100),
      ]);

      const offerTitleMap = new Map(offersData.map((offer) => [offer.id, offer.titre || "Offre"]));
      const appsMapped: AppItem[] = applicationsData.map((application) => ({
        id: application.id,
        offreId: application.offre_id,
        talentId: application.talent_id,
        offreTitre: offerTitleMap.get(application.offre_id) || "Offre",
        statut: application.statut,
        createdAt: application.created_at,
      }));
      setApplications(appsMapped);

      const applicationById = new Map(appsMapped.map((item) => [item.id, item]));
      const messagesData = (messagesResult.data ?? []) as MessageRow[];
      const threadMap = new Map<string, MsgThread>();
      for (const message of messagesData) {
        if (!threadMap.has(message.candidature_id)) {
          const app = applicationById.get(message.candidature_id);
          threadMap.set(message.candidature_id, {
            candidatureId: message.candidature_id,
            offreTitre: app?.offreTitre || "Candidature",
            lastContent: message.contenu,
            lastAt: message.created_at,
            unreadCount:
              message.destinataire_id === user.id && !message.lu ? 1 : 0,
          });
        } else {
          const current = threadMap.get(message.candidature_id)!;
          if (message.destinataire_id === user.id && !message.lu) {
            current.unreadCount += 1;
          }
        }
      }
      setThreads(Array.from(threadMap.values()));

      const docsData = (docsResult.data ?? []) as Array<DocumentRequestRow & { document_label: string }>;
      const docsMapped: DocItem[] = docsData.map((doc) => ({
        id: doc.id,
        label: doc.document_label || "Document",
        status: doc.status,
        requestedAt: doc.requested_at,
        uploadedAt: doc.uploaded_at,
      }));
      setDocuments(docsMapped);

      setStats({
        offresPubliees: offersData.length,
        candidaturesRecues: applicationsData.length,
        candidaturesEnAttente: applicationsData.filter(
          (application) => !application.statut || application.statut === "envoyee",
        ).length,
        candidaturesAcceptees: applicationsData.filter((application) => application.statut === "acceptee").length,
        messagesNonLus: messagesData.filter((message) => message.destinataire_id === user.id && !message.lu).length,
        demandesDocumentsEnCours: docsData.filter((doc) => doc.status === "requested").length,
      });
    } catch {
      setErrorMessage("Impossible de charger les donnees entreprise pour le moment.");
    }
  }, [user]);

  useEffect(() => {
    void fetchDashboard().finally(() => setLoading(false));
  }, [fetchDashboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  const openConversation = useCallback(
    async (candidatureId: string) => {
      if (!user) return;
      setSelectedConversationCandidatureId(candidatureId);
      setConversationLoading(true);
      setErrorMessage(null);
      setActionMessage(null);

      const [conversationResult] = await Promise.all([
        supabase
          .from("messages")
          .select("id, candidature_id, expedition_id, destinataire_id, contenu, lu, created_at")
          .eq("candidature_id", candidatureId)
          .order("created_at", { ascending: true }),
        (supabase as any)
          .from("messages")
          .update({ lu: true })
          .eq("candidature_id", candidatureId)
          .eq("destinataire_id", user.id)
          .eq("lu", false),
      ]);

      const data = (conversationResult.data ?? []) as MessageRow[];
      const mapped: ConversationMessage[] = data.map((message) => ({
        id: message.id,
        candidatureId: message.candidature_id,
        contenu: message.contenu,
        createdAt: message.created_at,
        lu: message.lu,
        expeditionId: message.expedition_id,
        destinataireId: message.destinataire_id,
      }));
      setConversationMessages(mapped);
      setConversationLoading(false);

      const nextThreads = threads.map((thread) =>
        thread.candidatureId === candidatureId ? { ...thread, unreadCount: 0 } : thread,
      );
      setThreads(nextThreads);
      const unreadNow = nextThreads.reduce((sum, thread) => sum + thread.unreadCount, 0);
      setStats((prev) => ({ ...prev, messagesNonLus: unreadNow }));
    },
    [threads, user],
  );

  const sendConversationReply = useCallback(async () => {
    if (!user || !selectedConversationCandidatureId) return;
    const application = applications.find((item) => item.id === selectedConversationCandidatureId);
    const content = conversationDraft.trim();

    if (!application || !application.talentId) {
      setErrorMessage("Destinataire introuvable pour cette conversation.");
      return;
    }
    if (!content) {
      setErrorMessage("Ecrivez un message avant envoi.");
      return;
    }

    setConversationSending(true);
    setErrorMessage(null);
    const { data, error } = await (supabase as any)
      .from("messages")
      .insert([
        {
          candidature_id: selectedConversationCandidatureId,
          expedition_id: user.id,
          destinataire_id: application.talentId,
          contenu: content,
          lu: false,
        },
      ])
      .select("id, candidature_id, expedition_id, destinataire_id, contenu, lu, created_at")
      .single();

    if (error) {
      setErrorMessage("Envoi impossible pour le moment.");
      setConversationSending(false);
      return;
    }

    const message = data as MessageRow;
    setConversationMessages((prev) => [
      ...prev,
      {
        id: message.id,
        candidatureId: message.candidature_id,
        contenu: message.contenu,
        createdAt: message.created_at,
        lu: message.lu,
        expeditionId: message.expedition_id,
        destinataireId: message.destinataire_id,
      },
    ]);
    setConversationDraft("");
    setConversationSending(false);
    setActionMessage("Message envoye au talent.");
  }, [applications, conversationDraft, selectedConversationCandidatureId, user]);

  const acceptanceRate = useMemo(() => {
    if (stats.candidaturesRecues === 0) return 0;
    return Math.round((stats.candidaturesAcceptees / stats.candidaturesRecues) * 100);
  }, [stats]);

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === selectedOfferId) || null,
    [offers, selectedOfferId],
  );

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedApplicationId) || null,
    [applications, selectedApplicationId],
  );

  const selectedConversationApplication = useMemo(
    () => applications.find((application) => application.id === selectedConversationCandidatureId) || null,
    [applications, selectedConversationCandidatureId],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement de votre espace entreprise...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4fc6ff" />}
    >
      <View style={styles.hero}>
        <Text style={styles.title}>
          Bonjour {getCompanyName(profile?.company_name ?? null, profile?.full_name ?? null)}
        </Text>
        <Text style={styles.subtitle}>
          Votre cockpit mobile entreprise: offres, candidatures, messages et documents.
        </Text>
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {actionMessage ? <Text style={styles.success}>{actionMessage}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tabButton, activeTab === tab.id ? styles.tabButtonActive : null]}
          >
            <Text style={[styles.tabText, activeTab === tab.id ? styles.tabTextActive : null]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {activeTab === "apercu" && (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Offres publiees</Text>
              <Text style={styles.statValue}>{stats.offresPubliees}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Candidatures recues</Text>
              <Text style={styles.statValue}>{stats.candidaturesRecues}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Messages non lus</Text>
              <Text style={styles.statValue}>{stats.messagesNonLus}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Taux d'acceptation</Text>
              <Text style={styles.statValue}>{acceptanceRate}%</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priorites du moment</Text>
            <Text style={styles.quickActionItem}>Candidatures en attente: {stats.candidaturesEnAttente}</Text>
            <Text style={styles.quickActionItem}>
              Demandes de documents en cours: {stats.demandesDocumentsEnCours}
            </Text>
            <Text style={styles.quickActionItem}>Messages non lus: {stats.messagesNonLus}</Text>
          </View>
        </>
      )}

      {activeTab === "offres" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes offres</Text>
          {offers.length === 0 ? (
            <Text style={styles.emptyText}>Aucune offre publiee pour le moment.</Text>
          ) : (
            offers.map((offer) => (
              <View key={offer.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{offer.titre}</Text>
                  <View style={[styles.pill, styles.pillInterview]}>
                    <Text style={styles.pillText}>{mapOfferStatus(offer.statut)}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  {(offer.localisation || "Localisation non precisee") +
                    " - " +
                    (offer.contrat || "Contrat non precise")}
                </Text>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setSelectedOfferId((prev) => (prev === offer.id ? null : offer.id))}
                >
                  <Text style={styles.secondaryButtonText}>
                    {selectedOfferId === offer.id ? "Masquer detail" : "Voir detail"}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
          {selectedOffer ? (
            <View style={styles.detailPanel}>
              <Text style={styles.detailTitle}>Detail de l'offre</Text>
              <Text style={styles.cardMeta}>Titre: {selectedOffer.titre}</Text>
              <Text style={styles.cardMeta}>Secteur: {selectedOffer.secteur || "Non precise"}</Text>
              <Text style={styles.cardMeta}>Statut: {mapOfferStatus(selectedOffer.statut)}</Text>
              <Text style={styles.cardMeta}>Publication: {formatDate(selectedOffer.created_at)}</Text>
            </View>
          ) : null}
        </View>
      )}

      {activeTab === "candidatures" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Candidatures recues</Text>
          {applications.length === 0 ? (
            <Text style={styles.emptyText}>Aucune candidature recue pour le moment.</Text>
          ) : (
            applications.map((application) => (
              <View key={application.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{application.offreTitre}</Text>
                  <View style={[styles.pill, getStatusPillStyle(application.statut)]}>
                    <Text style={styles.pillText}>{mapCandidatureStatus(application.statut)}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>Recue le {formatDate(application.createdAt)}</Text>
                <View style={styles.inlineActions}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setSelectedApplicationId((prev) => (prev === application.id ? null : application.id))}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {selectedApplicationId === application.id ? "Masquer detail" : "Voir detail"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      setActiveTab("messagerie");
                      void openConversation(application.id);
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Ouvrir conversation</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          {selectedApplication ? (
            <View style={styles.detailPanel}>
              <Text style={styles.detailTitle}>Detail candidature</Text>
              <Text style={styles.cardMeta}>Offre: {selectedApplication.offreTitre}</Text>
              <Text style={styles.cardMeta}>Statut: {mapCandidatureStatus(selectedApplication.statut)}</Text>
              <Text style={styles.cardMeta}>Date: {formatDate(selectedApplication.createdAt)}</Text>
            </View>
          ) : null}
        </View>
      )}

      {activeTab === "messagerie" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messagerie</Text>
          {threads.length === 0 ? (
            <Text style={styles.emptyText}>Aucun message recu pour le moment.</Text>
          ) : (
            threads.map((thread) => (
              <View key={thread.candidatureId} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{thread.offreTitre}</Text>
                  {thread.unreadCount > 0 ? (
                    <Text style={styles.unreadBadge}>{thread.unreadCount} nouveau(x)</Text>
                  ) : null}
                </View>
                <Text style={styles.cardMeta}>{thread.lastContent}</Text>
                <Text style={styles.cardMeta}>Dernier message: {formatDateTime(thread.lastAt)}</Text>
                <Pressable style={styles.secondaryButton} onPress={() => void openConversation(thread.candidatureId)}>
                  <Text style={styles.secondaryButtonText}>Ouvrir conversation</Text>
                </Pressable>
              </View>
            ))
          )}

          {selectedConversationCandidatureId ? (
            <View style={styles.detailPanel}>
              <Text style={styles.detailTitle}>
                Conversation - {selectedConversationApplication?.offreTitre || "Candidature"}
              </Text>
              {conversationLoading ? (
                <Text style={styles.cardMeta}>Chargement de la conversation...</Text>
              ) : conversationMessages.length === 0 ? (
                <Text style={styles.cardMeta}>Aucun message pour le moment.</Text>
              ) : (
                <View style={styles.conversationList}>
                  {conversationMessages.map((message) => {
                    const isMine = message.expeditionId === user?.id;
                    return (
                      <View
                        key={message.id}
                        style={[
                          styles.bubble,
                          isMine ? styles.myBubble : styles.otherBubble,
                        ]}
                      >
                        <Text style={styles.bubbleText}>{message.contenu}</Text>
                        <Text style={styles.bubbleDate}>{formatDateTime(message.createdAt)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="Ecrivez votre reponse..."
                placeholderTextColor="#7d8aa8"
                multiline
                value={conversationDraft}
                onChangeText={setConversationDraft}
              />
              <Pressable
                style={styles.primaryButton}
                onPress={() => void sendConversationReply()}
                disabled={conversationSending}
              >
                <Text style={styles.primaryButtonText}>
                  {conversationSending ? "Envoi..." : "Envoyer"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      {activeTab === "documents" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demandes de documents</Text>
          {documents.length === 0 ? (
            <Text style={styles.emptyText}>Aucune demande de document pour le moment.</Text>
          ) : (
            documents.map((document) => (
              <View key={document.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{document.label}</Text>
                  <View style={[styles.pill, getDocPillStyle(document.status)]}>
                    <Text style={styles.pillText}>{mapDocumentStatus(document.status)}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>Demande le {formatDate(document.requestedAt)}</Text>
                {document.uploadedAt ? (
                  <Text style={styles.cardMeta}>Recu le {formatDate(document.uploadedAt)}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      )}

      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutButtonText}>Se deconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#060911",
    padding: 20,
    gap: 14,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#060911",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    color: "#c4d0e8",
    fontSize: 16,
    textAlign: "center",
  },
  hero: {
    backgroundColor: "#111726",
    borderWidth: 1,
    borderColor: "#273552",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  title: {
    color: "#f4f8ff",
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: "#b4bfd7",
    fontSize: 14,
    lineHeight: 21,
  },
  error: {
    color: "#ff9d9d",
    fontSize: 14,
  },
  success: {
    color: "#95f2ba",
    fontSize: 14,
  },
  tabsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  tabButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2a3753",
    backgroundColor: "#121a2b",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tabButtonActive: {
    backgroundColor: "#14b8a6",
    borderColor: "#34d3c5",
  },
  tabText: {
    color: "#c5cfe6",
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#05101a",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  statCard: {
    width: "50%",
    padding: 4,
  },
  statLabel: {
    color: "#9eabc5",
    fontSize: 12,
    marginBottom: 6,
  },
  statValue: {
    color: "#f4f8ff",
    fontSize: 24,
    fontWeight: "800",
  },
  section: {
    backgroundColor: "#0f1422",
    borderWidth: 1,
    borderColor: "#202b44",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: "#eef3ff",
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#141b2d",
    borderWidth: 1,
    borderColor: "#23304c",
    borderRadius: 12,
    padding: 12,
    gap: 5,
  },
  detailPanel: {
    marginTop: 4,
    backgroundColor: "#111a2a",
    borderWidth: 1,
    borderColor: "#2b3d60",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  detailTitle: {
    color: "#e7eeff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    color: "#f4f8ff",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  cardMeta: {
    color: "#a7b3cd",
    fontSize: 13,
    lineHeight: 19,
  },
  unreadBadge: {
    color: "#7bd0ff",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyText: {
    color: "#a2aec8",
    fontSize: 14,
  },
  quickActionItem: {
    color: "#aeb9d2",
    fontSize: 14,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  pillText: {
    color: "#eaf0ff",
    fontSize: 12,
    fontWeight: "700",
  },
  pillPending: {
    backgroundColor: "#3f2f1e",
    borderColor: "#755831",
  },
  pillAccepted: {
    backgroundColor: "#153622",
    borderColor: "#2a6d42",
  },
  pillRefused: {
    backgroundColor: "#3a1d23",
    borderColor: "#7f3642",
  },
  pillInterview: {
    backgroundColor: "#1d2f4a",
    borderColor: "#2f5d9b",
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  secondaryButton: {
    marginTop: 2,
    alignSelf: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#35557f",
    backgroundColor: "#1b2d45",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  secondaryButtonText: {
    color: "#d9e9ff",
    fontSize: 12,
    fontWeight: "700",
  },
  conversationList: {
    gap: 8,
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: "92%",
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#0f8f8d",
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1b273f",
  },
  bubbleText: {
    color: "#eef4ff",
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleDate: {
    color: "#c3d4ff",
    fontSize: 11,
    marginTop: 5,
  },
  input: {
    backgroundColor: "#171f32",
    borderWidth: 1,
    borderColor: "#2e4268",
    borderRadius: 10,
    color: "#e9f1ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 78,
    textAlignVertical: "top",
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: "#11a7a4",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  signOutButton: {
    marginTop: 4,
    backgroundColor: "#1f2538",
    borderWidth: 1,
    borderColor: "#2f3a58",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 46,
  },
  signOutButtonText: {
    color: "#f4f8ff",
    fontSize: 16,
    fontWeight: "700",
  },
});
