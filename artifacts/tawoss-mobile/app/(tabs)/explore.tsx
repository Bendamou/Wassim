import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, FlatList, Platform, Pressable,
  RefreshControl, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface Pro { id: number; name: string; rating?: number; location?: string; bio?: string; isVerified: boolean; acceptedBids?: number; }
interface Job { id: number; service: string; budget: number; location: string; status: string; bidsCount?: number; }

const SVC_EMOJI: Record<string, string> = { haircut: "💇", beard: "🧔", nails: "💅", full_grooming: "✨" };
const SVC_LABEL: Record<string, string> = { haircut: "Haircut", beard: "Beard Trim", nails: "Nails", full_grooming: "Full Package" };

// ── CLIENT ───────────────────────────────────────────────────────────────────
function ClientExplore() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: pros = [], isLoading, refetch } = useQuery<Pro[]>({
    queryKey: ["professionals"],
    queryFn: () => api("GET", "/professionals", undefined, token),
    enabled: !!token,
  });

  return (
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Top Professionals</Text>
        {isLoading && <ActivityIndicator color="#00B4FF" size="small" />}
      </View>
      <FlatList
        data={pros}
        keyExtractor={(p) => String(p.id)}
        scrollEnabled={pros.length > 0}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00B4FF" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 : 120, gap: 12 }}
        ListEmptyComponent={!isLoading ? (
          <View style={s.empty}>
            <Feather name="users" size={36} color="#374151" />
            <Text style={s.emptyText}>No professionals yet</Text>
          </View>
        ) : null}
        renderItem={({ item: pro }) => (
          <View style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{pro.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={s.proName}>{pro.name}</Text>
                {pro.isVerified && <Feather name="check-circle" size={13} color="#00B4FF" />}
              </View>
              {!!pro.location && <Text style={s.proSub}>{pro.location}</Text>}
              {!!pro.rating && pro.rating > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Feather name="star" size={12} color="#FFDD00" />
                  <Text style={s.rating}>{pro.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
            {(pro.acceptedBids ?? 0) > 0 && (
              <View style={s.statPill}>
                <Text style={s.statPillText}>{pro.acceptedBids} jobs</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

// ── FREELANCER ───────────────────────────────────────────────────────────────
function FreelancerExplore() {
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
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={s.title}>All Requests</Text>
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>{jobs.length}</Text>
          </View>
        </View>
        {isLoading && <ActivityIndicator color="#FF1F8E" size="small" />}
      </View>
      <FlatList
        data={jobs}
        keyExtractor={(j) => String(j.id)}
        scrollEnabled={jobs.length > 0}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FF1F8E" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 : 120, gap: 12 }}
        ListEmptyComponent={!isLoading ? (
          <View style={s.empty}>
            <Feather name="zap" size={36} color="#374151" />
            <Text style={s.emptyText}>No requests right now</Text>
          </View>
        ) : null}
        renderItem={({ item: job }) => (
          <Pressable
            style={({ pressed }) => [s.card, { borderColor: pressed ? "#FF1F8E60" : "rgba(255,255,255,0.08)", opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push("/(tabs)/activity")}
          >
            <View style={s.svcIcon}>
              <Text style={{ fontSize: 20 }}>{SVC_EMOJI[job.service] ?? "✂️"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.proName}>{SVC_LABEL[job.service] ?? job.service}</Text>
              <Text style={s.proSub}>{job.location}</Text>
              {(job.bidsCount ?? 0) === 0
                ? <Text style={{ fontSize: 12, color: "#4ade80", fontFamily: "Inter_700Bold", marginTop: 3 }}>⚡ No bids yet</Text>
                : <Text style={{ fontSize: 12, color: "#FF1F8E", fontFamily: "Inter_700Bold", marginTop: 3 }}>{job.bidsCount} bids</Text>
              }
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.budget}>{job.budget}</Text>
              <Text style={s.budgetSub}>MAD</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

// ── SALON ────────────────────────────────────────────────────────────────────
function SalonExplore() {
  const insets = useSafeAreaInsets();

  const stats = [
    { label: "Today's Revenue", value: "0 MAD", color: "#00B4FF" },
    { label: "This Week", value: "0 MAD", color: "#FF1F8E" },
    { label: "Chairs Busy", value: "0 / 4", color: "#9B30FF" },
    { label: "Avg Rating", value: "–", color: "#FFDD00" },
  ];

  return (
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Analytics</Text>
      </View>
      <View style={s.analyticsGrid}>
        {stats.map((item) => (
          <View key={item.label} style={[s.analyticsCard, { borderColor: `${item.color}30` }]}>
            <Text style={[s.analyticsVal, { color: item.color }]}>{item.value}</Text>
            <Text style={s.analyticsLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.empty}>
        <Feather name="bar-chart-2" size={40} color="#374151" />
        <Text style={s.emptyText}>Detailed analytics coming soon</Text>
        <Text style={s.emptyHint}>Your earnings and chair activity will appear here</Text>
      </View>
    </View>
  );
}

export default function ExploreTab() {
  const { user } = useAuth();
  if (user?.role === "professional") return <FreelancerExplore />;
  if (user?.role === "salon_owner") return <SalonExplore />;
  return <ClientExplore />;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090013" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#130028", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(0,180,255,0.15)", borderWidth: 1, borderColor: "rgba(0,180,255,0.3)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#00B4FF" },
  svcIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,31,142,0.25)", backgroundColor: "rgba(255,31,142,0.12)", alignItems: "center", justifyContent: "center" },
  proName: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  proSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 2 },
  rating: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFDD00" },
  statPill: { backgroundColor: "rgba(0,180,255,0.12)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statPillText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#00B4FF" },
  budget: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  budgetSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9ca3af" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,31,142,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF1F8E" },
  liveText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#FF1F8E" },
  analyticsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  analyticsCard: { width: "46%", backgroundColor: "#130028", borderRadius: 18, padding: 18, borderWidth: 1 },
  analyticsVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  analyticsLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 4 },
  empty: { alignItems: "center", gap: 12, paddingTop: 40 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#6b7280" },
  emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#4b5563", textAlign: "center", paddingHorizontal: 40 },
});
