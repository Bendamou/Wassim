import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const ALL_SERVICES: Record<string, string[]> = {
  barber: ["Men's Haircut", "Fade", "Beard Trim", "Beard Styling", "Hot Towel Shave", "Hair Coloring", "Line Up"],
  hair_stylist: ["Cut & Style", "Blowout", "Balayage", "Extensions", "Keratin Treatment", "Braids & Twists", "Highlights"],
  nail_tech: ["Manicure", "Pedicure", "Gel Nails", "Acrylic Nails", "Nail Art", "SNS Dipping", "Paraffin Wax"],
  esthetician: ["Classic Facial", "Men's Facial", "Microdermabrasion", "Threading", "Eyebrow Waxing", "Chemical Peel"],
  makeup: ["Bridal Makeup", "Event Makeup", "Lash Extensions", "Brow Lamination", "Airbrush", "HD Brows"],
  massage: ["Swedish Massage", "Deep Tissue", "Hot Stone", "Reflexology", "Sports Massage", "Couples Massage"],
};

function formatPhone(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits.startsWith("0") ? `+212${digits.slice(1)}` : `+${digits}`;
}

export default function ProServices() {
  const { role, name, email, phone, category } = useLocalSearchParams<{
    role: string; name: string; email: string; phone: string; category: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const services = ALL_SERVICES[category ?? "barber"] ?? [];

  const toggle = (svc: string) => {
    Haptics.selectionAsync();
    setSelected((prev) => prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]);
  };

  const handleRegister = async () => {
    if (selected.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const data = await api("POST", "/auth/phone-register", {
        phone: formatPhone(phone ?? ""),
        name: name ?? "",
        email: email ?? "",
        role: "professional",
        gender_pref: "all",
      });
      try {
        await api("PATCH", "/auth/profile", { bio: JSON.stringify({ category, services: selected }) }, data.token);
      } catch {}
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color="#9ca3af" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Services you offer</Text>
        <Text style={styles.sub}>Select all that apply — clients will see these</Text>

        <View style={styles.chips}>
          {services.map((svc) => {
            const sel = selected.includes(svc);
            return (
              <Pressable
                key={svc}
                onPress={() => toggle(svc)}
                style={[styles.chip, sel && styles.chipSelected]}
              >
                {sel && <Feather name="check" size={12} color="#FF1F8E" />}
                <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{svc}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, { opacity: (selected.length === 0 || loading || pressed) ? (selected.length === 0 || loading ? 0.4 : 0.85) : 1 }]}
          onPress={handleRegister}
          disabled={selected.length === 0 || loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : (
            <>
              <Text style={styles.btnText}>Start Taking Jobs</Text>
              <Feather name="zap" size={20} color="#000" />
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 16 },
  backText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#9ca3af" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#f0eeff", marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9ca3af", marginBottom: 24 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 32 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipSelected: { borderColor: "#FF1F8E", backgroundColor: "rgba(255,31,142,0.12)" },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#9ca3af" },
  chipTextSelected: { color: "#FF1F8E", fontFamily: "Inter_700Bold" },
  btn: {
    backgroundColor: "#FF1F8E", borderRadius: 18, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#000" },
});
