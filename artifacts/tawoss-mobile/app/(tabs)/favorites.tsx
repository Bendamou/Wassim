import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator, Alert, FlatList, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";
import { useFavorites, FavoriteSalon } from "@/hooks/useFavorites";

type Filter = "all" | "mens" | "womens" | "available";

export default function FavoritesTab() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;
  const router = useRouter();

  const { favorites, isLoading, refetch, toggle } = useFavorites();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let list = favorites;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
      );
    }
    if (filter === "mens") list = list.filter((s) => s.category === "mens" || !s.category);
    if (filter === "womens") list = list.filter((s) => s.category === "womens");
    if (filter === "available") list = list.filter((s) => (s.free_chairs ?? 0) > 0 || s.is_live);
    return list;
  }, [favorites, search, filter]);

  const handleRemove = (salon: FavoriteSalon) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      isRTL ? "إزالة من المفضلة؟" : "Remove from favorites?",
      salon.name,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.remove,
          style: "destructive",
          onPress: async () => {
            await toggle(salon.id);
          },
        },
      ]
    );
  };

  if (user?.role !== "client") return null;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "mens", label: t.filterMens },
    { key: "womens", label: t.filterWomens },
    { key: "available", label: t.filterAvailNow },
  ];

  return (
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={s.header}>
        <Text style={[s.title, { textAlign: ta }]}>{t.favoritesTitle}</Text>
        {isLoading && <ActivityIndicator color="#FF1F8E" size="small" />}
      </View>

      <View style={s.searchRow}>
        <Feather name="search" size={16} color="#6b7280" style={s.searchIcon} />
        <TextInput
          style={[s.searchInput, { textAlign: ta }]}
          placeholder={t.searchSalons}
          placeholderTextColor="#4b5563"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterPill, filter === f.key && s.filterPillActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(s) => String(s.id)}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FF1F8E" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 : 110, gap: 14 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Text style={s.emptyHeart}>❤️</Text>
              <Text style={s.emptyTitle}>{t.noFavorites}</Text>
              <Text style={s.emptySub}>{t.noFavoritesSub}</Text>
              <Pressable
                style={({ pressed }) => [s.browseBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={s.browseBtnText}>{t.browseSalons}</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item: salon }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.salonAvatar}>
                <Text style={s.salonAvatarText}>{salon.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, alignItems: ta === "right" ? "flex-end" : "flex-start" }}>
                <Text style={[s.salonName, { textAlign: ta }]}>{salon.name}</Text>
                {!!salon.city && (
                  <View style={s.metaRow}>
                    <Feather name="map-pin" size={11} color="#9ca3af" />
                    <Text style={s.metaText}>{salon.city}</Text>
                  </View>
                )}
                {!!salon.rating && salon.rating > 0 && (
                  <View style={s.metaRow}>
                    <Feather name="star" size={11} color="#FFDD00" />
                    <Text style={[s.metaText, { color: "#FFDD00" }]}>{salon.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => handleRemove(salon)} style={s.heartBtn}>
                <Feather name="heart" size={20} color="#FF1F8E" />
              </TouchableOpacity>
            </View>

            <View style={s.badgeRow}>
              {salon.is_live ? (
                <View style={s.liveBadge}>
                  <View style={s.liveDot} />
                  <Text style={s.liveText}>LIVE</Text>
                </View>
              ) : null}
              {(salon.free_chairs ?? 0) > 0 ? (
                <View style={s.chairBadge}>
                  <Feather name="users" size={11} color="#00B4FF" />
                  <Text style={s.chairText}>{t.chairsAvailable(Number(salon.free_chairs))}</Text>
                </View>
              ) : null}
            </View>

            <View style={s.actions}>
              <Pressable
                style={({ pressed }) => [s.actionBtn, s.bookBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/explore");
                }}
              >
                <Feather name="scissors" size={14} color="#000" />
                <Text style={s.bookBtnText}>{t.bookNow}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.actionBtn, s.mapBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/explore");
                }}
              >
                <Feather name="map" size={14} color="#00B4FF" />
                <Text style={s.mapBtnText}>{t.viewMap}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.actionBtn, s.removeBtn, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => handleRemove(salon)}
              >
                <Feather name="trash-2" size={14} color="#ef4444" />
                <Text style={s.removeBtnText}>{t.remove}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090013" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 22, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 12, backgroundColor: "#130028", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 14, gap: 10, height: 46 },
  searchIcon: { },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Cairo_400Regular", color: "#f0eeff", paddingVertical: 0 },
  filterRow: { paddingHorizontal: 20, paddingBottom: 14, gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "transparent" },
  filterPillActive: { backgroundColor: "rgba(255,31,142,0.15)", borderColor: "#FF1F8E" },
  filterText: { fontSize: 13, fontFamily: "Cairo_600SemiBold", color: "#6b7280" },
  filterTextActive: { color: "#FF1F8E" },
  card: { backgroundColor: "#130028", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 16, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  salonAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(155,48,255,0.15)", borderWidth: 1, borderColor: "rgba(155,48,255,0.3)", alignItems: "center", justifyContent: "center" },
  salonAvatarText: { fontSize: 20, fontFamily: "Cairo_700Bold", color: "#9B30FF" },
  salonName: { fontSize: 16, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "#9ca3af" },
  heartBtn: { padding: 6 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(74,222,128,0.12)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80" },
  liveText: { fontSize: 11, fontFamily: "Cairo_700Bold", color: "#4ade80", letterSpacing: 1 },
  chairBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,180,255,0.12)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chairText: { fontSize: 11, fontFamily: "Cairo_600SemiBold", color: "#00B4FF" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12, paddingVertical: 10 },
  bookBtn: { backgroundColor: "#FF1F8E" },
  bookBtnText: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#000" },
  mapBtn: { backgroundColor: "rgba(0,180,255,0.12)", borderWidth: 1, borderColor: "rgba(0,180,255,0.3)" },
  mapBtnText: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
  removeBtn: { backgroundColor: "rgba(239,68,68,0.10)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" },
  removeBtnText: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#ef4444" },
  empty: { alignItems: "center", gap: 12, paddingTop: 80, paddingHorizontal: 40 },
  emptyHeart: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontFamily: "Cairo_700Bold", color: "#f0eeff", textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#6b7280", textAlign: "center", lineHeight: 22 },
  browseBtn: { marginTop: 8, backgroundColor: "#FF1F8E", borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  browseBtnText: { fontSize: 15, fontFamily: "Cairo_700Bold", color: "#000" },
});
