import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROLE_LABEL: Record<string, string> = { client: "Customer", salon_owner: "Salon Owner", professional: "Freelancer" };
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
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color="#9ca3af" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.roleTag}>{ROLE_LABEL[role ?? "client"]}</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.sub}>Quick setup — just 3 fields</Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <View style={[styles.inputRow, { borderColor: name.length >= 2 ? color : "rgba(255,255,255,0.12)" }]}>
              <Feather name="user" size={18} color={name.length >= 2 ? color : "#6b7280"} />
              <TextInput
                style={styles.input}
                placeholder="Ahmed Benali"
                placeholderTextColor="#4b5563"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>GMAIL ADDRESS</Text>
            <View style={[styles.inputRow, { borderColor: email.includes("@") ? color : "rgba(255,255,255,0.12)" }]}>
              <Feather name="mail" size={18} color={email.includes("@") ? color : "#6b7280"} />
              <TextInput
                style={styles.input}
                placeholder="you@gmail.com"
                placeholderTextColor="#4b5563"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={[styles.inputRow, { borderColor: phone.length >= 8 ? color : "rgba(255,255,255,0.12)" }]}>
              <Feather name="phone" size={18} color={phone.length >= 8 ? color : "#6b7280"} />
              <TextInput
                style={styles.input}
                placeholder="0612 345 678"
                placeholderTextColor="#4b5563"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, { backgroundColor: color, opacity: (!valid || loading) ? 0.4 : pressed ? 0.85 : 1 }]}
          onPress={handleContinue}
          disabled={!valid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Text style={styles.btnText}>Continue</Text>
              <Feather name="chevron-right" size={20} color="#000" />
            </>
          )}
        </Pressable>

        <TouchableOpacity onPress={() => router.push("/auth/signin")} style={styles.signinRow}>
          <Text style={styles.signinText}>Already registered? </Text>
          <Text style={[styles.signinLink, { color }]}>Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090013" },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 16 },
  backText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#9ca3af" },
  header: { marginBottom: 28 },
  roleTag: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#00B4FF", letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#f0eeff" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9ca3af", marginTop: 4 },
  fields: { gap: 16, marginBottom: 24 },
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
    marginBottom: 16,
  },
  btnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#000" },
  signinRow: { flexDirection: "row", justifyContent: "center", paddingVertical: 8 },
  signinText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6b7280" },
  signinLink: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
