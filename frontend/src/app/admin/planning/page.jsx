"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/lib/api";
import { useAT } from "@/components/admin/AdminLanguage";
import { addDays, endOf, formatDay, parseIso, toIso, todayIso } from "@/lib/dates";

// Planning géant : toutes les dates de départ (jamais effacées = archive),
// les circuits en cours chaque jour et les voyageurs. Recherche par nom ou
// téléphone (le téléphone n'est jamais affiché).

// Jours de la semaine (lundi en premier) générés avec la langue de l'admin
const weekdayNames = (locale) =>
  Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i, 12).toLocaleDateString(locale, { weekday: "short" })
  );

const PALETTE = [
  "bg-emerald-500/25 text-emerald-200 border-emerald-500/40",
  "bg-sky-500/25 text-sky-200 border-sky-500/40",
  "bg-amber-500/25 text-amber-200 border-amber-500/40",
  "bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-500/40",
  "bg-rose-500/25 text-rose-200 border-rose-500/40",
  "bg-teal-500/25 text-teal-200 border-teal-500/40",
  "bg-violet-500/25 text-violet-200 border-violet-500/40",
  "bg-lime-500/25 text-lime-200 border-lime-500/40",
];

function colorOf(id) {
  let h = 0;

  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;

  return PALETTE[h % PALETTE.length];
}

const STATUS_LABEL = {
  pending: "a.pln.status_pending",
  confirmed: "a.pln.status_confirmed",
  rejected: "a.pln.status_rejected",
  cancelled: "a.pln.status_cancelled",
};

const STATUS_TEXT = {
  pending: "text-amber-300",
  confirmed: "text-emerald-300",
  rejected: "text-red-300",
  cancelled: "text-slate-400",
};

const monthTitle = (first, locale) =>
  parseIso(toIso(first)).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

function firstOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function shiftMonth(first, delta) {
  return new Date(first.getFullYear(), first.getMonth() + delta, 1, 12);
}

// Groupe départs + réservations en "voyages" (circuit + date de départ)
function buildTrips(data, showCancelled, ta) {
  const trips = new Map();

  const ensure = (circuit, circuitId, start) => {
    const key = `${circuitId}|${start}`;

    if (!trips.has(key)) {
      const duration = circuit?.duration_days || 1;

      trips.set(key, {
        key,
        circuitId,
        title: circuit?.title || ta("a.pln.circuit_default"),
        start,
        end: endOf(start, duration),
        people: [],
      });
    }

    return trips.get(key);
  };

  for (const d of data.departures || []) {
    ensure(d.circuits, d.circuit_id, d.start_date);
  }

  for (const r of data.reservations || []) {
    const trip = ensure(r.circuits, r.circuit_id, r.start_date);
    const closed = r.status === "cancelled" || r.status === "rejected";

    if (closed && !showCancelled) continue;

    trip.people.push(r);
  }

  return Array.from(trips.values());
}

function travelersOf(trip) {
  return trip.people
    .filter((p) => p.status !== "cancelled" && p.status !== "rejected")
    .reduce((sum, p) => sum + (Number(p.travelers) || 0), 0);
}

