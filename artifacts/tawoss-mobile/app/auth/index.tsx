import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ar } from "@/lib/strings";

const ROLES = [
  { id: "client" as const, label: ar.roleClient, sub: ar.roleClientSub, icon: "user" as const, color: "#00B4FF", bg: "rgba(0,180,255,0.10)", border: "rgba(0,180,255,0.35)" },
  { id: "salon_owner" as const, label: ar.roleSalon, sub: ar.roleSalonSub, icon: "home" as const, color: "#9B30FF", bg: "rgba(155,48,255,0.10)", border: "rgba(155,48,255,0.35)" },
  { id: "professional" as const, label: ar.rolePro, sub: ar.roleProSub, icon: "scissors" as const, color: "#FF1F8E", bg: "rgba(255,31,142,0.10)", border: "rgba(255,31,142,0.35)" },
];

export default function AuthWelcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRole = (roleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/auth/credentials", params: { role: roleId } });
  };

  return (
    <View style={[s.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={s.logoSection}>
          <LinearGradient colors={["#00B4FF", "#FF1F8E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logoBox}>
            <Feather name="scissors" size={28} color="#fff" />
          </LinearGradient>
          <Text style={s.appName}>{ar.appName}</Text>
          <Text style={s.tagSub}>{ar.appTagline}</Text>
          <View style={s.tagContainer}>
            <Text style={s.tagLine1}>{ar.heroLine1}</Text>
            <Text style={s.tagLine2}>{ar.heroLine2}</Text>
          </View>
        </View>

        <Text style={s.question}>{ar.whoAreYou}</Text>
        <Text style={s.questionSub}>{ar.chooseRole}</Text>

        <View style={s.cards}>
          {ROLES.map((role) => (
            <Pressable
              key={role.id}
              style={({ pressed }) => [s.card, { backgroundColor: role.bg, borderColor: role.border, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              onPress={() => handleRole(role.id)}
            >
              <Feather name="chevron-left" size={18} color={role.color} />
              <View style={s.cardText}>
                <Text style={s.cardLabel}>{role.label}</Text>
                <Text style={s.cardSub}>{role.sub}</Text>
              </View>
              <View style={[s.cardIcon, { borderColor: `${role.color}40`, backgroundColor: `${role.color}18` }]}>
                <Feather name={role.icon} size={22} color={role.color} />
              </View>
            </Pressable>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.push("/auth/signin")} style={s.signinRow}>
          <Text style={s.signinLink}>{ar.signIn} ←</Text>
          <Text style={s.signinText}> {ar.alreadyHaveAccount}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },
  logoSection: { alignItems: "center", paddingTop: 28, paddingBottom: 28 },
  logoBox: { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  appName: { fontSize: 32, fontFamily: "Cairo_700Bold", color: "#fff", letterSpacing: 2 },
  tagSub: { fontSize: 13, fontFamily: "Cairo_600SemiBold", color: "#00B4FF", letterSpacing: 1, marginTop: 4 },
  tagContainer: { marginTop: 14, alignItems: "center" },
  tagLine1: { fontSize: 24, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
  tagLine2: { fontSize: 24, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginTop: 2 },
  question: { fontSize: 22, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginBottom: 4, textAlign: "right" },
  questionSub: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginBottom: 18, textAlign: "right" },
  cards: { gap: 12 },
  card: { borderRadius: 20, borderWidth: 1.5, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 },
  cardIcon: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 17, fontFamily: "Cairo_700Bold", color: "#f0eeff", textAlign: "right" },
  cardSub: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 2, textAlign: "right" },
  signinRow: { flexDirection: "row", justifyContent: "center", marginTop: 30, paddingVertical: 8 },
  signinText: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#6b7280" },
  signinLink: { fontSize: 14, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
});
