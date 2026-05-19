import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Clipboard,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { GoldenFrame } from "@/components/GoldenFrame";
import { ProfileModal, SecurityModal, CartModal, ContactModal } from "@/components/DrawerModals";

type Tool = { id: number; title: string; color: string; url?: string | null; isActive: boolean; imageUrl?: string | null; description?: string | null; [k: string]: unknown };

function ProfileDrawer({
  visible,
  onClose,
  onRecharge,
  onNotifications,
}: {
  visible: boolean;
  onClose: () => void;
  onRecharge: () => void;
  onNotifications: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { user, isAdmin, logout } = useAuth();

  const [showProfile, setShowProfile] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const openModal = (setter: (v: boolean) => void) => {
    onClose();
    setTimeout(() => setter(true), 320);
  };

  const balanceAmount = user ? Number(user.balance).toLocaleString("ar-SY") : "0";

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج من الحساب؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: async () => { onClose(); await logout(); } },
    ]);
  };

  const menuItems: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; onPress?: () => void; iconBg?: string }[] = [
    { icon: "user", label: "الملف الشخصي", iconBg: "rgba(124,58,237,0.22)", onPress: () => openModal(setShowProfile) },
    { icon: "shield", label: "الأمان والحساب", iconBg: "rgba(124,58,237,0.22)", onPress: () => openModal(setShowSecurity) },
    { icon: "credit-card", label: "الشحن والدفع", iconBg: "rgba(124,58,237,0.22)", onPress: onRecharge },
    { icon: "shopping-cart", label: "السلة", iconBg: "#1a3d2e", onPress: () => openModal(setShowCart) },
    { icon: "bell", label: "الإشعارات", iconBg: "rgba(124,58,237,0.22)", onPress: () => { onClose(); onNotifications(); } },
    { icon: "message-circle", label: "تواصل معنا", iconBg: "rgba(124,58,237,0.22)", onPress: () => openModal(setShowContact) },
  ];

  if (isAdmin) {
    menuItems.unshift({
      icon: "settings",
      label: "لوحة الإدارة",
      iconBg: "#2d1f4a",
      onPress: () => { onClose(); setTimeout(() => router.push("/admin"), 300); },
    });
  }

  const initial = (user?.username ?? "م")[0].toUpperCase();
  const accountId = (user as any)?.accountId ?? "";

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={dStyles.root}>
          <TouchableOpacity style={dStyles.overlay} activeOpacity={1} onPress={onClose} />
          <View style={[dStyles.panel, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dStyles.scroll}>
              <View style={dStyles.avatarWrap}>
                <View style={dStyles.avatarRing}>
                  <View style={dStyles.avatarInner}>
                    <Text style={dStyles.avatarInitial}>{initial}</Text>
                  </View>
                </View>
                {(user as any)?.isVip && (
                  <View style={dStyles.vipBadge}>
                    <Text style={dStyles.vipText}>VIP</Text>
                  </View>
                )}
              </View>
              <Text style={dStyles.username} numberOfLines={1}>{user?.username ?? "مستخدم المنصة"}</Text>
              <View style={dStyles.balanceCard}>
                <Text style={dStyles.balanceAmount}>{balanceAmount}$</Text>
                <Text style={dStyles.balanceLabel}>رصيدك</Text>
              </View>
              {accountId ? <Text style={dStyles.accountId}>معزز الحساب: {accountId}</Text> : null}
              <View style={dStyles.separator} />
              {menuItems.map((item) => (
                <TouchableOpacity key={item.label} style={dStyles.menuCard} activeOpacity={0.75} onPress={item.onPress}>
                  <View style={[dStyles.menuIconBox, { backgroundColor: item.iconBg ?? "rgba(124,58,237,0.22)" }]}>
                    <Feather name={item.icon} size={17} color="#d4a017" />
                  </View>
                  <Text style={dStyles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={dStyles.logoutCard} onPress={handleLogout} activeOpacity={0.8}>
                <View style={[dStyles.menuIconBox, { backgroundColor: "#3d1515" }]}>
                  <Feather name="log-out" size={17} color="#ef4444" />
                </View>
                <Text style={dStyles.logoutLabel}>تسجيل الخروج</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
      <SecurityModal visible={showSecurity} onClose={() => setShowSecurity(false)} onLoggedOut={() => router.replace("/login")} />
      <CartModal visible={showCart} onClose={() => setShowCart(false)} />
      <ContactModal visible={showContact} onClose={() => setShowContact(false)} />
    </>
  );
}

const dStyles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row-reverse" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  panel: { width: "82%", backgroundColor: "#0d0028", paddingHorizontal: 18, borderRightWidth: 1, borderRightColor: "rgba(124,58,237,0.25)" },
  scroll: { gap: 10 },
  avatarWrap: { alignItems: "center", paddingTop: 8, gap: 8 },
  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2.5, borderColor: "#d4a017", alignItems: "center", justifyContent: "center" },
  avatarInner: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#1a0040", alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: "Cairo_700Bold", fontSize: 32, color: "#d4a017" },
  vipBadge: { backgroundColor: "#d4a017", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 4 },
  vipText: { fontFamily: "Cairo_700Bold", fontSize: 12, color: "#0a001a" },
  username: { fontFamily: "Cairo_700Bold", fontSize: 22, color: "#f8fafc", textAlign: "center", marginTop: 4 },
  balanceCard: { backgroundColor: "rgba(124,58,237,0.15)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(124,58,237,0.3)", paddingHorizontal: 18, paddingVertical: 14, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  balanceLabel: { fontFamily: "Cairo_400Regular", fontSize: 14, color: "#8b7bb8" },
  balanceAmount: { fontFamily: "Cairo_700Bold", fontSize: 20, color: "#d4a017" },
  accountId: { fontFamily: "Cairo_400Regular", fontSize: 12, color: "#6b5b8a", textAlign: "center", marginTop: -2 },
  separator: { height: 1, backgroundColor: "rgba(124,58,237,0.2)", marginVertical: 6 },
  menuCard: { backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(124,58,237,0.2)", flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 14 },
  menuIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontFamily: "Cairo_600SemiBold", fontSize: 15, color: "#e2e8f0", textAlign: "right" },
  logoutCard: { backgroundColor: "rgba(127,29,29,0.2)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 14, marginTop: 4 },
  logoutLabel: { flex: 1, fontFamily: "Cairo_700Bold", fontSize: 15, color: "#ef4444", textAlign: "right" },
});

function ToolCard({ tool }: { tool: Tool }) {
  const colors = useColors();
  const handlePress = async () => {
    if (tool.url) {
      const { Linking } = await import("react-native");
      try {
        if (await Linking.canOpenURL(tool.url)) { Linking.openURL(tool.url); return; }
      } catch { }
    }
    router.push(`/tool/${tool.id}`);
  };
  const cardColor = tool.color || "#7c3aed";
  return (
    <GoldenFrame radius={18} style={{ width: "48%", minHeight: 148 }}>
      <TouchableOpacity style={[styles.toolCard, { backgroundColor: cardColor + "14", width: undefined, minHeight: undefined, borderWidth: 0, flex: 1 }]} activeOpacity={0.8} onPress={handlePress}>
        <View style={[styles.toolCardGlow, { backgroundColor: cardColor + "30" }]} />
        <Text style={[styles.toolSparkle1, { color: cardColor }]}>✦</Text>
        <Text style={[styles.toolSparkle2, { color: cardColor }]}>✦</Text>
        <View style={styles.toolCardIconWrap}>
          {(tool as any).imageUrl ? (
            <Image source={{ uri: (tool as any).imageUrl }} style={styles.toolCardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.toolCardIcon, { backgroundColor: cardColor + "35", borderColor: cardColor + "70" }]}>
              <Feather name="tool" size={24} color={cardColor} />
            </View>
          )}
        </View>
        <Text style={[styles.toolCardLabel, { color: colors.foreground }]} numberOfLines={2}>{tool.title}</Text>
        {(tool as any).description ? (
          <Text style={[styles.toolCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>{(tool as any).description}</Text>
        ) : null}
        <View style={[styles.toolCardArrow, { backgroundColor: cardColor + "22", borderColor: cardColor + "44" }]}>
          <Feather name="arrow-left" size={13} color={cardColor} />
        </View>
      </TouchableOpacity>
    </GoldenFrame>
  );
}

function EmptyToolCard() {
  const colors = useColors();
  return (
    <TouchableOpacity style={[styles.toolCard, { borderColor: colors.border, borderStyle: "dashed", backgroundColor: "rgba(124,58,237,0.06)" }]} activeOpacity={0.7} onPress={() => router.push("/(tabs)/tools")}>
      <View style={styles.toolCardIconWrap}>
        <View style={[styles.toolCardIcon, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="plus" size={22} color={colors.mutedForeground} />
        </View>
      </View>
      <Text style={[styles.toolCardLabel, { color: colors.mutedForeground }]}>أضف أداة</Text>
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; value: React.ReactNode; color: string }) {
  const colors = useColors();
  return (
    <GoldenFrame radius={14} style={{ flex: 1 }}>
      <View style={[styles.statCard, { backgroundColor: color + "10" }]}>
        <View style={[styles.statCardBottomGlow, { backgroundColor: color + "18" }]} />
        <Feather name={icon} size={20} color={color} />
        <Text style={[styles.statCardValue, { color: color }]}>{value ?? "—"}</Text>
        <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    </GoldenFrame>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topInset = isWeb ? 67 : insets.top;

  const [stats, setStats] = React.useState<any>(null);
  const [allTools, setAllTools] = React.useState<Tool[]>([]);
  const { user, isAdmin, token } = useAuth();

  const apiDomain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const apiBase2 = apiDomain ? `https://${apiDomain}` : "";

  const refetchStats = React.useCallback(async () => {
    try { const r = await fetch(`${apiBase2}/api/stats`); if (r.ok) setStats(await r.json()); } catch { }
  }, [apiBase2]);

  const refetchTools = React.useCallback(async () => {
    try { const r = await fetch(`${apiBase2}/api/tools`); if (r.ok) setAllTools(await r.json()); } catch { }
  }, [apiBase2]);

  useEffect(() => { refetchStats(); refetchTools(); }, [refetchStats, refetchTools]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [rechargeOpen, setRechargeOpen] = React.useState(false);
  const [rechargeStep, setRechargeStep] = React.useState<1 | 2>(1);
  const [selectedAmount, setSelectedAmount] = React.useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<"cash" | "binance" | "usdt" | null>(null);
  const [transactionId, setTransactionId] = React.useState("");
  const [transferImage, setTransferImage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [titleHold, setTitleHold] = React.useState(0);
  const [titleTimer, setTitleTimer] = React.useState<ReturnType<typeof setTimeout> | null>(null);
  const [titleInterval, setTitleInterval] = React.useState<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = React.useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
      const base = domain ? `https://${domain}` : "";
      const authHdr = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`${base}/api/notifications/unread-count`, { headers: authHdr });
      if (res.ok) {
        const { count } = await res.json() as { count: number };
        setUnreadCount(count);
      }
    } catch { }
  }, [user]);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);
  useFocusEffect(React.useCallback(() => { fetchUnreadCount(); }, [fetchUnreadCount]));

  const [banners, setBanners] = useState<any[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const carouselRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get("window").width;

  const fetchBanners = async () => {
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
      const base = domain ? `https://${domain}` : "";
      const res = await fetch(`${base}/api/banners`);
      if (res.ok) setBanners(await res.json());
    } catch { }
  };

  useEffect(() => { fetchBanners(); }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setBannerIdx((prev) => {
        const next = (prev + 1) % banners.length;
        carouselRef.current?.scrollTo({ x: next * (screenWidth - 32), animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [banners, screenWidth]);

  const tools = (allTools ?? []).filter((t) => t.isActive).slice(0, 4);
  const toolSlots = [...tools];
  while (toolSlots.length < 4) toolSlots.push(null as unknown as Tool);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([refetchStats(), refetchTools(), fetchBanners(), fetchUnreadCount()]).finally(() => setRefreshing(false));
  };

  const PAYMENT_OPTIONS = [
    { key: "cash" as const, label: "شام كاش", icon: "dollar-sign" as const, color: "#16a34a", id: "9685a0de3bba93e04c63396255d86de0" },
    { key: "binance" as const, label: "بينانس", icon: "trending-up" as const, color: "#f59e0b", id: "63078113" },
    { key: "usdt" as const, label: "USDT", icon: "circle" as const, color: "#22d3ee", id: "TLqiL3ZtuCUYA78UM9HEPJZV1fAch69KKa" },
  ];
  const selectedOption = PAYMENT_OPTIONS.find((o) => o.key === paymentMethod);

  const closeRecharge = () => {
    setRechargeOpen(false); setRechargeStep(1); setSelectedAmount(null);
    setPaymentMethod(null); setTransactionId(""); setTransferImage("");
  };

  const pickTransferImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى معرض الصور."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
    if (!result.canceled) setTransferImage(result.assets[0].uri);
  };

  const submitRecharge = async () => {
    if (!selectedAmount) { Alert.alert("مطلوب", "اختر المبلغ المراد شحنه."); return; }
    if (!transactionId.trim()) { Alert.alert("مطلوب", "أدخل معرف المعاملة."); return; }
    if (!transferImage.trim()) { Alert.alert("مطلوب", "أرفق صورة التحويل."); return; }
    setSubmitting(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
      const apiBase = domain ? `https://${domain}` : "";
      const authHdr2 = token ? { "Authorization": `Bearer ${token}` } : {};
      await fetch(`${apiBase}/api/recharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHdr2 },
        body: JSON.stringify({ paymentMethod: selectedOption?.label ?? paymentMethod, transactionId: transactionId.trim(), transferImageUrl: transferImage.trim(), amount: selectedAmount }),
      });
      Alert.alert("تم الإرسال ✓", "سيتم مراجعة طلب الشحن من قبل الإدارة وإشعارك قريباً.");
      closeRecharge();
    } catch { Alert.alert("خطأ", "تعذّر إرسال الطلب، حاول مجدداً."); }
    finally { setSubmitting(false); }
  };

  const startTitleHold = () => {
    if (titleTimer || titleInterval) return;
    let elapsed = 0;
    const interval = setInterval(() => { elapsed += 100; setTitleHold(Math.min(elapsed / 7000, 1)); }, 100);
    const timer = setTimeout(() => { clearInterval(interval); setTitleHold(1); router.push("/admin"); }, 7000);
    setTitleTimer(timer); setTitleInterval(interval);
  };

  const cancelTitleHold = () => {
    if (titleTimer) clearTimeout(titleTimer);
    if (titleInterval) clearInterval(titleInterval);
    setTitleTimer(null); setTitleInterval(null); setTitleHold(0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity activeOpacity={0.9} onPressIn={startTitleHold} onPressOut={cancelTitleHold} style={styles.titleWrap}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>السوري معك</Text>
            <Text style={[styles.headerSubtitle, { color: colors.accent }]}>منصتك الذكية</Text>
            {titleHold > 0 && (
              <View style={[styles.holdBar, { borderColor: colors.border }]}>
                <View style={[styles.holdFill, { width: `${Math.round(titleHold * 100)}%` as any, backgroundColor: colors.primary }]} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setMenuOpen(true)} activeOpacity={0.85}>
            <Feather name="menu" size={20} color={colors.foreground} />
            {unreadCount > 0 && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: isWeb ? 34 + 96 : 112 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {banners.length > 0 ? (
          <View style={styles.carouselWrap}>
            <ScrollView
              ref={carouselRef}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => setBannerIdx(Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32)))}
              style={{ width: screenWidth - 32 }}
            >
              {banners.map((b) => (
                <Image key={b.id} source={{ uri: b.imageUrl }} style={{ width: screenWidth - 32, height: 160, borderRadius: 16 }} resizeMode="cover" />
              ))}
            </ScrollView>
            {banners.length > 1 && (
              <View style={styles.carouselDots}>
                {banners.map((_, i) => (
                  <View key={i} style={[styles.carouselDot, { backgroundColor: i === bannerIdx ? colors.primary : colors.border }]} />
                ))}
              </View>
            )}
            <Text style={[styles.bannerUsername, { color: colors.primary, marginTop: 6, textAlign: "right" }]}>
              {user?.username ? `مرحباً، ${user.username}` : "مرحباً بك في المنصة"}
            </Text>
          </View>
        ) : (
          <LinearGradient colors={["#1e0850", "#0d0028"]} style={styles.welcomeBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.bannerDecorCircle1} />
            <View style={styles.bannerDecorCircle2} />
            <View style={styles.bannerDots}>
              {[0, 1, 2].map((i) => <View key={i} style={[styles.bannerDot, i === 0 ? { backgroundColor: "#7c3aed", width: 18 } : {}]} />)}
            </View>
            <View style={styles.bannerContent}>
              <View style={styles.bannerText}>
                <Text style={styles.bannerHello}>أهلاً بك 👋</Text>
                <Text style={styles.bannerSub}>اكتشف محتوى يناسبك</Text>
              </View>
              <View style={styles.bannerIconGroup}>
                <View style={[styles.bannerIconCircle, { backgroundColor: "#7c3aed33", borderColor: "#7c3aed44", borderWidth: 1 }]}>
                  <Text style={{ fontSize: 42 }}>👋</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.bannerUsername, { color: colors.primary }]}>
              {user?.username ? `مرحباً، ${user.username}` : "مرحباً بك في المنصة"}
            </Text>
          </LinearGradient>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>أدواتي التفاعلية</Text>
          </View>
          <View style={styles.toolsGrid}>
            {toolSlots.map((tool, i) =>
              tool ? <ToolCard key={tool.id} tool={tool} /> : <EmptyToolCard key={`empty-${i}`} />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>إحصائيات المنصة</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatCard icon="users" label="المستخدمين" value={(stats as any)?.totalUsers} color="#818cf8" />
            <StatCard icon="tool" label="الأدوات" value={(stats as any)?.totalTools} color="#34d399" />
            <StatCard icon="shield" label="موثوقة" value="98%" color="#4ade80" />
            <StatCard icon="clock" label="متاح دائماً" value="24/7" color="#fb923c" />
          </View>
        </View>
      </ScrollView>

      <ProfileDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onRecharge={() => { setMenuOpen(false); setTimeout(() => setRechargeOpen(true), 250); }}
        onNotifications={() => { setTimeout(() => router.push("/(tabs)/notifications"), 300); }}
      />

      <Modal visible={rechargeOpen} transparent animationType="slide" onRequestClose={closeRecharge}>
        <View style={rStyles.backdrop}>
          <View style={[rStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={rStyles.sheetHeader}>
              <TouchableOpacity onPress={closeRecharge} style={rStyles.closeBtn}>
                <Feather name="x" size={20} color="#94a3b8" />
              </TouchableOpacity>
              <Text style={rStyles.sheetTitle}>{rechargeStep === 1 ? "اختر طريقة الدفع" : "تأكيد التحويل"}</Text>
              {rechargeStep === 2 ? (
                <TouchableOpacity onPress={() => setRechargeStep(1)} style={rStyles.backBtn}>
                  <Feather name="arrow-right" size={20} color="#d4a017" />
                </TouchableOpacity>
              ) : <View style={{ width: 36 }} />}
            </View>

            {rechargeStep === 1 && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rStyles.step}>
                <Text style={rStyles.stepHint}>اختر المبلغ المراد شحنه</Text>
                <View style={rStyles.amountGrid}>
                  {[5, 10, 25, 50, 100, 200].map((amt) => (
                    <TouchableOpacity key={amt} style={[rStyles.amountBtn, selectedAmount === amt && rStyles.amountBtnSelected]} activeOpacity={0.8} onPress={() => setSelectedAmount(amt)}>
                      <Text style={[rStyles.amountText, selectedAmount === amt && rStyles.amountTextSelected]}>${amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={rStyles.separator2} />
                <Text style={rStyles.stepHint}>اختر وسيلة الدفع للمتابعة</Text>
                {PAYMENT_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt.key} style={[rStyles.methodBtn, { borderColor: opt.color + "60" }]} activeOpacity={0.85} onPress={() => { setPaymentMethod(opt.key); setRechargeStep(2); }}>
                    <View style={[rStyles.methodIcon, { backgroundColor: opt.color + "22" }]}>
                      <Feather name={opt.icon} size={22} color={opt.color} />
                    </View>
                    <Text style={[rStyles.methodLabel, { color: opt.color }]}>{opt.label}</Text>
                    <Feather name="chevron-left" size={18} color={opt.color + "88"} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {rechargeStep === 2 && selectedOption && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rStyles.step}>
                <View style={[rStyles.idCard, { borderColor: selectedOption.color + "55" }]}>
                  <Text style={rStyles.idCardTitle}>أرسل المبلغ إلى هذا المعرف</Text>
                  <View style={rStyles.idRow}>
                    <Text style={[rStyles.idValue, { color: selectedOption.color }]} selectable>{selectedOption.id}</Text>
                    <TouchableOpacity style={[rStyles.copyBtn, { backgroundColor: selectedOption.color + "22", borderColor: selectedOption.color + "44" }]} activeOpacity={0.8} onPress={() => { Clipboard.setString(selectedOption.id); Alert.alert("تم النسخ ✓", "تم نسخ معرف الدفع."); }}>
                      <Feather name="copy" size={15} color={selectedOption.color} />
                      <Text style={[rStyles.copyText, { color: selectedOption.color }]}>نسخ</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[rStyles.methodBadge, { backgroundColor: selectedOption.color + "22" }]}>
                    <Text style={[rStyles.methodBadgeText, { color: selectedOption.color }]}>{selectedOption.label}</Text>
                  </View>
                </View>
                <View style={rStyles.separator2} />
                <Text style={rStyles.fieldLabel}>معرف المعاملة (Transaction ID)</Text>
                <TextInput value={transactionId} onChangeText={setTransactionId} placeholder="أدخل معرف المعاملة بعد الإرسال" placeholderTextColor="#4b6280" style={rStyles.textInput} />
                <Text style={rStyles.fieldLabel}>صورة التحويل</Text>
                <TouchableOpacity style={rStyles.uploadBtn} activeOpacity={0.85} onPress={pickTransferImage}>
                  <Feather name="image" size={20} color={transferImage ? "#22d3ee" : "#64748b"} />
                  <Text style={[rStyles.uploadText, transferImage ? { color: "#22d3ee" } : {}]}>
                    {transferImage ? "تم اختيار الصورة — اضغط للتغيير" : "اضغط لاختيار صورة التحويل"}
                  </Text>
                </TouchableOpacity>
                {transferImage ? <Image source={{ uri: transferImage }} style={rStyles.previewImage} resizeMode="cover" /> : null}
                <TouchableOpacity style={[rStyles.submitBtn, submitting && { opacity: 0.6 }]} activeOpacity={0.85} onPress={submitRecharge} disabled={submitting}>
                  <Text style={rStyles.submitText}>{submitting ? "جاري الإرسال..." : "إرسال طلب الشحن"}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const rStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#0d0028", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: "rgba(124,58,237,0.3)", paddingHorizontal: 18, paddingTop: 8, maxHeight: "90%" },
  sheetHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(124,58,237,0.2)", marginBottom: 8 },
  sheetTitle: { fontFamily: "Cairo_700Bold", fontSize: 17, color: "#f8fafc", textAlign: "center", flex: 1 },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  step: { gap: 14, paddingBottom: 24 },
  stepHint: { fontFamily: "Cairo_400Regular", fontSize: 13, color: "#8b7bb8", textAlign: "center" },
  methodBtn: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 18, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 18, gap: 14 },
  methodIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  methodLabel: { flex: 1, fontFamily: "Cairo_700Bold", fontSize: 18, textAlign: "right" },
  idCard: { backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  idCardTitle: { fontFamily: "Cairo_600SemiBold", fontSize: 13, color: "#8b7bb8", textAlign: "right" },
  idRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  idValue: { flex: 1, fontFamily: "Cairo_700Bold", fontSize: 13, textAlign: "right" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  copyText: { fontFamily: "Cairo_600SemiBold", fontSize: 12 },
  methodBadge: { alignSelf: "flex-end", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  methodBadgeText: { fontFamily: "Cairo_700Bold", fontSize: 11 },
  separator2: { height: 1, backgroundColor: "rgba(124,58,237,0.2)" },
  fieldLabel: { fontFamily: "Cairo_600SemiBold", fontSize: 14, color: "#cbd5e1", textAlign: "right" },
  textInput: { backgroundColor: "rgba(124,58,237,0.08)", borderWidth: 1, borderColor: "rgba(124,58,237,0.25)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: "#f8fafc", textAlign: "right", fontFamily: "Cairo_400Regular", fontSize: 14 },
  uploadBtn: { flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: "rgba(124,58,237,0.08)", borderWidth: 1, borderColor: "rgba(124,58,237,0.25)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderStyle: "dashed" },
  uploadText: { fontFamily: "Cairo_400Regular", fontSize: 13, color: "#8b7bb8", flex: 1, textAlign: "right" },
  previewImage: { width: "100%", height: 160, borderRadius: 14 },
  submitBtn: { backgroundColor: "#d4a017", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  submitText: { fontFamily: "Cairo_700Bold", fontSize: 16, color: "#0a001a" },
  amountGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 },
  amountBtn: { width: "30%", paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(124,58,237,0.25)", backgroundColor: "rgba(124,58,237,0.08)", alignItems: "center" },
  amountBtnSelected: { borderColor: "#d4a017", backgroundColor: "rgba(212,160,23,0.15)" },
  amountText: { fontFamily: "Cairo_700Bold", fontSize: 16, color: "#8b7bb8" },
  amountTextSelected: { color: "#d4a017" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth },
  headerInner: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  titleWrap: { alignItems: "flex-end", gap: 2 },
  headerTitle: { fontFamily: "Cairo_700Bold", fontSize: 20 },
  headerSubtitle: { fontFamily: "Cairo_400Regular", fontSize: 12 },
  holdBar: { width: 120, height: 4, borderRadius: 999, borderWidth: 1, overflow: "hidden" },
  holdFill: { height: "100%" },
  menuBtn: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  menuBadge: { position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#d4a017", alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#0a001a" },
  menuBadgeText: { fontFamily: "Cairo_700Bold", fontSize: 10, color: "#0a001a", lineHeight: 14 },
  scrollContent: { paddingTop: 16, gap: 18 },
  welcomeBanner: { marginHorizontal: 16, borderRadius: 24, padding: 24, overflow: "hidden", minHeight: 170, justifyContent: "space-between", borderWidth: 1, borderColor: "rgba(124,58,237,0.3)" },
  bannerDecorCircle1: { position: "absolute", top: -30, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(124,58,237,0.2)" },
  bannerDecorCircle2: { position: "absolute", bottom: -20, right: 30, width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(14,165,233,0.15)" },
  bannerContent: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", flex: 1 },
  bannerText: { gap: 6, alignItems: "flex-end", flex: 1 },
  bannerHello: { fontFamily: "Cairo_700Bold", fontSize: 26, color: "#f8fafc" },
  bannerSub: { fontFamily: "Cairo_400Regular", fontSize: 14, color: "#c4b5fd" },
  bannerDots: { flexDirection: "row", gap: 5, marginBottom: 10 },
  bannerDot: { width: 8, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.2)" },
  bannerIconGroup: { alignItems: "center", justifyContent: "center", marginRight: 8 },
  bannerIconCircle: { width: 80, height: 80, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  bannerUsername: { fontFamily: "Cairo_700Bold", fontSize: 15, alignSelf: "flex-end" },
  carouselWrap: { gap: 8, paddingHorizontal: 16 },
  carouselDots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  carouselDot: { width: 8, height: 8, borderRadius: 4 },
  section: { paddingHorizontal: 16, gap: 10 },
  sectionHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  sectionBar: { width: 4, height: 22, borderRadius: 2 },
  sectionTitle: { fontFamily: "Cairo_700Bold", fontSize: 17 },
  toolsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 12 },
  toolCard: { width: "48%", borderRadius: 18, borderWidth: 1, padding: 14, gap: 10, overflow: "hidden", position: "relative", minHeight: 148 },
  toolCardGlow: { position: "absolute", top: -25, right: -25, width: 90, height: 90, borderRadius: 45 },
  toolSparkle1: { position: "absolute", top: 10, left: 14, fontSize: 9, opacity: 0.7 },
  toolSparkle2: { position: "absolute", bottom: 36, right: 8, fontSize: 7, opacity: 0.5 },
  toolCardIconWrap: { alignSelf: "flex-end" },
  toolCardIcon: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  toolCardImage: { width: 54, height: 54, borderRadius: 27 },
  toolCardLabel: { fontFamily: "Cairo_600SemiBold", fontSize: 14, textAlign: "right" },
  toolCardSub: { fontFamily: "Cairo_400Regular", fontSize: 11, textAlign: "right", marginTop: -4 },
  toolCardArrow: { alignSelf: "flex-start", width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row-reverse", gap: 8 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: "center", gap: 5, overflow: "hidden", position: "relative" },
  statCardBottomGlow: { position: "absolute", bottom: 0, left: 0, right: 0, height: 28, borderRadius: 14 },
  statCardValue: { fontFamily: "Cairo_700Bold", fontSize: 14 },
  statCardLabel: { fontFamily: "Cairo_400Regular", fontSize: 9 },
});
