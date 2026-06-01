import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

const ROLE_LABEL: Record<string, string> = { client: "Customer", professional: "Freelancer / Pro", salon_owner: "Salon Owner" };
const ROLE_COLOR: Record<string, string> = { client: "#00B4FF", professional: "#FF1F8E", salon_owner: "#9B30FF" };

export default function ProfileTab() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert("Sign out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out", style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/auth");
        },
      },
    ]);
  };

  const color = ROLE_COLOR[user?.role ?? "client"] ?? "#00B4FF";

  return (
    <View style={[styles.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 100 }}>
        {/* Avatar + Name */}
        <View style={styles.heroSection}>
          <View style={[styles.avatar, { borderColor: `${color}60`, shadowColor: color }]}>
            <Text style={[styles.avatarText, { color }]}>{user?.name?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={[styles.rolePill, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
            <Text style={[styles.roleText, { color }]}>{ROLE_LABEL[user?.role ?? "client"]}</Text>
          </View>
          {user?.rating !== undefined && user.rating > 0 && (
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color="#FFDD00" />
              <Text style={styles.ratingText}>{user.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Info cards */}
        <View style={styles.infoSection}>
          {[
            { icon: "mail" as const, label: "Email", value: user?.email },
            { icon: "phone" as const, label: "Phone", value: user?.phone ?? "Not set" },
            { icon: "map-pin" as const, label: "Location", value: user?.location ?? "Not set" },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${color}12` }]}>
                <Feather name={item.icon} size={16} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>

          <TouchableOpacity style={styles.actionRow}>
            <Feather name="edit-2" size={18} color="#9ca3af" />
            <Text style={styles.actionText}>Edit Profile</Text>
            <Feather name="chevron-right" size={16} color="#6b7280" />
          </TouchableOpacity>

          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Feather name="check-circle" size={16} color="#4ade80" />
              <Text style={styles.verifiedText}>Verified Professional</Text>
            </View>
          )}

          <TouchableOpacity style={styles.actionRow}>
            <Feather name="help-circle" size={18} color="#9ca3af" />
            <Text style={styles.actionText}>Help & Support</Text>
            <Feather name="chevron-right" size={16} color="#6b7280" />
          </TouchableOpacity>

          <Pressable
            style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Version */}
        <Text style={styles.version}>Tawoss v1.0.0 · Look fresh. Book like a boss.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090013" },
  heroSection: { alignItems: "center", paddingTop: 32, paddingBottom: 32, paddingHorizontal: 20 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: "#130028",
    borderWidth: 2.5, alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, marginBottom: 14,
  },
  avatarText: { fontSize: 36, fontFamily: "Inter_700Bold" },
  name: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#f0eeff", marginBottom: 8 },
  rolePill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, marginBottom: 8 },
  roleText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFDD00" },
  infoSection: { marginHorizontal: 20, backgroundColor: "#130028", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#6b7280", letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#f0eeff", marginTop: 2 },
  actionsSection: { marginHorizontal: 20 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#6b7280", letterSpacing: 2, marginBottom: 12 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#130028", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 10 },
  actionText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: "#f0eeff" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(74,222,128,0.10)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(74,222,128,0.25)", marginBottom: 10 },
  verifiedText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#4ade80" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginTop: 4 },
  logoutText: { flex: 1, fontSize: 15, fontFamily: "Inter_700Bold", color: "#ef4444" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#374151", textAlign: "center", marginTop: 28 },
});
