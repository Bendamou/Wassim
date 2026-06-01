import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const PREFS = [
  { key: "men", icon: "scissors" as const, label: "Men's Grooming", sub: "Barbers, fades, beard care", color: "#00B4FF" },
  { key: "women", icon: "star" as const, label: "Women's Beauty", sub: "Nails, skincare, styling", color: "#FF1F8E" },
  { key: "all", icon: "zap" as const, label: "All Services", sub: "Show me everything", color: "#9B30FF" },
];

function formatPhone(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`;
}

export default function Pref() {
  const { role, name, email, phone } = useLocalSearchParams<{ role: string; name: string; email: string; phone: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePref = async (pref: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const data = await api("POST", "/auth/phone-register", {
        phone: formatPhone(phone ?? ""),
        name: name ?? "",
        email: email ?? "",
        role: "client",
        gender_pref: pref,
      });
      await login(data.user, data.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      if (err.message?.includes("already registered")) {
        try {
          const data = await api("POST", "/auth/phone-login", { phone: formatPhone(phone ?? "") });
          await login(data.user, data.token);
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
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={20} color="#9ca3af" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Your grooming preference</Text>
      <Text style={styles.sub}>We'll personalise your feed and map</Text>

      <View style={styles.cards}>
        {PREFS.map((p) => (
          <Pressable
            key={p.key}
            style={({ pressed }) => [
              styles.card,
              { borderColor: `${p.color}40`, backgroundColor: `${p.color}10`, opacity: (loading || pressed) ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            onPress={() => handlePref(p.key)}
            disabled={loading}
          >
            <View style={[styles.icon, { backgroundColor: `${p.color}18`, borderColor: `${p.color}40` }]}>
              <Feather name={p.icon} size={22} color={p.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{p.label}</Text>
              <Text style={styles.hint}>{p.sub}</Text>
            </View>
            {loading ? <ActivityIndicator color={p.color} size="small" /> : <Feather name="chevron-right" size={18} color={p.color} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013", paddingHorizontal: 24 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 16 },
  backText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#9ca3af" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#f0eeff", marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9ca3af", marginBottom: 28 },
  cards: { gap: 12 },
  card: { borderRadius: 20, borderWidth: 1.5, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 },
  icon: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 2 },
});
