"use client";

import Link from "next/link";
import { useT } from "./LanguageProvider";

// Flèche de retour : un rond bien visible, sans texte.
// variant "site" (pages publiques, fond sombre) ou "admin".
export default function BackArrow({ href, label, variant = "site", className = "" }) {
  const { t } = useT();

  const base =
    variant === "admin"
      ? "border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
      : "border-2 border-or-clair/70 bg-emeraude-900/70 text-or-clair backdrop-blur hover:bg-or-clair hover:text-emeraude-950";

  return (
    <Link
      href={href}
      aria-label={label || t("common.back")}
      title={label || t("common.back")}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${base} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5" />
        <path d="M11 6l-6 6 6 6" />
      </svg>
    </Link>
  );
}
