import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useLanguage, useStrings } from "@/context/LanguageContext";

function LangToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <View style={lt.row}>
      <TouchableOpacity
        style={[lt.btn, lang === "ar" && lt.btnActive]}
        onPress={() => { Haptics.selectionAsync(); setLang("ar"); }}
        activeOpacity={0.7}
      >
        <Text style={[lt.txt, lang === "ar" && lt.txtActive]}>ع</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[lt.btn, lang === "en" && lt.btnActive]}
        onPress={() => { Haptics.selectionAsync(); setLang("en"); }}
        activeOpacity={0.7}
      >
        <Text style={[lt.txt, lang === "en" && lt.txtActive]}>EN</Text>
      </TouchableOpacity>
    </View>
  );
}

const lt = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, marginRight: 16 },
  btn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)",
  },
  btnActive: { backgroundColor: "#00B4FF", borderColor: "#00B4FF" },
  txt: { fontSize: 13, fontFamily: "Cairo_700Bold", color: "#6b7280" },
  txtActive: { color: "#000" },
});

export default function TabLayout() {
  const { user } = useAuth();
  const t = useStrings();
  const isPro = user?.role === "professional";
  const isSalon = user?.role === "salon_owner";
  const isClient = user?.role === "client";
  const isIOS = Platform.OS === "ios";

  const activeColor = isPro ? "#FF1F8E" : isSalon ? "#9B30FF" : "#00B4FF";

  const headerOptions = {
    headerStyle: { backgroundColor: "#0d001f" },
    headerTintColor: "#f0eeff",
    headerTitleStyle: { fontFamily: "Cairo_700Bold", fontSize: 18 },
    headerShadowVisible: false,
    headerRight: () => <LangToggle />,
    headerShown: true,
  } as const;

  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#0a0018",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.08)",
          elevation: 0,
          height: Platform.OS === "web" ? 62 : 82,
          paddingBottom: Platform.OS === "web" ? 10 : 22,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0018" }]} />
          ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Cairo_600SemiBold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isSalon ? t.tabDashboard : t.tabHome,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: isPro ? t.tabRequests : isSalon ? t.analytics : t.tabExplore,
          tabBarIcon: ({ color, size }) => (
            <Feather
              name={isPro ? "zap" : isSalon ? "bar-chart-2" : "compass"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: isPro ? t.tabMyBids : isSalon ? t.tabQueue : t.tabMyJobs,
          tabBarIcon: ({ color, size }) => (
            <Feather name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t.tabFavorites,
          tabBarButton: isClient ? undefined : () => null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          title: t.tabPostJob,
          tabBarButton: isClient ? undefined : () => null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabProfile,
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
