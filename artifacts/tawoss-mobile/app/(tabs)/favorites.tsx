import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";
import { api } from "@/lib/api";

interface Salon {
  id: number;
  name: string;
  address?: string;
  rating?: number;
  is_live?: boolean;
  free_chairs?: number;
  total_chairs?: number;
  avg_service_price?: number;
  owner_name?: string;
  favorited_at?: string;
}

type Filter = "all" | "available" | "live";

export default function FavoritesTab() {
  const { token, user } = useAuth();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;
  const router = useRouter();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { data: favorites = [], isLoading, refetch, isRefetching } = useQuery<Salon[]>({
    queryKey: ["favorites"],
    queryFn: () => api("GET", "/users/favorites", undefined, token),
    enabled: !!token && user?.role === "client",
  });

  const removeMutation = useMutation({
    mutationFn: (salonId: number) => api("DELETE", `/users/favorites/${salonId}`, undefined, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["salons"] });
    },
  });

  const filtered = useMemo(() => {
    let list = favorites;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.address ?? "").toLowerCase().includes(q) ||
        (s.owner_name ?? "").toLowerCase().includes(q)
      );
    }
    if (filter === "available") list = list.filter(s => (s.free_chairs ?? 0) > 0);
    if (filter === "live") list = list.filter(s => s.is_live);
    return list;
  }, [favorites, search, filter]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "live", label: t.isLive },
    { key: "available", label: t.filterAvailable },
  ];

  const renderItem = useCallback(({ item: s }: { item: Salon }) => {
    const freeChairs = Number(s.free_chairs ?? 0);
    const isRemoving = removeMutation.isPending && removeMutation.variables === s.id;

    return (
      <View style={st.card}>
        <View style={st.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={st.nameRow}>
              {s.is_live && (
                <View style={st.liveBadge}>
                  <View style={st.liveDot} />
                  <Text style={st.liveText}>{t.isLive}</Text>
                </View>
              )}
              <Text style={[st.salonName, { textAlign: ta }]} numberOfLines={1}>
                {s.name}
              </Text>
            </View>
            {!!s.address && (
              <Text style={[st.address, { textAlign: ta }]} numberOfLines={1}>
                <Feather name="map-pin" size={11} color="#9ca3af" /> {s.address}
              </Text>
            )}
            {!!s.owner_name && (
              <Text style={[st.ownerName, { textAlign: ta }]}>
                <Feather name="scissors" size={11} color="#9B30FF" /> {s.owner_name}
              </Text>
            )}
          </View>

          <Pressable
            style={[st.heartBtn, isRemoving && { opacity: 0.4 }]}
            onPress={() => removeMutation.mutate(s.id)}
            disabled={isRemoving}
          >
            <Feather name="heart" size={20} color="#FF1F8E" />
          </Pressable>
        </View>

        <View style={st.metaRow}>
          {typeof s.rating === "number" && s.rating > 0 && (
            <View style={st.metaPill}>
              <Feather name="star" size={11} color="#FFDD00" />
              <Text style={[st.metaText, { color: "#FFDD00" }]}>{s.rating.toFixed(1)}</Text>
            </View>
          )}
          <View style={[st.metaPill, { borderColor: freeChairs > 0 ? "rgba(0,180,255,0.3)" : "rgba(255,255,255,0.1)" }]}>
            <Feather name="scissors" size={11} color={freeChairs > 0 ? "#00B4FF" : "#6b7280"} />
            <Text style={[st.metaText, { color: freeChairs > 0 ? "#00B4FF" : "#6b7280" }]}>
              {freeChairs > 0 ? t.freeChairs(freeChairs) : t.noFreeChairs}
            </Text>
          </View>
          {s.avg_service_price != null && (
            <View style={st.metaPill}>
              <Text style={[st.metaText, { color: "#9B30FF" }]}>~{s.avg_service_price} {t.mad}</Text>
            </View>
          )}
        </View>

        <View style={[st.actions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Pressable
            style={[st.actionBtn, { backgroundColor: "rgba(0,180,255,0.15)", borderColor: "rgba(0,180,255,0.35)" }]}
            onPress={() => router.push(`/(tabs)/explore`)}
          >
            <Feather name="calendar" size={14} color="#00B4FF" />
            <Text style={[st.actionText, { color: "#00B4FF" }]}>{t.bookNow}</Text>
          </Pressable>

          <Pressable
            style={[st.actionBtn, { backgroundColor: "rgba(155,48,255,0.12)", borderColor: "rgba(155,48,255,0.3)" }]}
            onPress={() => router.push(`/(tabs)/explore`)}
          >
            <Feather name="map" size={14} color="#9B30FF" />
            <Text style={[st.actionText, { color: "#9B30FF" }]}>{t.viewMap}</Text>
          </Pressable>

          <Pressable
            style={[st.actionBtn, { backgroundColor: "rgba(255,31,142,0.1)", borderColor: "rgba(255,31,142,0.25)" }]}
            onPress={() => removeMutation.mutate(s.id)}
            disabled={isRemoving}
          >
            <Feather name="trash-2" size={14} color="#FF1F8E" />
            <Text style={[st.actionText, { color: "#FF1F8E" }]}>{t.removeFav}</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [t, ta, isRTL, removeMutation, router]);

  if (user?.role !== "client") {
    return (
      <View style={[st.screen, { justifyContent: "center", alignItems: "center" }]}>
        <Feather name="lock" size={36} color="#374151" />
        <Text style={[st.emptyText, { marginTop: 12 }]}>Customers only</Text>
      </View>
    );
  }

  return (
    <View style={st.screen}>
      <View style={st.searchBar}>
        <Feather name="search" size={16} color="#6b7280" />
        <TextInput
          style={[st.searchInput, { textAlign: ta }]}
          placeholder={t.salonSearchPlaceholder}
          placeholderTextColor="#4b5563"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={15} color="#6b7280" />
          </Pressable>
        )}
      </View>

      <View style={[st.filters, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        {FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={[st.filterChip, filter === f.key && st.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[st.filterText, filter === f.key && st.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={st.center}>
          <ActivityIndicator color="#FF1F8E" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={s => String(s.id)}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#FF1F8E"
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Platform.OS === "web" ? 70 : 120,
            gap: 14,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={st.emptyState}>
              <Text style={st.emptyHeart}>❤️</Text>
              <Text style={st.emptyTitle}>{t.favoritesEmpty}</Text>
              <Text style={st.emptyHint}>{t.favoritesEmptyHint}</Text>
              <Pressable
                style={st.browseBtn}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Feather name="compass" size={16} color="#000" />
                <Text style={st.browseBtnText}>{t.browseSalons}</Text>
              </Pressable>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090013" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    backgroundColor: "#130028", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: "Cairo_400Regular", color: "#f0eeff",
  },

  filters: {
    gap: 8, paddingHorizontal: 16, paddingBottom: 10, flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  filterChipActive: { backgroundColor: "#FF1F8E", borderColor: "#FF1F8E" },
  filterText: { fontSize: 12, fontFamily: "Cairo_600SemiBold", color: "#9ca3af" },
  filterTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#130028", borderRadius: 18,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 3 },
  salonName: { fontSize: 16, fontFamily: "Cairo_700Bold", color: "#f0eeff", flex: 1 },
  address: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 2 },
  ownerName: { fontSize: 12, fontFamily: "Cairo_500Medium", color: "#c4b5fd", marginTop: 3 },

  heartBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,31,142,0.12)", borderWidth: 1, borderColor: "rgba(255,31,142,0.3)",
    alignItems: "center", justifyContent: "center",
  },

  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(74,222,128,0.15)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#4ade80" },
  liveText: { fontSize: 10, fontFamily: "Cairo_700Bold", color: "#4ade80" },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 12 },
  metaPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  metaText: { fontSize: 11, fontFamily: "Cairo_600SemiBold" },

  actions: { gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
  },
  actionText: { fontSize: 12, fontFamily: "Cairo_700Bold" },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  emptyHeart: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  emptyHint: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#6b7280", textAlign: "center", paddingHorizontal: 32 },
  emptyText: { fontSize: 15, fontFamily: "Cairo_500Medium", color: "#6b7280" },
  browseBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 16, backgroundColor: "#00B4FF",
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16,
  },
  browseBtnText: { fontSize: 14, fontFamily: "Cairo_700Bold", color: "#000" },
});
