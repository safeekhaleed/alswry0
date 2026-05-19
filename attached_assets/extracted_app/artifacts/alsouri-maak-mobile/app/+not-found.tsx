import { Feather } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ title: "الصفحة غير موجودة" }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={48} color={colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          هذه الصفحة غير موجودة
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            العودة إلى الرئيسية
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
  title: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 20,
    textAlign: "center",
  },
  link: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  linkText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 15,
  },
});
