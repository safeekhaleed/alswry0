import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>الرئيسية</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="store">
        <Icon sf={{ default: "bag", selected: "bag.fill" }} />
        <Label>المتجر</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lessons">
        <Icon sf={{ default: "play.rectangle", selected: "play.rectangle.fill" }} />
        <Label>الدروس</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tools">
        <Icon sf={{ default: "wrench", selected: "wrench.fill" }} />
        <Label>الأدوات</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="services">
        <Icon sf={{ default: "star", selected: "star.fill" }} />
        <Label>الخدمات</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "#0d0028" },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
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
            isIOS ? (
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
            isIOS ? (
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
            isIOS ? (
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
            isIOS ? (
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

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
