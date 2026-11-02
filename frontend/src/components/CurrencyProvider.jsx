"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CURRENCIES, currencyForLang, formatPrice } from "../lib/currency";
import { useT } from "./LanguageProvider";

const STORAGE_KEY = "currency";

const CurrencyContext = createContext({
  currency: "EUR",
  setCurrency: () => {},
  format: (p) => String(p),
});

function save(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignoré
  }
}

export function CurrencyProvider({ children }) {
  const { locale, lang, ready, langVersion } = useT();
  const [currency, setCurrencyState] = useState("EUR");

  const currencyRef = useRef("EUR");
  const started = useRef(false);
  const seenVersion = useRef(0);

  const apply = useCallback((code, persist) => {
    currencyRef.current = code;
    setCurrencyState(code);

    if (persist) save(code);
  }, []);

  // 1. Au chargement (une fois la langue déterminée) : la monnaie mémorisée,
  //    sinon celle de la langue de la personne.
  useEffect(() => {
    if (!ready || started.current) return;

    started.current = true;

    let saved = null;

    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // stockage indisponible
    }

    apply(
      saved && CURRENCIES.includes(saved) ? saved : currencyForLang(lang, null),
      false
    );
  }, [ready, lang, apply]);

  // 2. Quand la personne CHOISIT une langue : la monnaie suit la langue.
  //    (Changer seulement la monnaie ne change jamais la langue.)
  useEffect(() => {
    if (langVersion === seenVersion.current) return;

    seenVersion.current = langVersion;

    apply(currencyForLang(lang, currencyRef.current), true);
  }, [langVersion, lang, apply]);

  const setCurrency = useCallback(
    (next) => {
      if (!CURRENCIES.includes(next)) return;

      apply(next, true);
    },
    [apply]
  );

  const format = useCallback(
    (priceMga, cur = currency) => formatPrice(priceMga, cur, locale),
    [currency, locale]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, format }),
    [currency, setCurrency, format]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

// Même présentation que le sélecteur de langue : une liste déroulante.
// Les noms des devises viennent du navigateur, dans la langue choisie.
export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const { t, lang } = useT();

  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang === "la" ? "it" : lang], {
        type: "currency",
      });
    } catch {
      return null;
    }
  }, [lang]);

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      aria-label={t("cur.label")}
      className="w-[6.5rem] rounded-full border border-white/25 bg-emeraude-900 px-2 py-1 text-xs font-medium text-white sm:w-auto"
    >
      {CURRENCIES.map((c) => {
        const name = names?.of(c);

        return (
          <option key={c} value={c}>
            {name && name !== c ? `${c} · ${name}` : c}
          </option>
        );
      })}
    </select>
  );
}
