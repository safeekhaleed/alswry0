import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

type TabKey = "overview" | "users" | "notifications" | "lessons" | "tools" | "services" | "banners" | "recharge";
type EditType = "user" | "lesson" | "tool" | "service";
type EditState = { type: EditType | null; item: any };
type ContentTypeKey = "link" | "app" | "file" | "text" | "video";

const CONTENT_TYPES: ContentTypeKey[] = ["link", "app", "file", "text", "video"];
const CT_LABELS: Record<ContentTypeKey, string> = { link: "رابط", app: "تطبيق", file: "ملف", text: "نص", video: "فيديو" };

function StatCard({ icon, label, value, color }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; value: React.ReactNode; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value ?? "—"}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function EditDialog({ visible, title, onClose, onSave, fields, submitLabel }: {
  visible: boolean; title: string; onClose: () => void; onSave: () => void;
  fields: React.ReactNode; submitLabel: string;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
            {fields}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSave} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.modalBtnText, { color: "#0f1624" }]}>{submitLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const { logout, isAdmin, isLoading: authLoading, token } = useAuth();
  const apiBase = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  const apiFetch = React.useCallback((url: string, opts: RequestInit = {}) => {
    const hdrs: Record<string, string> = {
      ...(opts.headers as Record<string, string> ?? {}),
    };
    if (!hdrs["Content-Type"] && opts.body) hdrs["Content-Type"] = "application/json";
    if (token) hdrs["Authorization"] = `Bearer ${token}`;
    return fetch(url, { ...opts, headers: hdrs });
  }, [token]);

  const [tab, setTab] = useState<TabKey>("overview");
  const [refreshing, setRefreshing] = useState(false);

  const [edit, setEdit] = useState<EditState>({ type: null, item: null });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [extra1, setExtra1] = useState("");
  const [extra2, setExtra2] = useState("");
  const [flag, setFlag] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState("");
  const [price, setPrice] = useState("");
  const [color, setColor] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [editContentType, setEditContentType] = useState<ContentTypeKey>("link");

  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addImageUrl, setAddImageUrl] = useState("");
  const [addContent, setAddContent] = useState("");
  const [addContentType, setAddContentType] = useState<ContentTypeKey>("link");
  const [addPrice, setAddPrice] = useState("");
  const [addColor, setAddColor] = useState("#d4a017");
  const [addIsActive, setAddIsActive] = useState(true);
  const [addDuration, setAddDuration] = useState("");
  const [addVideoUrl, setAddVideoUrl] = useState("");
  const [addFileUploading, setAddFileUploading] = useState(false);

  const [banners, setBanners] = useState<any[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [bannerOrder, setBannerOrder] = useState("0");
  const [bannerUploading, setBannerUploading] = useState(false);

  const [showCharge, setShowCharge] = useState(false);
  const [chargeUserId, setChargeUserId] = useState<number | null>(null);
  const [chargeUserName, setChargeUserName] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeNote, setChargeNote] = useState("");

  const [showNotify, setShowNotify] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  const [notifyUserId, setNotifyUserId] = useState<number | null>(null);

  type SentLogItem = { id: number; title: string; message: string; type: string; recipientCount: number; sentAt: string };
  const [sentLog, setSentLog] = useState<SentLogItem[]>([]);
  const [sentLogLoading, setSentLogLoading] = useState(false);

  type RechargeItem = { id: number; username: string; paymentMethod: string; transactionId: string; transferImageUrl: string; amount?: number; status: string; createdAt: string };
  const [rechargeRequests, setRechargeRequests] = useState<RechargeItem[]>([]);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [cardImageUploading, setCardImageUploading] = useState(false);

  const [secretVisible, setSecretVisible] = useState(false);
  const [secretProgress, setSecretProgress] = useState(0);
  const [holdTimer, setHoldTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [holdInterval, setHoldInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[] | undefined>(undefined);
  const [tools, setTools] = useState<any[] | undefined>(undefined);
  const [lessons, setLessons] = useState<any[] | undefined>(undefined);
  const [services, setServices] = useState<any[] | undefined>(undefined);

  const refetchStats = async () => {
    try { const r = await apiFetch(`${apiBase}/api/stats`); if (r.ok) setStats(await r.json()); } catch { }
  };
  const refetchUsers = async () => {
    try { const r = await apiFetch(`${apiBase}/api/users`); if (r.ok) setUsers(await r.json()); } catch { }
  };
  const refetchTools = async () => {
    try { const r = await apiFetch(`${apiBase}/api/tools`); if (r.ok) setTools(await r.json()); } catch { }
  };
  const refetchLessons = async () => {
    try { const r = await apiFetch(`${apiBase}/api/lessons`); if (r.ok) setLessons(await r.json()); } catch { }
  };
  const refetchServices = async () => {
    try { const r = await apiFetch(`${apiBase}/api/services`); if (r.ok) setServices(await r.json()); } catch { }
  };

  useEffect(() => { refetchStats(); refetchUsers(); refetchTools(); refetchLessons(); refetchServices(); }, []);

  const makeDel = (endpoint: string) => ({
    mutate: (args: { id: number }, opts: { onSuccess: () => void }) => {
      apiFetch(`${apiBase}/api/${endpoint}/${args.id}`, { method: "DELETE" }).then(() => opts.onSuccess());
    }
  });
  const deleteUser = makeDel("users");
  const deleteLesson = makeDel("lessons");
  const deleteTool = makeDel("tools");
  const deleteService = makeDel("services");

  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/api/banners/all`);
      if (res.ok) setBanners(await res.json());
    } finally { setBannersLoading(false); }
  };
  useEffect(() => { if (tab === "banners") fetchBanners(); }, [tab]);

  const fetchRechargeRequests = async () => {
    setRechargeLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/api/recharge`);
      if (res.ok) setRechargeRequests(await res.json());
    } catch { } finally { setRechargeLoading(false); }
  };
  useEffect(() => { if (tab === "recharge") fetchRechargeRequests(); }, [tab]);

  const fetchSentLog = async () => {
    setSentLogLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/api/notifications/log`);
      if (res.ok) setSentLog(await res.json());
    } catch { } finally { setSentLogLoading(false); }
  };
  useEffect(() => { if (tab === "notifications") fetchSentLog(); }, [tab]);

  const handleRechargeStatus = async (id: number, status: "approved" | "rejected") => {
    const res = await apiFetch(`${apiBase}/api/recharge/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchRechargeRequests();
    else Alert.alert("خطأ", "فشلت العملية");
  };

  const onRefresh = () => {
    setRefreshing(true);
    const tasks: Promise<unknown>[] = [refetchStats(), refetchUsers(), refetchLessons(), refetchTools(), refetchServices()];
    if (tab === "banners") tasks.push(fetchBanners());
    if (tab === "notifications") tasks.push(fetchSentLog());
    if (tab === "recharge") tasks.push(fetchRechargeRequests());
    Promise.all(tasks).finally(() => setRefreshing(false));
  };

  const pickCardImage = async (setter: (url: string) => void) => {
    if (Platform.OS === "web") return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى الصور."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    setCardImageUploading(true);
    try {
      const res = await apiFetch(`${apiBase}/api/upload`, { method: "POST", body: JSON.stringify({ base64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "خطأ في الرفع");
      setter(json.url);
    } catch (e: any) { Alert.alert("خطأ", "فشل رفع الصورة: " + e.message); }
    finally { setCardImageUploading(false); }
  };

  const pickBannerImage = async () => {
    if (Platform.OS === "web") return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى الصور."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    setBannerUploading(true);
    try {
      const res = await apiFetch(`${apiBase}/api/upload`, { method: "POST", body: JSON.stringify({ base64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "خطأ في الرفع");
      setBannerImageUrl(json.url);
    } catch (e: any) { Alert.alert("خطأ", "فشل رفع الصورة: " + e.message); }
    finally { setBannerUploading(false); }
  };

  const pickToolFile = async () => {
    if (Platform.OS === "web") return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/plain", "text/x-python", "application/vnd.android.package-archive", "*/*"], copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      setAddFileUploading(true);
      const FileSystem = await import("expo-file-system/legacy");
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: "base64" });
      const res = await apiFetch(`${apiBase}/api/upload`, { method: "POST", body: JSON.stringify({ base64, mimeType: asset.mimeType ?? "application/octet-stream" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "خطأ في الرفع");
      setAddContent(json.url);
      Alert.alert("تم ✓", `تم رفع الملف: ${asset.name}`);
    } catch (e: any) { Alert.alert("خطأ", "فشل رفع الملف: " + e.message); }
    finally { setAddFileUploading(false); }
  };

  const pickLessonVideo = async () => {
    if (Platform.OS === "web") return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى مكتبة الوسائط."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, allowsEditing: false, quality: 1, base64: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) { Alert.alert("تنبيه", "حجم الفيديو كبير جداً (الحد الأقصى 50 ميجابايت). استخدم رابطاً خارجياً."); return; }
      setAddFileUploading(true);
      const FileSystem = await import("expo-file-system/legacy");
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: "base64" });
      const res = await apiFetch(`${apiBase}/api/upload`, { method: "POST", body: JSON.stringify({ base64, mimeType: asset.mimeType ?? "video/mp4" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAddVideoUrl(json.url);
      Alert.alert("تم ✓", "تم رفع الفيديو بنجاح");
    } catch (e: any) { Alert.alert("خطأ", "فشل رفع الفيديو: " + e.message); }
    finally { setAddFileUploading(false); }
  };

  const saveBanner = async () => {
    if (!bannerImageUrl.trim()) { Alert.alert("مطلوب", "أدخل رابط الصورة"); return; }
    try {
      const res = await apiFetch(`${apiBase}/api/banners`, { method: "POST", body: JSON.stringify({ imageUrl: bannerImageUrl, title: bannerTitle || null, linkUrl: bannerLinkUrl || null, sortOrder: Number(bannerOrder || 0) }) });
      if (!res.ok) { Alert.alert("خطأ", "فشل الإضافة"); return; }
      await fetchBanners();
      setShowAddBanner(false);
      setBannerImageUrl(""); setBannerTitle(""); setBannerLinkUrl(""); setBannerOrder("0");
    } catch (e: any) { Alert.alert("خطأ", e.message); }
  };

  const deleteBanner = (id: number) => {
    Alert.alert("تأكيد الحذف", "هل تريد حذف هذا البانر؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: async () => { await apiFetch(`${apiBase}/api/banners/${id}`, { method: "DELETE" }); await fetchBanners(); } },
    ]);
  };

  const toggleBannerActive = async (id: number, current: boolean) => {
    await apiFetch(`${apiBase}/api/banners/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !current }) });
    await fetchBanners();
  };

  const openCharge = (userId: number, userName: string, _currentBalance: string) => {
    setChargeUserId(userId); setChargeUserName(userName); setChargeAmount(""); setChargeNote(""); setShowCharge(true);
  };

  const saveCharge = async () => {
    if (!chargeUserId || !chargeAmount.trim()) { Alert.alert("مطلوب", "أدخل مبلغ الشحن"); return; }
    try {
      const userRow = users?.find((u) => u.id === chargeUserId);
      const current = Number(userRow?.balance ?? 0);
      const added = Number(chargeAmount);
      if (isNaN(added) || added <= 0) { Alert.alert("خطأ", "أدخل مبلغاً صحيحاً"); return; }
      const newBalance = current + added;
      const res = await apiFetch(`${apiBase}/api/users/${chargeUserId}`, { method: "PATCH", body: JSON.stringify({ balance: newBalance }) });
      if (!res.ok) { Alert.alert("خطأ", "فشل شحن الرصيد"); return; }
      if (chargeNote.trim()) {
        await apiFetch(`${apiBase}/api/notifications/send`, { method: "POST", body: JSON.stringify({ title: "تم شحن رصيدك ✅", message: chargeNote.trim() || `تمت إضافة ${added} إلى رصيدك. الرصيد الحالي: ${newBalance}`, type: "recharge_approved", targetUserId: chargeUserId }) });
      }
      await Promise.all([refetchUsers(), refetchStats()]);
      setShowCharge(false);
      Alert.alert("تم ✅", `تم شحن ${added} لـ ${chargeUserName}`);
    } catch (e: any) { Alert.alert("خطأ", e.message); }
  };

  const openNotify = (userId?: number) => {
    setNotifyUserId(userId ?? null); setNotifyTitle(""); setNotifyBody(""); setShowNotify(true);
  };

  const sendNotification = async () => {
    if (!notifyTitle.trim()) { Alert.alert("مطلوب", "أدخل عنوان الإشعار"); return; }
    try {
      if (notifyUserId) {
        const res = await apiFetch(`${apiBase}/api/notifications/send`, { method: "POST", body: JSON.stringify({ title: notifyTitle, message: notifyBody, type: "admin_message", targetUserId: notifyUserId }) });
        if (!res.ok) { Alert.alert("خطأ", "فشل الإرسال"); return; }
      } else {
        const res = await apiFetch(`${apiBase}/api/notifications/send`, { method: "POST", body: JSON.stringify({ title: notifyTitle, message: notifyBody, type: "app_update" }) });
        if (!res.ok) { Alert.alert("خطأ", "فشل الإرسال الجماعي"); return; }
      }
      setShowNotify(false); fetchSentLog();
      Alert.alert("تم ✅", notifyUserId ? "تم إرسال الإشعار" : "تم إرسال الإشعار لجميع المستخدمين");
    } catch (e: any) { Alert.alert("خطأ", e.message); }
  };

  const handleDelete = (id: number, label: string, mutation: { mutate: (args: { id: number }, opts: { onSuccess: () => void }) => void }, refetch: () => void) => {
    Alert.alert("تأكيد الحذف", `هل أنت متأكد من حذف "${label}"؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => mutation.mutate({ id }, { onSuccess: refetch }) },
    ]);
  };

  const startSecretHold = () => {
    if (secretVisible) return;
    setSecretProgress(0);
    let elapsed = 0;
    const interval = setInterval(() => { elapsed += 250; setSecretProgress(Math.min(elapsed / 7000, 1)); }, 250);
    const timer = setTimeout(() => { clearInterval(interval); setSecretVisible(true); setSecretProgress(1); }, 7000);
    setHoldInterval(interval); setHoldTimer(timer);
  };

  const cancelSecretHold = () => {
    if (holdTimer) clearTimeout(holdTimer);
    if (holdInterval) clearInterval(holdInterval);
    setHoldTimer(null); setHoldInterval(null);
    if (!secretVisible) setSecretProgress(0);
  };

  const closeEdit = () => setEdit({ type: null, item: null });

  const openEditor = (type: EditType, item: any) => {
    setEdit({ type, item });
    setTitle(item?.title ?? item?.username ?? "");
    setDescription(item?.description ?? "");
    setCategory(item?.category ?? "");
    setExtra1(String(item?.duration ?? item?.balance ?? item?.price ?? ""));
    setExtra2(item?.videoUrl ?? item?.avatarUrl ?? "");
    setFlag(Boolean(item?.isPublished ?? item?.isActive ?? item?.isVip ?? item?.isAvailable));
    setName(item?.username ?? "");
    setEmail(item?.email ?? "");
    setBalance(String(item?.balance ?? 0));
    setPrice(String(item?.price ?? 0));
    setColor(item?.color ?? "#d4a017");
    setUrl(item?.url ?? "");
    setIconUrl(item?.iconUrl ?? "");
    setImageUrl(item?.imageUrl ?? "");
    setContent(item?.content ?? "");
    setEditContentType((item?.contentType as ContentTypeKey) ?? "link");
  };

  const saveEdit = async () => {
    if (!edit.type || !edit.item?.id) return;
    const id = edit.item.id;
    const body = edit.type === "user"
      ? { username: name, email, balance: Number(balance || 0), isVip: flag }
      : edit.type === "lesson"
        ? { title, description, category, duration: Number(extra1 || 0), isPublished: flag, videoUrl: extra2 || null, imageUrl: imageUrl || null, content: content || null, contentType: editContentType || null }
        : edit.type === "tool"
          ? { title, description, category, color: color || "#d4a017", url: url || null, iconUrl: iconUrl || null, imageUrl: imageUrl || null, content: content || null, contentType: editContentType || null, isActive: flag }
          : { title, description, category, price: Number(price || 0), url: url || null, iconUrl: iconUrl || null, imageUrl: imageUrl || null, content: content || null, contentType: editContentType || null, isAvailable: flag };
    const endpoint = edit.type === "user" ? "users" : edit.type === "lesson" ? "lessons" : edit.type === "tool" ? "tools" : "services";
    const res = await apiFetch(`${apiBase}/api/${endpoint}/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) { Alert.alert("خطأ", "فشل التحديث"); return; }
    await Promise.all([refetchStats(), refetchUsers(), refetchLessons(), refetchTools(), refetchServices()]);
    closeEdit();
  };

  const openAdd = () => {
    setAddTitle(""); setAddDescription(""); setAddCategory(""); setAddUrl(""); setAddImageUrl(""); setAddContent("");
    setAddPrice(""); setAddColor("#d4a017"); setAddIsActive(true); setAddContentType("link"); setAddDuration(""); setAddVideoUrl("");
    setShowAdd(true);
  };

  const saveAdd = async () => {
    if (tab !== "banners" && !addTitle.trim()) { Alert.alert("مطلوب", "أدخل اسم المنتج"); return; }
    try {
      if (tab === "tools") {
        const finalContent = addContentType === "video" ? (addVideoUrl || addContent) : addContent;
        const res = await apiFetch(`${apiBase}/api/tools`, { method: "POST", body: JSON.stringify({ title: addTitle, description: addDescription || " ", category: addCategory || "عام", color: addColor || "#d4a017", url: addUrl || null, imageUrl: addImageUrl || null, content: finalContent || null, contentType: addContentType || null, isActive: addIsActive }) });
        if (!res.ok) { Alert.alert("خطأ", "فشل الإضافة"); return; }
        await refetchTools();
      } else if (tab === "services") {
        const finalContent = addContentType === "video" ? (addVideoUrl || addContent) : addContent;
        const res = await apiFetch(`${apiBase}/api/services`, { method: "POST", body: JSON.stringify({ title: addTitle, description: addDescription || " ", category: addCategory || "عام", price: Number(addPrice || 0), url: addUrl || null, imageUrl: addImageUrl || null, content: finalContent || null, contentType: addContentType || null, isAvailable: addIsActive }) });
        if (!res.ok) { Alert.alert("خطأ", "فشل الإضافة"); return; }
        await refetchServices();
      } else if (tab === "lessons") {
        const finalContent = addContentType === "video" ? (addVideoUrl || addContent) : addContent;
        const res = await apiFetch(`${apiBase}/api/lessons`, { method: "POST", body: JSON.stringify({ title: addTitle, description: addDescription || " ", category: addCategory || "عام", price: Number(addPrice || 0), duration: Number(addDuration || 0), videoUrl: addVideoUrl || null, imageUrl: addImageUrl || null, content: finalContent || null, contentType: addContentType || null, isPublished: addIsActive }) });
        if (!res.ok) { Alert.alert("خطأ", "فشل الإضافة"); return; }
        await refetchLessons();
      }
      await refetchStats();
      setShowAdd(false);
    } catch (e: any) { Alert.alert("خطأ", e.message); }
  };

  if (authLoading) {
    return <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={48} color="#ef4444" />
        <Text style={[styles.errorText, { color: colors.foreground }]}>غير مصرح بالوصول</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.replace("/(tabs)")}>
          <Text style={[styles.backBtnText, { color: "#0f1624" }]}>العودة للتطبيق</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ContentTypePicker = ({ value, onChange }: { value: ContentTypeKey; onChange: (v: ContentTypeKey) => void }) => (
    <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
      {CONTENT_TYPES.map((ct) => (
        <TouchableOpacity key={ct} onPress={() => onChange(ct)} activeOpacity={0.8}
          style={[styles.ctBtn, { backgroundColor: value === ct ? colors.primary : colors.secondary, borderColor: value === ct ? colors.primary : colors.border }]}>
          <Text style={{ fontFamily: "Cairo_600SemiBold", fontSize: 12, color: value === ct ? "#0f1624" : colors.foreground }}>{CT_LABELS[ct]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const inputStyle = [styles.input, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={[styles.headerBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="arrow-right" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onLongPress={startSecretHold} onPressOut={cancelSecretHold} delayLongPress={7000} style={styles.titleWrap} activeOpacity={0.9}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>السوري معك</Text>
            {secretProgress > 0 && (
              <View style={[styles.holdBar, { borderColor: colors.border }]}>
                <View style={[styles.holdFill, { width: `${Math.round(secretProgress * 100)}%` as any, backgroundColor: colors.primary }]} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { logout().then(() => router.replace("/login")); }} style={[styles.headerBtn, { backgroundColor: "#ef44441a", borderColor: "#ef444430" }]}>
            <Feather name="log-out" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {(["overview", "users", "notifications", "lessons", "tools", "services", "banners", "recharge"] as TabKey[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && { backgroundColor: colors.primary }]} onPress={() => setTab(t)} activeOpacity={0.8}>
              <Text style={[styles.tabBtnText, { color: tab === t ? "#0f1624" : colors.mutedForeground }]}>
                {t === "overview" ? "نظرة عامة" : t === "users" ? "المستخدمون" : t === "notifications" ? "الإشعارات" : t === "lessons" ? "الدروس" : t === "tools" ? "الأدوات" : t === "services" ? "الخدمات" : t === "banners" ? "البنرات" : "شحن الرصيد"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: isWeb ? 40 : 60 }]} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

        {tab === "overview" && (
          <View style={{ gap: 12 }}>
            <View style={styles.grid2}>
              <StatCard icon="users" label="المستخدمون" value={stats?.totalUsers} color="#60a5fa" />
              <StatCard icon="book-open" label="الدروس" value={stats?.totalLessons} color="#34d399" />
              <StatCard icon="tool" label="الأدوات" value={stats?.totalTools} color="#a78bfa" />
              <StatCard icon="briefcase" label="الخدمات" value={stats?.totalServices} color={colors.primary} />
            </View>
            <TouchableOpacity onPress={() => openNotify()} style={[styles.actionCard, { backgroundColor: "#3b82f622", borderColor: "#3b82f644" }]} activeOpacity={0.8}>
              <Feather name="bell" size={20} color="#60a5fa" />
              <Text style={[styles.actionCardText, { color: "#60a5fa" }]}>إرسال إشعار لجميع المستخدمين</Text>
              <Feather name="chevron-left" size={18} color="#60a5fa88" />
            </TouchableOpacity>
          </View>
        )}

        {tab === "users" && (
          <View style={styles.listSection}>
            {users?.map((u) => (
              <View key={u.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.listItemMain}>
                  <Text style={[styles.listItemTitle, { color: colors.foreground }]}>{u.username}</Text>
                  <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>{u.email}</Text>
                  <View style={{ flexDirection: "row-reverse", gap: 6, flexWrap: "wrap" }}>
                    {u.isVip && <View style={[styles.badge, { backgroundColor: colors.primary + "22" }]}><Text style={[styles.badgeText, { color: colors.primary }]}>VIP</Text></View>}
                    <View style={[styles.badge, { backgroundColor: "#34d39922" }]}><Text style={[styles.badgeText, { color: "#34d399" }]}>💰 {u.balance}</Text></View>
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openCharge(u.id, u.username, String(u.balance))} style={[styles.chargeBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}><Feather name="plus-circle" size={16} color={colors.primary} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => openNotify(u.id)} style={[styles.notifyBtn, { backgroundColor: "#3b82f622", borderColor: "#3b82f644" }]}><Feather name="bell" size={16} color="#60a5fa" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => openEditor("user", u)} style={styles.editBtn}><Feather name="edit-2" size={16} color={colors.foreground} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(u.id, u.username, deleteUser, refetchUsers)} style={styles.deleteBtn}><Feather name="trash-2" size={16} color="#ef4444" /></TouchableOpacity>
                </View>
              </View>
            ))}
            {(!users || users.length === 0) && <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا يوجد مستخدمون حتى الآن</Text>}
          </View>
        )}

        {tab === "notifications" && (
          <View style={{ gap: 16 }}>
            <View style={[styles.notifSection, { backgroundColor: colors.card, borderColor: "#3b82f644" }]}>
              <View style={styles.notifSectionHeader}>
                <Feather name="radio" size={18} color="#60a5fa" />
                <Text style={[styles.notifSectionTitle, { color: "#60a5fa" }]}>بث لجميع المستخدمين</Text>
              </View>
              <TextInput value={notifyTitle} onChangeText={setNotifyTitle} placeholder="عنوان الإشعار *" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
              <TextInput value={notifyBody} onChangeText={setNotifyBody} placeholder="نص الإشعار (اختياري)" placeholderTextColor={colors.mutedForeground} style={[inputStyle, { minHeight: 70, textAlignVertical: "top" }]} multiline />
              <TouchableOpacity onPress={async () => {
                if (!notifyTitle.trim()) { Alert.alert("مطلوب", "أدخل عنوان الإشعار"); return; }
                try {
                  const res = await apiFetch(`${apiBase}/api/notifications/send`, { method: "POST", body: JSON.stringify({ title: notifyTitle, message: notifyBody, type: "app_update" }) });
                  if (!res.ok) { Alert.alert("خطأ", "فشل الإرسال الجماعي"); return; }
                  const json = await res.json();
                  setNotifyTitle(""); setNotifyBody(""); fetchSentLog();
                  Alert.alert("تم ✅", `تم إرسال الإشعار لـ ${json.sent ?? 0} مستخدم`);
                } catch (e: any) { Alert.alert("خطأ", e.message); }
              }} style={[styles.notifSendBtn, { backgroundColor: "#3b82f6" }]} activeOpacity={0.8}>
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.notifSendBtnText}>إرسال للجميع</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.notifSubTitle, { color: colors.mutedForeground }]}>أو أرسل لمستخدم محدد</Text>
            <View style={styles.listSection}>
              {users?.map((u) => (
                <View key={u.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.listItemMain}>
                    <Text style={[styles.listItemTitle, { color: colors.foreground }]}>{u.username}</Text>
                    <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>{u.email}</Text>
                    {(u as any).pushToken ? (
                      <View style={[styles.badge, { backgroundColor: "#34d39922" }]}><Text style={[styles.badgeText, { color: "#34d399" }]}>جهاز مُسجَّل</Text></View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: colors.secondary }]}><Text style={[styles.badgeText, { color: colors.mutedForeground }]}>بدون جهاز</Text></View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => openNotify(u.id)} style={[styles.notifyBtn, { backgroundColor: "#3b82f622", borderColor: "#3b82f644" }]}><Feather name="bell" size={16} color="#60a5fa" /></TouchableOpacity>
                </View>
              ))}
              {(!users || users.length === 0) && <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا يوجد مستخدمون</Text>}
            </View>
            <View style={[styles.notifSection, { backgroundColor: colors.card, borderColor: "#a78bfa44" }]}>
              <View style={styles.notifSectionHeader}>
                <Feather name="clock" size={18} color="#a78bfa" />
                <Text style={[styles.notifSectionTitle, { color: "#a78bfa" }]}>الإشعارات المُرسَلة مؤخراً</Text>
              </View>
              {sentLogLoading ? <ActivityIndicator color="#a78bfa" style={{ marginVertical: 12 }} /> : sentLog.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign: "right" }]}>لم يُرسَل أي إشعار بعد</Text>
              ) : sentLog.map((item) => (
                <View key={item.id} style={[styles.sentLogItem, { borderColor: colors.border }]}>
                  <View style={styles.sentLogHeader}>
                    <Text style={[styles.sentLogTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.sentLogBadge, { backgroundColor: item.type === "app_update" ? "#3b82f622" : "#d4a01722" }]}>
                      <Text style={[styles.sentLogBadgeText, { color: item.type === "app_update" ? "#60a5fa" : "#d4a017" }]}>{item.type === "app_update" ? "بث عام" : "مستخدم محدد"}</Text>
                    </View>
                  </View>
                  {!!item.message && <Text style={[styles.sentLogMsg, { color: colors.mutedForeground }]} numberOfLines={2}>{item.message}</Text>}
                  <View style={styles.sentLogFooter}>
                    <Text style={[styles.sentLogMeta, { color: colors.mutedForeground }]}>{new Date(item.sentAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text>
                    <View style={styles.sentLogRecipients}><Feather name="users" size={12} color="#94a3b8" /><Text style={[styles.sentLogMeta, { color: colors.mutedForeground }]}>{item.recipientCount}</Text></View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === "lessons" && (
          <View style={styles.listSection}>
            <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]} activeOpacity={0.8}>
              <Feather name="plus" size={18} color={colors.primary} /><Text style={[styles.addBtnText, { color: colors.primary }]}>إضافة درس جديد</Text>
            </TouchableOpacity>
            {lessons?.map((l) => (
              <View key={l.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.listItemMain}>
                  <Text style={[styles.listItemTitle, { color: colors.foreground }]}>{l.title}</Text>
                  <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>{l.category} · {l.duration} د</Text>
                  <View style={[styles.badge, { backgroundColor: l.isPublished ? "#34d39922" : colors.secondary }]}><Text style={[styles.badgeText, { color: l.isPublished ? "#34d399" : colors.mutedForeground }]}>{l.isPublished ? "منشور" : "مسودة"}</Text></View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openEditor("lesson", l)} style={styles.editBtn}><Feather name="edit-2" size={16} color={colors.foreground} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(l.id, l.title, deleteLesson, refetchLessons)} style={styles.deleteBtn}><Feather name="trash-2" size={16} color="#ef4444" /></TouchableOpacity>
                </View>
              </View>
            ))}
            {(!lessons || lessons.length === 0) && <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد دروس حتى الآن</Text>}
          </View>
        )}

        {tab === "tools" && (
          <View style={styles.listSection}>
            <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]} activeOpacity={0.8}>
              <Feather name="plus" size={18} color={colors.primary} /><Text style={[styles.addBtnText, { color: colors.primary }]}>إضافة أداة جديدة</Text>
            </TouchableOpacity>
            {tools?.map((t) => (
              <View key={t.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.colorDot, { backgroundColor: t.color }]} />
                <View style={styles.listItemMain}>
                  <Text style={[styles.listItemTitle, { color: colors.foreground }]}>{t.title}</Text>
                  <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>{t.category}</Text>
                  {t.contentType && <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>نوع: {CT_LABELS[t.contentType as ContentTypeKey] ?? t.contentType}</Text>}
                  <View style={[styles.badge, { backgroundColor: t.isActive ? "#34d39922" : colors.secondary }]}><Text style={[styles.badgeText, { color: t.isActive ? "#34d399" : colors.mutedForeground }]}>{t.isActive ? "نشط" : "غير نشط"}</Text></View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openEditor("tool", t)} style={styles.editBtn}><Feather name="edit-2" size={16} color={colors.foreground} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(t.id, t.title, deleteTool, refetchTools)} style={styles.deleteBtn}><Feather name="trash-2" size={16} color="#ef4444" /></TouchableOpacity>
                </View>
              </View>
            ))}
            {(!tools || tools.length === 0) && <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد أدوات حتى الآن</Text>}
          </View>
        )}

        {tab === "services" && (
          <View style={styles.listSection}>
            <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]} activeOpacity={0.8}>
              <Feather name="plus" size={18} color={colors.primary} /><Text style={[styles.addBtnText, { color: colors.primary }]}>إضافة خدمة جديدة</Text>
            </TouchableOpacity>
            {services?.map((s) => (
              <View key={s.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.listItemMain}>
                  <Text style={[styles.listItemTitle, { color: colors.foreground }]}>{s.title}</Text>
                  <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>{s.category} · {s.price}</Text>
                  {s.contentType && <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>نوع: {CT_LABELS[s.contentType as ContentTypeKey] ?? s.contentType}</Text>}
                  <View style={[styles.badge, { backgroundColor: s.isAvailable ? "#34d39922" : colors.secondary }]}><Text style={[styles.badgeText, { color: s.isAvailable ? "#34d399" : colors.mutedForeground }]}>{s.isAvailable ? "متاح" : "غير متاح"}</Text></View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openEditor("service", s)} style={styles.editBtn}><Feather name="edit-2" size={16} color={colors.foreground} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(s.id, s.title, deleteService, refetchServices)} style={styles.deleteBtn}><Feather name="trash-2" size={16} color="#ef4444" /></TouchableOpacity>
                </View>
              </View>
            ))}
            {(!services || services.length === 0) && <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد خدمات حتى الآن</Text>}
          </View>
        )}

        {tab === "banners" && (
          <View style={styles.listSection}>
            <TouchableOpacity onPress={() => { setBannerImageUrl(""); setBannerTitle(""); setBannerLinkUrl(""); setBannerOrder("0"); setShowAddBanner(true); }} style={[styles.addBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]} activeOpacity={0.8}>
              <Feather name="plus" size={18} color={colors.primary} /><Text style={[styles.addBtnText, { color: colors.primary }]}>إضافة بانر جديد</Text>
            </TouchableOpacity>
            {bannersLoading && <ActivityIndicator color={colors.primary} />}
            {banners.map((b) => (
              <View key={b.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: "column", alignItems: "flex-end" }]}>
                {b.imageUrl ? <Image source={{ uri: b.imageUrl }} style={styles.bannerThumb} resizeMode="cover" /> : null}
                <View style={{ width: "100%", flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                  <View style={styles.listItemMain}>
                    <Text style={[styles.listItemTitle, { color: colors.foreground }]}>{b.title || "بدون عنوان"}</Text>
                    {b.linkUrl ? <Text style={[styles.listItemSub, { color: colors.mutedForeground }]} numberOfLines={1}>{b.linkUrl}</Text> : null}
                    <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>الترتيب: {b.sortOrder}</Text>
                    <View style={[styles.badge, { backgroundColor: b.isActive ? "#34d39922" : colors.secondary }]}><Text style={[styles.badgeText, { color: b.isActive ? "#34d399" : colors.mutedForeground }]}>{b.isActive ? "نشط" : "مخفي"}</Text></View>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => toggleBannerActive(b.id, b.isActive)} style={styles.editBtn}><Feather name={b.isActive ? "eye-off" : "eye"} size={16} color={colors.foreground} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteBanner(b.id)} style={styles.deleteBtn}><Feather name="trash-2" size={16} color="#ef4444" /></TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            {!bannersLoading && banners.length === 0 && <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد بنرات حتى الآن</Text>}
          </View>
        )}

        {tab === "recharge" && (
          <View style={styles.listSection}>
            <TouchableOpacity onPress={fetchRechargeRequests} style={[styles.addBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={16} color={colors.primary} /><Text style={[styles.addBtnText, { color: colors.primary }]}>تحديث القائمة</Text>
            </TouchableOpacity>
            {rechargeLoading && <ActivityIndicator color={colors.primary} />}
            {rechargeRequests.map((r) => {
              const isPending = r.status === "pending";
              const statusColor = r.status === "approved" ? "#34d399" : r.status === "rejected" ? "#ef4444" : colors.primary;
              const statusLabel = r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : "قيد الانتظار";
              return (
                <View key={r.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: "column", alignItems: "flex-end", gap: 8 }]}>
                  <View style={{ flexDirection: "row-reverse", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ gap: 3 }}>
                      <Text style={[styles.listItemTitle, { color: colors.foreground }]}>{r.username}</Text>
                      {r.amount ? <Text style={[styles.listItemSub, { color: "#d4a017", fontFamily: "Cairo_700Bold" }]}>المبلغ: ${r.amount}</Text> : null}
                      <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>عبر: {r.paymentMethod}</Text>
                      <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>رقم العملية: {r.transactionId}</Text>
                      <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>{new Date(r.createdAt).toLocaleString("ar")}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}><Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text></View>
                  </View>
                  {r.transferImageUrl ? (
                    <TouchableOpacity onPress={() => Linking.openURL(r.transferImageUrl)} style={{ width: "100%" }}>
                      <Image source={{ uri: r.transferImageUrl }} style={{ width: "100%", height: 140, borderRadius: 10 }} resizeMode="cover" />
                      <Text style={[styles.listItemSub, { color: "#60a5fa", textAlign: "center", marginTop: 4 }]}>عرض صورة الإيصال</Text>
                    </TouchableOpacity>
                  ) : null}
                  {isPending && (
                    <View style={{ flexDirection: "row-reverse", gap: 8, width: "100%" }}>
                      <TouchableOpacity onPress={() => { Alert.alert("تأكيد", "قبول طلب الشحن؟", [{ text: "إلغاء", style: "cancel" }, { text: "قبول", onPress: () => handleRechargeStatus(r.id, "approved") }]); }} style={[styles.modalBtn, { backgroundColor: "#34d39922", flex: 1 }]}>
                        <Text style={[styles.modalBtnText, { color: "#34d399" }]}>قبول ✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { Alert.alert("تأكيد", "رفض طلب الشحن؟", [{ text: "إلغاء", style: "cancel" }, { text: "رفض", style: "destructive", onPress: () => handleRechargeStatus(r.id, "rejected") }]); }} style={[styles.modalBtn, { backgroundColor: "#ef444422", flex: 1 }]}>
                        <Text style={[styles.modalBtnText, { color: "#ef4444" }]}>رفض ✗</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
            {!rechargeLoading && rechargeRequests.length === 0 && <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد طلبات شحن حتى الآن</Text>}
          </View>
        )}
      </ScrollView>

      <EditDialog
        visible={edit.type !== null}
        title={edit.type === "user" ? "تعديل مستخدم" : edit.type === "lesson" ? "تعديل درس" : edit.type === "tool" ? "تعديل أداة" : "تعديل خدمة"}
        onClose={closeEdit} submitLabel="حفظ" onSave={saveEdit}
        fields={
          <View style={{ gap: 10 }}>
            {edit.type !== "user" && (
              <>
                <TextInput value={title} onChangeText={setTitle} placeholder="العنوان" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
                <TextInput value={description} onChangeText={setDescription} placeholder="الوصف" placeholderTextColor={colors.mutedForeground} style={inputStyle} multiline />
                <TextInput value={category} onChangeText={setCategory} placeholder="التصنيف" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
              </>
            )}
            {edit.type === "user" && (
              <>
                <TextInput value={name} onChangeText={setName} placeholder="اسم المستخدم" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
                <TextInput value={email} onChangeText={setEmail} placeholder="البريد" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
                <TextInput value={balance} onChangeText={setBalance} placeholder="الرصيد" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" style={inputStyle} />
              </>
            )}
            {edit.type === "lesson" && (
              <>
                <TextInput value={extra1} onChangeText={setExtra1} placeholder="المدة (دقائق)" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" style={inputStyle} />
                <TextInput value={extra2} onChangeText={setExtra2} placeholder="رابط الفيديو" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
              </>
            )}
            {edit.type === "tool" && (
              <>
                <TextInput value={color} onChangeText={setColor} placeholder="اللون (مثال: #d4a017)" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
                <TextInput value={url} onChangeText={setUrl} placeholder="الرابط (اختياري)" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
                <TextInput value={iconUrl} onChangeText={setIconUrl} placeholder="رابط الأيقونة (اختياري)" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
              </>
            )}
            {edit.type === "service" && (
              <>
                <TextInput value={price} onChangeText={setPrice} placeholder="السعر" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" style={inputStyle} />
                <TextInput value={url} onChangeText={setUrl} placeholder="الرابط (اختياري)" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
                <TextInput value={iconUrl} onChangeText={setIconUrl} placeholder="رابط الأيقونة (اختياري)" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
              </>
            )}
            {edit.type !== "user" && (
              <>
                <View style={{ flexDirection: "row-reverse", gap: 8, alignItems: "center" }}>
                  <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder="رابط صورة البطاقة (اختياري)" placeholderTextColor={colors.mutedForeground} style={[inputStyle, { flex: 1 }]} autoCapitalize="none" keyboardType="url" />
                  {Platform.OS !== "web" && (
                    <TouchableOpacity onPress={() => pickCardImage(setImageUrl)} disabled={cardImageUploading} style={[styles.chargeBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44", opacity: cardImageUploading ? 0.5 : 1 }]}>
                      <Feather name={cardImageUploading ? "loader" : "image"} size={18} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>نوع المحتوى المُسلَّم</Text>
                <ContentTypePicker value={editContentType} onChange={setEditContentType} />
                <TextInput value={content} onChangeText={setContent} placeholder="المحتوى (نص/رابط يُرسل للمستخدم بعد الدفع)" placeholderTextColor={colors.mutedForeground} style={[inputStyle, { minHeight: 60 }]} multiline />
              </>
            )}
            <TouchableOpacity onPress={() => setFlag((v) => !v)} style={[styles.switchRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.switchText, { color: colors.foreground }]}>تفعيل/إلغاء</Text>
              <Feather name={flag ? "toggle-right" : "toggle-left"} size={24} color={flag ? colors.primary : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {tab === "tools" ? "إضافة أداة جديدة" : tab === "services" ? "إضافة خدمة جديدة" : "إضافة درس جديد"}
              </Text>
              <View style={{ gap: 10 }}>
                {/* Basic fields */}
                <TextInput value={addTitle} onChangeText={setAddTitle} placeholder="الاسم *" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
                <TextInput value={addDescription} onChangeText={setAddDescription} placeholder="الوصف (اختياري)" placeholderTextColor={colors.mutedForeground} style={[inputStyle, { minHeight: 56, textAlignVertical: "top" }]} multiline />
                <TextInput value={addCategory} onChangeText={setAddCategory} placeholder="التصنيف (عام)" placeholderTextColor={colors.mutedForeground} style={inputStyle} />

                {/* Price — shown for all tabs */}
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                  <Feather name="tag" size={14} color={colors.primary} />
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground, flex: 1 }]}>السعر (بالدولار)</Text>
                </View>
                <TextInput value={addPrice} onChangeText={setAddPrice} placeholder="0" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" style={inputStyle} />

                {/* Lessons: duration */}
                {tab === "lessons" && (
                  <TextInput value={addDuration} onChangeText={setAddDuration} placeholder="مدة الدرس (دقائق)" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" style={inputStyle} />
                )}

                {/* Tools: color + interactive link */}
                {tab === "tools" && (
                  <>
                    <TextInput value={addColor} onChangeText={setAddColor} placeholder="لون الكارت (مثال: #7c3aed)" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
                    <TextInput value={addUrl} onChangeText={setAddUrl} placeholder="رابط الأداة التفاعلية (يفتح فوراً عند الضغط)" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
                  </>
                )}

                {/* Image picker */}
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                  <Feather name="image" size={14} color={colors.primary} />
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground, flex: 1 }]}>صورة البطاقة</Text>
                </View>
                <View style={{ flexDirection: "row-reverse", gap: 8, alignItems: "center" }}>
                  <TextInput value={addImageUrl} onChangeText={setAddImageUrl} placeholder="رابط الصورة (اختياري)" placeholderTextColor={colors.mutedForeground} style={[inputStyle, { flex: 1 }]} autoCapitalize="none" keyboardType="url" />
                  {Platform.OS !== "web" && (
                    <TouchableOpacity onPress={() => pickCardImage(setAddImageUrl)} disabled={cardImageUploading} style={[styles.chargeBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44", opacity: cardImageUploading ? 0.5 : 1 }]}>
                      <Feather name={cardImageUploading ? "loader" : "upload"} size={18} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
                {addImageUrl.trim().length > 0 && <Image source={{ uri: addImageUrl }} style={{ width: "100%", height: 80, borderRadius: 10 }} resizeMode="cover" />}

                {/* Delivered content type */}
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Feather name="package" size={14} color={colors.primary} />
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground, flex: 1 }]}>نوع المحتوى المُسلَّم بعد الدفع</Text>
                </View>
                <ContentTypePicker value={addContentType} onChange={(v) => { setAddContentType(v); setAddContent(""); }} />

                {/* Content input — changes based on type */}
                {(addContentType === "link") && (
                  <TextInput value={addContent} onChangeText={setAddContent} placeholder="أدخل الرابط هنا..." placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
                )}
                {(addContentType === "text") && (
                  <TextInput value={addContent} onChangeText={setAddContent} placeholder="اكتب النص الذي سيُرسل للمشتري..." placeholderTextColor={colors.mutedForeground} style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]} multiline />
                )}
                {(addContentType === "file" || addContentType === "app") && (
                  Platform.OS !== "web" ? (
                    <TouchableOpacity onPress={pickToolFile} disabled={addFileUploading}
                      style={[styles.uploadFileBtn, { backgroundColor: addContent ? "#14532d" : colors.secondary, borderColor: addContent ? "#22c55e44" : colors.border, opacity: addFileUploading ? 0.5 : 1 }]}>
                      <Feather name={addFileUploading ? "loader" : addContent ? "check-circle" : "folder"} size={18} color={addContent ? "#22c55e" : colors.primary} />
                      <Text style={[styles.uploadFileBtnText, { color: addContent ? "#22c55e" : colors.primary }]}>
                        {addFileUploading ? "جاري الرفع..." : addContent ? "تم الرفع ✓ — اضغط لتغيير الملف" : "اضغط لاختيار ملف من الجهاز"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TextInput value={addContent} onChangeText={setAddContent} placeholder="رابط الملف / التطبيق" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
                  )
                )}
                {(addContentType === "video") && (
                  Platform.OS !== "web" ? (
                    <>
                      <TouchableOpacity onPress={pickLessonVideo} disabled={addFileUploading}
                        style={[styles.uploadFileBtn, { backgroundColor: addContent ? "#14532d" : colors.secondary, borderColor: addContent ? "#22c55e44" : colors.border, opacity: addFileUploading ? 0.5 : 1 }]}>
                        <Feather name={addFileUploading ? "loader" : addContent ? "check-circle" : "video"} size={18} color={addContent ? "#22c55e" : colors.primary} />
                        <Text style={[styles.uploadFileBtnText, { color: addContent ? "#22c55e" : colors.primary }]}>
                          {addFileUploading ? "جاري الرفع..." : addContent ? "تم رفع الفيديو ✓ — اضغط لتغييره" : "اضغط لاختيار فيديو من الجهاز"}
                        </Text>
                      </TouchableOpacity>
                      {addVideoUrl ? null : <TextInput value={addContent} onChangeText={setAddContent} placeholder="أو أدخل رابط الفيديو مباشرة" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />}
                    </>
                  ) : (
                    <TextInput value={addContent} onChangeText={setAddContent} placeholder="رابط الفيديو" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
                  )
                )}

                {/* Active toggle */}
                <TouchableOpacity onPress={() => setAddIsActive((v) => !v)} style={[styles.switchRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Text style={[styles.switchText, { color: colors.foreground }]}>{addIsActive ? (tab === "lessons" ? "منشور" : "نشط") : (tab === "lessons" ? "مسودة" : "غير نشط")}</Text>
                  <Feather name={addIsActive ? "toggle-right" : "toggle-left"} size={24} color={addIsActive ? colors.primary : colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowAdd(false)} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}><Text style={[styles.modalBtnText, { color: colors.foreground }]}>إلغاء</Text></TouchableOpacity>
                <TouchableOpacity onPress={saveAdd} style={[styles.modalBtn, { backgroundColor: colors.primary }]}><Text style={[styles.modalBtnText, { color: "#0f1624" }]}>إضافة</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showAddBanner} transparent animationType="fade" onRequestClose={() => setShowAddBanner(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة بانر جديد</Text>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row-reverse", gap: 8, alignItems: "center" }}>
                  <TextInput value={bannerImageUrl} onChangeText={setBannerImageUrl} placeholder="رابط الصورة *" placeholderTextColor={colors.mutedForeground} style={[inputStyle, { flex: 1 }]} autoCapitalize="none" keyboardType="url" />
                  {Platform.OS !== "web" && (
                    <TouchableOpacity onPress={pickBannerImage} disabled={bannerUploading} style={[styles.chargeBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44", opacity: bannerUploading ? 0.5 : 1 }]}>
                      <Feather name={bannerUploading ? "loader" : "image"} size={18} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
                {bannerImageUrl.trim().length > 0 && <Image source={{ uri: bannerImageUrl }} style={[styles.bannerThumb, { alignSelf: "center" }]} resizeMode="cover" />}
                <TextInput value={bannerTitle} onChangeText={setBannerTitle} placeholder="العنوان (اختياري)" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
                <TextInput value={bannerLinkUrl} onChangeText={setBannerLinkUrl} placeholder="الرابط عند النقر (اختياري)" placeholderTextColor={colors.mutedForeground} style={inputStyle} autoCapitalize="none" keyboardType="url" />
                <TextInput value={bannerOrder} onChangeText={setBannerOrder} placeholder="ترتيب العرض (0 = أول)" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" style={inputStyle} />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowAddBanner(false)} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}><Text style={[styles.modalBtnText, { color: colors.foreground }]}>إلغاء</Text></TouchableOpacity>
                <TouchableOpacity onPress={saveBanner} style={[styles.modalBtn, { backgroundColor: colors.primary }]}><Text style={[styles.modalBtnText, { color: "#0f1624" }]}>إضافة</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showCharge} transparent animationType="fade" onRequestClose={() => setShowCharge(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, margin: 20 }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>شحن رصيد</Text>
            <Text style={[styles.listItemSub, { color: colors.mutedForeground }]}>المستخدم: {chargeUserName}</Text>
            <View style={{ gap: 10 }}>
              <TextInput value={chargeAmount} onChangeText={setChargeAmount} placeholder="المبلغ المراد إضافته *" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" style={inputStyle} />
              <TextInput value={chargeNote} onChangeText={setChargeNote} placeholder="نص الإشعار (اختياري)" placeholderTextColor={colors.mutedForeground} style={inputStyle} multiline />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCharge(false)} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}><Text style={[styles.modalBtnText, { color: colors.foreground }]}>إلغاء</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveCharge} style={[styles.modalBtn, { backgroundColor: colors.primary }]}><Text style={[styles.modalBtnText, { color: "#0f1624" }]}>شحن</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showNotify} transparent animationType="fade" onRequestClose={() => setShowNotify(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, margin: 20 }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{notifyUserId ? "إرسال إشعار لمستخدم" : "إشعار لجميع المستخدمين"}</Text>
            <View style={{ gap: 10 }}>
              <TextInput value={notifyTitle} onChangeText={setNotifyTitle} placeholder="عنوان الإشعار *" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
              <TextInput value={notifyBody} onChangeText={setNotifyBody} placeholder="نص الإشعار" placeholderTextColor={colors.mutedForeground} style={[inputStyle, { minHeight: 70 }]} multiline />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowNotify(false)} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}><Text style={[styles.modalBtnText, { color: colors.foreground }]}>إلغاء</Text></TouchableOpacity>
              <TouchableOpacity onPress={sendNotification} style={[styles.modalBtn, { backgroundColor: "#3b82f6" }]}><Text style={[styles.modalBtnText, { color: "#fff" }]}>إرسال</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={secretVisible} transparent animationType="fade" onRequestClose={() => setSecretVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.secretCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>لوحة الإدارة المخفية</Text>
            <Text style={[styles.secretHint, { color: colors.mutedForeground }]}>يمكنك الآن تعديل جميع المنتجات داخل التطبيق.</Text>
            <TouchableOpacity onPress={() => setSecretVisible(false)} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.modalBtnText, { color: "#0f1624" }]}>فتح</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 16 },
  errorText: { fontFamily: "Cairo_700Bold", fontSize: 18 },
  backBtn: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { fontFamily: "Cairo_700Bold", fontSize: 15 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  titleWrap: { alignItems: "center", gap: 4 },
  headerTitle: { fontFamily: "Cairo_700Bold", fontSize: 18 },
  holdBar: { width: 120, height: 4, borderRadius: 999, borderWidth: 1, overflow: "hidden" },
  holdFill: { height: "100%" },
  tabsRow: { flexDirection: "row-reverse", paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  tabBtnText: { fontFamily: "Cairo_600SemiBold", fontSize: 13 },
  scrollContent: { padding: 16, gap: 12 },
  grid2: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 12 },
  statCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center", gap: 8 },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: "Cairo_700Bold", fontSize: 24 },
  statLabel: { fontFamily: "Cairo_400Regular", fontSize: 12 },
  actionCard: { flexDirection: "row-reverse", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  actionCardText: { flex: 1, fontFamily: "Cairo_600SemiBold", fontSize: 14 },
  listSection: { gap: 10 },
  listItem: { flexDirection: "row-reverse", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  colorDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  listItemMain: { flex: 1, gap: 4, alignItems: "flex-end" },
  listItemTitle: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
  listItemSub: { fontFamily: "Cairo_400Regular", fontSize: 12 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-end" },
  badgeText: { fontFamily: "Cairo_600SemiBold", fontSize: 11 },
  actionRow: { flexDirection: "row-reverse", gap: 6, alignItems: "center" },
  editBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  chargeBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
  notifyBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
  emptyText: { fontFamily: "Cairo_400Regular", fontSize: 13, textAlign: "center", paddingVertical: 20 },
  bannerThumb: { width: "100%", height: 120, borderRadius: 10, marginBottom: 8 },
  fieldLabel: { fontFamily: "Cairo_400Regular", fontSize: 12, textAlign: "right" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center" },
  modalCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  secretCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10, margin: 20 },
  modalTitle: { fontFamily: "Cairo_700Bold", fontSize: 16 },
  secretHint: { fontFamily: "Cairo_400Regular", fontSize: 13 },
  modalActions: { flexDirection: "row-reverse", gap: 8, marginTop: 6 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  modalBtnText: { fontFamily: "Cairo_700Bold", fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Cairo_400Regular", textAlign: "right" },
  switchRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  switchText: { fontFamily: "Cairo_600SemiBold", fontSize: 13 },
  addBtn: { flexDirection: "row-reverse", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 2 },
  addBtnText: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
  ctBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  uploadFileBtn: { flexDirection: "row-reverse", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  uploadFileBtnText: { fontFamily: "Cairo_600SemiBold", fontSize: 13 },
  notifSection: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  notifSectionHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 4 },
  notifSectionTitle: { fontFamily: "Cairo_700Bold", fontSize: 15 },
  notifSendBtn: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12 },
  notifSendBtnText: { fontFamily: "Cairo_700Bold", fontSize: 14, color: "#fff" },
  notifSubTitle: { fontFamily: "Cairo_600SemiBold", fontSize: 13, textAlign: "right" },
  sentLogItem: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 5 },
  sentLogHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: 8 },
  sentLogTitle: { fontFamily: "Cairo_700Bold", fontSize: 14, flex: 1, textAlign: "right" },
  sentLogBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  sentLogBadgeText: { fontFamily: "Cairo_600SemiBold", fontSize: 11 },
  sentLogMsg: { fontFamily: "Cairo_400Regular", fontSize: 12, textAlign: "right", lineHeight: 18 },
  sentLogFooter: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  sentLogMeta: { fontFamily: "Cairo_400Regular", fontSize: 11 },
  sentLogRecipients: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
});
