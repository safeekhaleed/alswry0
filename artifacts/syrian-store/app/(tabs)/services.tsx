import { Feather } from "@expo/vector-icons";
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

import { useColors } from "@/hooks/useColors";
import { GoldenFrame } from "@/components/GoldenFrame";

type Service = {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  price: number;
  url?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  content?: string | null;
  contentType?: string | null;
  isAvailable: boolean;
  createdAt: string;
};

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

function useListServices() {
  const [data, setData] = useState<Service[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const refetch = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch(`${API_BASE}/api/services`);
      if (res.ok) setData(await res.json());
      else setIsError(true);
    } catch { setIsError(true); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { refetch(); }, []);
  return { data, isLoading, isError, refetch };
}

function ServiceCard({ service }: { service: Service }) {
  const colors = useColors();
  const isAvailable = service.isAvailable;

  return (
    <GoldenFrame radius={16}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderWidth: 0 }]}
        activeOpacity={isAvailable ? 0.75 : 1}
      >
        <View style={styles.cardMain}>
          <View style={styles.cardLeft}>
            <View
              style={[
                styles.availableBadge,
                { backgroundColor: isAvailable ? "#34d39922" : colors.muted },
              ]}
            >
              <View
                style={[
                  styles.availableDot,
                  { backgroundColor: isAvailable ? "#34d399" : colors.mutedForeground },
                ]}
              />
              <Text
                style={[
                  styles.availableText,
                  { color: isAvailable ? "#34d399" : colors.mutedForeground },
                ]}
              >
                {isAvailable ? "متاح" : "غير متاح"}
              </Text>
            </View>
            <View style={[styles.priceBox, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {service.price > 0 ? service.price.toLocaleString("ar-SA") : "مجاني"}
              </Text>
              {service.price > 0 && (
                <Text style={[styles.priceCurrency, { color: colors.primary }]}>$</Text>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
              {service.title}
            </Text>
            <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
              {service.description}
            </Text>
            <View style={[styles.categoryTag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>
                {service.category}
              </Text>
            </View>
          </View>
        </View>
        {isAvailable && (
          <TouchableOpacity
            style={[styles.requestBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Feather name="send" size={14} color={colors.primaryForeground} />
            <Text style={[styles.requestBtnText, { color: colors.primaryForeground }]}>طلب الخدمة</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </GoldenFrame>
  );
}

export default function ServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { data: services, isLoading, isError, refetch } = useListServices();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = services
    ? Array.from(new Set(services.map((s) => s.category)))
    : [];

  const filtered = services
    ? selectedCategory
      ? services.filter((s) => s.category === selectedCategory)
      : services
    : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الخدمات</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {filtered.length > 0 ? `${filtered.length} خدمة متاحة` : ""}
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
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>خطأ في تحميل الخدمات</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Feather name="star" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد خدمات متاحة</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ServiceCard service={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: isWeb ? 34 + 84 : 100 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
  listContent: { padding: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  cardMain: { flexDirection: "row-reverse", gap: 12 },
  cardRight: { flex: 1, gap: 6, alignItems: "flex-end" },
  cardLeft: { gap: 8, alignItems: "center", minWidth: 70 },
  cardTitle: { fontFamily: "Cairo_600SemiBold", fontSize: 15, textAlign: "right" },
  cardDesc: { fontFamily: "Cairo_400Regular", fontSize: 12, lineHeight: 19, textAlign: "right" },
  availableBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  availableDot: { width: 6, height: 6, borderRadius: 3 },
  availableText: { fontFamily: "Cairo_400Regular", fontSize: 11 },
  priceBox: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
  priceValue: { fontFamily: "Cairo_700Bold", fontSize: 16 },
  priceCurrency: { fontFamily: "Cairo_400Regular", fontSize: 10 },
  categoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontFamily: "Cairo_400Regular", fontSize: 12 },
  requestBtn: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 8 },
  requestBtnText: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
});
