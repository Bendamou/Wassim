import React, { createContext, useContext, useState, useEffect } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

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
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("tawoss_user");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("tawoss_token");
  });

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("tawoss_token"));
  }, []);

  const login = (newUser: AuthUser, newToken: string) => {
    localStorage.setItem("tawoss_user", JSON.stringify(newUser));
    localStorage.setItem("tawoss_token", newToken);
    setUser(newUser);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("tawoss_user");
    localStorage.removeItem("tawoss_token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
