"use client";

import { useAT } from "./AdminLanguage";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "adminTheme";

const AdminThemeContext = createContext({ theme: "dark", toggle: () => {} });

// Thème de l'admin : sombre (défaut) ou clair. Le choix est mémorisé.
// Le mode clair inverse le noir et le blanc (voir globals.css) ;
// le vert et le rouge restent.
export function AdminThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved === "light" || saved === "dark") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(saved);
      }
    } catch {
      // stockage indisponible
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";

      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignoré
      }

      return next;
    });
  }, []);

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div data-admin-theme={theme}>{children}</div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

export function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useAdminTheme();
  const { ta } = useAT();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`adm-btn-ghost ${className}`}
    >
      {theme === "dark" ? `☀ ${ta("a.theme.light")}` : `☾ ${ta("a.theme.dark")}`}
    </button>
  );
}
