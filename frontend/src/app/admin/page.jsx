"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const nf = new Intl.NumberFormat("fr-FR");

function num(value) {
  return nf.format(Number(value) || 0);
}

function ar(value) {
  return `${num(value)} Ar`;
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
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-slate-200">{label}</p>
        <p className="font-mono text-lg text-slate-50">{num(value)}</p>
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
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setStats(await api.get("/stats"));
      } catch (e) {
        setError(e.message || "Statistiques indisponibles.");
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
        <h1 className="adm-h1">Dashboard</h1>
        <p className="adm-sub">Vue générale de Madagascar Tour.</p>
      </div>

      {error && (
        <div className="adm-alert">
          {error}
          <p className="mt-1 text-xs opacity-80">
            Les statistiques demandent d&apos;avoir exécuté sql/phase5_notes_stats.sql
            dans Supabase.
          </p>
        </div>
      )}

      {/* ---------- Chiffres clés ---------- */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Visiteurs"
          value={dash ?? num(s.visitors)}
          hint={`${num(s.page_views)} pages vues`}
        />
        <StatCard
          label="Comptes créés"
          value={dash ?? num(s.accounts)}
          hint="Inscrits sur le site"
        />
        <StatCard
          label="Réservations"
          value={dash ?? num(r.total)}
          hint={`${num(r.pending)} en attente`}
          href="/admin/reservations"
        />
        <StatCard
          label="Avis à modérer"
          value={dash ?? num(s.comments_pending)}
          hint={`${num(s.comments_total)} avis au total`}
          href="/admin/comments"
        />
        <StatCard
          label="Circuits"
          value={dash ?? num(s.circuits)}
          href="/admin/circuits"
        />
        <StatCard
          label="Lieux touristiques"
          value={dash ?? num(s.places)}
          href="/admin/places"
        />
        <StatCard
          label="Chiffre confirmé"
          value={dash ?? ar(s.revenue_confirmed)}
          hint={`${num(s.travelers_confirmed)} voyageur(s) confirmé(s)`}
        />
        <StatCard
          label="En attente de réponse"
          value={dash ?? ar(s.revenue_pending)}
          hint="Demandes à traiter"
        />
      </section>

      {stats && (
        <>
          {/* ---------- Visiteurs -> connectés -> réservations ---------- */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="adm-card space-y-5">
              <div>
                <h2 className="adm-h2">Du visiteur à la réservation</h2>
                <p className="adm-sub !mt-0.5">
                  Combien de personnes vont jusqu&apos;au bout.
                </p>
              </div>

              <FunnelStep
                label="Visiteurs du site"
                value={visitors}
                max={visitors}
                note="Toute personne qui ouvre le site, connectée ou non."
              />
              <FunnelStep
                label="Visiteurs qui se sont connectés"
                value={logged}
                max={visitors}
                note={`${pct(logged, visitors)} % des visiteurs`}
              />
              <FunnelStep
                label="Clients qui ont réservé"
                value={reservers}
                max={visitors}
                note={`${pct(reservers, logged)} % des connectés · ${pct(
                  reservers,
                  visitors
                )} % des visiteurs`}
              />

              <p className="adm-note">
                {num(loggedNoBooking)} personne(s) se sont connectées sans
                réserver. Visiteurs restés sans compte : {num(Math.max(visitors - logged, 0))}.
              </p>
            </div>

            <div className="adm-card space-y-5">
              <div>
                <h2 className="adm-h2">Comment arrivent-ils ?</h2>
                <p className="adm-sub !mt-0.5">
                  Visites : une par ouverture du site.
                </p>
              </div>

              <FunnelStep
                label="Lien tapé ou favori (accès direct)"
                value={s.sessions_direct || 0}
                max={sessions}
                note={`${pct(s.sessions_direct || 0, sessions)} % des visites`}
              />
              <FunnelStep
                label="Venus d'un autre site ou d'un partage"
                value={s.sessions_referral || 0}
                max={sessions}
                note={`${pct(s.sessions_referral || 0, sessions)} % des visites`}
              />

              <div>
                <h3 className="mb-3 text-sm font-medium text-slate-300">
                  Réservations par statut
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="adm-badge text-amber-300">
                    En attente : {num(r.pending)}
                  </span>
                  <span className="adm-badge text-emerald-300">
                    Confirmées : {num(r.confirmed)}
                  </span>
                  <span className="adm-badge text-red-300">
                    Refusées : {num(r.rejected)}
                  </span>
                  <span className="adm-badge">Annulées : {num(r.cancelled)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- 7 derniers jours ---------- */}
          <section className="adm-card">
            <h2 className="adm-h2">Visites des 7 derniers jours</h2>
            <p className="adm-sub !mt-0.5">Pages vues par jour.</p>

            <div className="mt-5 flex h-40 items-end gap-2 sm:gap-4">
              {daily.map((d) => {
                const height =
                  maxDaily > 0 ? Math.max(4, Math.round((d.visits / maxDaily) * 100)) : 4;

                return (
                  <div
                    key={d.day}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    title={`${d.day} : ${d.visits} pages vues, ${d.visitors} visiteur(s)`}
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
              <h2 className="adm-h2">Circuits les plus consultés</h2>

              {mostViewed.length === 0 ? (
                <p className="adm-empty">Pas encore de données.</p>
              ) : (
                <ul className="space-y-4">
                  {mostViewed.map((c) => (
                    <li key={c.id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-sm text-slate-200">
                          {c.title}
                        </p>
                        <p className="shrink-0 font-mono text-sm text-slate-400">
                          {num(c.views)} vues · {num(c.reservations)} résa.
                        </p>
                      </div>
                      <Bar value={c.views} max={maxCircuitViews} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="adm-card space-y-4">
              <h2 className="adm-h2">Circuits les mieux notés</h2>

              {bestRated.length === 0 ? (
                <p className="adm-empty">Aucun avis approuvé pour l&apos;instant.</p>
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
                          ({num(c.rating_count)})
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
              <h2 className="adm-h2">Lieux les plus visités</h2>
              <p className="adm-sub !mt-0.5">
                Pages de lieux ouvertes depuis « À découvrir » et la page Explorer.
              </p>
            </div>

            {places.length === 0 ? (
              <p className="adm-empty">Pas encore de données.</p>
            ) : (
              <ul className="space-y-4">
                {places.map((p) => (
                  <li key={p.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-sm text-slate-200">
                        {p.name}
                      </p>
                      <p className="shrink-0 font-mono text-sm text-slate-400">
                        {num(p.views)} vues
                      </p>
                    </div>
                    <Bar value={p.views} max={maxPlace} tone="amber" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-xs text-slate-500">
            Les visites sont comptées depuis l&apos;installation de la v11. Un
            visiteur est reconnu grâce à un identifiant anonyme gardé dans son
            navigateur (s&apos;il change d&apos;appareil, il compte pour un autre).
          </p>
        </>
      )}
    </div>
  );
}
