import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";
import type { ColorValue } from "react-native";
import { useAuth } from "@/context/auth";
import { C } from "@/constants/app-theme";

const TabIcon = ({
  symbol,
  color,
  focused,
}: {
  symbol: string;
  color: ColorValue;
  focused: boolean;
}) => (
  <View
    style={{
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: focused ? C.blueSoft : "transparent",
    }}
  >
    <Text style={{ color, fontSize: 19, lineHeight: 22, fontWeight: "900" }}>
      {symbol}
    </Text>
  </View>
);

export default function TabLayout() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Redirect href="/login" />;
  const customer = user.role === "user";
  const workspace =
    user.role === "admin"
      ? "Business"
      : user.role === "driver"
        ? "Driver"
        : "Dashboard";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: C.line,
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Book",
          href: customer ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon symbol="＋" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "My rides",
          href: customer ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon symbol="≡" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="role"
        options={{
          title: workspace,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon symbol="▦" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Updates",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon symbol="◆" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon symbol="●" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
