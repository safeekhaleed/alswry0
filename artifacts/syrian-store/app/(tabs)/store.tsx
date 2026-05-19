import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { GoldenFrame } from "@/components/GoldenFrame";
import { useColors } from "@/hooks/useColors";

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

const PROD_API = "https://alsouri-maak-api.onrender.com";
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : Platform.OS !== "web" ? PROD_API : "";

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

  React.useEffect(() => { refetch(); }, []);
  return { data, isLoading, isError, refetch };
}

async function purchaseService(serviceId: number, note: string, token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/services/${serviceId}/purchase`, {
    method: "POST",
    headers,
    body: JSON.stringify({ note }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "خطأ غير معروف");
  return json as {
    success: boolean;
    cartItem: any;
    newBalance: number;
    content: string | null;
    contentType: string | null;
    serviceTitle: string;
    price: number;
  };
}

type PurchaseResult = Awaited<ReturnType<typeof purchaseService>>;

function ContentTypePill({ type, content }: { type: string | null; content: string | null }) {
  const colors = useColors();
  if (!content) return null;
  const isUrl = type === "link" || type === "app" || type === "video" || type === "file";
  if (isUrl) {
    return (
      <TouchableOpacity
        style={[mo.contentBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        onPress={() => Linking.openURL(content).catch(() => {})}
        activeOpacity={0.8}
      >
        <Feather name={type === "video" ? "video" : type === "file" ? "download" : "external-link"} size={16} color={colors.primary} />
        <Text style={[mo.contentText, { color: colors.primary }]} numberOfLines={2}>{content}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={[mo.contentBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <Feather name="file-text" size={16} color={colors.mutedForeground} />
      <Text style={[mo.contentText, { color: colors.foreground }]} selectable>{content}</Text>
    </View>
  );
}

function ServiceOrderModal({
  service,
  visible,
  onClose,
  onPurchased,
}: {
  service: Service | null;
  visible: boolean;
  onClose: () => void;
  onPurchased: (result: PurchaseResult) => void;
}) {
  const colors = useColors();
  const { user, refreshUser, token } = useAuth() as any;
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  const balance = Number(user?.balance ?? 0);
  const price = service?.price ?? 0;
  const canAfford = balance >= price;

  const handleClose = () => {
    setNote("");
    setResult(null);
    onClose();
  };

  const submit = async () => {
    if (!service) return;
    setSending(true);
    try {
      const res = await purchaseService(service.id, note, token);
      await refreshUser?.();
      setResult(res);
      onPurchased(res);
    } catch (e: any) {
      Alert.alert("خطأ في الشراء", e.message);
    } finally {
      setSending(false);
    }
  };

  if (!service) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={mo.backdrop}>
        <TouchableOpacity style={mo.overlay} activeOpacity={1} onPress={handleClose} />
        <View style={[mo.sheet, { backgroundColor: colors.card }]}>
          <View style={mo.handle} />
          <View style={mo.header}>
            <TouchableOpacity onPress={handleClose} style={mo.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[mo.title, { color: colors.foreground }]}>
              {result ? "تم الشراء بنجاح ✓" : "تأكيد الشراء"}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {result ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 28 }}>
              <View style={[mo.successBadge, { backgroundColor: "#34d39922" }]}>
                <Feather name="check-circle" size={32} color="#34d399" />
                <Text style={[mo.successTitle, { color: "#34d399" }]}>تمت عملية الشراء</Text>
                <Text style={[mo.successSub, { color: colors.mutedForeground }]}>
                  {result.price > 0 ? `تم خصم $${result.price} • رصيدك الآن: $${result.newBalance.toFixed(2)}` : "حصلت على الخدمة مجاناً"}
                </Text>
              </View>
              {result.content && (
                <>
                  <Text style={[mo.label, { color: colors.mutedForeground }]}>المحتوى المُسلَّم</Text>
                  <ContentTypePill type={result.contentType} content={result.content} />
                </>
              )}
              <TouchableOpacity style={[mo.submitBtn, { backgroundColor: colors.primary }]} onPress={handleClose} activeOpacity={0.85}>
                <Text style={[mo.submitText, { color: "#0f1624" }]}>حسناً</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
              <View style={mo.serviceInfo}>
                <View style={[mo.iconBox, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name="package" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[mo.serviceName, { color: colors.foreground }]}>{service.title}</Text>
                  <Text style={[mo.serviceDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{service.description}</Text>
                </View>
                <View style={[mo.pricePill, { backgroundColor: price === 0 ? "#34d39922" : colors.primary }]}>
                  <Text style={[mo.priceText, { color: price === 0 ? "#34d399" : "#0f1624" }]}>
                    {price === 0 ? "مجاني" : `$${price}`}
                  </Text>
                </View>
              </View>

              <View style={[mo.balanceRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[mo.balanceLabel, { color: colors.mutedForeground }]}>رصيدك الحالي</Text>
                <Text style={[mo.balanceValue, { color: canAfford || price === 0 ? "#34d399" : "#ef4444" }]}>${balance.toFixed(2)}</Text>
              </View>

              {price > 0 && !canAfford && (
                <View style={[mo.warningBox, { backgroundColor: "#ef444415", borderColor: "#ef444430" }]}>
                  <Feather name="alert-circle" size={16} color="#ef4444" />
                  <Text style={[mo.warningText, { color: "#ef4444" }]}>
                    رصيدك غير كافٍ. تحتاج ${(price - balance).toFixed(2)} إضافية.
                  </Text>
                </View>
              )}

              {(price === 0 || canAfford) && (
                <>
                  <Text style={[mo.label, { color: colors.mutedForeground, marginTop: 14 }]}>ملاحظة (اختياري)</Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="أضف ملاحظة أو تفاصيل إضافية..."
                    placeholderTextColor={colors.mutedForeground}
                    style={[mo.input, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
                    multiline
                    numberOfLines={3}
                    textAlign="right"
                  />
                </>
              )}

              <TouchableOpacity
                style={[mo.submitBtn, { backgroundColor: price > 0 && !canAfford ? colors.border : colors.primary, marginTop: 14 }, (sending || (price > 0 && !canAfford)) && { opacity: 0.7 }]}
                onPress={price > 0 && !canAfford ? undefined : submit}
                disabled={sending || (price > 0 && !canAfford)}
                activeOpacity={0.85}
              >
                <Feather name={price === 0 ? "gift" : "credit-card"} size={16} color={price > 0 && !canAfford ? colors.mutedForeground : "#0f1624"} />
                <Text style={[mo.submitText, { color: price > 0 && !canAfford ? colors.mutedForeground : "#0f1624" }]}>
                  {sending ? "جاري المعالجة..." : price === 0 ? "احصل عليها مجاناً" : !canAfford ? "رصيد غير كافٍ" : `شراء مقابل $${price}`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const mo = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  overlay: { flex: 1 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingBottom: 8, maxHeight: "85%" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#2d4a6a", alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, marginBottom: 12 },
  title: { fontFamily: "Cairo_700Bold", fontSize: 17, flex: 1, textAlign: "center" },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  serviceInfo: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12, marginBottom: 14, padding: 12, borderRadius: 14, backgroundColor: "rgba(124,58,237,0.08)" },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  serviceName: { fontFamily: "Cairo_700Bold", fontSize: 15, textAlign: "right" },
  serviceDesc: { fontFamily: "Cairo_400Regular", fontSize: 12, textAlign: "right" },
  pricePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  priceText: { fontFamily: "Cairo_700Bold", fontSize: 13 },
  balanceRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  balanceLabel: { fontFamily: "Cairo_400Regular", fontSize: 13 },
  balanceValue: { fontFamily: "Cairo_700Bold", fontSize: 16 },
  warningBox: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 10 },
  warningText: { fontFamily: "Cairo_400Regular", fontSize: 12, textAlign: "right", flex: 1 },
  label: { fontFamily: "Cairo_600SemiBold", fontSize: 13, textAlign: "right", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Cairo_400Regular", fontSize: 14, marginBottom: 6, minHeight: 80, textAlignVertical: "top" },
  submitBtn: { flexDirection: "row-reverse", borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { fontFamily: "Cairo_700Bold", fontSize: 15 },
  successBadge: { alignItems: "center", borderRadius: 18, padding: 20, gap: 8 },
  successTitle: { fontFamily: "Cairo_700Bold", fontSize: 18 },
  successSub: { fontFamily: "Cairo_400Regular", fontSize: 13, textAlign: "center" },
  contentBox: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  contentText: { fontFamily: "Cairo_400Regular", fontSize: 13, flex: 1, textAlign: "right" },
});

function ServiceCard({ service, onOrder }: { service: Service; onOrder: (s: Service) => void }) {
  const colors = useColors();
  return (
    <GoldenFrame radius={16}>
      <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 0 }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="package" size={20} color={colors.primary} />
          </View>
          <View style={[styles.priceBadge, { backgroundColor: service.isAvailable ? (service.price === 0 ? "#34d39922" : colors.primary) : colors.border }]}>
            <Text style={[styles.priceText, { color: service.isAvailable ? (service.price === 0 ? "#34d399" : "#0f1624") : colors.mutedForeground }]}>
              {service.price === 0 ? "مجاني" : `$${service.price}`}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{service.title}</Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={3}>{service.description}</Text>
        <View style={styles.cardFooter}>
          <View style={[styles.categoryChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>{service.category}</Text>
          </View>
          <View style={[styles.availBadge, { backgroundColor: service.isAvailable ? "#34d39922" : "#ef444422" }]}>
            <View style={[styles.availDot, { backgroundColor: service.isAvailable ? "#34d399" : "#ef4444" }]} />
            <Text style={[styles.availText, { color: service.isAvailable ? "#34d399" : "#ef4444" }]}>
              {service.isAvailable ? "متاح" : "غير متاح"}
            </Text>
          </View>
        </View>
        {service.isAvailable && (
          <TouchableOpacity
            style={[styles.orderBtn, { backgroundColor: service.price === 0 ? "#34d39922" : colors.primary, borderWidth: service.price === 0 ? 1 : 0, borderColor: "#34d39944" }]}
            activeOpacity={0.85}
            onPress={() => onOrder(service)}
          >
            <Feather name={service.price === 0 ? "gift" : "credit-card"} size={15} color={service.price === 0 ? "#34d399" : "#0f1624"} />
            <Text style={[styles.orderBtnText, { color: service.price === 0 ? "#34d399" : "#0f1624" }]}>
              {service.price === 0 ? "احصل مجاناً" : `شراء $${service.price}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </GoldenFrame>
  );
}

