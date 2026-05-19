import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = (() => {
  const d = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return d ? `https://${d}` : "";
})();

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

function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sh.backdrop}>
        <TouchableOpacity style={sh.overlay} activeOpacity={1} onPress={onClose} />
        <View style={[sh.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={sh.handle} />
          <View style={sh.header}>
            <TouchableOpacity onPress={onClose} style={sh.closeBtn}>
              <Feather name="x" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <Text style={sh.title}>{title}</Text>
            <View style={{ width: 36 }} />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const sh = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  overlay: { flex: 1 },
  sheet: { backgroundColor: "#0d0028", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, maxHeight: "92%" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#2d4a6a", alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(124,58,237,0.22)", marginBottom: 12 },
  title: { fontFamily: "Cairo_700Bold", fontSize: 17, color: "#f8fafc", flex: 1, textAlign: "center" },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});

const f = StyleSheet.create({
  label: { fontFamily: "Cairo_600SemiBold", fontSize: 13, color: "#94a3b8", textAlign: "right", marginBottom: 4 },
  input: { backgroundColor: "rgba(124,58,237,0.08)", borderWidth: 1, borderColor: "rgba(124,58,237,0.22)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: "#f8fafc", textAlign: "right", fontFamily: "Cairo_400Regular", fontSize: 14 },
  btn: { backgroundColor: "#d4a017", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  btnText: { fontFamily: "Cairo_700Bold", fontSize: 15, color: "#0d0028" },
  dangerBtn: { backgroundColor: "#1a0a0a", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#ef444440" },
  dangerText: { fontFamily: "Cairo_700Bold", fontSize: 15, color: "#ef4444" },
  gap: { gap: 10 },
});

export function ProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, refreshUser, token } = useAuth() as any;
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername(user?.username ?? "");
      setAvatarUri(user?.avatarUrl ?? "");
    }
  }, [visible, user]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى الصور."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      try {
        const uploadRes = await apiCall("/upload", "POST", {
          base64: asset.base64,
          mimeType: asset.mimeType ?? "image/jpeg",
        }, token);
        setAvatarUri(uploadRes.url);
      } catch (e: any) {
        Alert.alert("خطأ", "فشل رفع الصورة: " + e.message);
      }
    }
  };

  const save = async () => {
    if (!username.trim()) { Alert.alert("مطلوب", "أدخل اسم المستخدم."); return; }
    setSaving(true);
    try {
      await apiCall("/auth/user/profile", "PATCH", { username: username.trim(), avatarUrl: avatarUri || null }, token);
      await refreshUser?.();
      Alert.alert("تم الحفظ ✓", "تم تحديث ملفك الشخصي.");
      onClose();
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally { setSaving(false); }
  };

  const initial = (user?.username ?? "م")[0].toUpperCase();

  return (
    <Sheet visible={visible} onClose={onClose} title="الملف الشخصي">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[f.gap, { paddingBottom: 24 }]}>
        <TouchableOpacity style={pm.avatarWrap} activeOpacity={0.85} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={pm.avatar} />
          ) : (
            <View style={pm.avatarFallback}><Text style={pm.avatarInitial}>{initial}</Text></View>
          )}
          <View style={pm.cameraBadge}><Feather name="camera" size={14} color="#0d0028" /></View>
        </TouchableOpacity>

        <Text style={f.label}>اسم المستخدم</Text>
        <TextInput value={username} onChangeText={setUsername} placeholder="اسم المستخدم" placeholderTextColor="#4b6280" style={f.input} />

        <Text style={[f.label, { marginTop: 4 }]}>البريد الإلكتروني</Text>
        <View style={[f.input, { opacity: 0.5 }]}><Text style={{ color: "#f8fafc", fontFamily: "Cairo_400Regular", fontSize: 14, textAlign: "right" }}>{user?.email ?? ""}</Text></View>

        <TouchableOpacity style={[f.btn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <Text style={f.btnText}>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Sheet>
  );
}

const pm = StyleSheet.create({
  avatarWrap: { alignSelf: "center", marginBottom: 8, position: "relative" },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2.5, borderColor: "#d4a017" },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(124,58,237,0.12)", borderWidth: 2.5, borderColor: "#d4a017", alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: "Cairo_700Bold", fontSize: 32, color: "#d4a017" },
  cameraBadge: { position: "absolute", bottom: 2, right: 2, backgroundColor: "#d4a017", borderRadius: 12, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
});

