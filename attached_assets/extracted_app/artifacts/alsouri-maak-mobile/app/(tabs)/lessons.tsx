import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListLessons } from "@workspace/api-client-react";
import type { Lesson } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} د`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} س ${m} د` : `${h} س`;
}

function LessonCard({ lesson, onPress }: { lesson: Lesson; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.durationBadge, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="clock" size={11} color={colors.primary} />
          <Text style={[styles.durationText, { color: colors.primary }]}>
            {formatDuration(lesson.duration)}
          </Text>
        </View>
        <View style={styles.cardTitleRow}>
          <View
            style={[
              styles.publishedDot,
              { backgroundColor: lesson.isPublished ? "#34d399" : colors.muted },
            ]}
          />
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
            {lesson.title}
          </Text>
        </View>
      </View>
      <Text
        style={[styles.cardDescription, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {lesson.description}
      </Text>
      <View style={styles.cardFooter}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>
            {lesson.category}
          </Text>
        </View>
        <Feather name="play-circle" size={22} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

export default function LessonsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { data: lessons, isLoading, isError, refetch } = useListLessons();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = lessons
    ? Array.from(new Set(lessons.map((l) => l.category)))
    : [];

  const filtered = lessons
    ? selectedCategory
      ? lessons.filter((l) => l.category === selectedCategory && l.isPublished)
      : lessons.filter((l) => l.isPublished)
    : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الدروس</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {filtered.length > 0 ? `${filtered.length} درس متاح` : ""}
        </Text>
      </View>

      {categories.length > 0 && (
        <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedCategory === null ? colors.primary : colors.secondary,
                  borderColor: selectedCategory === null ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedCategory === null ? colors.primaryForeground : colors.foreground },
                ]}
              >
                الكل
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedCategory === cat ? colors.primary : colors.secondary,
                    borderColor: selectedCategory === cat ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedCategory === cat ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            خطأ في تحميل الدروس
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="book-open" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            لا توجد دروس متاحة
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <LessonCard lesson={item} onPress={() => router.push(`/lesson/${item.id}`)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: isWeb ? 34 + 84 : 100 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          scrollEnabled={!!(filtered.length > 0)}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 26,
  },
  headerSub: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  filterBar: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row-reverse",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  emptyText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 15,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    gap: 6,
    alignItems: "flex-end",
  },
  cardTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  publishedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  cardTitle: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 16,
    flex: 1,
    textAlign: "right",
  },
  durationBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  durationText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
  },
  cardDescription: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  cardFooter: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 12,
  },
});