export default function StoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { data: services, isLoading, isError, refetch } = useListServices();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const handleOrder = (service: Service) => {
    setSelectedService(service);
    setOrderModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerInner}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>المتجر</Text>
          <View style={[styles.headerIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shopping-bag" size={18} color={colors.primary} />
          </View>
        </View>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>اشترِ الخدمات مباشرةً بالرصيد</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: isWeb ? 34 + 84 : 110 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {isLoading && (
          <View style={styles.centerMsg}>
            <Text style={[styles.centerText, { color: colors.mutedForeground }]}>جاري التحميل...</Text>
          </View>
        )}
        {isError && (
          <View style={styles.centerMsg}>
            <Feather name="alert-circle" size={32} color="#ef4444" />
            <Text style={[styles.centerText, { color: "#ef4444" }]}>فشل التحميل</Text>
            <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.retryText, { color: "#0f1624" }]}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isLoading && !isError && (!services || services.length === 0) && (
          <View style={styles.centerMsg}>
            <Feather name="shopping-bag" size={40} color={colors.mutedForeground} />
            <Text style={[styles.centerText, { color: colors.mutedForeground }]}>لا توجد خدمات متاحة</Text>
          </View>
        )}
        {services?.map((service) => (
          <ServiceCard key={service.id} service={service} onOrder={handleOrder} />
        ))}
      </ScrollView>

      <ServiceOrderModal
        service={selectedService}
        visible={orderModalVisible}
        onClose={() => setOrderModalVisible(false)}
        onPurchased={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingBottom: 12 },
  headerInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  headerTitle: { fontFamily: "Cairo_700Bold", fontSize: 20 },
  headerIcon: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerSub: { fontFamily: "Cairo_400Regular", fontSize: 13, textAlign: "right", marginBottom: 4 },
  scrollContent: { padding: 16, gap: 12 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  priceBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  priceText: { fontFamily: "Cairo_700Bold", fontSize: 14 },
  cardTitle: { fontFamily: "Cairo_700Bold", fontSize: 16, textAlign: "right" },
  cardDesc: { fontFamily: "Cairo_400Regular", fontSize: 13, textAlign: "right", lineHeight: 20 },
  cardFooter: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  categoryChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontFamily: "Cairo_400Regular", fontSize: 12 },
  availBadge: { flexDirection: "row-reverse", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontFamily: "Cairo_600SemiBold", fontSize: 12 },
  orderBtn: { borderRadius: 12, paddingVertical: 11, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 8, marginTop: 4 },
  orderBtnText: { fontFamily: "Cairo_700Bold", fontSize: 14 },
  centerMsg: { alignItems: "center", paddingVertical: 60, gap: 12 },
  centerText: { fontFamily: "Cairo_400Regular", fontSize: 15 },
  retryBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  retryText: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
});
