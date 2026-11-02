"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  dictionaries,
  DEFAULT_LANG,
  LOCALES,
  RTL_LANGS,
} from "../lib/i18n/dictionaries";
import { PAYMENT_TEXTS } from "../lib/i18n/payment";

const STORAGE_KEY = "lang";

// Langue affichée quand celle du navigateur n'existe pas sur le site
// (mets "fr" pour revenir au français dans ce cas)
const FALLBACK_LANG = "en";

// Variantes régionales rattachées à une langue du site
const BASE_ALIASES = { zh: "zh-CN", pt: "pt-BR" };

function matchLang(tag) {
  if (!tag) return null;

  const clean = String(tag).replace("_", "-").toLowerCase();
  const codes = Object.keys(dictionaries);

  const exact = codes.find((c) => c.toLowerCase() === clean);

  if (exact) return exact;

  const base = clean.split("-")[0];

  return (
    BASE_ALIASES[base] || codes.find((c) => c.toLowerCase() === base) || null
  );
}

// Langues du navigateur, dans l'ordre de préférence de la personne :
// on prend la première que le site propose.
export function detectLang() {
  const list =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

  for (const tag of list) {
    const found = matchLang(tag);

    if (found) return found;
  }

  return FALLBACK_LANG;
}

// Cherche un texte : langue choisie, puis textes du paiement (langue, puis
// anglais), puis français.
function lookup(lang, key) {
  return (
    dictionaries[lang]?.[key] ??
    PAYMENT_TEXTS[lang]?.[key] ??
    PAYMENT_TEXTS.en[key] ??
    dictionaries[DEFAULT_LANG][key] ??
    PAYMENT_TEXTS[DEFAULT_LANG][key] ??
    key
  );
}

const LanguageContext = createContext({
  lang: DEFAULT_LANG,
  locale: LOCALES[DEFAULT_LANG],
  setLang: () => {},
  ready: false,
  langVersion: 0,
  t: (key) => lookup(DEFAULT_LANG, key),
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);

  // ready : la langue de départ est déterminée
  const [ready, setReady] = useState(false);

  // Augmente à chaque choix de langue FAIT PAR LA PERSONNE (pas à la détection) :
  // c'est ce qui permet de changer la monnaie avec la langue.
  const [langVersion, setLangVersion] = useState(0);

  // Au chargement : langue mémorisée, sinon langue(s) du navigateur
  useEffect(() => {
    let wanted = null;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved && dictionaries[saved]) wanted = saved;
    } catch {
      // stockage indisponible
    }

    if (!wanted) wanted = detectLang();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(wanted);
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!dictionaries[next]) return;

    setLangState(next);
    setLangVersion((v) => v + 1);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignoré
    }
  }, []);

  const t = useCallback(
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
      locale: LOCALES[lang] || LOCALES[DEFAULT_LANG],
      setLang,
      ready,
      langVersion,
      t,
    }),
    [lang, setLang, ready, langVersion, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
