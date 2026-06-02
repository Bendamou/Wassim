import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage, useStrings } from "@/context/LanguageContext";

export default function AuthWelcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useStrings();
  const { lang, setLang, isRTL } = useLanguage();

  const ROLES = [
    { id: "client" as const, label: t.roleClient, sub: t.roleClientSub, icon: "user" as const, color: "#00B4FF", bg: "rgba(0,180,255,0.10)", border: "rgba(0,180,255,0.35)" },
    { id: "salon_owner" as const, label: t.roleSalon, sub: t.roleSalonSub, icon: "home" as const, color: "#9B30FF", bg: "rgba(155,48,255,0.10)", border: "rgba(155,48,255,0.35)" },
    { id: "professional" as const, label: t.rolePro, sub: t.roleProSub, icon: "scissors" as const, color: "#FF1F8E", bg: "rgba(255,31,142,0.10)", border: "rgba(255,31,142,0.35)" },
  ];

  const handleRole = (roleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/auth/credentials", params: { role: roleId } });
  };

  const ta = isRTL ? "right" : "left" as const;

  return (
    <View style={[s.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>

      {/* ── LANGUAGE SELECTOR — always visible, above scroll ── */}
      <View style={s.langBar}>
        <Feather name="globe" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
        <TouchableOpacity
          style={[s.langBtn, lang === "ar" && s.langBtnActive]}
          onPress={() => { Haptics.selectionAsync(); setLang("ar"); }}
          activeOpacity={0.75}
        >
          {lang === "ar" && <View style={s.langDot} />}
          <Text style={[s.langBtnText, lang === "ar" && s.langBtnTextActive]}>العربية</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.langBtn, lang === "en" && s.langBtnActive]}
          onPress={() => { Haptics.selectionAsync(); setLang("en"); }}
          activeOpacity={0.75}
        >
          {lang === "en" && <View style={s.langDot} />}
          <Text style={[s.langBtnText, lang === "en" && s.langBtnTextActive]}>English</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.logoSection}>
          <LinearGradient colors={["#00B4FF", "#FF1F8E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logoBox}>
            <Feather name="scissors" size={28} color="#fff" />
          </LinearGradient>
          <Text style={s.appName}>{t.appName}</Text>
          <Text style={s.tagSub}>{t.appTagline}</Text>
          <View style={s.tagContainer}>
            <Text style={s.tagLine1}>{t.heroLine1}</Text>
            <Text style={s.tagLine2}>{t.heroLine2}</Text>
          </View>
        </View>

        <Text style={[s.question, { textAlign: ta }]}>{t.whoAreYou}</Text>
        <Text style={[s.questionSub, { textAlign: ta }]}>{t.chooseRole}</Text>

        <View style={s.cards}>
          {ROLES.map((role) => (
            <Pressable
              key={role.id}
              style={({ pressed }) => [s.card, { backgroundColor: role.bg, borderColor: role.border, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              onPress={() => handleRole(role.id)}
            >
              <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={role.color} />
              <View style={s.cardText}>
                <Text style={[s.cardLabel, { textAlign: ta }]}>{role.label}</Text>
                <Text style={[s.cardSub, { textAlign: ta }]}>{role.sub}</Text>
              </View>
              <View style={[s.cardIcon, { borderColor: `${role.color}40`, backgroundColor: `${role.color}18` }]}>
                <Feather name={role.icon} size={22} color={role.color} />
              </View>
            </Pressable>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.push("/auth/signin")} style={s.signinRow}>
          <Text style={s.signinLink}>{t.signIn} {isRTL ? "←" : "→"}</Text>
          <Text style={s.signinText}> {t.alreadyHaveAccount}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },

  langBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#0d001f",
  },
  langBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "transparent",
  },
  langBtnActive: {
    backgroundColor: "#1a003d",
    borderColor: "#00B4FF",
  },
  langDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: "#00B4FF",
  },
  langBtnText: {
    fontSize: 15,
    fontFamily: "Cairo_600SemiBold",
    color: "#6b7280",
  },
  langBtnTextActive: {
    color: "#00B4FF",
  },

  scroll: { paddingHorizontal: 24, paddingBottom: 48 },
  logoSection: { alignItems: "center", paddingTop: 20, paddingBottom: 28 },
  logoBox: { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  appName: { fontSize: 32, fontFamily: "Cairo_700Bold", color: "#fff", letterSpacing: 2 },
  tagSub: { fontSize: 13, fontFamily: "Cairo_600SemiBold", color: "#00B4FF", letterSpacing: 1, marginTop: 4 },
  tagContainer: { marginTop: 14, alignItems: "center" },
  tagLine1: { fontSize: 24, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
  tagLine2: { fontSize: 24, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginTop: 2 },
  question: { fontSize: 22, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginBottom: 4 },
  questionSub: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginBottom: 18 },
  cards: { gap: 12 },
  card: { borderRadius: 20, borderWidth: 1.5, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 },
  cardIcon: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 17, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  cardSub: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 2 },
  signinRow: { flexDirection: "row", justifyContent: "center", marginTop: 30, paddingVertical: 8 },
  signinText: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#6b7280" },
  signinLink: { fontSize: 14, fontFamily: "Cairo_700Bold", color: "#00B4FF" },
});
