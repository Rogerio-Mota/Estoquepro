import { useEffect, useMemo, useState } from "react";

import AuthContext from "./auth-context";
import {
  clearSession,
  getStoredUser,
  hasStoredSession,
  loginRequest,
  meRequest,
  setStoredSession,
} from "../services/api";


export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(() => hasStoredSession() && !getStoredUser());

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      if (!hasStoredSession() || user) {
        return;
      }

      setLoading(true);

      try {
        const currentUser = await meRequest();

        if (!isMounted) {
          return;
        }

        setStoredSession({ user: currentUser });
        setUser(currentUser);
      } catch {
        clearSession();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [user]);

  async function login(username, password) {
    setLoading(true);

    try {
      const tokens = await loginRequest(username, password);
      const currentUser = await meRequest(tokens.access);

      setStoredSession({
        access: tokens.access,
        refresh: tokens.refresh,
        user: currentUser,
      });
      setUser(currentUser);

      return { success: true };
    } catch (error) {
      clearSession();
      return {
        success: false,
        message: error.message || "Erro ao fazer login.",
      };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: hasStoredSession(),
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
