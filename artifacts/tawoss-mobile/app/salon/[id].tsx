import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Platform, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";
import { useFavorites } from "@/hooks/useFavorites";
import { api } from "@/lib/api";

type Chair = { id: number; name: string; status: "available" | "occupied" };
type Service = { id: number; name: string; description?: string; price: number; duration_mins: number };
type Review = { id: number; client_name: string; rating: number; comment: string; created_at: string };
type SalonDetail = {
  id: number; name: string; address?: string; city?: string;
  description?: string; is_live: boolean; is_verified: boolean;
  free_chairs: number; total_chairs: number; avg_service_price?: number;
  owner_name?: string; rating?: number;
  chairs: Chair[]; services: Service[]; reviews: Review[];
  activeClaims?: any[];
};

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Feather key={i} name="star" size={12}
          color={i <= Math.round(rating) ? "#FFDD00" : "#374151"} />
      ))}
    </View>
  );
}

export default function SalonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;
  const { isFavorite, toggle } = useFavorites();

  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"services" | "chairs" | "reviews">("services");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api("GET", `/salons/${id}`, undefined, token)
      .then(setSalon)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleFav = async () => {
    if (!user || favLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFavLoading(true);
    try { await toggle(Number(id)); } finally { setFavLoading(false); }
  };

  const fav = isFavorite(Number(id));
  const freeChairs = Number(salon?.free_chairs ?? 0);
  const avgRating = salon?.reviews?.length
    ? (salon.reviews.reduce((s, r) => s + r.rating, 0) / salon.reviews.length)
    : 0;

  return (
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 0 : 0 }]}>
      {/* Header bar */}
      <View style={[s.headerBar, { paddingTop: Platform.OS === "web" ? 16 : insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color="#f0eeff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{salon?.name ?? ""}</Text>
        <TouchableOpacity onPress={handleFav} style={[s.favBtn, fav && s.favBtnActive]} disabled={favLoading}>
          <Feather name="heart" size={18} color={fav ? "#FF1F8E" : "#6b7280"} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#00B4FF" size="large" />
        </View>
      ) : !salon ? (
        <View style={s.center}>
          <Feather name="alert-circle" size={40} color="#374151" />
          <Text style={s.errorText}>Salon not found</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 40 : 110 }}
        >
          {/* Hero card */}
          <View style={s.heroCard}>
            <View style={s.heroAvatar}>
              <Text style={s.heroAvatarText}>{salon.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={s.heroName} numberOfLines={2}>{salon.name}</Text>
                {salon.is_verified && (
                  <View style={s.verifiedBadge}>
                    <Feather name="check-circle" size={12} color="#00B4FF" />
                  </View>
                )}
              </View>

              {!!salon.address && (
                <View style={s.metaRow}>
                  <Feather name="map-pin" size={12} color="#6b7280" />
                  <Text style={s.metaText}>{salon.address}</Text>
                </View>
              )}

              {avgRating > 0 && (
                <View style={s.metaRow}>
                  <Stars rating={avgRating} />
                  <Text style={s.ratingText}>{avgRating.toFixed(1)}</Text>
                  <Text style={s.reviewCount}>({salon.reviews.length})</Text>
                </View>
              )}

              <View style={s.metaRow}>
                <Feather name="scissors" size={12} color="#6b7280" />
                <Text style={s.metaText}>{salon.total_chairs} chairs</Text>
                {freeChairs > 0 && (
                  <>
                    <Text style={s.dot}>·</Text>
                    <View style={s.freeChairBadge}>
                      <Text style={s.freeChairText}>{freeChairs} free</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Live / Walk-in CTA */}
          {salon.is_live && (
            <View style={s.liveCta}>
              <View style={s.liveRow}>
                <View style={s.liveDot} />
                <Text style={s.liveLabel}>LIVE NOW</Text>
                {freeChairs > 0 && (
                  <Text style={s.liveChairs}>{freeChairs} chair{freeChairs !== 1 ? "s" : ""} open</Text>
                )}
              </View>
              {freeChairs > 0 && user?.role === "client" && (
                <Text style={s.liveSubtext}>Walk in and claim your spot</Text>
              )}
            </View>
          )}

          {/* Description */}
          {!!salon.description && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { textAlign: ta }]}>About</Text>
              <Text style={[s.description, { textAlign: ta }]}>{salon.description}</Text>
            </View>
          )}

          {/* Tabs */}
          <View style={s.tabBar}>
            {(["services", "chairs", "reviews"] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[s.tab, activeTab === tab && s.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                  {tab === "services" ? t.services ?? "Services"
                    : tab === "chairs" ? "Chairs"
                    : t.reviews ?? "Reviews"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Services */}
          {activeTab === "services" && (
            <View style={s.section}>
              {salon.services.length === 0 ? (
                <Text style={s.emptyTabText}>No services listed yet.</Text>
              ) : salon.services.map(svc => (
                <View key={svc.id} style={s.serviceCard}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[s.serviceName, { textAlign: ta }]}>{svc.name}</Text>
                    {!!svc.description && (
                      <Text style={[s.serviceDesc, { textAlign: ta }]}>{svc.description}</Text>
                    )}
                    <View style={s.metaRow}>
                      <Feather name="clock" size={11} color="#6b7280" />
                      <Text style={s.metaText}>{svc.duration_mins} min</Text>
                    </View>
                  </View>
                  <View style={s.priceBox}>
                    <Text style={s.priceNum}>{svc.price}</Text>
                    <Text style={s.priceCur}>MAD</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Chairs */}
          {activeTab === "chairs" && (
            <View style={s.section}>
              {salon.chairs.length === 0 ? (
                <Text style={s.emptyTabText}>No chairs listed.</Text>
              ) : (
                <View style={s.chairGrid}>
                  {salon.chairs.map(ch => {
                    const free = ch.status === "available";
                    return (
                      <View key={ch.id} style={[s.chairTile, free ? s.chairFree : s.chairBusy]}>
                        <Feather name="scissors" size={18} color={free ? "#4ade80" : "#6b7280"} />
                        <Text style={[s.chairName, { color: free ? "#4ade80" : "#6b7280" }]}
                          numberOfLines={1}>{ch.name}</Text>
                        <View style={[s.chairStatusDot, { backgroundColor: free ? "#4ade80" : "#FF1F8E" }]} />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Reviews */}
          {activeTab === "reviews" && (
            <View style={s.section}>
              {salon.reviews.length === 0 ? (
                <Text style={s.emptyTabText}>No reviews yet.</Text>
              ) : salon.reviews.map(rev => (
                <View key={rev.id} style={s.reviewCard}>
                  <View style={s.reviewHeader}>
                    <View style={s.reviewAvatar}>
                      <Text style={s.reviewAvatarText}>{rev.client_name?.[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.reviewName}>{rev.client_name}</Text>
                      <Stars rating={rev.rating} />
                    </View>
                  </View>
                  {!!rev.comment && (
                    <Text style={[s.reviewComment, { textAlign: ta }]}>{rev.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090013" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 15, fontFamily: "Cairo_400Regular", color: "#6b7280" },

  headerBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "#090013", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  favBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  favBtnActive: { backgroundColor: "rgba(255,31,142,0.15)", borderWidth: 1, borderColor: "rgba(255,31,142,0.4)" },

  heroCard: {
    flexDirection: "row", gap: 14, padding: 20,
    backgroundColor: "#130028", marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  heroAvatar: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: "rgba(155,48,255,0.15)", borderWidth: 1, borderColor: "rgba(155,48,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  heroAvatarText: { fontSize: 26, fontFamily: "Cairo_700Bold", color: "#9B30FF" },
  heroName: { fontSize: 18, fontFamily: "Cairo_700Bold", color: "#f0eeff", lineHeight: 24 },
  verifiedBadge: { padding: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "#6b7280" },
  dot: { color: "#374151", fontSize: 12 },
  ratingText: { fontSize: 12, fontFamily: "Cairo_700Bold", color: "#FFDD00" },
  reviewCount: { fontSize: 11, fontFamily: "Cairo_400Regular", color: "#6b7280" },
  freeChairBadge: { backgroundColor: "rgba(74,222,128,0.15)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  freeChairText: { fontSize: 11, fontFamily: "Cairo_600SemiBold", color: "#4ade80" },

  liveCta: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: "rgba(74,222,128,0.08)", borderWidth: 1, borderColor: "rgba(74,222,128,0.3)",
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 4,
  },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  liveLabel: { fontSize: 12, fontFamily: "Cairo_700Bold", color: "#4ade80", letterSpacing: 1.5 },
  liveChairs: { fontSize: 12, fontFamily: "Cairo_600SemiBold", color: "#4ade80", marginLeft: "auto" },
  liveSubtext: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "rgba(74,222,128,0.7)" },

  section: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginBottom: 4 },
  description: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#9ca3af", lineHeight: 22 },

  tabBar: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "rgba(0,180,255,0.15)" },
  tabText: { fontSize: 13, fontFamily: "Cairo_600SemiBold", color: "#4b5563" },
  tabTextActive: { color: "#00B4FF" },

  emptyTabText: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#4b5563", textAlign: "center", paddingVertical: 20 },

  serviceCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#130028", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  serviceName: { fontSize: 14, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  serviceDesc: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "#6b7280", lineHeight: 18 },
  priceBox: { alignItems: "center", minWidth: 48 },
  priceNum: { fontSize: 22, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
  priceCur: { fontSize: 10, fontFamily: "Cairo_400Regular", color: "#6b7280" },

  chairGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chairTile: {
    width: "30%", borderRadius: 14, padding: 12, alignItems: "center", gap: 6,
    borderWidth: 1,
  },
  chairFree: { backgroundColor: "rgba(74,222,128,0.08)", borderColor: "rgba(74,222,128,0.25)" },
  chairBusy: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" },
  chairName: { fontSize: 11, fontFamily: "Cairo_600SemiBold", textAlign: "center" },
  chairStatusDot: { width: 6, height: 6, borderRadius: 3 },

  reviewCard: {
    backgroundColor: "#130028", borderRadius: 16, padding: 14, gap: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(155,48,255,0.15)", alignItems: "center", justifyContent: "center" },
  reviewAvatarText: { fontSize: 16, fontFamily: "Cairo_700Bold", color: "#9B30FF" },
  reviewName: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginBottom: 3 },
  reviewComment: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#9ca3af", lineHeight: 20 },
});
