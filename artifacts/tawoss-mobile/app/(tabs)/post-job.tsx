import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";
import { api } from "@/lib/api";

export default function PostJob() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const t = useStrings();
  const { isRTL } = useLanguage();
  const ta = isRTL ? "right" : "left" as const;

  const MENS_SERVICES = [
    { id: "haircut", label: t.serviceHaircut, emoji: "💇" },
    { id: "beard", label: t.serviceBeard, emoji: "🧔" },
    { id: "nails", label: t.serviceNails, emoji: "💅" },
    { id: "full_grooming", label: t.serviceFull, emoji: "✨" },
  ];
  const WOMENS_SERVICES = [
    { id: "makeup_artist", label: t.serviceMakeupArtist, emoji: "💄", badge: "1000–3000 MAD" },
    { id: "hair_colorist", label: t.serviceHairColorist, emoji: "🎨", badge: "400–1200 MAD" },
    { id: "nail_technician", label: t.serviceNailTechnician, emoji: "💅", badge: "150–400 MAD" },
    { id: "lash_artist", label: t.serviceLashArtist, emoji: "👁️", badge: "400–1200 MAD" },
    { id: "bridal_specialist", label: t.serviceBridalSpecialist, emoji: "👰", badge: "2500–6000 MAD" },
    { id: "esthetician", label: t.serviceEsthetician, emoji: "🧖", badge: "250–600 MAD" },
    { id: "hairdresser", label: t.serviceHairdresser, emoji: "✂️", badge: "150–300 MAD" },
    { id: "brow_specialist", label: t.serviceBrowSpecialist, emoji: "🤨", badge: "150–400 MAD" },
    { id: "waxing_specialist", label: t.serviceWaxingSpecialist, emoji: "🌸", badge: "200–450 MAD" },
    { id: "massage_therapist", label: t.serviceMassageTherapist, emoji: "💆", badge: "300–550 MAD" },
  ];

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
      Alert.alert(t.jobPosted, t.biddingStart, [{ text: t.ok, onPress: () => router.push("/(tabs)/activity") }]);
    },
    onError: (err: any) => Alert.alert(t.error, err.message ?? t.couldNotPost),
  });

  return (
    <KeyboardAvoidingView
      style={[s.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={[s.header, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <Text style={[s.title, { textAlign: ta }]}>{t.postJobTitle}</Text>
          <Text style={[s.sub, { textAlign: ta }]}>{t.setYourPrice}</Text>
        </View>

        <Text style={[s.label, { textAlign: ta }]}>{t.serviceLabel}</Text>

        {/* Men's / General */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionEmoji}>✂️</Text>
          <Text style={s.sectionTitle}>{isRTL ? "حلاقة رجالية" : "Men's Grooming"}</Text>
        </View>
        <View style={s.serviceGrid}>
          {MENS_SERVICES.map((svc) => (
            <Pressable
              key={svc.id}
              style={({ pressed }) => [s.svcCard, service === svc.id && s.svcSelected, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
              onPress={() => { Haptics.selectionAsync(); setService(svc.id); }}
            >
              <Text style={s.svcEmoji}>{svc.emoji}</Text>
              <Text style={[s.svcLabel, service === svc.id && { color: "#00B4FF" }]}>{svc.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Women's Beauty */}
        <View style={[s.sectionHeader, { marginTop: 8 }]}>
          <Text style={s.sectionEmoji}>💄</Text>
          <Text style={[s.sectionTitle, { color: "#FF1F8E" }]}>{isRTL ? "خدمات تجميل نسائية" : "Women's Beauty"}</Text>
        </View>
        <View style={s.serviceGrid}>
          {WOMENS_SERVICES.map((svc) => {
            const sel = service === svc.id;
            return (
              <Pressable
                key={svc.id}
                style={({ pressed }) => [s.svcCard, sel && s.svcSelectedPink, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                onPress={() => { Haptics.selectionAsync(); setService(svc.id); }}
              >
                <Text style={s.svcEmoji}>{svc.emoji}</Text>
                <Text style={[s.svcLabel, sel && { color: "#FF1F8E" }]} numberOfLines={2}>{svc.label}</Text>
                <View style={s.priceBadge}>
                  <Text style={s.priceBadgeText}>{svc.badge}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[s.label, { textAlign: ta }]}>{t.budgetLabel}</Text>
        <View style={[s.inputRow, { borderColor: Number(budget) > 0 ? "#00B4FF" : "rgba(255,255,255,0.12)" }]}>
          <TextInput
            style={[s.input, { fontSize: 28, fontFamily: "Cairo_700Bold" }]}
            placeholder="80"
            placeholderTextColor="#374151"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            returnKeyType="next"
            textAlign={ta}
          />
          <Text style={s.currencySymbol}>{t.mad}</Text>
        </View>

        <Text style={[s.label, { textAlign: ta }]}>{t.locationLabel}</Text>
        <View style={[s.inputRow, { borderColor: location.length >= 3 ? "#00B4FF" : "rgba(255,255,255,0.12)" }]}>
          <TextInput
            style={s.input}
            placeholder={t.locationPlaceholder}
            placeholderTextColor="#4b5563"
            value={location}
            onChangeText={setLocation}
            returnKeyType="done"
            textAlign={ta}
          />
          <Feather name="map-pin" size={18} color={location.length >= 3 ? "#00B4FF" : "#6b7280"} />
        </View>

        <Pressable
          style={({ pressed }) => [s.btn, { opacity: (!valid || mutation.isPending || pressed) ? (!valid || mutation.isPending ? 0.4 : 0.85) : 1 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); mutation.mutate(); }}
          disabled={!valid || mutation.isPending}
        >
          {mutation.isPending ? <ActivityIndicator color="#000" /> : (
            <>
              <Text style={s.btnText}>{t.postJobBtn}</Text>
              <Feather name="send" size={20} color="#000" />
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  scroll: { paddingHorizontal: 24, paddingBottom: 120 },
  header: { paddingTop: 20, paddingBottom: 28 },
  title: { fontSize: 26, fontFamily: "Cairo_700Bold", color: "#f0eeff" },
  sub: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 4 },
  label: { fontSize: 13, fontFamily: "Cairo_600SemiBold", color: "#6b7280", marginBottom: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionEmoji: { fontSize: 16 },
  sectionTitle: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#6b7280", letterSpacing: 0.5, textTransform: "uppercase" },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  svcCard: { width: "47%", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.10)", borderRadius: 16, padding: 14, alignItems: "center", gap: 5 },
  svcSelected: { borderColor: "#00B4FF", backgroundColor: "rgba(0,180,255,0.10)" },
  svcSelectedPink: { borderColor: "#FF1F8E", backgroundColor: "rgba(255,31,142,0.10)" },
  svcEmoji: { fontSize: 26 },
  svcLabel: { fontSize: 12, fontFamily: "Cairo_600SemiBold", color: "#9ca3af", textAlign: "center", lineHeight: 16 },
  priceBadge: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  priceBadgeText: { fontSize: 10, fontFamily: "Cairo_600SemiBold", color: "#6b7280" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24 },
  currencySymbol: { fontSize: 16, fontFamily: "Cairo_700Bold", color: "#6b7280" },
  input: { flex: 1, fontSize: 16, fontFamily: "Cairo_500Medium", color: "#f0eeff" },
  btn: { backgroundColor: "#00B4FF", borderRadius: 18, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  btnText: { fontSize: 18, fontFamily: "Cairo_700Bold", color: "#000" },
});
