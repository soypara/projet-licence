"use client";

import Link from "next/link";
import { AGENCY } from "@/lib/agency";
import { useT } from "./LanguageProvider";

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-or-clair"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

// Petite annonce affichée sur l'accueil : le formulaire est sur /reserve.
export default function ReserveAd() {
  const { t } = useT();

  const points = [t("ad.b1"), t("ad.b2"), t("ad.b3")];

  return (
    <div className="glass overflow-hidden p-0">
      <div className="grid gap-6 bg-gradient-to-br from-or/20 via-transparent to-transparent p-6 sm:p-8 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div className="space-y-4">
          <p className="eyebrow">{t("nav.reserve")}</p>

          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            {t("ad.title")}
          </h2>

          <p className="text-white/85">{t("ad.text")}</p>

          <ul className="space-y-2 text-sm text-white/90">
            {points.map((p) => (
              <li key={p} className="flex gap-2">
                <Check />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 md:items-stretch">
          <Link href="/reserve" className="btn-gold w-full">
            {t("ad.cta")}
          </Link>

          <a
            href={`tel:${AGENCY.phone.replace(/\s/g, "")}`}
            className="btn-glass w-full"
          >
            {t("ad.call", { phone: AGENCY.phone })}
          </a>

          <p className="text-center text-xs text-white/70">{t("r.policy")}</p>
        </div>
      </div>
    </div>
  );
}
