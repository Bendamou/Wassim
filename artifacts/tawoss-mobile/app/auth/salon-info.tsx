import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

function formatPhone(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`;
}

export default function SalonInfo() {
  const { name, email, phone } = useLocalSearchParams<{ name: string; email: string; phone: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [salonName, setSalonName] = useState("");
  const [salonCity, setSalonCity] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = salonName.trim().length >= 2 && salonCity.trim().length >= 2;

  const handleRegister = async () => {
    if (!valid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const data = await api("POST", "/auth/phone-register", {
        phone: formatPhone(phone ?? ""),
        name: name ?? "",
        email: email ?? "",
        role: "salon_owner",
        gender_pref: "all",
      });
      try {
        await api("POST", "/salons", {
          name: salonName.trim(),
          address: salonCity.trim(),
          description: "Men & Women",
        }, data.token);
      } catch {}
      await login(data.user, data.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      if (err.message?.includes("already registered")) {
        try {
          const loginData = await api("POST", "/auth/phone-login", { phone: formatPhone(phone ?? "") });
          await login(loginData.user, loginData.token);
          router.replace("/(tabs)");
        } catch {
          Alert.alert("Error", "Could not sign in. Try signing in instead.");
        }
      } else {
        Alert.alert("Error", err.message ?? "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color="#9ca3af" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Your salon details</Text>
        <Text style={styles.sub}>Clients will see this on the map</Text>

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>SALON / SPA NAME *</Text>
            <View style={[styles.inputRow, { borderColor: salonName.length >= 2 ? "#9B30FF" : "rgba(255,255,255,0.12)" }]}>
              <Feather name="home" size={18} color={salonName.length >= 2 ? "#9B30FF" : "#6b7280"} />
              <TextInput
                style={styles.input}
                placeholder="Barber House Maarif"
                placeholderTextColor="#4b5563"
                value={salonName}
                onChangeText={setSalonName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>CITY / NEIGHBOURHOOD *</Text>
            <View style={[styles.inputRow, { borderColor: salonCity.length >= 2 ? "#9B30FF" : "rgba(255,255,255,0.12)" }]}>
              <Feather name="map-pin" size={18} color={salonCity.length >= 2 ? "#9B30FF" : "#6b7280"} />
              <TextInput
                style={styles.input}
                placeholder="Casablanca, Maarif"
                placeholderTextColor="#4b5563"
                value={salonCity}
                onChangeText={setSalonCity}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, { opacity: (!valid || loading || pressed) ? (!valid || loading ? 0.4 : 0.85) : 1 }]}
          onPress={handleRegister}
          disabled={!valid || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.btnText}>Register Salon</Text>
              <Feather name="chevron-right" size={20} color="#fff" />
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 16 },
  backText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#9ca3af" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#f0eeff", marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9ca3af", marginBottom: 28 },
  fields: { gap: 16, marginBottom: 28 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#6b7280", letterSpacing: 2 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium", color: "#f0eeff" },
  btn: {
    borderRadius: 18, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#9B30FF",
  },
  btnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
});
