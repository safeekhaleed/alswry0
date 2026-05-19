import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

export default function ToolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [tool, setTool] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`${API_BASE}/api/tools/${id}`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then((data) => {
        setTool(data);
        // Auto-open WebView if tool has a URL
        if (data?.url && (data.url.startsWith("http://") || data.url.startsWith("https://"))) {
          setShowWebView(true);
        }
      })
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  const hasUrl =
    tool?.url &&
    (tool.url.startsWith("http://") || tool.url.startsWith("https://"));

  const cardColor = tool?.color || colors.primary;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-right" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>تحميل...</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isError || !tool) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-right" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>خطأ</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.center}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>تعذّر تحميل الأداة</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Full-screen WebView modal
  if (showWebView && hasUrl) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        {/* Browser-like header */}
        <View style={[styles.webHeader, { paddingTop: topPad + 4 }]}>
          <TouchableOpacity style={styles.webBackBtn} onPress={() => { setShowWebView(false); router.back(); }}>
            <Feather name="arrow-right" size={20} color="#f8fafc" />
          </TouchableOpacity>
          <View style={styles.webUrlBar}>
            <Feather name="lock" size={11} color="#22c55e" />
            <Text style={styles.webUrlText} numberOfLines={1}>{tool.title}</Text>
          </View>
          <TouchableOpacity style={styles.webBackBtn} onPress={() => { setShowWebView(false); router.back(); }}>
            <Feather name="x" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Embedded content */}
        {isWeb ? (
          // Web: iframe
          <iframe
            src={tool.url}
            style={{ flex: 1, border: "none", width: "100%", height: "100%" } as any}
            allow="camera; microphone; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        ) : (
          // Native: show in-app browser overlay simulation
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a001a" }}>
            <View style={[styles.nativeBrowserCard, { borderColor: cardColor + "44" }]}>
              {tool.imageUrl ? (
                <Image source={{ uri: tool.imageUrl }} style={styles.nativeBrowserImg} resizeMode="cover" />
              ) : (
                <View style={[styles.nativeBrowserIcon, { backgroundColor: cardColor + "22" }]}>
                  <Feather name="tool" size={48} color={cardColor} />
                </View>
              )}
              <Text style={[styles.nativeBrowserTitle, { color: "#f8fafc" }]}>{tool.title}</Text>
              <Text style={[styles.nativeBrowserDesc, { color: "#94a3b8" }]}>{tool.description}</Text>
              <TouchableOpacity
                style={[styles.nativeLaunchBtn, { backgroundColor: cardColor }]}
                activeOpacity={0.85}
                onPress={async () => {
                  const WB = await import("expo-web-browser");
                  await WB.openBrowserAsync(tool.url, { showTitle: false, toolbarColor: "#0a001a" });
                }}
              >
                <Feather name="play" size={16} color="#fff" />
                <Text style={styles.nativeLaunchText}>فتح الأداة</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Info screen (no URL or WebView closed)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {tool.title}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
        <View style={[styles.infoIconWrap, { backgroundColor: cardColor + "22" }]}>
          {tool.imageUrl ? (
            <Image source={{ uri: tool.imageUrl }} style={{ width: 80, height: 80, borderRadius: 20 }} />
          ) : (
            <Feather name="tool" size={40} color={cardColor} />
          )}
        </View>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>{tool.title}</Text>
        <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>{tool.description}</Text>
        {tool.category && (
          <View style={[styles.infoBadge, { backgroundColor: cardColor + "18" }]}>
            <Text style={[styles.infoBadgeText, { color: cardColor }]}>{tool.category}</Text>
          </View>
        )}
        {!hasUrl && (
          <Text style={[styles.infoDesc, { color: colors.mutedForeground, fontSize: 13, textAlign: "center" }]}>
            لا يوجد رابط مرتبط بهذه الأداة
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { padding: 2 },
  headerTitle: { fontFamily: "Cairo_600SemiBold", fontSize: 17, flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyText: { fontFamily: "Cairo_400Regular", fontSize: 15, textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
  // WebView header
  webHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingBottom: 10, backgroundColor: "#0d0028", borderBottomWidth: 1, borderBottomColor: "rgba(124,58,237,0.2)" },
  webBackBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  webUrlBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  webUrlText: { fontFamily: "Cairo_400Regular", fontSize: 12, color: "#cbd5e1", flex: 1 },
  // Native browser card
  nativeBrowserCard: { width: "90%", backgroundColor: "#130030", borderRadius: 24, borderWidth: 1, padding: 28, alignItems: "center", gap: 14 },
  nativeBrowserImg: { width: 100, height: 100, borderRadius: 20 },
  nativeBrowserIcon: { width: 100, height: 100, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  nativeBrowserTitle: { fontFamily: "Cairo_700Bold", fontSize: 20, textAlign: "center" },
  nativeBrowserDesc: { fontFamily: "Cairo_400Regular", fontSize: 13, textAlign: "center", lineHeight: 22 },
  nativeLaunchBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  nativeLaunchText: { fontFamily: "Cairo_700Bold", fontSize: 15, color: "#fff" },
  // Info screen
  infoIconWrap: { width: 100, height: 100, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  infoTitle: { fontFamily: "Cairo_700Bold", fontSize: 22, textAlign: "center" },
  infoDesc: { fontFamily: "Cairo_400Regular", fontSize: 15, lineHeight: 26, textAlign: "center", color: "#94a3b8" },
  infoBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  infoBadgeText: { fontFamily: "Cairo_600SemiBold", fontSize: 13 },
});
