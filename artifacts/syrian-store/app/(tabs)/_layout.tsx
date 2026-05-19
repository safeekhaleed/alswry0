import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const BlurView: React.ComponentType<any> | null =
  Platform.OS === "ios" ? require("expo-blur").BlurView : null;

const SymbolView: React.ComponentType<any> | null =
  Platform.OS === "ios" ? require("expo-symbols").SymbolView : null;

export default function TabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#a78bfa",
        tabBarInactiveTintColor: "#5a4d7a",
        tabBarLabelStyle: {
          fontFamily: "Cairo_400Regular",
          fontSize: 11,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#0d0028",
          borderTopWidth: 1,
          borderTopColor: "rgba(124,58,237,0.25)",
          elevation: 0,
          paddingBottom: isWeb ? 0 : insets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS && BlurView ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0d0028" }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color, size }) =>
            isIOS && SymbolView ? (
              <SymbolView name="house.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="home" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "المتجر",
          tabBarIcon: ({ color, size }) =>
            isIOS && SymbolView ? (
              <SymbolView name="bag.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="shopping-bag" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: "الدروس",
          tabBarIcon: ({ color, size }) =>
            isIOS && SymbolView ? (
              <SymbolView name="play.rectangle.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="play-circle" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "الأدوات",
          tabBarIcon: ({ color, size }) =>
            isIOS && SymbolView ? (
              <SymbolView name="wrench.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="tool" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "الخدمات",
          tabBarIcon: ({ color, size }) =>
            isIOS && SymbolView ? (
              <SymbolView name="star.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="briefcase" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
