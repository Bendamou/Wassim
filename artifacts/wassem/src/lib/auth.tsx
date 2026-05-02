import { setAuthTokenGetter } from "@workspace/api-client-react";
import React, { createContext, useContext, useState, useEffect } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: "client" | "professional";
  location?: string | null;
  bio?: string | null;
  isVerified: boolean;
  rating?: number | null;
  avatar?: string | null;
  createdAt?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem("wassem_token");
    const userStr = localStorage.getItem("wassem_user");
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  });

  useEffect(() => {
    setAuthTokenGetter(() => authState.token);
  }, [authState.token]);

  const login = (user: AuthUser, token: string) => {
    localStorage.setItem("wassem_token", token);
    localStorage.setItem("wassem_user", JSON.stringify(user));
    setAuthState({ user, token });
  };

  const logout = () => {
    localStorage.removeItem("wassem_token");
    localStorage.removeItem("wassem_user");
    setAuthState({ user: null, token: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
