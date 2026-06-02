import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator, FlatList, Platform, Pressable,
  RefreshControl, StyleSheet, Text, ToastAndroid, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { SVC_LABEL_AR } from "@/lib/strings";

interface Pro { id: number; name: string; rating?: number; location?: string; isVerified: boolean; acceptedBids?: number; }
interface Job { id: number; service: string; budget: number; location: string; status: string; bidsCount?: number; }
interface Salon { id: number; name: string; address?: string; rating?: number; is_live?: boolean; free_chairs?: number; avg_service_price?: number; owner_name?: string; }

const SVC_EMOJI: Record<string, string> = { haircut: "💇", beard: "🧔", nails: "💅", full_grooming: "✨" };

function HeartButton({ salonId, token }: { salonId: number; token: string | null }) {
  const qc = useQueryClient();
  const t = useStrings();

  const { data: check } = useQuery<{ isFavorite: boolean }>({
    queryKey: ["fav-check", salonId],
    queryFn: () => api("GET", `/users/favorites/check/${salonId}`, undefined, token),
    enabled: !!token,
    staleTime: 30_000,
  });

  const isFav = check?.isFavorite ?? false;

  const toggle = useMutation({
    mutationFn: () =>
      isFav
        ? api("DELETE", `/users/favorites/${salonId}`, undefined, token)
        : api("POST", `/users/favorites/${salonId}`, undefined, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fav-check", salonId] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      if (Platform.OS === "android") {
        ToastAndroid.show(isFav ? t.removedFromFavorites : t.addedToFavorites, ToastAndroid.SHORT);
      }
    },
  });

  return (
    <Pressable
      style={[hb.btn, isFav && hb.btnActive]}
      onPress={() => toggle.mutate()}
      disabled={toggle.isPending}
    >
      <Feather name="heart" size={16} color={isFav ? "#FF1F8E" : "#6b7280"} />
    </Pressable>
  );
}

const hb = StyleSheet.create({
  btn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,31,142,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  btnActive: { backgroundColor: "rgba(255,31,142,0.18)", borderColor: "rgba(255,31,142,0.45)" },
});

