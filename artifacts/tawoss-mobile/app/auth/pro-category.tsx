import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATS = [
  { id: "barber", label: "Barber", sub: "Cuts, fades, beard" },
  { id: "hair_stylist", label: "Hair Stylist", sub: "Color, extensions" },
  { id: "nail_tech", label: "Nail Tech", sub: "Manicure, gel, art" },
  { id: "esthetician", label: "Esthetician", sub: "Facials, waxing" },
  { id: "makeup", label: "Makeup Artist", sub: "Bridal, events" },
  { id: "massage", label: "Massage", sub: "Swedish, deep tissue" },
];

export default function ProCategory() {
  const params = useLocalSearchParams<{ role: string; name: string; email: string; phone: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState("");

  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelected(id);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color="#9ca3af" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Your specialisation</Text>
        <Text style={styles.sub}>What type of pro are you?</Text>

        <View style={styles.grid}>
          {CATS.map((cat) => {
            const sel = selected === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.card,
                  sel ? styles.cardSelected : {},
                  { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
                onPress={() => handleSelect(cat.id)}
              >
                {sel && <Feather name="check-circle" size={16} color="#FF1F8E" style={styles.check} />}
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catSub}>{cat.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, { opacity: (!selected || pressed) ? (!selected ? 0.4 : 0.85) : 1 }]}
          onPress={() => router.push({ pathname: "/auth/pro-services", params: { ...params, category: selected } })}
          disabled={!selected}
        >
          <Text style={styles.btnText}>Continue</Text>
          <Feather name="chevron-right" size={20} color="#000" />
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  card: {
    width: "47%", borderRadius: 18, borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.04)",
    padding: 18, position: "relative",
  },
  cardSelected: {
    borderColor: "#FF1F8E", backgroundColor: "rgba(255,31,142,0.10)",
  },
  check: { position: "absolute", top: 10, right: 10 },
  catLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#f0eeff", marginBottom: 4 },
  catSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9ca3af" },
  btn: {
    backgroundColor: "#FF1F8E", borderRadius: 18, paddingVertical: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#000" },
});
