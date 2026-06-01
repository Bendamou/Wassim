import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "client" | "professional" | "salon_owner";
  isVerified: boolean;
  rating?: number;
  avatar?: string;
  location?: string;
  bio?: string;
  gender_pref?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem("tawoss_token"),
          AsyncStorage.getItem("tawoss_user"),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const login = async (newUser: AuthUser, newToken: string) => {
    await Promise.all([
      AsyncStorage.setItem("tawoss_token", newToken),
      AsyncStorage.setItem("tawoss_user", JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem("tawoss_token"),
      AsyncStorage.removeItem("tawoss_user"),
    ]);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
