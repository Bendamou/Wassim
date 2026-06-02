import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Platform, Pressable,
  RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { SVC_LABEL_AR, STATUS_LABEL } from "@/lib/strings";

interface Job { id: number; service: string; budget: number; location: string; status: string; bidsCount?: number; }
interface Bid { id: number; jobId: number; price: number; status: string; estimatedArrival?: string; }
const SVC_EMOJI: Record<string, string> = { haircut: "💇", beard: "🧔", nails: "💅", full_grooming: "✨" };
const STATUS_COLOR: Record<string, string> = { open: "#4ade80", in_progress: "#00B4FF", completed: "#9ca3af", cancelled: "#ef4444" };
const BID_COLOR: Record<string, string> = { pending: "#FFDD00", accepted: "#4ade80", rejected: "#ef4444" };

function ClientActivity() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;
  const svcMap = SVC_LABEL_AR(t);
  const statusMap = STATUS_LABEL(t);

  const { data: jobs = [], isLoading, refetch } = useQuery<Job[]>({
    queryKey: ["my-jobs"],
    queryFn: () => api("GET", "/jobs", undefined, token),
    enabled: !!token,
    refetchInterval: 5000,
  });

  const cancelMutation = useMutation({
    mutationFn: (jobId: number) => api("PATCH", `/jobs/${jobId}/status`, { status: "cancelled" }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-jobs"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => Alert.alert(t.error, t.couldNotCancel),
  });

  return (
    <View style={[s.screen, ]}>
      <View style={s.header}>
        {isLoading && <ActivityIndicator color="#00B4FF" size="small" />}
        <Text style={[s.title, { textAlign: ta }]}>{t.myJobs}</Text>
      </View>
      <FlatList
        data={jobs}
        keyExtractor={(j) => String(j.id)}
        scrollEnabled={jobs.length > 0}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00B4FF" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 : 120, gap: 12 }}
        ListEmptyComponent={!isLoading ? (
          <View style={s.empty}>
            <Feather name="briefcase" size={40} color="#374151" />
            <Text style={s.emptyText}>{t.noBidsOnJob}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/post-job")} style={s.emptyBtn}>
              <Text style={s.emptyBtnText}>{t.postFirstJob}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        renderItem={({ item: job }) => (
          <View style={s.card}>
            <View style={s.cardRow}>
              <View style={{ flex: 1, alignItems: ta === "right" ? "flex-end" : "flex-start" }}>
                <Text style={[s.cardTitle, { textAlign: ta }]}>{svcMap[job.service] ?? job.service}</Text>
                <Text style={[s.cardSub, { textAlign: ta }]}>{job.location}</Text>
                {(job.bidsCount ?? 0) > 0 && (
                  <Text style={s.bidsText}>⚡ {t.bidsCount(job.bidsCount!)}</Text>
                )}
              </View>
              <View style={s.icon}>
                <Text style={{ fontSize: 20 }}>{SVC_EMOJI[job.service] ?? "✂️"}</Text>
              </View>
              <View style={{ alignItems: "flex-start" }}>
                <Text style={s.budget}>{job.budget} {t.mad}</Text>
                <View style={[s.statusPill, { backgroundColor: `${STATUS_COLOR[job.status] ?? "#9ca3af"}20`, borderColor: `${STATUS_COLOR[job.status] ?? "#9ca3af"}50` }]}>
                  <Text style={[s.statusText, { color: STATUS_COLOR[job.status] ?? "#9ca3af" }]}>{statusMap[job.status] ?? job.status}</Text>
                </View>
              </View>
            </View>
            {job.status === "open" && (
              <TouchableOpacity
                onPress={() => Alert.alert(t.cancelJobTitle, t.cancelJobMsg, [
                  { text: t.keepJob, style: "cancel" },
                  { text: t.cancelJobConfirm, style: "destructive", onPress: () => cancelMutation.mutate(job.id) },
                ])}
                style={[s.cancelRow, { alignItems: isRTL ? "flex-start" : "flex-end" }]}
              >
                <Text style={s.cancelText}>{t.cancelThisJob}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

function FreelancerActivity() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;
  const svcMap = SVC_LABEL_AR(t);
  const statusMap = STATUS_LABEL(t);

  const [bidPrice, setBidPrice] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: () => api("GET", "/jobs", undefined, token),
    enabled: !!token,
    refetchInterval: 5000,
  });

  const { data: bids = [], isLoading, refetch } = useQuery<Bid[]>({
    queryKey: ["my-bids"],
    queryFn: () => api("GET", "/bids", undefined, token),
    enabled: !!token,
    refetchInterval: 5000,
  });

  const placeBid = async (jobId: number, budget: number) => {
    const price = Number(bidPrice[jobId] ?? budget);
    if (!price) return;
    setSubmitting(jobId);
    try {
      await api("POST", "/bids", { jobId, price, estimatedArrival: "15 mins" }, token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["my-bids"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    } catch (err: any) {
      Alert.alert(t.error, err.message ?? t.couldNotBid);
    } finally {
      setSubmitting(null);
    }
  };

  const openJobs = jobs.filter((j) => j.status === "open" && !bids.some((b) => b.jobId === j.id));

  return (
    <View style={[s.screen, ]}>
      <View style={s.header}>
        {isLoading && <ActivityIndicator color="#FF1F8E" size="small" />}
        <Text style={[s.title, { textAlign: ta }]}>{t.myBids}</Text>
      </View>

      <FlatList
        data={bids}
        keyExtractor={(b) => String(b.id)}
        scrollEnabled
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FF1F8E" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 : 120, gap: 12 }}
        ListHeaderComponent={openJobs.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={[s.sectionLabel, { textAlign: ta }]}>{t.availableJobs(openJobs.length)}</Text>
            {openJobs.slice(0, 4).map((job) => (
              <View key={job.id} style={[s.card, s.newJobCard]}>
                <View style={s.bidInputRow}>
                  <Pressable
                    style={({ pressed }) => [s.bidBtn, { opacity: (submitting === job.id || pressed) ? 0.7 : 1 }]}
                    onPress={() => placeBid(job.id, job.budget)}
                    disabled={submitting === job.id}
                  >
                    {submitting === job.id
                      ? <ActivityIndicator color="#000" size="small" />
                      : <Feather name="send" size={16} color="#000" />}
                  </Pressable>
                  <TextInput
                    style={s.bidInput}
                    placeholder={String(job.budget)}
                    placeholderTextColor="#6b7280"
                    value={bidPrice[job.id] ?? ""}
                    onChangeText={(v) => setBidPrice((prev) => ({ ...prev, [job.id]: v }))}
                    keyboardType="numeric"
                    textAlign={ta}
                  />
                </View>
                <View style={{ flex: 1, alignItems: ta === "right" ? "flex-end" : "flex-start" }}>
                  <Text style={[s.cardTitle, { textAlign: ta }]}>{svcMap[job.service] ?? job.service}</Text>
                  <Text style={[s.cardSub, { textAlign: ta }]}>{job.location} · {t.budget}: {job.budget} {t.mad}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        ListEmptyComponent={!isLoading ? (
          <View style={s.empty}>
            <Feather name="send" size={40} color="#374151" />
            <Text style={s.emptyText}>{t.noBidsYet}</Text>
            <Text style={s.emptyHint}>{t.browseToBid}</Text>
          </View>
        ) : null}
        renderItem={({ item: bid }) => (
          <View style={[s.card, { borderColor: `${BID_COLOR[bid.status] ?? "#9ca3af"}40` }]}>
            <View style={s.cardRow}>
              <View style={{ flex: 1, alignItems: ta === "right" ? "flex-end" : "flex-start" }}>
                <Text style={[s.cardTitle, { textAlign: ta }]}>{t.jobNum(bid.jobId)}</Text>
                <Text style={[s.cardSub, { textAlign: ta }]}>{t.yourBid}: {bid.price} {t.mad}</Text>
              </View>
              <View style={[s.statusPill, { backgroundColor: `${BID_COLOR[bid.status] ?? "#9ca3af"}20`, borderColor: `${BID_COLOR[bid.status] ?? "#9ca3af"}50` }]}>
                <Text style={[s.statusText, { color: BID_COLOR[bid.status] ?? "#9ca3af" }]}>{statusMap[bid.status] ?? bid.status}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function SalonActivity() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;
  const statusMap = STATUS_LABEL(t);
  const [salonId, setSalonId] = useState<number | null>(null);
  const [queue, setQueue] = useState<any[]>([]);

  useState(() => {
    if (!token) return;
    api("GET", "/salons", undefined, token)
      .then((salons: any[]) => {
        const mine = salons.find((s: any) => s.ownerId === user?.id || s.owner_id === user?.id);
        if (mine) setSalonId(mine.id);
      })
      .catch(() => {});
  });

  useState(() => {
    if (!salonId || !token) return;
    api("GET", `/salons/${salonId}/queue`, undefined, token).then(setQueue).catch(() => {});
  });

  const updateClaim = async (claimId: number, status: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api("PATCH", `/claims/${claimId}`, { status }, token);
      setQueue((prev) => prev.map((c: any) => (c.id === claimId ? { ...c, status } : c)));
    } catch (err: any) {
      Alert.alert(t.error, err.message);
    }
  };

  return (
    <View style={[s.screen, ]}>
      <View style={s.header}>
        <Text style={[s.title, { textAlign: ta }]}>{t.chairQueueTitle(queue.length)}</Text>
      </View>
      <FlatList
        data={queue}
        keyExtractor={(c: any) => String(c.id)}
        scrollEnabled={queue.length > 0}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 : 120, gap: 12 }}
        ListEmptyComponent={(
          <View style={s.empty}>
            <Feather name="users" size={40} color="#374151" />
            <Text style={s.emptyText}>{t.queueEmpty}</Text>
            <Text style={s.emptyHint}>{t.goLiveForQueue}</Text>
          </View>
        )}
        renderItem={({ item: claim }) => (
          <View style={[s.card, { flexDirection: "row", alignItems: "center", gap: 14 }]}>
            {claim.status === "claimed" && (
              <View style={{ gap: 8 }}>
                <TouchableOpacity style={s.actionBtn} onPress={() => updateClaim(claim.id, "completed")}>
                  <Feather name="check" size={18} color="#4ade80" />
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { borderColor: "rgba(239,68,68,0.4)", backgroundColor: "rgba(239,68,68,0.10)" }]} onPress={() => updateClaim(claim.id, "noshow")}>
                  <Feather name="x" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
            <View style={{ flex: 1, alignItems: ta === "right" ? "flex-end" : "flex-start" }}>
              <Text style={[s.cardTitle, { textAlign: ta }]}>{claim.clientName ?? t.clientNum(claim.clientId)}</Text>
              <Text style={[s.cardSub, { textAlign: ta }]}>{t.chair} {claim.chairId ?? "–"} · {t.depositLabel}: {claim.depositAmount ?? 20} {t.mad}</Text>
              <View style={[s.statusPill, { marginTop: 6, backgroundColor: "#9B30FF20", borderColor: "#9B30FF50" }]}>
                <Text style={[s.statusText, { color: "#9B30FF" }]}>{statusMap[claim.status] ?? claim.status}</Text>
              </View>
            </View>
            <View style={s.icon}>
              <Feather name="user" size={18} color="#9B30FF" />
            </View>
          </View>
        )}
      />
    </View>
  );
}

export default function ActivityTab() {
  const { user } = useAuth();
  if (user?.role === "professional") return <FreelancerActivity />;
  if (user?.role === "salon_owner") return <SalonActivity />;
  return <ClientActivity />;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090013" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 22, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  sectionLabel: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#FF1F8E", letterSpacing: 0.3, marginBottom: 10 },
  card: { backgroundColor: "#130028", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  newJobCard: { borderColor: "rgba(255,31,142,0.30)", backgroundColor: "rgba(255,31,142,0.06)", marginBottom: 10 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(0,180,255,0.10)", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  cardSub: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 2 },
  bidsText: { fontSize: 12, fontFamily: "Cairo_700Bold", color: "#FF1F8E", marginTop: 4 },
  budget: { fontSize: 15, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, marginTop: 4 },
  statusText: { fontSize: 11, fontFamily: "Cairo_700Bold" },
  cancelRow: { marginTop: 10 },
  cancelText: { fontSize: 13, fontFamily: "Cairo_500Medium", color: "#ef4444" },
  bidInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bidInput: { width: 70, height: 38, borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(255,31,142,0.4)", backgroundColor: "rgba(255,31,142,0.08)", paddingHorizontal: 10, fontSize: 15, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  bidBtn: { width: 40, height: 38, borderRadius: 10, backgroundColor: "#FF1F8E", alignItems: "center", justifyContent: "center" },
  actionBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(74,222,128,0.12)", borderWidth: 1, borderColor: "rgba(74,222,128,0.4)", alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 16, fontFamily: "Cairo_600SemiBold", color: "#6b7280" },
  emptyHint: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#4b5563", textAlign: "center", paddingHorizontal: 40 },
  emptyBtn: { backgroundColor: "rgba(0,180,255,0.15)", borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(0,180,255,0.3)" },
  emptyBtnText: { fontSize: 14, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
});
