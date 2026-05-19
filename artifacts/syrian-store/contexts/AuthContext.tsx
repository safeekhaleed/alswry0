import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "@alsouri_user";
const ADMIN_STORAGE_KEY = "@alsouri_is_admin";
const TOKEN_STORAGE_KEY = "@alsouri_token";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

export type UserAuthResponse = {
  id: number;
  username: string;
  email: string;
  balance: string | number;
  isVip: boolean;
  isAdmin?: boolean;
  pushToken?: string | null;
  accountId?: string | null;
  token?: string;
};

export type UserLoginInput = { email: string; password: string };
export type UserRegisterInput = { username: string; email: string; password: string };

async function apiCall<T = unknown>(
  path: string,
  options?: RequestInit,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: { status: number; data: unknown } = { status: res.status, data };
    throw err;
  }
  return data as T;
}

type AuthState = {
  user: UserAuthResponse | null;
  isLoading: boolean;
  isAdmin: boolean;
  token: string | null;
  login: (input: UserLoginInput) => Promise<void>;
  register: (input: UserRegisterInput) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAdmin: false,
  token: null,
  login: async () => {},
  register: async () => {},
  loginAdmin: async () => false,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function restore() {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        const adminStored = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedToken) setToken(storedToken);
        setIsAdmin(adminStored === "true");
        if (storedToken) {
          const fresh = await apiCall<UserAuthResponse>("/api/auth/me", undefined, storedToken);
          setUser(fresh);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        }
      } catch (err) {
        const e = err as { status?: number };
        if (e?.status === 401) {
          await AsyncStorage.multiRemove([STORAGE_KEY, TOKEN_STORAGE_KEY, ADMIN_STORAGE_KEY]);
          setUser(null);
          setToken(null);
          setIsAdmin(false);
        }
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  const loginAdmin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await apiCall<UserAuthResponse>("/api/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (result.token) {
        setToken(result.token);
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      }
      setUser(result);
      setIsAdmin(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      await AsyncStorage.setItem(ADMIN_STORAGE_KEY, "true");
      return true;
    } catch {
      setIsAdmin(false);
      await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
      return false;
    }
  }, []);

  const login = useCallback(async (input: UserLoginInput) => {
    const result = await apiCall<UserAuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (result.token) {
      setToken(result.token);
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    }
    setUser(result);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  }, []);

  const register = useCallback(async (input: UserRegisterInput) => {
    const result = await apiCall<UserAuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (result.token) {
      setToken(result.token);
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    }
    setUser(result);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiCall("/api/auth/logout", { method: "POST" }, token);
      }
    } catch {}
    setUser(null);
    setIsAdmin(false);
    setToken(null);
    await AsyncStorage.multiRemove([STORAGE_KEY, TOKEN_STORAGE_KEY, ADMIN_STORAGE_KEY]);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const fresh = await apiCall<UserAuthResponse>("/api/auth/me", undefined, token);
      setUser(fresh);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {}
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, token, login, register, loginAdmin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
