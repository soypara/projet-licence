"use client";

import { useT } from "./LanguageProvider";

// Champ de recherche des circuits (titre, lieux, descriptions)
export default function CircuitSearch({ value, onChange }) {
  const { t } = useT();

  return (
    <div className="relative max-w-xl">
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-white/70"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        className="input-glass !ps-11 !pe-11"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("search.clear")}
          className="absolute end-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-sm text-white hover:bg-white/25"
        >
          ✕
        </button>
      )}
    </div>
  );
}
