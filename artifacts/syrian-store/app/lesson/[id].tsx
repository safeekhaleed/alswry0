import { Feather } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ساعة ${m} دقيقة` : `${h} ساعة`;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16));

function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={{ width: SCREEN_WIDTH, height: VIDEO_HEIGHT }}
      nativeControls
      contentFit="contain"
    />
  );
}

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetch(`${API_BASE}/api/lessons/${id}`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(setLesson)
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

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
          {lesson?.title ?? "تفاصيل الدرس"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError || !lesson ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>تعذّر تحميل الدرس</Text>
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
          {lesson.videoUrl ? (
            <View style={[styles.videoContainer, { backgroundColor: "#000" }]}>
              <VideoPlayer videoUrl={lesson.videoUrl} />
            </View>
          ) : (
            <View
              style={[
                styles.noVideoPlaceholder,
                { backgroundColor: colors.secondary, height: VIDEO_HEIGHT },
              ]}
            >
              <Feather name="video-off" size={44} color={colors.mutedForeground} />
              <Text style={[styles.noVideoText, { color: colors.mutedForeground }]}>لا يوجد فيديو لهذا الدرس</Text>
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="clock" size={13} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {formatDuration(lesson.duration)}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                <Feather name="tag" size={13} color={colors.mutedForeground} />
                <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                  {lesson.category}
                </Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>{lesson.title}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {lesson.description}
            </Text>
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
  videoContainer: { width: "100%" },
  noVideoPlaceholder: { width: "100%", alignItems: "center", justifyContent: "center", gap: 10 },
  noVideoText: { fontFamily: "Cairo_400Regular", fontSize: 14 },
  content: { padding: 16, gap: 14 },
  metaRow: { flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" },
  badge: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontFamily: "Cairo_400Regular", fontSize: 12 },
  title: { fontFamily: "Cairo_700Bold", fontSize: 20, textAlign: "right", lineHeight: 32 },
  divider: { height: 1, marginVertical: 2 },
  description: { fontFamily: "Cairo_400Regular", fontSize: 15, lineHeight: 26, textAlign: "right" },
});