export default function PlanningPage() {
  const { ta, locale } = useAT();
  const today = todayIso();

  const [month, setMonth] = useState(() => firstOfMonth(new Date()));
  const [data, setData] = useState({ departures: [], reservations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(today);
  const [showCancelled, setShowCancelled] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState("");

  const panelRef = useRef(null);

  const monthStart = toIso(month);
  const monthEnd = toIso(shiftMonth(month, 1)).slice(0, 8) + "01";
  const lastDay = addDays(monthEnd, -1);

  // Charge le mois (et 60 jours avant, pour les circuits commencés le mois précédent)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(
          `/planning?from=${addDays(monthStart, -60)}&to=${lastDay}`
        );

        if (!cancelled) {
          setData({
            departures: res?.departures || [],
            reservations: res?.reservations || [],
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [monthStart, lastDay]);

  // Recherche (attend que la personne ait fini de taper)
  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        const res = await api.get(`/planning/search?q=${encodeURIComponent(q)}`);

        if (!cancelled) setResults({
            travelers: Array.isArray(res?.travelers) ? res.travelers : [],
            trips: Array.isArray(res?.trips) ? res.trips : [],
          });
      } catch (e) {
        if (!cancelled) {
          setResults({ travelers: [], trips: [] });
          setError(e.message);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const trips = useMemo(() => buildTrips(data, showCancelled, ta), [data, showCancelled, ta]);

  // Cases du mois : de lundi à dimanche
  const cells = useMemo(() => {
    const first = parseIso(monthStart);
    const offset = (first.getDay() + 6) % 7; // lundi = 0
    const gridStart = addDays(monthStart, -offset);
    const total = Math.ceil((offset + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7) * 7;

    return Array.from({ length: total }, (_, i) => addDays(gridStart, i));
  }, [monthStart]);

  const tripsOn = (day) => trips.filter((t) => t.start <= day && day <= t.end);

  function goToResult(r) {
    const start = r.start_date;

    setMonth(firstOfMonth(parseIso(start)));
    setSelected(start);
    setHighlight(r.id ? String(r.id) : "");

    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  }

  const dayTrips = tripsOn(selected);

  return (
    <div className="mx-auto max-w-[110rem] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-slate-50">
            {ta("a.pln.title")}
          </h1>
          <p className="text-sm text-slate-400">
            {ta("a.pln.subtitle")}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
          />
          {ta("a.pln.show_cancelled")}
        </label>
      </div>

      {/* Recherche d'un voyageur */}
      <div className="adm-card space-y-3">
        <label htmlFor="planning-search" className="text-sm text-slate-300">
          {ta("a.pln.search_label")}
        </label>

        <input
          id="planning-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ta("a.pln.search_placeholder")}
          className="adm-input w-full"
          autoComplete="off"
        />

        {searching && <p className="text-xs text-slate-500">{ta("a.pln.searching")}</p>}

        {results && !searching && (
          <div className="space-y-3">
            {results.travelers.length === 0 && results.trips.length === 0 && (
              <p className="text-sm text-slate-400">{ta("a.pln.no_results")}</p>
            )}

            {results.travelers.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {ta("a.pln.travelers_title", { n: results.travelers.length })}
                </p>
                <ul className="max-h-60 divide-y divide-slate-800 overflow-y-auto rounded-lg border border-slate-800">
                  {results.travelers.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => goToResult(r)}
                        className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800/60"
                      >
                        <span className="font-semibold text-slate-100">
                          {r.full_name || ta("a.pln.no_name")}
                        </span>
                        <span className="text-slate-300">
                          {ta("a.pln.result_traveler_line", {
                            circuit: r.circuits?.title || ta("a.pln.circuit_default"),
                            date: formatDay(r.start_date, locale),
                            n: r.travelers,
                          })}
                        </span>
                        <span
                          className={STATUS_TEXT[r.status] || "text-slate-400"}
                        >
                          {STATUS_LABEL[r.status] ? ta(STATUS_LABEL[r.status]) : r.status}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.trips.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {ta("a.pln.trips_title", { n: results.trips.length })}
                </p>
                <ul className="max-h-60 divide-y divide-slate-800 overflow-y-auto rounded-lg border border-slate-800">
                  {results.trips.map((t) => (
                    <li key={`${t.circuit_id}|${t.start_date}`}>
                      <button
                        type="button"
                        onClick={() => goToResult(t)}
                        className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800/60"
                      >
                        <span className="font-semibold text-slate-100">
                          {t.circuits?.title || ta("a.pln.circuit_default")}
                        </span>
                        <span className="text-slate-300">
                          {ta("a.pln.departure_on", { date: formatDay(t.start_date, locale) })}
                        </span>
                        <span className="text-slate-400">
                          {ta("a.pln.travelers_count", { n: t.travelers })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Calendrier */}
      <div className="adm-card space-y-3 !p-3 sm:!p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="adm-btn !px-3"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              aria-label={ta("a.pln.prev_month")}
            >
              ←
            </button>
            <button
              type="button"
              className="adm-btn !px-3"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              aria-label={ta("a.pln.next_month")}
            >
              →
            </button>
            <button
              type="button"
              className="adm-btn-ghost"
              onClick={() => {
                setMonth(firstOfMonth(new Date()));
                setSelected(today);
              }}
            >
              {ta("a.pln.today")}
            </button>
          </div>

          <h2 className="font-sans text-xl font-semibold capitalize text-slate-50">
            {monthTitle(month, locale)}
          </h2>

          <span className="text-xs text-slate-500">
            {loading ? ta("a.pln.loading") : ""}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-800 bg-slate-800">
          {weekdayNames(locale).map((d) => (
            <div
              key={d}
              className="bg-slate-900 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              {d}
            </div>
          ))}

          {cells.map((day) => {
            const inMonth = day >= monthStart && day <= lastDay;
            const list = tripsOn(day);
            const isToday = day === today;
            const isSelected = day === selected;

            return (
              <button
                type="button"
                key={day}
                onClick={() => setSelected(day)}
                className={`flex min-h-[4.5rem] flex-col items-stretch gap-1 bg-slate-950 p-1 text-left align-top transition hover:bg-slate-900 sm:min-h-[7rem] lg:min-h-[9.5rem] lg:p-1.5 ${
                  inMonth ? "" : "opacity-40"
                } ${isSelected ? "ring-2 ring-inset ring-emerald-400" : ""}`}
              >
                <span
                  className={`text-xs font-semibold ${
                    isToday
                      ? "inline-flex h-5 w-5 items-center justify-center self-start rounded-full bg-emerald-500 text-slate-950"
                      : "text-slate-300"
                  }`}
                >
                  {Number(day.slice(8))}
                </span>

                {/* Grand écran : le nom des circuits ; petit écran : des pastilles */}
                <div className="hidden min-w-0 flex-col gap-1 sm:flex">
                  {list.slice(0, 3).map((t) => (
                    <span
                      key={t.key}
                      className={`truncate rounded border px-1.5 py-0.5 text-[11px] leading-tight ${colorOf(
                        t.circuitId
                      )}`}
                      title={t.title}
                    >
                      {t.start === day ? "▶ " : ""}
                      {t.title}
                      {travelersOf(t) > 0 ? ` · ${travelersOf(t)}` : ""}
                    </span>
                  ))}

                  {list.length > 3 && (
                    <span className="text-[11px] text-slate-400">
                      {ta("a.pln.others", { n: list.length - 3 })}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {list.slice(0, 6).map((t) => (
                    <span
                      key={t.key}
                      className={`h-2 w-2 rounded-full border ${colorOf(
                        t.circuitId
                      )}`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          ▶ {ta("a.pln.legend")}
        </p>
      </div>

      {/* Détail du jour */}
      <div ref={panelRef} className="adm-card scroll-mt-4 space-y-4">
        <h2 className="font-sans text-lg font-semibold capitalize text-slate-50">
          {formatDay(selected, locale)}
        </h2>

        {dayTrips.length === 0 ? (
          <p className="text-sm text-slate-400">
            {ta("a.pln.no_trips_day")}
          </p>
        ) : (
          dayTrips.map((t) => (
            <section
              key={t.key}
              className={`space-y-2 rounded-xl border p-3 ${colorOf(t.circuitId)}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-sans text-base font-semibold text-slate-50">
                  {t.title}
                </h3>
                <p className="text-xs text-slate-300">
                  {ta("a.pln.range_line", {
                    from: formatDay(t.start, locale),
                    to: formatDay(t.end, locale),
                    n: travelersOf(t),
                  })}
                </p>
              </div>

              {t.people.length === 0 ? (
                <p className="text-sm text-slate-300">
                  {ta("a.pln.no_reservations")}
                </p>
              ) : (
                <ul className="divide-y divide-slate-700/60 text-sm">
                  {t.people.map((p) => (
                    <li
                      key={p.id}
                      className={`flex flex-wrap items-center justify-between gap-2 py-1.5 ${
                        String(p.id) === highlight
                          ? "rounded bg-emerald-400/20 px-2 font-semibold"
                          : ""
                      }`}
                    >
                      <span className="text-slate-50">
                        {p.full_name || ta("a.pln.no_name")}
                      </span>
                      <span className="text-slate-300">
                        {ta("a.pln.travelers_count", { n: p.travelers })}
                      </span>
                      <span className={STATUS_TEXT[p.status] || "text-slate-400"}>
                        {STATUS_LABEL[p.status] ? ta(STATUS_LABEL[p.status]) : p.status}
                        {p.payment_status === "paid" ? ` · ${ta("a.pln.deposit_paid")}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
