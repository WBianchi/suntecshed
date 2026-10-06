"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getRecaptchaToken } from "@/lib/recaptcha-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CLIENT";
  avatar: string | null;
  phone?: string | null;
  isVip?: boolean;
  vipExpiresAt?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Erro ao fazer login" };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const register = async (formData: { name: string; email: string; password: string; phone?: string }) => {
    try {
      const recaptchaToken = await getRecaptchaToken("register");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, recaptchaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Erro ao criar conta" };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
