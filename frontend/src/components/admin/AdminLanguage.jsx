"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { LANGUAGES, LOCALES, RTL_LANGS } from "@/lib/i18n/dictionaries";
import { ADMIN_DICTIONARIES } from "@/lib/i18n/adminDictionaries";

// Langue de l'ADMINISTRATION : indépendante de celle du site client.
// (clé "adminLang" dans le navigateur ; la clé "lang" du site n'est pas touchée)
const STORAGE_KEY = "adminLang";
const DEFAULT_ADMIN_LANG = "fr";

function lookup(lang, key) {
  return (
    ADMIN_DICTIONARIES[lang]?.[key] ??
    ADMIN_DICTIONARIES.en?.[key] ??
    ADMIN_DICTIONARIES[DEFAULT_ADMIN_LANG]?.[key] ??
    key
  );
}

const AdminLanguageContext = createContext({
  lang: DEFAULT_ADMIN_LANG,
  locale: LOCALES[DEFAULT_ADMIN_LANG],
  dir: "ltr",
  setLang: () => {},
  ta: (key) => lookup(DEFAULT_ADMIN_LANG, key),
});

export function AdminLanguageProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_ADMIN_LANG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved && ADMIN_DICTIONARIES[saved]) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLangState(saved);
      }
    } catch {
      // stockage indisponible
    }
  }, []);

  const setLang = useCallback((next) => {
    if (!ADMIN_DICTIONARIES[next]) return;

    setLangState(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignoré
    }
  }, []);

  // ta("clé", { variable: valeur }) : texte de l'admin dans la langue de l'admin
  const ta = useCallback(
    (key, vars) => {
      const text = lookup(lang, key);

      if (!vars) return text;

      return Object.entries(vars).reduce(
        (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
        text
      );
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      locale: LOCALES[lang] || LOCALES[DEFAULT_ADMIN_LANG],
      dir: RTL_LANGS.includes(lang) ? "rtl" : "ltr",
      setLang,
      ta,
    }),
    [lang, setLang, ta]
  );

  return (
    <AdminLanguageContext.Provider value={value}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAT() {
  return useContext(AdminLanguageContext);
}

// Liste déroulante des 15 langues (pour la barre latérale de l'admin)
export function AdminLanguageSwitcher({ className = "" }) {
  const { lang, setLang, ta } = useAT();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      aria-label={ta("a.lang.label")}
      className={`adm-input ${className}`}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
