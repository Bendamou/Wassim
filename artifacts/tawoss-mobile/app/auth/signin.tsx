import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

function formatPhone(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`;
}

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
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
      Alert.alert("Not found", err.message ?? "Phone not found. Create an account first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color="#9ca3af" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Enter your phone number to continue</Text>

        <View style={[styles.inputRow, { borderColor: phone.length >= 8 ? "#00B4FF" : "rgba(255,255,255,0.12)" }]}>
          <Feather name="phone" size={20} color={phone.length >= 8 ? "#00B4FF" : "#6b7280"} />
          <TextInput
            style={styles.input}
            placeholder="0612 345 678"
            placeholderTextColor="#4b5563"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            autoFocus
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, { opacity: (phone.length < 8 || loading || pressed) ? (phone.length < 8 || loading ? 0.4 : 0.85) : 1 }]}
          onPress={handleLogin}
          disabled={phone.length < 8 || loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : (
            <>
              <Text style={styles.btnText}>Sign In</Text>
              <Feather name="chevron-right" size={20} color="#000" />
            </>
          )}
        </Pressable>

        <TouchableOpacity onPress={() => router.replace("/auth")} style={styles.createRow}>
          <Text style={styles.createText}>New here? </Text>
          <Text style={styles.createLink}>Create account →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  content: { flex: 1, paddingHorizontal: 24 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 16 },
  backText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#9ca3af" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#f0eeff", marginBottom: 6, marginTop: 8 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9ca3af", marginBottom: 28 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 18, marginBottom: 20,
  },
  input: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  btn: {
    backgroundColor: "#00B4FF", borderRadius: 18, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16,
  },
  btnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#000" },
  createRow: { flexDirection: "row", justifyContent: "center", paddingVertical: 8 },
  createText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6b7280" },
  createLink: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FF1F8E" },
});
