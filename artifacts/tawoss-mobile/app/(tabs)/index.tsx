import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { SVC_LABEL_AR, STATUS_LABEL } from "@/lib/strings";

interface Job {
  id: number; service: string; budget: number; location: string;
  status: string; bidsCount?: number;
}

const SVC_EMOJI: Record<string, string> = { haircut: "💇", beard: "🧔", nails: "💅", full_grooming: "✨" };
const STATUS_COLOR: Record<string, string> = { open: "#4ade80", in_progress: "#00B4FF", completed: "#9ca3af", cancelled: "#ef4444" };

function ClientHome() {
  const { user, token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", "client"],
    queryFn: () => api("GET", "/dashboard/client", undefined, token),
    enabled: !!token,
    refetchInterval: 10000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.goodMorning : hour < 18 ? t.goodAfternoon : t.goodEvening;
  const svcMap = SVC_LABEL_AR(t);
  const statusMap = STATUS_LABEL(t);

  return (
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00B4FF" />}>
        <View style={s.header}>
          <View style={s.avatarBox}>
            <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[s.greeting, { textAlign: ta }]}>{greeting}،</Text>
            <Text style={[s.userName, { textAlign: ta }]}>{user?.name?.split(" ")[0]} 👋</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          {[
            { label: t.activeJobs, value: dashboard?.activeJobs ?? "–", color: "#00B4FF" },
            { label: t.pendingBids, value: dashboard?.pendingBids ?? "–", color: "#FF1F8E" },
            { label: t.totalJobs, value: dashboard?.totalJobs ?? "–", color: "#9B30FF" },
          ].map((s2) => (
            <View key={s2.label} style={[s.statCard, { borderColor: `${s2.color}30` }]}>
              <Text style={[s.statVal, { color: s2.color }]}>{s2.value}</Text>
              <Text style={s.statLabel}>{s2.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [s.postBtn, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/post-job"); }}
        >
          <Text style={s.postBtnText}>{t.postNewJob}</Text>
          <Feather name="plus-circle" size={22} color="#000" />
        </Pressable>

        <View style={s.section}>
          <Text style={[s.sectionTitle, { textAlign: ta }]}>{t.recentJobs}</Text>
          {isLoading ? (
            <ActivityIndicator color="#00B4FF" style={{ marginTop: 20 }} />
          ) : (dashboard?.recentJobs?.length ?? 0) === 0 ? (
            <View style={s.empty}>
              <Feather name="briefcase" size={32} color="#374151" />
              <Text style={s.emptyText}>{t.noJobsYet}</Text>
            </View>
          ) : (
            dashboard?.recentJobs?.map((job: Job) => (
              <TouchableOpacity key={job.id} style={s.jobCard} onPress={() => router.push("/(tabs)/activity")}>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[s.jobTitle, { textAlign: ta }]}>{svcMap[job.service] ?? job.service}</Text>
                  <Text style={[s.jobSub, { textAlign: ta }]}>{job.location}</Text>
                </View>
                <View style={s.jobIcon}>
                  <Text style={{ fontSize: 20 }}>{SVC_EMOJI[job.service] ?? "✂️"}</Text>
                </View>
                <View style={{ alignItems: "flex-start" }}>
                  <Text style={s.jobBudget}>{job.budget}</Text>
                  <Text style={s.jobBudgetSub}>{t.mad}</Text>
                  <View style={[s.statusDot, { backgroundColor: STATUS_COLOR[job.status] ?? "#9ca3af" }]} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function FreelancerHome() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;
  const svcMap = SVC_LABEL_AR(t);

  const { data: jobs = [], isLoading, refetch } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: () => api("GET", "/jobs", undefined, token),
    enabled: !!token,
    refetchInterval: 5000,
  });

  return (
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={s.header}>
        <View style={{ alignItems: "flex-end" }}>
          <View style={s.liveRow}>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>{t.live}</Text>
            </View>
            <Text style={[s.sectionTitle, { textAlign: ta }]}>{t.nearbyRequests}</Text>
          </View>
          <Text style={[s.subLabel, { textAlign: ta }]}>{t.openRequestsLabel(jobs.length)}</Text>
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
          <View style={[s.empty, { marginTop: 60 }]}>
            <Feather name="zap" size={40} color="#374151" />
            <Text style={s.emptyText}>{t.noRequestsYet}</Text>
            <Text style={s.emptyHint}>{t.clientsPosting}</Text>
          </View>
        ) : null}
        renderItem={({ item: job }) => (
          <Pressable
            style={({ pressed }) => [s.jobCard, s.jobCardFull, { borderColor: pressed ? "#FF1F8E50" : "rgba(255,255,255,0.08)", opacity: pressed ? 0.85 : 1 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/activity"); }}
          >
            <View style={{ flex: 1, alignItems: ta === "right" ? "flex-end" : "flex-start" }}>
              <Text style={[s.jobTitle, { textAlign: ta }]}>{svcMap[job.service] ?? job.service}</Text>
              <Text style={[s.jobSub, { textAlign: ta }]}>{job.location}</Text>
              {(job.bidsCount ?? 0) === 0
                ? <Text style={s.firstBid}>{t.beTheFirst}</Text>
                : <Text style={s.bidCount}>{t.bidsCount(job.bidsCount!)}</Text>}
            </View>
            <View style={[s.jobIcon, { backgroundColor: "rgba(255,31,142,0.12)", borderColor: "rgba(255,31,142,0.25)" }]}>
              <Text style={{ fontSize: 22 }}>{SVC_EMOJI[job.service] ?? "✂️"}</Text>
            </View>
            <View style={{ alignItems: "flex-start" }}>
              <Text style={s.jobBudget}>{job.budget}</Text>
              <Text style={s.jobBudgetSub}>{t.mad}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function SalonHome() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;

  const [salonId, setSalonId] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [lostRevenue, setLostRevenue] = useState(0);
  const statusMap = STATUS_LABEL(t);

  useEffect(() => {
    if (!token) return;
    api("GET", "/salons", undefined, token).then((salons: any[]) => {
      const mine = salons.find((s: any) => s.ownerId === user?.id || s.owner_id === user?.id);
      if (mine) { setSalonId(mine.id); setIsLive(!!mine.is_live); }
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!salonId || !token) return;
    const load = () => api("GET", `/salons/${salonId}/queue`, undefined, token).then(setQueue).catch(() => {});
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [salonId, token]);

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
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.header}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[s.userName, { textAlign: ta }]}>{t.salonDashboard}</Text>
            <Text style={[s.subLabel, { textAlign: ta }]}>{user?.name}</Text>
          </View>
        </View>

        <View style={s.liveTile}>
          <Pressable
            style={({ pressed }) => [s.toggleBtn, isLive ? s.toggleOn : s.toggleOff, { opacity: toggling || pressed ? 0.75 : 1 }]}
            onPress={toggleLive}
          >
            {toggling ? <ActivityIndicator color="#fff" size="small" /> : (
              <Feather name={isLive ? "wifi" : "wifi-off"} size={22} color="#fff" />
            )}
          </Pressable>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={[s.liveTileLabel, { textAlign: ta }]}>{isLive ? t.youAreLive : t.goLive}</Text>
            <Text style={[s.liveTileSub, { textAlign: ta }]}>{isLive ? t.clientsCanFind : t.startAccepting}</Text>
            {isLive && lostRevenue > 0 && (
              <View style={s.revenueRow}>
                <Text style={s.revenueText}>+{lostRevenue.toFixed(0)} {t.earnedToday}</Text>
                <Feather name="trending-up" size={14} color="#4ade80" />
              </View>
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={[s.sectionTitle, { textAlign: ta }]}>{t.liveQueueTitle(queue.length)}</Text>
          {queue.length === 0 ? (
            <View style={[s.empty, { marginTop: 12 }]}>
              <Feather name="users" size={28} color="#374151" />
              <Text style={s.emptyText}>{isLive ? t.noClaimsYet : t.goLiveToStart}</Text>
            </View>
          ) : (
            queue.map((claim: any) => (
              <View key={claim.id} style={s.queueCard}>
                <View style={[s.statusDot, { backgroundColor: claim.status === "claimed" ? "#4ade80" : "#9ca3af", width: 10, height: 10 }]} />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[s.jobTitle, { textAlign: ta }]}>{claim.clientName ?? t.clientNum(claim.clientId)}</Text>
                  <Text style={[s.jobSub, { textAlign: ta }]}>{t.chair} {claim.chairId ?? "–"} · {statusMap[claim.status] ?? claim.status}</Text>
                </View>
                <View style={s.jobIcon}>
                  <Feather name="user" size={18} color="#00B4FF" />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default function HomeTab() {
  const { user } = useAuth();
  if (user?.role === "professional") return <FreelancerHome />;
  if (user?.role === "salon_owner") return <SalonHome />;
  return <ClientHome />;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090013" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  greeting: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#9ca3af" },
  userName: { fontSize: 24, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  subLabel: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 2 },
  avatarBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,180,255,0.18)", borderWidth: 1.5, borderColor: "rgba(0,180,255,0.35)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: "#130028", borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "center" },
  statVal: { fontSize: 24, fontFamily: "Cairo_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Cairo_500Medium", color: "#9ca3af", marginTop: 4, textAlign: "center" },
  postBtn: { marginHorizontal: 20, marginBottom: 28, backgroundColor: "#00B4FF", borderRadius: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  postBtnText: { fontSize: 18, fontFamily: "Cairo_700Bold", color: "#000" },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginBottom: 14 },
  jobCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#130028", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 10 },
  jobCardFull: { backgroundColor: "#130028" },
  jobIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(0,180,255,0.10)", borderWidth: 1, borderColor: "rgba(0,180,255,0.20)", alignItems: "center", justifyContent: "center" },
  jobTitle: { fontSize: 16, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  jobSub: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 2 },
  jobBudget: { fontSize: 20, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  jobBudgetSub: { fontSize: 11, fontFamily: "Cairo_500Medium", color: "#9ca3af" },
  statusDot: { width: 8, height: 8, borderRadius: 4, alignSelf: "center", marginTop: 6 },
  firstBid: { fontSize: 12, fontFamily: "Cairo_700Bold", color: "#4ade80", marginTop: 4 },
  bidCount: { fontSize: 12, fontFamily: "Cairo_700Bold", color: "#FF1F8E", marginTop: 4 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 32 },
  emptyText: { fontSize: 15, fontFamily: "Cairo_500Medium", color: "#6b7280", textAlign: "center" },
  emptyHint: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#4b5563", textAlign: "center" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,31,142,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF1F8E" },
  liveText: { fontSize: 10, fontFamily: "Cairo_700Bold", color: "#FF1F8E", letterSpacing: 1 },
  liveTile: { marginHorizontal: 20, marginBottom: 24, backgroundColor: "#130028", borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", gap: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  liveTileLabel: { fontSize: 20, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  liveTileSub: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 4 },
  revenueRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  revenueText: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#4ade80" },
  toggleBtn: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  toggleOn: { backgroundColor: "#4ade80" },
  toggleOff: { backgroundColor: "#374151" },
  queueCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#160030", borderRadius: 16, padding: 14, marginBottom: 8 },
});
