"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAT } from "@/components/admin/AdminLanguage";

const STATS_UNAVAILABLE = "a.dash.stats_unavailable";

function num(value, locale) {
  return new Intl.NumberFormat(locale).format(Number(value) || 0);
}

function ar(value, locale) {
  return `${num(value, locale)} Ar`;
}

// Pourcentage entier (0 si on divise par zéro)
function pct(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function Bar({ value, max, tone = "emerald" }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  const color = tone === "amber" ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${value > 0 ? width : 0}%` }}
      />
    </div>
  );
}

function StatCard({ label, value, hint, href }) {
  const body = (
    <>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-3xl font-medium text-slate-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  );

  if (!href) return <div className="adm-card">{body}</div>;

  return (
    <Link
      href={href}
      className="adm-card block transition hover:border-emerald-600/60"
    >
      {body}
    </Link>
  );
}

function FunnelStep({ label, value, max, note }) {
  const { locale } = useAT();

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-slate-200">{label}</p>
        <p className="font-mono text-lg text-slate-50">{num(value, locale)}</p>
      </div>
      <Bar value={value} max={max} />
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function Stars({ value }) {
  const rounded = Math.round(Number(value) || 0);

  return (
    <span className="text-amber-400" aria-hidden="true">
      {"★".repeat(rounded)}
      <span className="text-slate-600">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export default function AdminPage() {
  const { ta, locale } = useAT();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setStats(await api.get("/stats"));
      } catch (e) {
        setError(e.message || STATS_UNAVAILABLE);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const s = stats || {};
  const r = s.reservations || {};
  const daily = s.daily || [];
  const circuits = s.circuits_stats || [];
  const places = s.places_stats || [];

  const maxDaily = Math.max(0, ...daily.map((d) => d.visits));
  const maxPlace = Math.max(0, ...places.map((p) => p.views));
  const maxCircuitViews = Math.max(0, ...circuits.map((c) => c.views));

  const visitors = s.visitors || 0;
  const logged = s.visitors_logged || 0;
  const reservers = s.reservers || 0;
  const loggedNoBooking = Math.max(logged - reservers, 0);

  const sessions = (s.sessions_direct || 0) + (s.sessions_referral || 0);

  const mostViewed = [...circuits]
    .sort((a, b) => b.views - a.views || b.reservations - a.reservations)
    .slice(0, 5);

  const bestRated = circuits
    .filter((c) => c.rating_count > 0)
    .sort((a, b) => b.rating - a.rating || b.rating_count - a.rating_count)
    .slice(0, 5);

  const dash = loading ? "…" : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="adm-h1">{ta("a.dash.title")}</h1>
        <p className="adm-sub">
          {ta("a.dash.overview", { name: "Madagascar Tour" })}
        </p>
      </div>

      {error && (
        <div className="adm-alert">
          {error === STATS_UNAVAILABLE ? ta(STATS_UNAVAILABLE) : error}
          <p className="mt-1 text-xs opacity-80">{ta("a.dash.sql_hint")}</p>
        </div>
      )}

      {/* ---------- Chiffres clés ---------- */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={ta("a.dash.visitors")}
          value={dash ?? num(s.visitors, locale)}
          hint={ta("a.dash.page_views_hint", { n: num(s.page_views, locale) })}
        />
        <StatCard
          label={ta("a.dash.accounts")}
          value={dash ?? num(s.accounts, locale)}
          hint={ta("a.dash.accounts_hint")}
        />
        <StatCard
          label={ta("a.dash.reservations")}
          value={dash ?? num(r.total, locale)}
          hint={ta("a.dash.pending_hint", { n: num(r.pending, locale) })}
          href="/admin/reservations"
        />
        <StatCard
          label={ta("a.dash.reviews_to_moderate")}
          value={dash ?? num(s.comments_pending, locale)}
          hint={ta("a.dash.reviews_total_hint", { n: num(s.comments_total, locale) })}
          href="/admin/comments"
        />
        <StatCard
          label={ta("a.dash.circuits")}
          value={dash ?? num(s.circuits, locale)}
          href="/admin/circuits"
        />
        <StatCard
          label={ta("a.dash.places")}
          value={dash ?? num(s.places, locale)}
          href="/admin/places"
        />
        <StatCard
          label={ta("a.dash.revenue_confirmed")}
          value={dash ?? ar(s.revenue_confirmed, locale)}
          hint={ta("a.dash.travelers_confirmed_hint", { n: num(s.travelers_confirmed, locale) })}
        />
        <StatCard
          label={ta("a.dash.revenue_pending")}
          value={dash ?? ar(s.revenue_pending, locale)}
          hint={ta("a.dash.requests_to_handle")}
        />
      </section>

      {stats && (
        <>
          {/* ---------- Visiteurs -> connectés -> réservations ---------- */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="adm-card space-y-5">
              <div>
                <h2 className="adm-h2">{ta("a.dash.funnel_title")}</h2>
                <p className="adm-sub !mt-0.5">
                  {ta("a.dash.funnel_sub")}
                </p>
              </div>

              <FunnelStep
                label={ta("a.dash.site_visitors")}
                value={visitors}
                max={visitors}
                note={ta("a.dash.site_visitors_note")}
              />
              <FunnelStep
                label={ta("a.dash.logged_visitors")}
                value={logged}
                max={visitors}
                note={ta("a.dash.pct_of_visitors", { p: pct(logged, visitors) })}
              />
              <FunnelStep
                label={ta("a.dash.customers_booked")}
                value={reservers}
                max={visitors}
                note={ta("a.dash.pct_of_logged_and_visitors", {
                  a: pct(reservers, logged),
                  b: pct(reservers, visitors),
                })}
              />

              <p className="adm-note">
                {ta("a.dash.no_booking_note", {
                  n: num(loggedNoBooking, locale),
                  m: num(Math.max(visitors - logged, 0), locale),
                })}
              </p>
            </div>

            <div className="adm-card space-y-5">
              <div>
                <h2 className="adm-h2">{ta("a.dash.sources_title")}</h2>
                <p className="adm-sub !mt-0.5">
                  {ta("a.dash.sources_sub")}
                </p>
              </div>

              <FunnelStep
                label={ta("a.dash.direct_access")}
                value={s.sessions_direct || 0}
                max={sessions}
                note={ta("a.dash.pct_of_visits", { p: pct(s.sessions_direct || 0, sessions) })}
              />
              <FunnelStep
                label={ta("a.dash.referral_access")}
                value={s.sessions_referral || 0}
                max={sessions}
                note={ta("a.dash.pct_of_visits", { p: pct(s.sessions_referral || 0, sessions) })}
              />

              <div>
                <h3 className="mb-3 text-sm font-medium text-slate-300">
                  {ta("a.dash.reservations_by_status")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="adm-badge text-amber-300">
                    {ta("a.dash.status_pending", { n: num(r.pending, locale) })}
                  </span>
                  <span className="adm-badge text-emerald-300">
                    {ta("a.dash.status_confirmed", { n: num(r.confirmed, locale) })}
                  </span>
                  <span className="adm-badge text-red-300">
                    {ta("a.dash.status_rejected", { n: num(r.rejected, locale) })}
                  </span>
                  <span className="adm-badge">
                    {ta("a.dash.status_cancelled", { n: num(r.cancelled, locale) })}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- 7 derniers jours ---------- */}
          <section className="adm-card">
            <h2 className="adm-h2">{ta("a.dash.last7_title")}</h2>
            <p className="adm-sub !mt-0.5">{ta("a.dash.last7_sub")}</p>

            <div className="mt-5 flex h-40 items-end gap-2 sm:gap-4">
              {daily.map((d) => {
                const height =
                  maxDaily > 0 ? Math.max(4, Math.round((d.visits / maxDaily) * 100)) : 4;

                return (
                  <div
                    key={d.day}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    title={ta("a.dash.day_tooltip", {
                      day: d.day,
                      visits: d.visits,
                      visitors: d.visitors,
                    })}
                  >
                    <span className="font-mono text-xs text-slate-400">
                      {d.visits}
                    </span>
                    <div
                      className="w-full max-w-10 rounded-t-md bg-emerald-500"
                      style={{ height: `${d.visits > 0 ? height : 4}%`, opacity: d.visits > 0 ? 1 : 0.25 }}
                    />
                    <span className="text-[11px] text-slate-500">
                      {d.day.slice(8, 10)}/{d.day.slice(5, 7)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------- Circuits ---------- */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="adm-card space-y-4">
              <h2 className="adm-h2">{ta("a.dash.most_viewed_title")}</h2>

              {mostViewed.length === 0 ? (
                <p className="adm-empty">{ta("a.dash.no_data")}</p>
              ) : (
                <ul className="space-y-4">
                  {mostViewed.map((c) => (
                    <li key={c.id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-sm text-slate-200">
                          {c.title}
                        </p>
                        <p className="shrink-0 font-mono text-sm text-slate-400">
                          {ta("a.dash.views_resa", {
                            views: num(c.views, locale),
                            resa: num(c.reservations, locale),
                          })}
                        </p>
                      </div>
                      <Bar value={c.views} max={maxCircuitViews} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="adm-card space-y-4">
              <h2 className="adm-h2">{ta("a.dash.best_rated_title")}</h2>

              {bestRated.length === 0 ? (
                <p className="adm-empty">{ta("a.dash.no_approved_reviews")}</p>
              ) : (
                <ul className="space-y-3">
                  {bestRated.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <p className="min-w-0 truncate text-sm text-slate-200">
                        {c.title}
                      </p>
                      <p className="shrink-0 text-sm">
                        <Stars value={c.rating} />{" "}
                        <span className="font-mono text-slate-300">
                          {Number(c.rating).toFixed(1)}
                        </span>{" "}
                        <span className="text-xs text-slate-500">
                          ({num(c.rating_count, locale)})
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ---------- Lieux ---------- */}
          <section className="adm-card space-y-4">
            <div>
              <h2 className="adm-h2">{ta("a.dash.top_places_title")}</h2>
              <p className="adm-sub !mt-0.5">
                {ta("a.dash.top_places_sub")}
              </p>
            </div>

            {places.length === 0 ? (
              <p className="adm-empty">{ta("a.dash.no_data")}</p>
            ) : (
              <ul className="space-y-4">
                {places.map((p) => (
                  <li key={p.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-sm text-slate-200">
                        {p.name}
                      </p>
                      <p className="shrink-0 font-mono text-sm text-slate-400">
                        {ta("a.dash.views_count", { n: num(p.views, locale) })}
                      </p>
                    </div>
                    <Bar value={p.views} max={maxPlace} tone="amber" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-xs text-slate-500">
            {ta("a.dash.footer_note")}
          </p>
        </>
      )}
    </div>
  );
}
