import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const ADMIN_EMAIL = "blaksafee@gmail.com";

type Mode = "login" | "register";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, register, loginAdmin } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("يرجى ملء جميع الحقول");
      return;
    }
    if (mode === "register" && !username.trim()) {
      setError("يرجى إدخال اسم المستخدم");
      return;
    }
    setIsLoading(true);
    try {
      const isAdminEmail = email.trim().toLowerCase() === ADMIN_EMAIL;
      if (mode === "login" && isAdminEmail) {
        const ok = await loginAdmin(email.trim(), password);
        if (ok) {
          router.replace("/admin");
          return;
        }
      }
      if (mode === "login") {
        await login({ email: email.trim(), password });
      } else {
        await register({ username: username.trim(), email: email.trim(), password });
      }
      router.replace("/(tabs)");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "data" in err) {
        const apiErr = (err as { data?: { error?: string } }).data?.error;
        setError(apiErr ?? "بيانات الدخول غير صحيحة");
      } else if (err instanceof TypeError) {
        setError("تعذّر الاتصال بالخادم — تأكد من اتصالك بالإنترنت");
      } else {
        setError("حدث خطأ، يرجى المحاولة مجدداً");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.topGradient, { backgroundColor: colors.primary + "11" }]}
          pointerEvents="none"
        />

        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
            <Feather name="globe" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>السوري معك</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>أهلاً بعودتك</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modeTabs, { backgroundColor: colors.secondary }]}>
            <TouchableOpacity
              style={[styles.modeTab, mode === "login" && { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }]}
              onPress={() => { setMode("login"); setError(null); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeTabText, { color: mode === "login" ? colors.foreground : colors.mutedForeground }]}>تسجيل الدخول</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === "register" && { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }]}
              onPress={() => { setMode("register"); setError(null); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeTabText, { color: mode === "register" ? colors.foreground : colors.mutedForeground }]}>إنشاء حساب</Text>
            </TouchableOpacity>
          </View>

          {mode === "register" && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>اسم المستخدم</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="أدخل اسمك"
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="right"
                  autoCapitalize="none"
                />
                <Feather name="user" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              </View>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>البريد الإلكتروني</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
              <Feather name="mail" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>كلمة المرور</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                textAlign="right"
              />
              <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
            </View>
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: "#ef44441a", borderColor: "#ef4444" }]}>
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={[styles.errorText, { color: "#ef4444" }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>{mode === "register" ? "إنشاء حساب" : "دخول"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  logoSection: { alignItems: "center", marginBottom: 32, gap: 8 },
  logoCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  appName: { fontFamily: "Cairo_700Bold", fontSize: 26 },
  tagline: { fontFamily: "Cairo_400Regular", fontSize: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  modeTabs: { flexDirection: "row-reverse", borderRadius: 12, padding: 4, marginBottom: 4 },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  modeTabText: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: "Cairo_600SemiBold", fontSize: 13, textAlign: "right" },
  inputRow: { flexDirection: "row-reverse", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  inputIcon: { flexShrink: 0 },
  eyeBtn: { flexShrink: 0, padding: 2 },
  input: { flex: 1, fontFamily: "Cairo_400Regular", fontSize: 15, padding: 0 },
  errorBox: { flexDirection: "row-reverse", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { fontFamily: "Cairo_400Regular", fontSize: 13, flex: 1, textAlign: "right" },
  submitBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  submitBtnText: { fontFamily: "Cairo_700Bold", fontSize: 16 },
});
