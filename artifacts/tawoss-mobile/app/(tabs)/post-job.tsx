import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const SERVICES = [
  { id: "haircut", label: "Haircut", emoji: "💇" },
  { id: "beard", label: "Beard Trim", emoji: "🧔" },
  { id: "nails", label: "Nails", emoji: "💅" },
  { id: "full_grooming", label: "Full Package", emoji: "✨" },
];

export default function PostJob() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [service, setService] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");

  const valid = service && Number(budget) > 0 && location.trim().length >= 3;

  const mutation = useMutation({
    mutationFn: () => api("POST", "/jobs", { service, budget: Number(budget), location: location.trim() }, token),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["my-jobs"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "client"] });
      Alert.alert("Job posted!", "Professionals will start bidding shortly.", [{ text: "OK", onPress: () => router.push("/(tabs)/activity") }]);
    },
    onError: (err: any) => Alert.alert("Error", err.message ?? "Could not post job"),
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Post a Job</Text>
          <Text style={styles.sub}>Set your price — pros will bid for it</Text>
        </View>

        {/* Service */}
        <Text style={styles.label}>SERVICE</Text>
        <View style={styles.serviceGrid}>
          {SERVICES.map((svc) => (
            <Pressable
              key={svc.id}
              style={({ pressed }) => [
                styles.svcCard,
                service === svc.id && styles.svcSelected,
                { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
              onPress={() => { Haptics.selectionAsync(); setService(svc.id); }}
            >
              <Text style={styles.svcEmoji}>{svc.emoji}</Text>
              <Text style={[styles.svcLabel, service === svc.id && { color: "#00B4FF" }]}>{svc.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Budget */}
        <Text style={styles.label}>YOUR BUDGET (MAD)</Text>
        <View style={[styles.inputRow, { borderColor: Number(budget) > 0 ? "#00B4FF" : "rgba(255,255,255,0.12)" }]}>
          <Text style={styles.currencySymbol}>MAD</Text>
          <TextInput
            style={[styles.input, { fontSize: 28, fontFamily: "Inter_700Bold" }]}
            placeholder="80"
            placeholderTextColor="#374151"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>

        {/* Location */}
        <Text style={styles.label}>YOUR LOCATION</Text>
        <View style={[styles.inputRow, { borderColor: location.length >= 3 ? "#00B4FF" : "rgba(255,255,255,0.12)" }]}>
          <Feather name="map-pin" size={18} color={location.length >= 3 ? "#00B4FF" : "#6b7280"} />
          <TextInput
            style={styles.input}
            placeholder="12 Rue Oum Rabie, Casablanca"
            placeholderTextColor="#4b5563"
            value={location}
            onChangeText={setLocation}
            returnKeyType="done"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, { opacity: (!valid || mutation.isPending || pressed) ? (!valid || mutation.isPending ? 0.4 : 0.85) : 1 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); mutation.mutate(); }}
          disabled={!valid || mutation.isPending}
        >
          {mutation.isPending ? <ActivityIndicator color="#000" /> : (
            <>
              <Feather name="send" size={20} color="#000" />
              <Text style={styles.btnText}>Post Job</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  scroll: { paddingHorizontal: 24, paddingBottom: 120 },
  header: { paddingTop: 20, paddingBottom: 28 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 4 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#6b7280", letterSpacing: 2, marginBottom: 10 },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  svcCard: {
    width: "47%", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.10)", borderRadius: 16, padding: 16, alignItems: "center", gap: 6,
  },
  svcSelected: { borderColor: "#00B4FF", backgroundColor: "rgba(0,180,255,0.10)" },
  svcEmoji: { fontSize: 28 },
  svcLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#9ca3af" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24,
  },
  currencySymbol: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#6b7280" },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium", color: "#f0eeff" },
  btn: {
    backgroundColor: "#00B4FF", borderRadius: 18, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  btnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#000" },
});
