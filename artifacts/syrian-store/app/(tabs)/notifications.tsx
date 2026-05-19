import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";

const PROD_API = "https://alsouri-maak-api.onrender.com";
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : Platform.OS !== "web" ? PROD_API : "";

async function apiCall(path: string, method = "GET", body?: object, token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "خطأ غير معروف");
  return json;
}

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  recharge_approved: "check-circle",
  recharge_rejected: "x-circle",
  admin_message: "message-circle",
  app_update: "bell",
};

const TYPE_COLOR: Record<string, string> = {
  recharge_approved: "#34d399",
  recharge_rejected: "#ef4444",
  admin_message: "#d4a017",
  app_update: "#60a5fa",
};

export default function NotificationsScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await apiCall("/notifications", "GET", undefined, token);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل الإشعارات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) load();
  }, [user, token, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const markRead = async (id: number) => {
    try {
      await apiCall(`/notifications/${id}/read`, "PATCH", undefined, token);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  if (!user) {
    return (
      <View style={[styles.flex, { backgroundColor: "#0a001a" }]}>
        <View style={[styles.empty, { paddingTop: insets.top + 60 }]}>
          <Feather name="lock" size={52} color="#2d4a6a" />
          <Text style={styles.emptyText}>سجّل الدخول لعرض إشعاراتك</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: "#0a001a" }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>الإشعارات</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color="#d4a017" size="large" />
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Feather name="wifi-off" size={48} color="#ef4444" />
          <Text style={[styles.emptyText, { color: "#ef4444" }]}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            items.length === 0 && styles.emptyScroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#d4a017"
              colors={["#d4a017"]}
            />
          }
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="bell-off" size={56} color="#2d4a6a" />
              <Text style={styles.emptyText}>لا توجد إشعارات بعد</Text>
              <Text style={styles.emptySubText}>ستظهر هنا إشعاراتك من الإدارة</Text>
            </View>
          ) : (
            items.map((item) => {
              const icon = TYPE_ICON[item.type] ?? "bell";
              const color = TYPE_COLOR[item.type] ?? "#94a3b8";
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, !item.isRead && styles.cardUnread]}
                  activeOpacity={0.82}
                  onPress={() => !item.isRead && markRead(item.id)}
                >
                  <View style={[styles.iconBox, { backgroundColor: color + "22" }]}>
                    <Feather name={icon} size={22} color={color} />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      {!item.isRead && <View style={styles.dot} />}
                    </View>
                    {!!item.message && (
                      <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text>
                    )}
                    <Text style={styles.cardTime}>
                      {new Date(item.createdAt).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(80,100,140,0.25)",
  },
  title: { fontFamily: "Cairo_700Bold", fontSize: 22, color: "#f8fafc" },
  badge: {
    backgroundColor: "#d4a017",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontFamily: "Cairo_700Bold", fontSize: 12, color: "#0a001a" },
  list: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  emptyScroll: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 60 },
  emptyText: { fontFamily: "Cairo_600SemiBold", fontSize: 16, color: "#64748b" },
  emptySubText: { fontFamily: "Cairo_400Regular", fontSize: 13, color: "#3d5a80", textAlign: "center" },
  card: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    backgroundColor: "rgba(124,58,237,0.12)",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.22)",
  },
  cardUnread: { borderColor: "#d4a01750", backgroundColor: "rgba(124,58,237,0.1)" },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, alignItems: "flex-end", gap: 5 },
  cardTop: { flexDirection: "row-reverse", alignItems: "center", gap: 8, width: "100%" },
  cardTitle: { fontFamily: "Cairo_700Bold", fontSize: 14, color: "#f0f4ff", flex: 1, textAlign: "right" },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#d4a017", flexShrink: 0 },
  cardMsg: { fontFamily: "Cairo_400Regular", fontSize: 13, color: "#94a3b8", textAlign: "right", lineHeight: 20, width: "100%" },
  cardTime: { fontFamily: "Cairo_400Regular", fontSize: 11, color: "#3d5a80", textAlign: "right" },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "rgba(124,58,237,0.22)", borderRadius: 12 },
  retryText: { fontFamily: "Cairo_600SemiBold", fontSize: 14, color: "#d4a017" },
});