function ClientExplore() {
  const { token } = useAuth();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;

  const { data: salons = [], isLoading: salonsLoading, refetch: refetchSalons } = useQuery<Salon[]>({
    queryKey: ["salons"],
    queryFn: () => api("GET", "/salons", undefined, token),
    enabled: !!token,
  });

  const { data: pros = [], isLoading: prosLoading, refetch: refetchPros } = useQuery<Pro[]>({
    queryKey: ["professionals"],
    queryFn: () => api("GET", "/professionals", undefined, token),
    enabled: !!token,
  });

  const isLoading = salonsLoading || prosLoading;
  const refetch = useCallback(() => { refetchSalons(); refetchPros(); }, [refetchSalons, refetchPros]);

  type Section =
    | { type: "header-salons" }
    | { type: "salon"; data: Salon }
    | { type: "empty-salons" }
    | { type: "header-pros" }
    | { type: "pro"; data: Pro }
    | { type: "empty-pros" };

  const listData: Section[] = [
    { type: "header-salons" },
    ...(salons.length > 0
      ? salons.map(s => ({ type: "salon" as const, data: s }))
      : [{ type: "empty-salons" as const }]),
    { type: "header-pros" },
    ...(pros.length > 0
      ? pros.map(p => ({ type: "pro" as const, data: p }))
      : [{ type: "empty-pros" as const }]),
  ];

  return (
    <View style={s.screen}>
      {isLoading && (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <ActivityIndicator color="#00B4FF" size="small" />
        </View>
      )}
      <FlatList
        data={listData}
        keyExtractor={(item, i) => {
          if (item.type === "salon") return `salon-${item.data.id}`;
          if (item.type === "pro") return `pro-${item.data.id}`;
          return `${item.type}-${i}`;
        }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00B4FF" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 70 : 120, gap: 12 }}
        renderItem={({ item }) => {
          if (item.type === "header-salons") {
            return (
              <View style={s.header}>
                <Text style={[s.title, { textAlign: ta }]}>{t.salonsNearby}</Text>
              </View>
            );
          }
          if (item.type === "empty-salons") {
            return (
              <View style={s.empty}>
                <Feather name="scissors" size={28} color="#374151" />
                <Text style={s.emptyText}>{t.noSalons}</Text>
              </View>
            );
          }
          if (item.type === "salon") {
            const salon = item.data;
            const freeChairs = Number(salon.free_chairs ?? 0);
            return (
              <View style={s.card}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    {salon.is_live && (
                      <View style={s.liveBadge}>
                        <View style={s.liveDot} />
                        <Text style={s.liveText}>{t.isLive}</Text>
                      </View>
                    )}
                    <Text style={[s.proName, { textAlign: ta, flex: 1 }]} numberOfLines={1}>{salon.name}</Text>
                  </View>
                  {!!salon.address && (
                    <Text style={[s.proSub, { textAlign: ta }]} numberOfLines={1}>
                      <Feather name="map-pin" size={10} color="#9ca3af" /> {salon.address}
                    </Text>
                  )}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                    {typeof salon.rating === "number" && salon.rating > 0 && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Feather name="star" size={11} color="#FFDD00" />
                        <Text style={[s.rating, { fontSize: 12 }]}>{salon.rating.toFixed(1)}</Text>
                      </View>
                    )}
                    <View style={[s.chairPill, { borderColor: freeChairs > 0 ? "rgba(0,180,255,0.3)" : "rgba(255,255,255,0.1)" }]}>
                      <Feather name="scissors" size={10} color={freeChairs > 0 ? "#00B4FF" : "#6b7280"} />
                      <Text style={[s.chairText, { color: freeChairs > 0 ? "#00B4FF" : "#6b7280" }]}>
                        {freeChairs > 0 ? t.freeChairs(freeChairs) : t.noFreeChairs}
                      </Text>
                    </View>
                  </View>
                </View>
                <HeartButton salonId={salon.id} token={token} />
              </View>
            );
          }
          if (item.type === "header-pros") {
            return (
              <View style={[s.header, { marginTop: 8 }]}>
                <Text style={[s.title, { textAlign: ta }]}>{t.topProfessionals}</Text>
              </View>
            );
          }
          if (item.type === "empty-pros") {
            return (
              <View style={s.empty}>
                <Feather name="users" size={28} color="#374151" />
                <Text style={s.emptyText}>{t.noProfessionals}</Text>
              </View>
            );
          }
          if (item.type === "pro") {
            const pro = item.data;
            return (
              <View style={s.card}>
                {(pro.acceptedBids ?? 0) > 0 && (
                  <View style={s.statPill}>
                    <Text style={s.statPillText}>{t.jobsCount(pro.acceptedBids!)}</Text>
                  </View>
                )}
                <View style={{ flex: 1, alignItems: ta === "right" ? "flex-end" : "flex-start" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {pro.isVerified && <Feather name="check-circle" size={13} color="#00B4FF" />}
                    <Text style={[s.proName, { textAlign: ta }]}>{pro.name}</Text>
                  </View>
                  {!!pro.location && <Text style={[s.proSub, { textAlign: ta }]}>{pro.location}</Text>}
                  {!!pro.rating && pro.rating > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <Text style={s.rating}>{pro.rating.toFixed(1)}</Text>
                      <Feather name="star" size={12} color="#FFDD00" />
                    </View>
                  )}
                </View>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{pro.name[0]?.toUpperCase()}</Text>
                </View>
              </View>
            );
          }
          return null;
        }}
      />
    </View>
  );
}

function FreelancerExplore() {
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
    <View style={[s.screen, ]}>
      <View style={s.header}>
        {isLoading && <ActivityIndicator color="#FF1F8E" size="small" />}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>{jobs.length}</Text>
          </View>
          <Text style={[s.title, { textAlign: ta }]}>{t.allRequests}</Text>
        </View>
      </View>
      <FlatList
        data={jobs}
        keyExtractor={(j) => String(j.id)}
        scrollEnabled={jobs.length > 0}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FF1F8E" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 70 : 120, gap: 12 }}
        ListEmptyComponent={!isLoading ? (
          <View style={s.empty}>
            <Feather name="zap" size={36} color="#374151" />
            <Text style={s.emptyText}>{t.noRequests}</Text>
          </View>
        ) : null}
        renderItem={({ item: job }) => (
          <Pressable
            style={({ pressed }) => [s.card, { borderColor: pressed ? "#FF1F8E60" : "rgba(255,255,255,0.08)", opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push("/(tabs)/activity")}
          >
            <View style={{ alignItems: "flex-start" }}>
              <Text style={s.budget}>{job.budget}</Text>
              <Text style={s.budgetSub}>{t.mad}</Text>
            </View>
            <View style={{ flex: 1, alignItems: ta === "right" ? "flex-end" : "flex-start" }}>
              <Text style={[s.proName, { textAlign: ta }]}>{svcMap[job.service] ?? job.service}</Text>
              <Text style={[s.proSub, { textAlign: ta }]}>{job.location}</Text>
              {(job.bidsCount ?? 0) === 0
                ? <Text style={{ fontSize: 12, color: "#4ade80", fontFamily: "Cairo_700Bold", marginTop: 3 }}>⚡ {t.beTheFirst}</Text>
                : <Text style={{ fontSize: 12, color: "#FF1F8E", fontFamily: "Cairo_700Bold", marginTop: 3 }}>{t.bidsCount(job.bidsCount!)}</Text>}
            </View>
            <View style={s.svcIcon}>
              <Text style={{ fontSize: 20 }}>{SVC_EMOJI[job.service] ?? "✂️"}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function SalonExplore() {
  const insets = useSafeAreaInsets();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;

  const stats = [
    { label: t.todayRevenue, value: `0 ${t.mad}`, color: "#00B4FF" },
    { label: t.thisWeek, value: `0 ${t.mad}`, color: "#FF1F8E" },
    { label: t.chairsBusy, value: "0 / 4", color: "#9B30FF" },
    { label: t.avgRating, value: "–", color: "#FFDD00" },
  ];

  return (
    <View style={[s.screen, ]}>
      <View style={s.header}>
        <Text style={[s.title, { textAlign: ta }]}>{t.analytics}</Text>
      </View>
      <View style={s.analyticsGrid}>
        {stats.map((item) => (
          <View key={item.label} style={[s.analyticsCard, { borderColor: `${item.color}30` }]}>
            <Text style={[s.analyticsVal, { color: item.color }]}>{item.value}</Text>
            <Text style={[s.analyticsLabel, { textAlign: ta }]}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.empty}>
        <Feather name="bar-chart-2" size={40} color="#374151" />
        <Text style={s.emptyText}>{t.analyticsComingSoon}</Text>
        <Text style={s.emptyHint}>{t.yourEarningsHere}</Text>
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
  title: { fontSize: 22, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#130028", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(0,180,255,0.15)", borderWidth: 1, borderColor: "rgba(0,180,255,0.3)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
  svcIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,31,142,0.25)", backgroundColor: "rgba(255,31,142,0.12)", alignItems: "center", justifyContent: "center" },
  proName: { fontSize: 15, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  proSub: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 2 },
  rating: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#FFDD00" },
  statPill: { backgroundColor: "rgba(0,180,255,0.12)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statPillText: { fontSize: 12, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
  budget: { fontSize: 20, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  budgetSub: { fontSize: 11, fontFamily: "Cairo_400Regular", color: "#9ca3af" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,31,142,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF1F8E" },
  liveText: { fontSize: 12, fontFamily: "Cairo_700Bold", color: "#FF1F8E" },
  analyticsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  analyticsCard: { width: "46%", backgroundColor: "#130028", borderRadius: 18, padding: 18, borderWidth: 1 },
  analyticsVal: { fontSize: 22, fontFamily: "Cairo_700Bold" },
  analyticsLabel: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 4 },
  empty: { alignItems: "center", gap: 12, paddingTop: 40 },
  emptyText: { fontSize: 15, fontFamily: "Cairo_500Medium", color: "#6b7280" },
  emptyHint: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#4b5563", textAlign: "center", paddingHorizontal: 40 },
});
