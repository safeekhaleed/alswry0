import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getUserMe, userLogin, userLogout, userRegister, adminLogin as apiAdminLogin } from "@workspace/api-client-react";
import type { UserAuthResponse, UserLoginInput, UserRegisterInput } from "@workspace/api-client-react";

const STORAGE_KEY = "@alsouri_user";
const ADMIN_STORAGE_KEY = "@alsouri_is_admin";
const ADMIN_EMAIL = "blaksafee@gmail.com";

function isUnauthorized(err: unknown): boolean {
  return (
    err != null &&
    typeof err === "object" &&
    "status" in err &&
    (err as { status: number }).status === 401
  );
}

type AuthState = {
  user: UserAuthResponse | null;
  isLoading: boolean;
  isAdmin: boolean;
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

  useEffect(() => {
    async function restore() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
        const adminStored = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
        setIsAdmin(adminStored === "true");
        const fresh = await getUserMe();
        setUser(fresh);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch (err) {
        if (isUnauthorized(err)) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  const loginAdmin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      await apiAdminLogin({ email, password });
      setIsAdmin(true);
      await AsyncStorage.setItem(ADMIN_STORAGE_KEY, "true");
      return true;
    } catch {
      setIsAdmin(false);
      await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
      return false;
    }
  }, []);

  const login = useCallback(async (input: UserLoginInput) => {
    const result = await userLogin(input);
    setUser(result);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  }, []);

  const register = useCallback(async (input: UserRegisterInput) => {
    const result = await userRegister(input);
    setUser(result);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  }, []);

  const logout = useCallback(async () => {
    try {
      await userLogout();
    } catch {}
    setUser(null);
    setIsAdmin(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await getUserMe();
      setUser(fresh);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, loginAdmin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}