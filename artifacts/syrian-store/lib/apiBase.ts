import { Platform } from "react-native";

const PRODUCTION_API = "https://alsouri-maak-api.onrender.com";

export function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  if (Platform.OS !== "web") return PRODUCTION_API;
  return "";
}

export const apiBase = getApiBase();
