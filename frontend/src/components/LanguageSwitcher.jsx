"use client";

import { LANGUAGES } from "../lib/i18n/dictionaries";
import { useT } from "./LanguageProvider";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useT();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      aria-label={t("nav.language")}
      className="rounded-full border border-white/25 bg-emeraude-900 px-2 py-1 text-xs font-medium text-white"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
