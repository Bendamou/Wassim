import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, FlatList, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// ── Shared types ────────────────────────────────────────────────────────────
interface Job {
  id: number; service: string; budget: number; location: string;
  status: string; bidsCount?: number; scheduledTime?: string; createdAt?: string;
}
const SVC_EMOJI: Record<string, string> = { haircut: "💇", beard: "🧔", nails: "💅", full_grooming: "✨" };
const SVC_LABEL: Record<string, string> = { haircut: "Haircut", beard: "Beard Trim", nails: "Nails", full_grooming: "Full Package" };

// ── CLIENT HOME ─────────────────────────────────────────────────────────────
function ClientHome() {
  const { user, token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", "client"],
    queryFn: () => api("GET", "/dashboard/client", undefined, token),
    enabled: !!token,
    refetchInterval: 10000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const STATUS_COLOR: Record<string, string> = { open: "#4ade80", in_progress: "#00B4FF", completed: "#9ca3af", cancelled: "#ef4444" };

  return (
    <View style={[styles.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00B4FF" />}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user?.name?.split(" ")[0]} 👋</Text>
          </View>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Active Jobs", value: dashboard?.activeJobs ?? "–", color: "#00B4FF" },
            { label: "Pending Bids", value: dashboard?.pendingBids ?? "–", color: "#FF1F8E" },
            { label: "Total Jobs", value: dashboard?.totalJobs ?? "–", color: "#9B30FF" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { borderColor: `${s.color}30` }]}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.postBtn, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/post-job"); }}
        >
          <Feather name="plus-circle" size={22} color="#000" />
          <Text style={styles.postBtnText}>Post a New Job</Text>
          <Feather name="chevron-right" size={20} color="#000" />
        </Pressable>

        {/* Recent jobs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Jobs</Text>
          {isLoading ? (
            <ActivityIndicator color="#00B4FF" style={{ marginTop: 20 }} />
          ) : (dashboard?.recentJobs?.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <Feather name="briefcase" size={32} color="#374151" />
              <Text style={styles.emptyText}>No jobs yet — post your first one!</Text>
            </View>
          ) : (
            dashboard?.recentJobs?.map((job: Job) => (
              <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => router.push("/(tabs)/activity")}>
                <View style={styles.jobIcon}>
                  <Text style={{ fontSize: 20 }}>{SVC_EMOJI[job.service] ?? "✂️"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{SVC_LABEL[job.service] ?? job.service}</Text>
                  <Text style={styles.jobSub}>{job.location}</Text>
                </View>
                <View>
                  <Text style={styles.jobBudget}>{job.budget}</Text>
                  <Text style={styles.jobBudgetSub}>MAD</Text>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[job.status] ?? "#9ca3af" }]} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── FREELANCER HOME ─────────────────────────────────────────────────────────
function FreelancerHome() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: jobs = [], isLoading, refetch } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: () => api("GET", "/jobs", undefined, token),
    enabled: !!token,
    refetchInterval: 5000,
  });

  return (
    <View style={[styles.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.header}>
        <View>
          <View style={styles.liveRow}>
            <Text style={styles.sectionTitle}>Nearby Requests</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.subLabel}>{jobs.length} open request{jobs.length !== 1 ? "s" : ""}</Text>
        </View>
        {isLoading && <ActivityIndicator color="#FF1F8E" size="small" />}
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(j) => String(j.id)}
        scrollEnabled={jobs.length > 0}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FF1F8E" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 : 100, gap: 12 }}
        ListEmptyComponent={!isLoading ? (
          <View style={[styles.empty, { marginTop: 60 }]}>
            <Feather name="zap" size={40} color="#374151" />
            <Text style={styles.emptyText}>No requests yet</Text>
            <Text style={styles.emptyHint}>Clients are posting — check back soon</Text>
          </View>
        ) : null}
        renderItem={({ item: job }) => (
          <Pressable
            style={({ pressed }) => [styles.jobCard, styles.jobCardFull, { borderColor: pressed ? "#FF1F8E50" : "rgba(255,255,255,0.08)", opacity: pressed ? 0.85 : 1 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/activity"); }}
          >
            <View style={[styles.jobIcon, { backgroundColor: "rgba(255,31,142,0.12)", borderColor: "rgba(255,31,142,0.25)" }]}>
              <Text style={{ fontSize: 22 }}>{SVC_EMOJI[job.service] ?? "✂️"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobTitle}>{SVC_LABEL[job.service] ?? job.service}</Text>
              <View style={styles.jobMetaRow}>
                <Feather name="map-pin" size={12} color="#9ca3af" />
                <Text style={styles.jobSub}>{job.location}</Text>
              </View>
              {(job.bidsCount ?? 0) === 0 ? (
                <Text style={styles.firstBid}>⚡ Be the first!</Text>
              ) : (
                <Text style={styles.bidCount}>{job.bidsCount} bid{job.bidsCount !== 1 ? "s" : ""}</Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.jobBudget}>{job.budget}</Text>
              <Text style={styles.jobBudgetSub}>MAD</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

// ── SALON HOME ──────────────────────────────────────────────────────────────
function SalonHome() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [salonId, setSalonId] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [lostRevenue, setLostRevenue] = useState(0);
  const liveRef = useRef(isLive);
  liveRef.current = isLive;

  useEffect(() => {
    if (!token) return;
    api("GET", "/salons", undefined, token).then((salons: any[]) => {
      const mine = salons.find((s: any) => s.ownerId === user?.id || s.owner_id === user?.id);
      if (mine) { setSalonId(mine.id); setIsLive(!!mine.is_live); }
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!salonId || !token) return;
    const load = () => {
      api("GET", `/salons/${salonId}/queue`, undefined, token).then(setQueue).catch(() => {});
    };
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [salonId, token]);

  // Lost revenue ticker
  useEffect(() => {
    if (!isLive) { setLostRevenue(0); return; }
    const iv = setInterval(() => setLostRevenue((v) => v + 0.04), 1000);
    return () => clearInterval(iv);
  }, [isLive]);

  const toggleLive = async () => {
    if (!salonId || toggling) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setToggling(true);
    try {
      await api("POST", `/salons/${salonId}/go-live`, undefined, token);
      setIsLive((v) => !v);
    } catch {} finally { setToggling(false); }
  };

  return (
    <View style={[styles.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.userName}>Salon Dashboard</Text>
            <Text style={styles.subLabel}>{user?.name}</Text>
          </View>
        </View>

        {/* Go Live Toggle */}
        <View style={styles.liveTile}>
          <View style={{ flex: 1 }}>
            <Text style={styles.liveTileLabel}>{isLive ? "🟢 You're LIVE" : "Go Live"}</Text>
            <Text style={styles.liveTileSub}>{isLive ? "Clients can find & book you" : "Start accepting walk-ins"}</Text>
            {isLive && lostRevenue > 0 && (
              <View style={styles.revenueRow}>
                <Feather name="trending-up" size={14} color="#4ade80" />
                <Text style={styles.revenueText}>+{lostRevenue.toFixed(0)} MAD earned today</Text>
              </View>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [styles.toggleBtn, isLive ? styles.toggleOn : styles.toggleOff, { opacity: toggling || pressed ? 0.75 : 1 }]}
            onPress={toggleLive}
          >
            {toggling ? <ActivityIndicator color="#fff" size="small" /> : (
              <Feather name={isLive ? "wifi" : "wifi-off"} size={22} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Queue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Queue ({queue.length})</Text>
          {queue.length === 0 ? (
            <View style={[styles.empty, { marginTop: 12 }]}>
              <Feather name="users" size={28} color="#374151" />
              <Text style={styles.emptyText}>{isLive ? "No claims yet — share your link!" : "Go live to start accepting walk-ins"}</Text>
            </View>
          ) : (
            queue.map((claim: any) => (
              <View key={claim.id} style={styles.queueCard}>
                <View style={styles.jobIcon}>
                  <Feather name="user" size={18} color="#00B4FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{claim.clientName ?? `Client #${claim.clientId}`}</Text>
                  <Text style={styles.jobSub}>Chair {claim.chairId ?? "–"} · {claim.status}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: claim.status === "claimed" ? "#4ade80" : "#9ca3af", width: 10, height: 10 }]} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Root component ─────────────────────────────────────────────────────────
export default function HomeTab() {
  const { user } = useAuth();
  if (user?.role === "professional") return <FreelancerHome />;
  if (user?.role === "salon_owner") return <SalonHome />;
  return <ClientHome />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090013" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9ca3af" },
  userName: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  subLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 2 },
  avatarBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,180,255,0.18)", borderWidth: 1.5, borderColor: "rgba(0,180,255,0.35)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#00B4FF" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: "#130028", borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "center" },
  statVal: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#9ca3af", marginTop: 4, textAlign: "center" },
  postBtn: {
    marginHorizontal: 20, marginBottom: 28, backgroundColor: "#00B4FF",
    borderRadius: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  postBtnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#000" },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#f0eeff", marginBottom: 14 },
  jobCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#130028", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 10 },
  jobCardFull: { backgroundColor: "#130028" },
  jobIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(0,180,255,0.10)", borderWidth: 1, borderColor: "rgba(0,180,255,0.20)", alignItems: "center", justifyContent: "center" },
  jobTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  jobSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 2 },
  jobMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  jobBudget: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#f0eeff", textAlign: "right" },
  jobBudgetSub: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#9ca3af", textAlign: "right" },
  statusDot: { width: 8, height: 8, borderRadius: 4, alignSelf: "flex-end", marginTop: 6 },
  firstBid: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#4ade80", marginTop: 4 },
  bidCount: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#FF1F8E", marginTop: 4 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 32 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#6b7280", textAlign: "center" },
  emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#4b5563", textAlign: "center" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,31,142,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF1F8E" },
  liveText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FF1F8E", letterSpacing: 1 },
  liveTile: { marginHorizontal: 20, marginBottom: 24, backgroundColor: "#130028", borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  liveTileLabel: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  liveTileSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 4 },
  revenueRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  revenueText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#4ade80" },
  toggleBtn: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  toggleOn: { backgroundColor: "#4ade80" },
  toggleOff: { backgroundColor: "#374151" },
  queueCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#160030", borderRadius: 16, padding: 14, marginBottom: 8 },
});
