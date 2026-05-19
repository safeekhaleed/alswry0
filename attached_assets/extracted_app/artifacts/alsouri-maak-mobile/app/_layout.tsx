import {
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
  useFonts,
} from "@expo-google-fonts/cairo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const _domain = process.env.EXPO_PUBLIC_DOMAIN;
if (_domain) {
  setBaseUrl(`https://${_domain}`);
} else {
  console.error(
    "[Config] EXPO_PUBLIC_DOMAIN is not set — API calls will fail. " +
    "For EAS builds, run: eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value <your-domain>"
  );
}

if (Platform.OS !== "web") {
  import("expo-notifications").then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  });
}

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const API_BASE = (() => {
  const d = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return d ? `https://${d}` : "";
})();

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const Notifications = await import("expo-notifications");
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "069c5083-ba53-4438-bf28-1fd0bf9ff5ca",
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

async function registerPushToken(userId: number) {
  const token = await getExpoPushToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api/notifications/push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });
  } catch {}
}

async function registerAdminPushToken() {
  const token = await getExpoPushToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api/notifications/admin/push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });
  } catch {}
}

function RootLayoutNav() {
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        router.replace("/admin");
        registerAdminPushToken();
      } else if (user) {
        router.replace("/(tabs)");
        registerPushToken(user.id);
      } else {
        router.replace("/login");
      }
    }
  }, [user, isAdmin, isLoading]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let receivedSub: { remove: () => void } | null = null;
    let responseSub: { remove: () => void } | null = null;

    import("expo-notifications").then((Notifications) => {
      receivedSub = Notifications.addNotificationReceivedListener(() => {
      });
      responseSub = Notifications.addNotificationResponseReceivedListener(() => {
      });
    });

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, []);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerBackTitle: "رجوع" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="lesson/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="tool/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
