import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, users } from "../api/client";

type User = { id: number; email: string; first_name: string | null; email_verified: boolean; is_active: boolean } | null;

const AuthContext = createContext<{
  user: User;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (first_name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (t: string | null) => void;
  loading: boolean;
}>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("tradsy_token"));
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t: string | null) => {
    if (t) localStorage.setItem("tradsy_token", t);
    else localStorage.removeItem("tradsy_token");
    setTokenState(t);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    users
      .me()
      .then(setUser)
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await auth.login({ email, password });
    setToken(access_token);
    const u = await users.me();
    setUser(u);
  }, [setToken]);

  const register = useCallback(async (first_name: string, email: string, password: string) => {
    const { access_token } = await auth.register({ first_name, email, password });
    setToken(access_token);
    const u = await users.me();
    setUser(u);
  }, [setToken]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, setToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
