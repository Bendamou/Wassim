import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROLES = [
  {
    id: "client" as const,
    label: "Customer",
    sub: "Book grooming services at your price",
    icon: "user" as const,
    color: "#00B4FF",
    bg: "rgba(0,180,255,0.10)",
    border: "rgba(0,180,255,0.35)",
  },
  {
    id: "salon_owner" as const,
    label: "Salon Owner",
    sub: "Register your shop & manage chairs",
    icon: "home" as const,
    color: "#9B30FF",
    bg: "rgba(155,48,255,0.10)",
    border: "rgba(155,48,255,0.35)",
  },
  {
    id: "professional" as const,
    label: "Freelancer / Pro",
    sub: "Choose your services & take jobs",
    icon: "scissors" as const,
    color: "#FF1F8E",
    bg: "rgba(255,31,142,0.10)",
    border: "rgba(255,31,142,0.35)",
  },
];

export default function AuthWelcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRole = (roleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/auth/credentials", params: { role: roleId } });
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={["#00B4FF", "#FF1F8E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Feather name="scissors" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>TAWOSS</Text>
          <Text style={styles.tagSub}>ON-DEMAND GROOMING</Text>
          <View style={styles.tagContainer}>
            <Text style={styles.tagLine1}>Look fresh.</Text>
            <Text style={styles.tagLine2}>Book like a boss.</Text>
          </View>
        </View>

        <Text style={styles.question}>Who are you?</Text>
        <Text style={styles.questionSub}>Choose how you want to use Tawoss</Text>

        <View style={styles.cards}>
          {ROLES.map((role) => (
            <Pressable
              key={role.id}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: role.bg, borderColor: role.border, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              onPress={() => handleRole(role.id)}
            >
              <View style={[styles.cardIcon, { borderColor: `${role.color}40`, backgroundColor: `${role.color}18` }]}>
                <Feather name={role.icon} size={22} color={role.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardLabel}>{role.label}</Text>
                <Text style={styles.cardSub}>{role.sub}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={role.color} />
            </Pressable>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.push("/auth/signin")} style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <Text style={styles.signinLink}>Sign in →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },
  logoSection: { alignItems: "center", paddingTop: 28, paddingBottom: 28 },
  logoBox: { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  appName: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 3 },
  tagSub: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#00B4FF", letterSpacing: 3, marginTop: 4 },
  tagContainer: { marginTop: 14, alignItems: "center" },
  tagLine1: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#00B4FF", letterSpacing: -0.5 },
  tagLine2: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#f0eeff", letterSpacing: -0.5, marginTop: 2 },
  question: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#f0eeff", marginBottom: 4 },
  questionSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9ca3af", marginBottom: 18 },
  cards: { gap: 12 },
  card: { borderRadius: 20, borderWidth: 1.5, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 },
  cardIcon: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 2 },
  signinRow: { flexDirection: "row", justifyContent: "center", marginTop: 30, paddingVertical: 8 },
  signinText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6b7280" },
  signinLink: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#00B4FF" },
});