export function SecurityModal({ visible, onClose, onLoggedOut }: { visible: boolean; onClose: () => void; onLoggedOut: () => void }) {
  const { logout, token } = useAuth() as any;
  const [tab, setTab] = useState<"password" | "email" | "delete">("password");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [deletePw, setDeletePw] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setCurrentPw(""); setNewPw(""); setConfirmPw(""); setNewEmail(""); setEmailPw(""); setDeletePw(""); };
  useEffect(() => { if (visible) { setTab("password"); reset(); } }, [visible]);

  const changePassword = async () => {
    if (!newPw || newPw !== confirmPw) { Alert.alert("خطأ", "كلمتا المرور غير متطابقتين."); return; }
    setSaving(true);
    try {
      await apiCall("/auth/user/password", "PATCH", { currentPassword: currentPw, newPassword: newPw }, token);
      Alert.alert("تم ✓", "تم تغيير كلمة المرور بنجاح."); reset(); onClose();
    } catch (e: any) { Alert.alert("خطأ", e.message); } finally { setSaving(false); }
  };

  const changeEmail = async () => {
    if (!newEmail.trim()) { Alert.alert("مطلوب", "أدخل البريد الإلكتروني الجديد."); return; }
    setSaving(true);
    try {
      await apiCall("/auth/user/email", "PATCH", { newEmail: newEmail.trim(), password: emailPw }, token);
      Alert.alert("تم ✓", "تم تغيير البريد الإلكتروني."); reset(); onClose();
    } catch (e: any) { Alert.alert("خطأ", e.message); } finally { setSaving(false); }
  };

  const deleteAccount = () => {
    Alert.alert("تأكيد الحذف", "سيتم حذف حسابك نهائياً ولا يمكن التراجع.", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: async () => {
        setSaving(true);
        try {
          await apiCall("/auth/user/account", "DELETE", { password: deletePw }, token);
          await logout();
          onClose();
          onLoggedOut();
        } catch (e: any) { Alert.alert("خطأ", e.message); } finally { setSaving(false); }
      }},
    ]);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="الأمان والحساب">
      <View style={sec.tabs}>
        {(["password", "email", "delete"] as const).map((t) => (
          <TouchableOpacity key={t} style={[sec.tab, tab === t && sec.tabActive]} onPress={() => setTab(t)}>
            <Text style={[sec.tabText, tab === t && sec.tabTextActive]}>
              {t === "password" ? "كلمة المرور" : t === "email" ? "الإيميل" : "حذف الحساب"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[f.gap, { paddingBottom: 24 }]}>
        {tab === "password" && <>
          <Text style={f.label}>كلمة المرور الحالية</Text>
          <TextInput value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="••••••••" placeholderTextColor="#4b6280" style={f.input} />
          <Text style={f.label}>كلمة المرور الجديدة</Text>
          <TextInput value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="••••••••" placeholderTextColor="#4b6280" style={f.input} />
          <Text style={f.label}>تأكيد كلمة المرور</Text>
          <TextInput value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="••••••••" placeholderTextColor="#4b6280" style={f.input} />
          <TouchableOpacity style={[f.btn, saving && { opacity: 0.6 }]} onPress={changePassword} disabled={saving}>
            <Text style={f.btnText}>{saving ? "جاري التغيير..." : "تغيير كلمة المرور"}</Text>
          </TouchableOpacity>
        </>}
        {tab === "email" && <>
          <Text style={f.label}>البريد الإلكتروني الجديد</Text>
          <TextInput value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" placeholder="example@email.com" placeholderTextColor="#4b6280" style={f.input} />
          <Text style={f.label}>كلمة المرور للتأكيد</Text>
          <TextInput value={emailPw} onChangeText={setEmailPw} secureTextEntry placeholder="••••••••" placeholderTextColor="#4b6280" style={f.input} />
          <TouchableOpacity style={[f.btn, saving && { opacity: 0.6 }]} onPress={changeEmail} disabled={saving}>
            <Text style={f.btnText}>{saving ? "جاري التغيير..." : "تغيير البريد الإلكتروني"}</Text>
          </TouchableOpacity>
        </>}
        {tab === "delete" && <>
          <Text style={[f.label, { color: "#ef4444" }]}>تحذير: لا يمكن التراجع عن هذا الإجراء.</Text>
          <Text style={f.label}>كلمة المرور للتأكيد</Text>
          <TextInput value={deletePw} onChangeText={setDeletePw} secureTextEntry placeholder="••••••••" placeholderTextColor="#4b6280" style={f.input} />
          <TouchableOpacity style={[f.dangerBtn, saving && { opacity: 0.6 }]} onPress={deleteAccount} disabled={saving}>
            <Text style={f.dangerText}>{saving ? "جاري الحذف..." : "حذف الحساب نهائياً"}</Text>
          </TouchableOpacity>
        </>}
      </ScrollView>
    </Sheet>
  );
}

const sec = StyleSheet.create({
  tabs: { flexDirection: "row-reverse", gap: 8, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: "rgba(124,58,237,0.12)", alignItems: "center" },
  tabActive: { backgroundColor: "#d4a017" },
  tabText: { fontFamily: "Cairo_600SemiBold", fontSize: 12, color: "#64748b" },
  tabTextActive: { color: "#0d0028" },
});

export function CartModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { token } = useAuth() as any;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addSheet, setAddSheet] = useState(false);
  const [addNote, setAddNote] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  const load = async () => {
    setLoading(true);
    try { setItems(await apiCall("/cart", "GET", undefined, token)); } catch {} finally { setLoading(false); }
  };

  const remove = async (id: number) => {
    try {
      await apiCall(`/cart/${id}`, "DELETE", undefined, token);
      setItems((p) => p.filter((i) => i.id !== id));
    } catch (e: any) { Alert.alert("خطأ", e.message); }
  };

  const uploadBase64 = async (base64: string, mimeType: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      headers,
      body: JSON.stringify({ base64, mimeType }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "خطأ في الرفع");
    return json.url as string;
  };

  const addText = async () => {
    if (!addNote.trim()) { Alert.alert("مطلوب", "أدخل نص الرسالة"); return; }
    setUploading(true);
    try {
      const added = await apiCall("/cart", "POST", { type: "text", title: "رسالة", content: addNote.trim() }, token);
      setItems((p) => [added, ...p]);
      setAddNote("");
      setAddSheet(false);
    } catch (e: any) { Alert.alert("خطأ", e.message); } finally { setUploading(false); }
  };

  const addImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى الصور."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const url = await uploadBase64(asset.base64!, asset.mimeType ?? "image/jpeg");
      const added = await apiCall("/cart", "POST", { type: "image", title: "صورة", content: url, thumbnailUrl: url }, token);
      setItems((p) => [added, ...p]);
      setAddSheet(false);
    } catch (e: any) { Alert.alert("خطأ", "فشل رفع الصورة: " + e.message); } finally { setUploading(false); }
  };

  const addFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: "*/*" });
      if (result.canceled) return;
      const file = result.assets[0];
      setUploading(true);
      const FileSystem = await import("expo-file-system/legacy");
      const b64 = await FileSystem.readAsStringAsync(file.uri, { encoding: "base64" });
      const url = await uploadBase64(b64, file.mimeType ?? "application/octet-stream");
      const added = await apiCall("/cart", "POST", { type: "file", title: file.name, content: url }, token);
      setItems((p) => [added, ...p]);
      setAddSheet(false);
    } catch (e: any) { Alert.alert("خطأ", "فشل رفع الملف: " + e.message); } finally { setUploading(false); }
  };

  const typeIcon: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
    text: "file-text", image: "image", video: "video", file: "paperclip", link: "link", service: "package",
  };
  const typeColor: Record<string, string> = {
    text: "#60a5fa", image: "#34d399", video: "#a78bfa", file: "#d4a017", link: "#f97316", service: "#d4a017",
  };

  return (
    <>
      <Sheet visible={visible} onClose={onClose} title="السلة">
        {loading ? (
          <View style={cart.center}><Text style={cart.empty}>جاري التحميل...</Text></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
            {items.length === 0 && (
              <View style={cart.center}>
                <Feather name="shopping-cart" size={48} color="#2d4a6a" />
                <Text style={cart.empty}>السلة فارغة</Text>
                <Text style={cart.emptySub}>ستصل هنا المنتجات التي تحفظها</Text>
              </View>
            )}
            {items.map((item) => {
              const icon = typeIcon[item.type] ?? "file";
              const color = typeColor[item.type] ?? "#94a3b8";
              const canOpen = item.content && item.type !== "text";
              const openContent = () => {
                if (item.type === "text") {
                  Alert.alert(item.title ?? "المحتوى", item.content ?? "");
                } else if (item.content) {
                  Linking.openURL(item.content).catch(() => Alert.alert("خطأ", "تعذّر فتح الرابط"));
                }
              };
              return (
                <View key={item.id} style={cart.card}>
                  {item.thumbnailUrl ? (
                    <Image source={{ uri: item.thumbnailUrl }} style={cart.thumb} />
                  ) : (
                    <View style={[cart.iconBox, { backgroundColor: color + "22" }]}>
                      <Feather name={icon} size={20} color={color} />
                    </View>
                  )}
                  <View style={cart.info}>
                    <Text style={cart.itemTitle} numberOfLines={1}>{item.title ?? item.content}</Text>
                    {item.type === "text" && item.content ? (
                      <Text style={cart.contentPreview} numberOfLines={2}>{item.content}</Text>
                    ) : (
                      <Text style={cart.itemType}>{item.type}</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {(canOpen || item.type === "text") && (
                      <TouchableOpacity onPress={openContent} style={cart.openBtn}>
                        <Feather name={item.type === "text" ? "eye" : "external-link"} size={15} color="#60a5fa" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => remove(item.id)} style={cart.deleteBtn}>
                      <Feather name="trash-2" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={cart.addBtn} activeOpacity={0.85} onPress={() => { setAddNote(""); setAddSheet(true); }}>
              <Feather name="plus" size={16} color="#d4a017" />
              <Text style={cart.addBtnText}>إضافة عنصر</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Sheet>

      <Modal visible={addSheet} transparent animationType="slide" onRequestClose={() => setAddSheet(false)}>
        <View style={sh.backdrop}>
          <TouchableOpacity style={sh.overlay} activeOpacity={1} onPress={() => setAddSheet(false)} />
          <View style={[sh.sheet, { paddingBottom: 32 }]}>
            <View style={sh.handle} />
            <View style={sh.header}>
              <TouchableOpacity onPress={() => setAddSheet(false)} style={sh.closeBtn}>
                <Feather name="x" size={20} color="#94a3b8" />
              </TouchableOpacity>
              <Text style={sh.title}>إضافة عنصر للسلة</Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={cart.addOptions}>
              <TouchableOpacity style={cart.optionBtn} onPress={addImage} disabled={uploading} activeOpacity={0.8}>
                <View style={[cart.optionIcon, { backgroundColor: "#34d39922" }]}>
                  <Feather name="image" size={24} color="#34d399" />
                </View>
                <Text style={cart.optionLabel}>صورة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={cart.optionBtn} onPress={addFile} disabled={uploading} activeOpacity={0.8}>
                <View style={[cart.optionIcon, { backgroundColor: "#d4a01722" }]}>
                  <Feather name="paperclip" size={24} color="#d4a017" />
                </View>
                <Text style={cart.optionLabel}>ملف</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginTop: 8 }}>
              <Text style={f.label}>رسالة نصية</Text>
              <TextInput
                value={addNote}
                onChangeText={setAddNote}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor="#4b6280"
                style={[f.input, { minHeight: 80, textAlignVertical: "top" }]}
                multiline
                textAlign="right"
              />
              <TouchableOpacity
                style={[f.btn, (uploading || !addNote.trim()) && { opacity: 0.5 }]}
                onPress={addText}
                disabled={uploading || !addNote.trim()}
                activeOpacity={0.85}
              >
                <Text style={f.btnText}>{uploading ? "جاري الرفع..." : "إرسال"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const cart = StyleSheet.create({
  center: { alignItems: "center", paddingVertical: 48, gap: 12 },
  empty: { fontFamily: "Cairo_600SemiBold", fontSize: 16, color: "#64748b" },
  emptySub: { fontFamily: "Cairo_400Regular", fontSize: 13, color: "#334155", textAlign: "center" },
  card: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "rgba(124,58,237,0.12)", borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: "rgba(124,58,237,0.22)" },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  thumb: { width: 42, height: 42, borderRadius: 10 },
  info: { flex: 1, alignItems: "flex-end", gap: 2 },
  itemTitle: { fontFamily: "Cairo_600SemiBold", fontSize: 14, color: "#e2e8f0" },
  itemType: { fontFamily: "Cairo_400Regular", fontSize: 11, color: "#64748b" },
  deleteBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  openBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  contentPreview: { fontFamily: "Cairo_400Regular", fontSize: 11, color: "#64748b", textAlign: "right" },
  addBtn: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, borderColor: "#d4a01740", borderStyle: "dashed", paddingVertical: 14, backgroundColor: "#d4a01710", marginTop: 4 },
  addBtnText: { fontFamily: "Cairo_600SemiBold", fontSize: 14, color: "#d4a017" },
  addOptions: { flexDirection: "row-reverse", gap: 12, marginBottom: 16 },
  optionBtn: { flex: 1, alignItems: "center", gap: 8, backgroundColor: "rgba(124,58,237,0.08)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(124,58,237,0.22)", paddingVertical: 16 },
  optionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  optionLabel: { fontFamily: "Cairo_600SemiBold", fontSize: 13, color: "#e2e8f0" },
});

export function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { token } = useAuth() as any;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  const load = async () => {
    setLoading(true);
    try { setItems(await apiCall("/notifications", "GET", undefined, token)); } catch {} finally { setLoading(false); }
  };

  const markRead = async (id: number) => {
    try {
      await apiCall(`/notifications/${id}/read`, "PATCH", undefined, token);
      setItems((p) => p.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const typeIcon: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
    recharge_approved: "check-circle", recharge_rejected: "x-circle",
    admin_message: "message-circle", app_update: "bell",
  };
  const typeColor: Record<string, string> = {
    recharge_approved: "#34d399", recharge_rejected: "#ef4444",
    admin_message: "#d4a017", app_update: "#60a5fa",
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="الإشعارات">
      {loading ? (
        <View style={notif.center}><Text style={notif.empty}>جاري التحميل...</Text></View>
      ) : items.length === 0 ? (
        <View style={notif.center}>
          <Feather name="bell-off" size={48} color="#2d4a6a" />
          <Text style={notif.empty}>لا توجد إشعارات</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
          {items.map((item) => {
            const icon = typeIcon[item.type] ?? "bell";
            const color = typeColor[item.type] ?? "#94a3b8";
            return (
              <TouchableOpacity
                key={item.id}
                style={[notif.card, !item.isRead && notif.cardUnread]}
                activeOpacity={0.85}
                onPress={() => !item.isRead && markRead(item.id)}
              >
                <View style={[notif.iconBox, { backgroundColor: color + "22" }]}>
                  <Feather name={icon} size={20} color={color} />
                </View>
                <View style={notif.info}>
                  <Text style={notif.ntitle}>{item.title}</Text>
                  <Text style={notif.nmsg}>{item.message}</Text>
                </View>
                {!item.isRead && <View style={notif.dot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </Sheet>
  );
}

const notif = StyleSheet.create({
  center: { alignItems: "center", paddingVertical: 48, gap: 12 },
  empty: { fontFamily: "Cairo_600SemiBold", fontSize: 16, color: "#64748b" },
  card: { flexDirection: "row-reverse", alignItems: "flex-start", backgroundColor: "rgba(124,58,237,0.12)", borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: "rgba(124,58,237,0.22)" },
  cardUnread: { borderColor: "#d4a01740", backgroundColor: "rgba(124,58,237,0.1)" },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, alignItems: "flex-end", gap: 4 },
  ntitle: { fontFamily: "Cairo_700Bold", fontSize: 14, color: "#f8fafc" },
  nmsg: { fontFamily: "Cairo_400Regular", fontSize: 13, color: "#94a3b8", textAlign: "right" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#d4a017", marginTop: 4 },
});

export function ContactModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const contacts = [
    { label: "واتساب", icon: "message-circle" as const, color: "#25d366", url: "https://wa.me/963983813393" },
    { label: "تلجرام", icon: "send" as const, color: "#29b6f6", url: "https://t.me/SY_T4" },
    { label: "انستجرام", icon: "instagram" as const, color: "#e1306c", url: "https://www.instagram.com/alswry00?igsh=MXZtZHllNm0zaHNjNQ==" },
  ];

  return (
    <Sheet visible={visible} onClose={onClose} title="تواصل معنا">
      <View style={{ gap: 12, paddingBottom: 24 }}>
        <Text style={{ fontFamily: "Cairo_400Regular", fontSize: 14, color: "#64748b", textAlign: "center" }}>
          اختر وسيلة التواصل المفضلة لديك
        </Text>
        {contacts.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={[ct.btn, { borderColor: c.color + "55" }]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(c.url)}
          >
            <View style={[ct.iconBox, { backgroundColor: c.color + "22" }]}>
              <Feather name={c.icon} size={26} color={c.color} />
            </View>
            <Text style={[ct.label, { color: c.color }]}>{c.label}</Text>
            <Feather name="external-link" size={16} color={c.color + "66"} />
          </TouchableOpacity>
        ))}
      </View>
    </Sheet>
  );
}

const ct = StyleSheet.create({
  btn: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "rgba(124,58,237,0.1)", borderRadius: 18, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 18, gap: 14 },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontFamily: "Cairo_700Bold", fontSize: 18, textAlign: "right" },
});
