"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "./LanguageProvider";
import { useCurrency } from "./CurrencyProvider";
import { RatingLine } from "./Stars";
import { formatDay } from "@/lib/dates";

// Carte de circuit. TOUTE la carte ouvre la page du circuit (photos,
// itinéraire sur la carte, durée, étapes) ; seul le bouton "Réserver"
// mène ailleurs : la page de réservation, circuit déjà choisi.
export default function CircuitCard({ circuit, cover, via = [] }) {
  const { t, locale } = useT();
  const { format } = useCurrency();
  const router = useRouter();

  const stops = circuit.stops || [];

  return (
    <article className="glass group relative flex flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:bg-white/15">
      {/* Lien étiré sur toute la carte */}
      <Link
        href={`/circuits/${circuit.id}`}
        aria-label={circuit.title}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-2 focus-visible:outline-or-clair"
      />

      <div className="relative h-44 w-full bg-emeraude-800/60">
        {cover && (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-gradient-to-t from-emeraude-950/90 to-transparent p-3 pt-10">
          {stops.length >= 2 && (
            <span className="chip">
              {stops[0].name} → {stops[stops.length - 1].name}
            </span>
          )}
          {circuit.duration_days && (
            <span className="chip">
              {t("c.days", { n: circuit.duration_days })}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-serif text-xl font-semibold text-white">
          {circuit.title}
        </h3>

        <p className="text-sm text-white/85">
          {circuit.departures?.length
            ? t("dep.next", {
                from: formatDay(circuit.departures[0].start_date, locale),
              })
            : t("dep.none_short")}
        </p>

        {via.length > 0 && (
          <p className="rounded-xl bg-or/20 px-3 py-1.5 text-xs font-medium text-or-clair">
            {t("search.via", { name: via.join(", ") })}
          </p>
        )}

        <RatingLine rating={circuit.rating} count={circuit.rating_count || 0} />

        {circuit.description && (
          <p className="line-clamp-2 text-sm text-white/80">
            {circuit.description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="text-xs text-white/70">{t("c.from")}</p>
            <p className="font-serif text-2xl font-bold text-or-clair">
              {format(circuit.price)}
              <span className="ml-1 font-sans text-xs font-normal text-white/70">
                {t("c.per_person")}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/reserve?circuit=${circuit.id}`)}
            className="btn-gold relative z-20 !px-5 !py-2.5"
          >
            {t("c.book")}
          </button>
        </div>

        <p className="text-sm font-medium text-white/85 group-hover:text-or-clair">
          {t("c.see_route")} →
        </p>
      </div>
    </article>
  );
}
