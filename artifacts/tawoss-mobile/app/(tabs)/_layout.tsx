import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { ar } from "@/lib/strings";

export default function TabLayout() {
  const { user } = useAuth();
  const isPro = user?.role === "professional";
  const isSalon = user?.role === "salon_owner";
  const isClient = user?.role === "client";
  const isIOS = Platform.OS === "ios";

  const activeColor = isPro ? "#FF1F8E" : isSalon ? "#9B30FF" : "#00B4FF";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#0a0018",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.08)",
          elevation: 0,
          height: Platform.OS === "web" ? 64 : 82,
          paddingBottom: Platform.OS === "web" ? 8 : 24,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0018" }]} />
          ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Cairo_600SemiBold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isSalon ? ar.tabDashboard : ar.tabHome,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: isPro ? ar.tabRequests : isSalon ? ar.analytics : ar.tabExplore,
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
          title: isPro ? ar.tabMyBids : isSalon ? ar.tabQueue : ar.tabMyJobs,
          tabBarIcon: ({ color, size }) => (
            <Feather name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          title: ar.tabPostJob,
          tabBarButton: isClient ? undefined : () => null,
          tabBarIcon: ({ color, size }) => (
            <Feather name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: ar.tabProfile,
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
