"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePopup } from "@/components/PopupProvider";
import { endOf, formatDay, formatRange } from "@/lib/dates";
import { CURRENCIES, formatExact, formatInCurrency } from "@/lib/currency";
import { depositOf } from "@/lib/payment";

const frT = (key, vars) =>
  key === "dep.one_day" ? `le ${vars.from}` : `du ${vars.from} au ${vars.to}`;

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmées" },
  { value: "rejected", label: "Refusées" },
  { value: "cancelled", label: "Annulées" },
];

const STATUS_LABEL = {
  pending: "En attente",
  confirmed: "Confirmée",
  rejected: "Refusée",
  cancelled: "Annulée",
};

const STATUS_CLASS = {
  pending: "text-amber-300 border-amber-500/40",
  confirmed: "text-emerald-300 border-emerald-500/40",
  rejected: "text-red-300 border-red-500/40",
  cancelled: "text-slate-400 border-slate-600",
};

// Numéro pour WhatsApp : chiffres seulement, indicatif 261 si le numéro
// commence par 0 (numéro malgache local).
function whatsappLink(phone) {
  let digits = String(phone || "").replace(/\D/g, "");

  if (digits.startsWith("0")) digits = `261${digits.slice(1)}`;

  return digits.length >= 9 ? `https://wa.me/${digits}` : "";
}

