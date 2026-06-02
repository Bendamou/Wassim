import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";
import { api } from "@/lib/api";

function formatPhone(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`;
}

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (phone.length < 8) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const data = await api("POST", "/auth/phone-login", { phone: formatPhone(phone) });
      await login(data.user, data.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(t.error, err.message ?? t.phoneNotFound);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[s.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={[s.back, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <Text style={s.backText}>{t.back}</Text>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={20} color="#9ca3af" />
        </TouchableOpacity>

        <Text style={[s.title, { textAlign: ta }]}>{t.welcomeBack}</Text>
        <Text style={[s.sub, { textAlign: ta }]}>{t.enterPhone}</Text>

        <View style={[s.inputRow, { borderColor: phone.length >= 8 ? "#00B4FF" : "rgba(255,255,255,0.12)" }]}>
          <TextInput
            style={s.input}
            placeholder={t.phonePlaceholder}
            placeholderTextColor="#4b5563"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            autoFocus
            textAlign={ta}
          />
          <Feather name="phone" size={20} color={phone.length >= 8 ? "#00B4FF" : "#6b7280"} />
        </View>

        <Pressable
          style={({ pressed }) => [s.btn, { opacity: (phone.length < 8 || loading || pressed) ? (phone.length < 8 || loading ? 0.4 : 0.85) : 1 }]}
          onPress={handleLogin}
          disabled={phone.length < 8 || loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : (
            <>
              <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={20} color="#000" />
              <Text style={s.btnText}>{t.signIn}</Text>
            </>
          )}
        </Pressable>

        <TouchableOpacity onPress={() => router.replace("/auth")} style={s.createRow}>
          <Text style={s.createLink}>{t.createAccountLink}</Text>
          <Text style={s.createText}> {t.newHere}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  content: { flex: 1, paddingHorizontal: 24 },
  back: { alignItems: "center", gap: 6, paddingVertical: 16 },
  backText: { fontSize: 14, fontFamily: "Cairo_500Medium", color: "#9ca3af" },
  title: { fontSize: 26, fontFamily: "Cairo_700Bold", color: "#f0eeff", marginBottom: 6, marginTop: 8 },
  sub: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginBottom: 28 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 18, marginBottom: 20,
  },
  input: { flex: 1, fontSize: 20, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  btn: {
    backgroundColor: "#00B4FF", borderRadius: 18, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16,
  },
  btnText: { fontSize: 18, fontFamily: "Cairo_700Bold", color: "#000" },
  createRow: { flexDirection: "row", justifyContent: "center", paddingVertical: 8 },
  createText: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#6b7280" },
  createLink: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#FF1F8E" },
});
