import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
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

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`${API_BASE}/api/tools/${id}`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(setTool)
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  const hasUrl =
    tool?.url &&
    (tool.url.startsWith("http://") || tool.url.startsWith("https://"));

  const handleLaunch = async () => {
    if (!hasUrl || !tool?.url) return;
    await WebBrowser.openBrowserAsync(tool.url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {tool?.title ?? "تفاصيل الأداة"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError || !tool ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>تعذّر تحميل الأداة</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>العودة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        >
          <View style={[styles.heroBanner, { backgroundColor: tool.color + "22" }]}>
            <View style={[styles.heroIconWrap, { backgroundColor: tool.color }]}>
              <Feather name="tool" size={36} color="#fff" />
            </View>
            <View style={[styles.colorBar, { backgroundColor: tool.color }]} />
          </View>

          <View style={styles.content}>
            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: tool.color + "22" }]}>
                <Feather name="tag" size={13} color={tool.color} />
                <Text style={[styles.badgeText, { color: tool.color }]}>{tool.category}</Text>
              </View>
              {!tool.isActive && (
                <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                  <Feather name="pause-circle" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>غير متاحة</Text>
                </View>
              )}
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>{tool.title}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {tool.description}
            </Text>

            {hasUrl && (
              <TouchableOpacity
                style={[styles.launchBtn, { backgroundColor: tool.color }]}
                onPress={handleLaunch}
                activeOpacity={0.85}
              >
                <Feather name="external-link" size={18} color="#fff" />
                <Text style={styles.launchBtnText}>فتح الأداة</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontFamily: "Cairo_600SemiBold", fontSize: 17, flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyText: { fontFamily: "Cairo_400Regular", fontSize: 15, textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
  heroBanner: { width: "100%", height: 160, alignItems: "center", justifyContent: "center", position: "relative" },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  colorBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 4 },
  content: { padding: 16, gap: 14 },
  metaRow: { flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" },
  badge: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontFamily: "Cairo_400Regular", fontSize: 12 },
  title: { fontFamily: "Cairo_700Bold", fontSize: 22, textAlign: "right", lineHeight: 34 },
  divider: { height: 1, marginVertical: 2 },
  description: { fontFamily: "Cairo_400Regular", fontSize: 15, lineHeight: 28, textAlign: "right" },
  launchBtn: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 14, marginTop: 8 },
  launchBtnText: { fontFamily: "Cairo_700Bold", fontSize: 15, color: "#fff" },
});
