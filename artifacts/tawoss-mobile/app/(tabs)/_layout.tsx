import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

function NativeTabLayout() {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const isPro = user?.role === "professional";
  const isSalon = user?.role === "salon_owner";

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{isSalon ? "Dashboard" : "Home"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Icon sf={{ default: isPro ? "bolt" : isSalon ? "chart.bar" : "safari", selected: isPro ? "bolt.fill" : isSalon ? "chart.bar.fill" : "safari.fill" }} />
        <Label>{isPro ? "Requests" : isSalon ? "Analytics" : "Explore"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="activity">
        <Icon sf={{ default: "briefcase", selected: "briefcase.fill" }} />
        <Label>{isPro ? "My Bids" : isSalon ? "Queue" : "My Jobs"}</Label>
      </NativeTabs.Trigger>
      {isClient && (
        <NativeTabs.Trigger name="post-job">
          <Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} />
          <Label>Post Job</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const isPro = user?.role === "professional";
  const isSalon = user?.role === "salon_owner";
  const isClient = user?.role === "client";

  const activeColor = isPro ? "#FF1F8E" : isSalon ? "#9B30FF" : "#00B4FF";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#0e0020",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.08)",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0e0020" }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isSalon ? "Dashboard" : "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: isPro ? "Requests" : isSalon ? "Analytics" : "Explore",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name={isPro ? "bolt" : "safari"} tintColor={color} size={24} />
            ) : (
              <Feather name={isPro ? "zap" : isSalon ? "bar-chart-2" : "compass"} size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: isPro ? "My Bids" : isSalon ? "Queue" : "My Jobs",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="briefcase" tintColor={color} size={24} />
            ) : (
              <Feather name="briefcase" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          title: "Post Job",
          tabBarButton: isClient ? undefined : () => null,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="plus.circle" tintColor={color} size={24} />
            ) : (
              <Feather name="plus-circle" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({});
