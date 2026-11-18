"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Admin } from "@/types";

interface AuthContextValue {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("mosaqaf_token");
      const cached = localStorage.getItem("mosaqaf_admin");
      if (token && cached) {
        try {
          setAdmin(JSON.parse(cached));
          const res = await api.get<{ admin: Admin }>("/auth/me");
          setAdmin(res.admin);
          localStorage.setItem("mosaqaf_admin", JSON.stringify(res.admin));
        } catch {
          localStorage.removeItem("mosaqaf_token");
          localStorage.removeItem("mosaqaf_admin");
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; admin: Admin }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("mosaqaf_token", res.token);
    localStorage.setItem("mosaqaf_admin", JSON.stringify(res.admin));
    setAdmin(res.admin);
  };

  const logout = () => {
    localStorage.removeItem("mosaqaf_token");
    localStorage.removeItem("mosaqaf_admin");
    setAdmin(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
