import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { ar } from "@/lib/strings";

const ROLE_LABEL: Record<string, string> = {
  client: ar.roleClientLabel,
  professional: ar.roleProLabel,
  salon_owner: ar.roleSalonLabel,
};
const ROLE_COLOR: Record<string, string> = { client: "#00B4FF", professional: "#FF1F8E", salon_owner: "#9B30FF" };

export default function ProfileTab() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(ar.signOutTitle, ar.signOutMsg, [
      { text: ar.cancel, style: "cancel" },
      {
        text: ar.signOut, style: "destructive",
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
    <View style={[s.screen, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 100 }}>
        <View style={s.heroSection}>
          <View style={[s.avatar, { borderColor: `${color}60`, shadowColor: color }]}>
            <Text style={[s.avatarText, { color }]}>{user?.name?.[0]?.toUpperCase() ?? "؟"}</Text>
          </View>
          <Text style={s.name}>{user?.name}</Text>
          <View style={[s.rolePill, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
            <Text style={[s.roleText, { color }]}>{ROLE_LABEL[user?.role ?? "client"]}</Text>
          </View>
          {user?.rating !== undefined && user.rating > 0 && (
            <View style={s.ratingRow}>
              <Text style={s.ratingText}>{user.rating.toFixed(1)}</Text>
              <Feather name="star" size={14} color="#FFDD00" />
            </View>
          )}
        </View>

        <View style={s.infoSection}>
          {[
            { icon: "mail" as const, label: ar.email, value: user?.email },
            { icon: "phone" as const, label: ar.phone, value: user?.phone ?? ar.notSet },
            { icon: "map-pin" as const, label: ar.location, value: user?.location ?? ar.notSet },
          ].map((item) => (
            <View key={item.label} style={s.infoRow}>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={s.infoValue}>{item.value}</Text>
              </View>
              <View style={[s.infoIcon, { backgroundColor: `${color}12` }]}>
                <Feather name={item.icon} size={16} color={color} />
              </View>
            </View>
          ))}
        </View>

        <View style={s.actionsSection}>
          <Text style={s.sectionLabel}>{ar.account}</Text>

          <TouchableOpacity style={s.actionRow}>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={s.actionText}>{ar.editProfile}</Text>
            </View>
            <Feather name="edit-2" size={18} color="#9ca3af" />
          </TouchableOpacity>

          {user?.isVerified && (
            <View style={s.verifiedBadge}>
              <Text style={s.verifiedText}>{ar.verifiedPro}</Text>
              <Feather name="check-circle" size={16} color="#4ade80" />
            </View>
          )}

          <TouchableOpacity style={s.actionRow}>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={s.actionText}>{ar.helpSupport}</Text>
            </View>
            <Feather name="help-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <Pressable
            style={({ pressed }) => [s.logoutBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleLogout}
          >
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={s.logoutText}>{ar.signOut}</Text>
            </View>
            <Feather name="log-out" size={18} color="#ef4444" />
          </Pressable>
        </View>

        <Text style={s.version}>{ar.appVersion}</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090013" },
  heroSection: { alignItems: "center", paddingTop: 32, paddingBottom: 32, paddingHorizontal: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#130028", borderWidth: 2.5, alignItems: "center", justifyContent: "center", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, marginBottom: 14 },
  avatarText: { fontSize: 36, fontFamily: "Cairo_700Bold" },
  name: { fontSize: 26, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginBottom: 8 },
  rolePill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, marginBottom: 8 },
  roleText: { fontSize: 13, fontFamily: "Cairo_700Bold" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingText: { fontSize: 15, fontFamily: "Cairo_700Bold", color: "#FFDD00" },
  infoSection: { marginHorizontal: 20, backgroundColor: "#130028", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, fontFamily: "Cairo_500Medium", color: "#6b7280" },
  infoValue: { fontSize: 15, fontFamily: "Cairo_600SemiBold", color: "#f0eeff", marginTop: 2 },
  actionsSection: { marginHorizontal: 20 },
  sectionLabel: { fontSize: 13, fontFamily: "Cairo_600SemiBold", color: "#6b7280", marginBottom: 12, textAlign: "right" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#130028", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 10 },
  actionText: { flex: 1, fontSize: 15, fontFamily: "Cairo_500Medium", color: "#f0eeff" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(74,222,128,0.10)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(74,222,128,0.25)", marginBottom: 10 },
  verifiedText: { flex: 1, fontSize: 14, fontFamily: "Cairo_700Bold", color: "#4ade80", textAlign: "right" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginTop: 4 },
  logoutText: { flex: 1, fontSize: 15, fontFamily: "Cairo_700Bold", color: "#ef4444" },
  version: { fontSize: 12, fontFamily: "Cairo_400Regular", color: "#374151", textAlign: "center", marginTop: 28, marginBottom: 8 },
});
