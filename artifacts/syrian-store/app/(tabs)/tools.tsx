import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Tool = {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  color: string;
  url?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  content?: string | null;
  contentType?: string | null;
  isActive: boolean;
  createdAt: string;
};

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

function useListTools() {
  const [data, setData] = useState<Tool[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const refetch = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch(`${API_BASE}/api/tools`);
      if (res.ok) setData(await res.json());
      else setIsError(true);
    } catch { setIsError(true); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { refetch(); }, []);
  return { data, isLoading, isError, refetch };
}

function ToolCard({ tool }: { tool: Tool }) {
  const colors = useColors();
  const router = useRouter();

  const handlePress = () => {
    if (tool.url) {
      Linking.openURL(tool.url).catch(() => router.push(`/tool/${tool.id}`));
    } else {
      router.push(`/tool/${tool.id}`);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
      onPress={handlePress}
    >
      <View style={[styles.colorStrip, { backgroundColor: tool.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.toolIcon, { backgroundColor: tool.color + "33" }]}>
            <Feather name="tool" size={18} color={tool.color} />
          </View>
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
          {tool.title}
        </Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
          {tool.description}
        </Text>
        <View style={styles.cardFooter}>
          <View style={[styles.categoryTag, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>
              {tool.category}
            </Text>
          </View>
          <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { data: tools, isLoading, isError, refetch } = useListTools();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeTools = tools?.filter((t) => t.isActive) ?? [];
  const categories = Array.from(new Set(activeTools.map((t) => t.category)));

  const filtered = selectedCategory
    ? activeTools.filter((t) => t.category === selectedCategory)
    : activeTools;

  const renderItem = ({ item }: { item: Tool }) => <ToolCard tool={item} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الأدوات</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {filtered.length > 0 ? `${filtered.length} أداة متاحة` : ""}
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
                  backgroundColor: !selectedCategory ? colors.primary : colors.secondary,
                  borderColor: !selectedCategory ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: !selectedCategory ? colors.primaryForeground : colors.foreground },
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
                    styles.filterText,
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
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>خطأ في تحميل الأدوات</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="tool" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد أدوات متاحة</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: isWeb ? 34 + 84 : 100 },
          ]}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, alignItems: "flex-end" },
  headerTitle: { fontFamily: "Cairo_700Bold", fontSize: 26 },
  headerSub: { fontFamily: "Cairo_400Regular", fontSize: 13, marginTop: 2 },
  filterBar: { borderBottomWidth: 1, paddingVertical: 10 },
  filterScroll: { paddingHorizontal: 16, gap: 8, flexDirection: "row-reverse" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontFamily: "Cairo_400Regular", fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyText: { fontFamily: "Cairo_400Regular", fontSize: 15, textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
  listContent: { padding: 12, gap: 10 },
  columnWrapper: { gap: 10, flexDirection: "row-reverse" },
  card: { flex: 1, borderRadius: 16, borderWidth: 1, overflow: "hidden", minHeight: 160 },
  colorStrip: { height: 4 },
  cardBody: { flex: 1, padding: 12, gap: 6, alignItems: "flex-end" },
  cardTop: { flexDirection: "row-reverse", justifyContent: "flex-start" },
  toolIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "Cairo_600SemiBold", fontSize: 14, textAlign: "right" },
  cardDesc: { fontFamily: "Cairo_400Regular", fontSize: 11, lineHeight: 17, textAlign: "right", flex: 1 },
  cardFooter: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 4 },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontFamily: "Cairo_400Regular", fontSize: 11 },
});
