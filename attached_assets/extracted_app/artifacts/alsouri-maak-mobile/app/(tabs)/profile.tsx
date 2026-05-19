import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetPlatformStats } from "@workspace/api-client-react";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const API_BASE = (() => {
  const d = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return d ? `https://${d}` : "";
})();

type MenuItemProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress?: () => void;
};

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
      <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.menuIconWrap, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { data: stats } = useGetPlatformStats();
  const { user, logout, refreshUser } = useAuth() as any;
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const pickAvatar = async () => {
    if (Platform.OS === "web") return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى الصور.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setAvatarUploading(true);
    try {
      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ base64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" }),
      });
      const json = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(json.error ?? "خطأ في الرفع");
      await fetch(`${API_BASE}/api/auth/user/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatarUrl: json.url }),
      });
      await refreshUser?.();
      Alert.alert("تم ✓", "تم تحديث صورة الملف الشخصي.");
    } catch (e: any) {
      Alert.alert("خطأ", "فشل رفع الصورة: " + e.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser?.();
    } finally {
      setRefreshing(false);
    }
  };

  function handleLogout() {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/login"));
      return;
    }
    Alert.alert(
      "تسجيل الخروج",
      "هل أنت متأكد من رغبتك في تسجيل الخروج؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "خروج",
          style: "destructive",
          onPress: () => logout().then(() => router.replace("/login")),
        },
      ],
    );
  }

  const balanceFormatted = user
    ? Number(user.balance).toLocaleString("ar-SY", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " ل.س"
    : "٠٫٠٠ ل.س";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: isWeb ? 34 + 84 : 100 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <LinearGradient
        colors={[colors.card, colors.background]}
        style={[styles.heroSection, { paddingTop: topPad + 20 }]}
      >
        <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} disabled={avatarUploading}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
              {user?.avatarUrl ? (
                <Image
                  key={user.avatarUrl}
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                  <Feather name="user" size={40} color={colors.primary} />
                </View>
              )}
            </View>
            {user?.isVip && (
              <View style={[styles.vipBadge, { backgroundColor: colors.primary }]}>
                <Feather name="star" size={10} color={colors.primaryForeground} />
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              <Feather name={avatarUploading ? "loader" : "camera"} size={12} color="#0d0028" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={[styles.username, { color: colors.foreground }]}>
          {user?.username ?? "مستخدم المنصة"}
        </Text>
        <Text style={[styles.accountId, { color: colors.mutedForeground }]}>
          {user?.accountId ?? "عضو في السوري معك"}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>
              {stats?.publishedLessons ?? "—"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>درس</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>
              {stats?.activeTools ?? "—"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>أداة</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.primary }]}>
              {user?.isVip ? "VIP" : "مجاني"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>عضوية</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.balanceRow}>
          <View style={[styles.balanceIconWrap, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="credit-card" size={20} color={colors.primary} />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>رصيد الحساب</Text>
            <Text style={[styles.balanceValue, { color: colors.foreground }]}>{balanceFormatted}</Text>
          </View>
          <TouchableOpacity
            style={[styles.rechargeBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => router.push("/")}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text style={[styles.rechargeBtnText, { color: colors.primaryForeground }]}>شحن</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.menuSectionTitle, { color: colors.mutedForeground }]}>الحساب</Text>
        <MenuItem icon="user" label="معلومات الملف الشخصي" />
        <MenuItem icon="bell" label="الإشعارات" />
        <MenuItem icon="shield" label="الأمان والخصوصية" />
      </View>

      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.menuSectionTitle, { color: colors.mutedForeground }]}>المنصة</Text>
        <MenuItem icon="book-open" label="دروسي المحفوظة" />
        <MenuItem icon="award" label="شهاداتي" />
        <MenuItem icon="help-circle" label="المساعدة والدعم" />
      </View>

      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.menuSectionTitle, { color: colors.mutedForeground }]}>عام</Text>
        <MenuItem icon="info" label="عن المنصة" />
        <MenuItem icon="share-2" label="مشاركة التطبيق" />
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: "#ef444460", backgroundColor: "#ef44441a" }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={[styles.logoutText, { color: "#ef4444" }]}>تسجيل الخروج</Text>
        <Feather name="log-out" size={18} color="#ef4444" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {},
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  vipBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    left: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0d0028",
  },
  username: {
    fontFamily: "Cairo_700Bold",
    fontSize: 22,
  },
  accountId: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 20,
    marginTop: 12,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statNum: {
    fontFamily: "Cairo_700Bold",
    fontSize: 20,
  },
  statLabel: {
    fontFamily: "Cairo_400Regular",
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  balanceRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  balanceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceInfo: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  balanceLabel: {
    fontFamily: "Cairo_400Regular",
    fontSize: 12,
  },
  balanceValue: {
    fontFamily: "Cairo_700Bold",
    fontSize: 20,
  },
  rechargeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  rechargeBtnText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 13,
  },
  menuSection: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuSectionTitle: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
    textAlign: "right",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: "Cairo_400Regular",
    fontSize: 15,
    flex: 1,
    textAlign: "right",
  },
  logoutBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 15,
  },
});
