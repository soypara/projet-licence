"use client";

import { useState } from "react";
import { useT } from "./LanguageProvider";

// Champ mot de passe avec l'œil pour afficher / masquer ce qu'on tape.
// "invalid" met le champ en rouge (la page affiche le message précis).
export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  invalid = false,
}) {
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className={`input-glass !pr-12 ${
          invalid ? "!border-red-400 !ring-1 !ring-red-400" : ""
        }`}
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("auth.hide_password") : t("auth.show_password")}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/70 transition hover:text-white"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {visible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4.2 9.5 6a12.6 12.6 0 0 1-3.1 3.7M6.6 6.7A12.9 12.9 0 0 0 2.5 12c1 1.8 4.5 6 9.5 6a9.7 9.7 0 0 0 4.1-.9" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
          ) : (
            <>
              <path d="M2.5 12C3.5 10.2 7 6 12 6s8.5 4.2 9.5 6c-1 1.8-4.5 6-9.5 6s-8.5-4.2-9.5-6z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
