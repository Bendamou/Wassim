import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, FlatList, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text,
  ToastAndroid, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { SVC_LABEL_AR } from "@/lib/strings";
import { useFavorites } from "@/hooks/useFavorites";

interface Pro { id: number; name: string; rating?: number; location?: string; isVerified: boolean; acceptedBids?: number; }
interface Job { id: number; service: string; budget: number; location: string; status: string; bidsCount?: number; }
interface Salon { id: number; name: string; city?: string; address?: string; rating?: number; is_live?: boolean; free_chairs?: number; total_chairs?: number; active_claims?: number; owner_name?: string; }
const SVC_EMOJI: Record<string, string> = { haircut: "💇", beard: "🧔", nails: "💅", full_grooming: "✨" };

function HeartButton({ salonId }: { salonId: number }) {
  const t = useStrings();
  const { isFavorite, toggle } = useFavorites();
  const [loading, setLoading] = useState(false);
  const fav = isFavorite(salonId);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const result = await toggle(salonId);
      if (Platform.OS === "android") {
        ToastAndroid.show(
          result === "added" ? t.addedToFavorites : t.removedFromFavorites,
          ToastAndroid.SHORT
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={s.heartBtn} disabled={loading}>
      <Feather name="heart" size={18} color={fav ? "#FF1F8E" : "#4b5563"} />
    </TouchableOpacity>
  );
}

function ClientExplore() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;
  const router = useRouter();

  const { data: salons = [], isLoading: salonsLoading, refetch: refetchSalons } = useQuery<Salon[]>({
    queryKey: ["salons"],
    queryFn: () => api("GET", "/salons", undefined, token),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const { data: pros = [], isLoading: prosLoading, refetch: refetchPros } = useQuery<Pro[]>({
    queryKey: ["professionals"],
    queryFn: () => api("GET", "/professionals", undefined, token),
    enabled: !!token,
  });

  const isLoading = salonsLoading || prosLoading;
  const refetch = () => { refetchSalons(); refetchPros(); };

  return (
    <ScrollView
      style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00B4FF" />}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 110 }}
    >
      <View style={s.header}>
        {isLoading && <ActivityIndicator color="#00B4FF" size="small" />}
        <Text style={[s.title, { textAlign: ta }]}>{t.salonsNearby}</Text>
      </View>

      {salons.map((salon) => (
        <Pressable
          key={salon.id}
          style={({ pressed }) => [s.salonCard, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/salon/${salon.id}` as any);
          }}
        >
          <View style={s.salonAvatar}>
            <Text style={s.salonAvatarText}>{salon.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, alignItems: ta === "right" ? "flex-end" : "flex-start" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {salon.is_live && (
                <View style={s.liveSmall}>
                  <View style={s.liveDot} />
                </View>
              )}
              <Text style={[s.salonName, { textAlign: ta }]}>{salon.name}</Text>
            </View>
            {!!salon.city && <Text style={[s.proSub, { textAlign: ta }]}>{salon.city}</Text>}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              {!!salon.rating && salon.rating > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Feather name="star" size={11} color="#FFDD00" />
                  <Text style={s.rating}>{salon.rating.toFixed(1)}</Text>
                </View>
              )}
              {(salon.free_chairs ?? 0) > 0 && (
                <View style={s.chairBadge}>
                  <Text style={s.chairText}>{t.chairsAvailable(Number(salon.free_chairs))}</Text>
                </View>
              )}
            </View>
          </View>
          <HeartButton salonId={salon.id} />
        </Pressable>
      ))}

      {salons.length === 0 && !salonsLoading && (
        <View style={[s.empty, { marginTop: 0, marginBottom: 32 }]}>
          <Feather name="scissors" size={32} color="#374151" />
          <Text style={s.emptyText}>{t.noProfessionals}</Text>
        </View>
      )}

      <View style={[s.header, { marginTop: 8 }]}>
        <Text style={[s.title, { textAlign: ta }]}>{t.topProfessionals}</Text>
      </View>

      {pros.map((pro) => (
        <View key={pro.id} style={[s.card, { marginHorizontal: 20, marginBottom: 10 }]}>
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
      ))}

      {pros.length === 0 && !prosLoading && (
        <View style={s.empty}>
          <Feather name="users" size={36} color="#374151" />
          <Text style={s.emptyText}>{t.noProfessionals}</Text>
        </View>
      )}
    </ScrollView>
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
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 : 120, gap: 12 }}
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
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 20, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  salonCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#130028", borderRadius: 18, padding: 14, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  salonAvatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(155,48,255,0.15)", borderWidth: 1, borderColor: "rgba(155,48,255,0.3)", alignItems: "center", justifyContent: "center" },
  salonAvatarText: { fontSize: 18, fontFamily: "Cairo_700Bold", color: "#9B30FF" },
  salonName: { fontSize: 15, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  heartBtn: { padding: 8, borderRadius: 20, backgroundColor: "rgba(255,31,142,0.08)" },
  chairBadge: { backgroundColor: "rgba(0,180,255,0.10)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  chairText: { fontSize: 11, fontFamily: "Cairo_600SemiBold", color: "#00B4FF" },
  liveSmall: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
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
