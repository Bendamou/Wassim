import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#090013", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#00B4FF" size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth" />;
  return <Redirect href="/(tabs)" />;
}