export default function AdminReservationsPage() {
  const { showPopup } = usePopup();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");
  const [circuitFilter, setCircuitFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sort, setSort] = useState("created_desc");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setReservations((await api.get("/reservations")) || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    try {
      setError("");
      const updated = await api.put(`/reservations/${id}/status`, { status });

      setReservations((current) =>
        current.map((r) => (r.id === id ? { ...r, ...updated } : r))
      );
    } catch (e) {
      setError(e.message);
    }
  }

  // Annuler une réservation : on demande confirmation avant
  function askCancel(r) {
    showPopup({
      kind: "error",
      title: "Annuler cette réservation ?",
      message: `${r.circuits?.title || "Circuit"} · ${r.travelers} voyageur(s). Elle passera dans les réservations annulées (elle reste dans l'historique).`,
      confirmLabel: "Oui, annuler",
      cancelLabel: "Non, garder",
      danger: true,
      onConfirm: () => setStatus(r.id, "cancelled"),
    });
  }

  // Choix proposés : uniquement les circuits et les dates présents dans les réservations
  const circuitOptions = Object.values(
    reservations.reduce((acc, r) => {
      if (r.circuit_id && !acc[r.circuit_id]) {
        acc[r.circuit_id] = {
          id: r.circuit_id,
          title: r.circuits?.title || "Circuit supprimé",
        };
      }
      return acc;
    }, {})
  ).sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" }));

  const dateOptions = Object.entries(
    reservations.reduce((acc, r) => {
      if (r.start_date) acc[r.start_date] = (acc[r.start_date] || 0) + 1;
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b));

  // 1) circuit + date  →  2) statut  →  3) tri
  const base = reservations.filter(
    (r) =>
      (circuitFilter === "all" || r.circuit_id === circuitFilter) &&
      (dateFilter === "all" || r.start_date === dateFilter)
  );

  const counts = base.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }),
    {}
  );

  const title = (r) => r.circuits?.title || "";

  const SORTERS = {
    created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    created_asc: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    start_asc: (a, b) => String(a.start_date).localeCompare(String(b.start_date)),
    start_desc: (a, b) => String(b.start_date).localeCompare(String(a.start_date)),
    title_asc: (a, b) =>
      title(a).localeCompare(title(b), "fr", { sensitivity: "base" }),
    title_desc: (a, b) =>
      title(b).localeCompare(title(a), "fr", { sensitivity: "base" }),
  };

  const shown = base
    .filter((r) => filter === "all" || r.status === filter)
    .sort(SORTERS[sort] || SORTERS.created_desc);

  const filtersActive =
    circuitFilter !== "all" || dateFilter !== "all" || sort !== "created_desc";

  function resetFilters() {
    setCircuitFilter("all");
    setDateFilter("all");
    setSort("created_desc");
  }

  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="adm-h1">Réservations</h1>
        <p className="adm-sub">
          {pendingCount} en attente · {reservations.length} au total
        </p>
      </div>

      {error && <div className="adm-alert mb-6">{error}</div>}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f.value === "all" ? base.length : counts[f.value] || 0;

          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={filter === f.value ? "adm-btn-ok" : "adm-btn-ghost"}
            >
              {f.label} <span className="ml-1 opacity-70">({n})</span>
            </button>
          );
        })}
      </div>

      <div className="adm-card mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="f-circuit" className="adm-label">
            Circuit
          </label>
          <select
            id="f-circuit"
            value={circuitFilter}
            onChange={(e) => setCircuitFilter(e.target.value)}
            className="adm-input"
          >
            <option value="all">Tous les circuits</option>
            {circuitOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-date" className="adm-label">
            Date de départ
          </label>
          <select
            id="f-date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="adm-input"
          >
            <option value="all">Toutes les dates</option>
            {dateOptions.map(([date, n]) => (
              <option key={date} value={date}>
                {new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR")} ({n})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-sort" className="adm-label">
            Trier par
          </label>
          <select
            id="f-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="adm-input"
          >
            <option value="created_desc">Reçues : plus récentes d&apos;abord</option>
            <option value="created_asc">Reçues : plus anciennes d&apos;abord</option>
            <option value="start_asc">Départ : le plus proche d&apos;abord</option>
            <option value="start_desc">Départ : le plus lointain d&apos;abord</option>
            <option value="title_asc">Circuit : de A à Z</option>
            <option value="title_desc">Circuit : de Z à A</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-3">
          <p className="text-sm text-slate-400">
            {shown.length} réservation(s) affichée(s)
          </p>

          {filtersActive && (
            <button type="button" onClick={resetFilters} className="adm-btn-ghost">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      <section className="adm-card">
        {loading ? (
          <p className="adm-empty">Chargement...</p>
        ) : shown.length === 0 ? (
          <p className="adm-empty">Aucune réservation.</p>
        ) : (
          <div className="space-y-3">
            {shown.map((r) => (
              <article key={r.id} className="adm-row">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-sans font-semibold text-slate-100">
                        {r.circuits?.title || "Circuit supprimé"}
                      </h3>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs ${
                          STATUS_CLASS[r.status] || STATUS_CLASS.pending
                        }`}
                      >
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </div>

                    {r.full_name && (
                      <p className="text-sm font-semibold text-slate-100">
                        {r.full_name}
                      </p>
                    )}

                    <p className="text-sm text-slate-300">
                      Départ :{" "}
                      {formatRange(
                        r.start_date,
                        r.circuits?.duration_days
                          ? endOf(r.start_date, r.circuits.duration_days)
                          : r.start_date,
                        "fr-FR",
                        frT
                      )}{" "}
                      · {r.travelers} voyageur(s)
                    </p>

                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                      <span>
                        Tél :{" "}
                        {r.phone ? (
                          <a
                            href={`tel:${r.phone.replace(/\s/g, "")}`}
                            className="font-mono text-emerald-300 underline underline-offset-2"
                          >
                            {r.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </span>

                      {whatsappLink(r.phone) && (
                        <a
                          href={whatsappLink(r.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-300 underline underline-offset-2"
                        >
                          WhatsApp
                        </a>
                      )}
                    </p>

                    {r.note && (
                      <p className="text-sm italic text-slate-400">
                        « {r.note} »
                      </p>
                    )}

                    <div className="space-y-1">
                      <p className="font-mono text-sm text-emerald-400">
                        Total : {formatExact(r.total_mga, "MGA")}
                      </p>

                      {r.payment_status === "paid" ? (
                        <p className="text-sm font-semibold text-emerald-300">
                          ✓ Acompte payé : {formatExact(depositOf(r), "MGA")}
                          {r.paid_currency && r.paid_display_amount != null && (
                            <span className="font-normal text-slate-300">
                              {" "}
                              (le client a payé{" "}
                              {formatInCurrency(
                                r.paid_display_amount,
                                r.paid_currency
                              )}
                              )
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-amber-300">
                          Acompte non payé : {formatExact(depositOf(r), "MGA")}
                          {r.pay_deadline && (
                            <span className="text-slate-300">
                              {" "}
                              · limite {formatDay(r.pay_deadline, "fr-FR")}
                            </span>
                          )}
                        </p>
                      )}

                      {r.cancel_reason === "unpaid_deadline" && (
                        <p className="text-xs text-red-300">
                          Annulée automatiquement : acompte non payé à temps.
                        </p>
                      )}

                      <details className="text-xs text-slate-400">
                        <summary className="cursor-pointer select-none text-slate-300">
                          Toutes les devises (valeurs exactes)
                        </summary>
                        <table className="mt-1 font-mono">
                          <thead>
                            <tr className="text-left text-slate-500">
                              <th className="pr-4 font-normal">Devise</th>
                              <th className="pr-4 font-normal">Total</th>
                              <th className="font-normal">Acompte</th>
                            </tr>
                          </thead>
                          <tbody>
                            {CURRENCIES.map((c) => (
                              <tr key={c}>
                                <td className="pr-4">{c}</td>
                                <td className="pr-4">
                                  {formatExact(r.total_mga, c)}
                                </td>
                                <td>{formatExact(depositOf(r), c)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    </div>

                    <p className="text-xs text-slate-500">
                      Reçue le{" "}
                      {new Date(r.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {r.status !== "confirmed" && (
                      <button
                        type="button"
                        onClick={() => setStatus(r.id, "confirmed")}
                        className="adm-btn-ok"
                      >
                        Confirmer
                      </button>
                    )}
                    {r.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => setStatus(r.id, "rejected")}
                        className="adm-btn-danger"
                      >
                        Refuser
                      </button>
                    )}
                    {r.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => askCancel(r)}
                        className="adm-btn-danger"
                      >
                        Annuler
                      </button>
                    )}
                    {r.status !== "pending" && (
                      <button
                        type="button"
                        onClick={() => setStatus(r.id, "pending")}
                        className="adm-btn-ghost"
                      >
                        Remettre en attente
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
