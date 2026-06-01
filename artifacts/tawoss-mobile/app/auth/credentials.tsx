import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ar } from "@/lib/strings";

const ROLE_LABEL: Record<string, string> = { client: ar.roleClient, salon_owner: ar.roleSalon, professional: ar.rolePro };
const ROLE_COLOR: Record<string, string> = { client: "#00B4FF", salon_owner: "#9B30FF", professional: "#FF1F8E" };

export default function Credentials() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const color = ROLE_COLOR[role ?? "client"] ?? "#00B4FF";
  const valid = name.trim().length >= 2 && email.includes("@") && phone.length >= 8;

  const handleContinue = () => {
    if (!valid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const params = { role, name: name.trim(), email: email.trim(), phone };
    if (role === "client") router.push({ pathname: "/auth/pref", params });
    else if (role === "salon_owner") router.push({ pathname: "/auth/salon-info", params });
    else router.push({ pathname: "/auth/pro-category", params });
  };

  return (
    <KeyboardAvoidingView style={[s.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>{ar.back}</Text>
          <Feather name="arrow-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <View style={s.header}>
          <Text style={s.roleTag}>{ROLE_LABEL[role ?? "client"]}</Text>
          <Text style={s.title}>{ar.createAccount}</Text>
          <Text style={s.sub}>{ar.quickSetup}</Text>
        </View>

        <View style={s.fields}>
          {[
            { label: ar.fullName, placeholder: ar.fullNamePlaceholder, value: name, onChange: setName, icon: "user" as const, keyboardType: "default" as const, valid: name.length >= 2 },
            { label: ar.gmailAddress, placeholder: ar.gmailPlaceholder, value: email, onChange: setEmail, icon: "mail" as const, keyboardType: "email-address" as const, valid: email.includes("@") },
            { label: ar.phoneNumber, placeholder: ar.phonePlaceholder, value: phone, onChange: setPhone, icon: "phone" as const, keyboardType: "phone-pad" as const, valid: phone.length >= 8 },
          ].map((field) => (
            <View key={field.label} style={s.fieldGroup}>
              <Text style={s.label}>{field.label}</Text>
              <View style={[s.inputRow, { borderColor: field.valid ? color : "rgba(255,255,255,0.12)" }]}>
                <TextInput
                  style={s.input}
                  placeholder={field.placeholder}
                  placeholderTextColor="#4b5563"
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType={field.keyboardType}
                  autoCapitalize={field.keyboardType === "email-address" ? "none" : "words"}
                  textAlign="right"
                />
                <Feather name={field.icon} size={18} color={field.valid ? color : "#6b7280"} />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [s.btn, { backgroundColor: color, opacity: (!valid || loading) ? 0.4 : pressed ? 0.85 : 1 }]}
          onPress={handleContinue}
          disabled={!valid || loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : (
            <>
              <Feather name="chevron-left" size={20} color="#000" />
              <Text style={s.btnText}>{ar.continue}</Text>
            </>
          )}
        </Pressable>

        <TouchableOpacity onPress={() => router.push("/auth/signin")} style={s.signinRow}>
          <Text style={[s.signinLink, { color }]}>{ar.signIn}</Text>
          <Text style={s.signinText}> {ar.alreadyRegistered}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 16, justifyContent: "flex-end" },
  backText: { fontSize: 14, fontFamily: "Cairo_500Medium", color: "#9ca3af" },
  header: { marginBottom: 28 },
  roleTag: { fontSize: 12, fontFamily: "Cairo_600SemiBold", color: "#00B4FF", letterSpacing: 1, marginBottom: 8, textAlign: "right" },
  title: { fontSize: 26, fontFamily: "Cairo_700Bold", color: "#f0eeff", textAlign: "right" },
  sub: { fontSize: 14, fontFamily: "Cairo_400Regular", color: "#9ca3af", marginTop: 4, textAlign: "right" },
  fields: { gap: 16, marginBottom: 24 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Cairo_600SemiBold", color: "#6b7280", textAlign: "right" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 16, fontFamily: "Cairo_500Medium", color: "#f0eeff" },
  btn: { borderRadius: 18, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 },
  btnText: { fontSize: 18, fontFamily: "Cairo_700Bold", color: "#000" },
  signinRow: { flexDirection: "row", justifyContent: "center", paddingVertical: 8 },
  signinText: { fontSize: 13, fontFamily: "Cairo_400Regular", color: "#6b7280" },
  signinLink: { fontSize: 13, fontFamily: "Cairo_700Bold" },
});
