"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageBackground from "@/components/PageBackground";
import BackArrow from "@/components/BackArrow";
import { RatingLine } from "@/components/Stars";
import CommentsSection from "@/components/CommentsSection";
import RouteMap from "@/components/RouteMap";
import useLocalizedCircuits from "@/components/useLocalizedCircuits";
import { useT } from "@/components/LanguageProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { TIERS } from "@/lib/pricing";
import { formatRange } from "@/lib/dates";
import { api } from "../../../lib/api";
import { friendlyError } from "@/lib/friendlyError";

// Une étape du parcours : numéro, nom et description du lieu (celle saisie
// quand le lieu a été ajouté). Description longue : "Lire la suite".
function StopItem({ place, index, last }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const text = place.description || "";
  const long = text.length > 220;
  const highlight = index === 0 || last;

  return (
    <div className="flex gap-3">
      <span
        className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold ${
          highlight ? "bg-or text-emeraude-950" : "bg-emeraude-700 text-white"
        }`}
      >
        {index + 1}
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-serif text-lg font-semibold leading-snug text-white">
          {place.name}
          {index === 0 && (
            <span className="ml-2 font-sans text-xs font-medium text-or-clair">
              {t("c.start")}
            </span>
          )}
          {last && index > 0 && (
            <span className="ml-2 font-sans text-xs font-medium text-or-clair">
              {t("c.end")}
            </span>
          )}
        </p>

        {text && (
          <>
            <p
              className={`whitespace-pre-line text-sm leading-relaxed text-white/80 ${
                long && !open ? "line-clamp-3" : ""
              }`}
            >
              {text}
            </p>

            {long && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="text-xs font-semibold text-or-clair underline underline-offset-4"
              >
                {open ? t("c.read_less") : t("c.read_more")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CircuitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, locale } = useT();
  const { format } = useCurrency();

  const [raw, setRaw] = useState(null);
  const [media, setMedia] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [c, m] = await Promise.all([
          api.get(`/circuits/${id}`),
          api.get(`/media/circuit/${id}`),
        ]);
        setRaw(c);
        setMedia(Array.isArray(m) ? m : []);
      } catch (e) {
        setError(friendlyError(e, t));
      }
    }

    if (id) load();
  }, [id]);

  const list = useMemo(() => (raw ? [raw] : []), [raw]);
  const circuit = useLocalizedCircuits(list)[0] || null;

  const stops = raw?.stops || [];
  function book() {
    router.push(`/reserve?circuit=${id}`);
  }

  return (
    <>
      <PageBackground name="circuits" />

      <div className="mx-auto max-w-3xl space-y-6 py-4">
        <BackArrow href="/#circuits" />

        {error && <div className="glass p-4 text-sm text-red-100">{error}</div>}

        {!circuit && !error && <div className="glass h-48 animate-pulse" />}

        {circuit && (
          <>
            <div className="space-y-3">
              <p className="eyebrow">{t("circuit.eyebrow")}</p>
              <h1 className="hero-title !text-4xl sm:!text-5xl">
                {circuit.title}
              </h1>

              <RatingLine
                rating={raw?.rating}
                count={raw?.rating_count || 0}
                className="!text-base"
              />

              <div className="flex flex-wrap items-center gap-3">
                {circuit.duration_days && (
                  <span className="chip">
                    {t("c.days", { n: circuit.duration_days })}
                  </span>
                )}
                <p className="font-serif text-2xl font-semibold text-or-clair">
                  {t("c.from")} {format(circuit.price)}
                </p>
              </div>

              <button type="button" onClick={book} className="btn-gold">
                {t("c.book")}
              </button>
            </div>

            {media.length > 0 && (
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((m) => (
                  <div key={m.id} className="glass overflow-hidden !rounded-2xl">
                    {m.type === "photo" ? (
                      <img
                        src={m.url}
                        alt={m.alt_text || circuit.title}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <video
                        src={m.url}
                        className="h-40 w-full object-cover"
                        controls
                      />
                    )}
                  </div>
                ))}
              </section>
            )}

            <section className="glass space-y-3 p-5 sm:p-6">
              <p className="eyebrow">{t("dep.title")}</p>

              {(raw?.departures || []).length === 0 ? (
                <p className="text-sm text-white/80">{t("dep.none")}</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {raw.departures.map((d) => (
                    <li key={d.start_date}>
                      <Link
                        href={`/reserve?circuit=${id}&date=${d.start_date}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white transition hover:bg-or/20"
                      >
                        <span className="font-medium">
                          {formatRange(d.start_date, d.end_date, locale, t)}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-or-clair">
                          {t("dep.book_this")} →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {circuit.description && (
              <section className="glass p-5 sm:p-6">
                <p className="whitespace-pre-line leading-relaxed text-white/90">
                  {circuit.description}
                </p>
              </section>
            )}

            {stops.length > 0 && (
              <section className="glass space-y-4 p-5 sm:p-6">
                <p className="eyebrow">{t("c.map")}</p>

                <RouteMap stops={stops} />

                <p className="eyebrow pt-2">{t("circuit.steps")}</p>

                <ol className="space-y-4">
                  {stops.map((p, index) => (
                    <li key={p.id}>
                      <StopItem
                        place={p}
                        index={index}
                        last={index === stops.length - 1}
                      />
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {raw?.price_tiers && (
              <section className="glass space-y-3 p-5 sm:p-6">
                <p className="eyebrow">{t("c.tiers_title")}</p>
                <ul className="divide-y divide-white/15">
                  {TIERS.map((tier) => (
                    <li
                      key={tier.key}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-white/85">
                        {t("c.tier_people", { range: tier.label })}
                      </span>
                      <span className="font-semibold text-or-clair">
                        {format(raw.price_tiers[tier.key])}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="space-y-3 pt-2">
              <p className="eyebrow">{t("circuit.reviews")}</p>
              <CommentsSection circuitId={id} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
