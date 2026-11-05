"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePopup } from "@/components/PopupProvider";
import { endOf, formatDay, formatRange } from "@/lib/dates";
import { CURRENCIES, formatExact, formatInCurrency } from "@/lib/currency";
import { depositOf } from "@/lib/payment";
import { useAT } from "@/components/admin/AdminLanguage";

const FILTERS = [
  { value: "all", key: "a.res.filter_all" },
  { value: "pending", key: "a.res.pending" },
  { value: "confirmed", key: "a.res.filter_confirmed" },
  { value: "rejected", key: "a.res.filter_rejected" },
  { value: "cancelled", key: "a.res.filter_cancelled" },
];

const STATUS_LABEL = {
  pending: "a.res.pending",
  confirmed: "a.res.status_confirmed",
  rejected: "a.res.status_rejected",
  cancelled: "a.res.status_cancelled",
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
  const { ta, locale } = useAT();
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
      title: ta("a.res.cancel_title"),
      message: ta("a.res.cancel_message", {
        title: r.circuits?.title || ta("a.res.circuit"),
        n: r.travelers,
      }),
      confirmLabel: ta("a.res.cancel_confirm"),
      cancelLabel: ta("a.res.cancel_keep"),
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
          title: r.circuits?.title || ta("a.res.deleted_circuit"),
        };
      }
      return acc;
    }, {})
  ).sort((a, b) => a.title.localeCompare(b.title, locale, { sensitivity: "base" }));

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
      title(a).localeCompare(title(b), locale, { sensitivity: "base" }),
    title_desc: (a, b) =>
      title(b).localeCompare(title(a), locale, { sensitivity: "base" }),
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
        <h1 className="adm-h1">{ta("a.res.title")}</h1>
        <p className="adm-sub">
          {ta("a.res.subtitle", {
            pending: pendingCount,
            total: reservations.length,
          })}
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
              {ta(f.key)} <span className="ml-1 opacity-70">({n})</span>
            </button>
          );
        })}
      </div>

      <div className="adm-card mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="f-circuit" className="adm-label">
            {ta("a.res.circuit")}
          </label>
          <select
            id="f-circuit"
            value={circuitFilter}
            onChange={(e) => setCircuitFilter(e.target.value)}
            className="adm-input"
          >
            <option value="all">{ta("a.res.all_circuits")}</option>
            {circuitOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-date" className="adm-label">
            {ta("a.res.departure_date")}
          </label>
          <select
            id="f-date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="adm-input"
          >
            <option value="all">{ta("a.res.all_dates")}</option>
            {dateOptions.map(([date, n]) => (
              <option key={date} value={date}>
                {new Date(`${date}T00:00:00`).toLocaleDateString(locale)} ({n})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-sort" className="adm-label">
            {ta("a.res.sort_by")}
          </label>
          <select
            id="f-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="adm-input"
          >
            <option value="created_desc">{ta("a.res.sort_created_desc")}</option>
            <option value="created_asc">{ta("a.res.sort_created_asc")}</option>
            <option value="start_asc">{ta("a.res.sort_start_asc")}</option>
            <option value="start_desc">{ta("a.res.sort_start_desc")}</option>
            <option value="title_asc">{ta("a.res.sort_title_asc")}</option>
            <option value="title_desc">{ta("a.res.sort_title_desc")}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-3">
          <p className="text-sm text-slate-400">
            {ta("a.res.shown_count", { n: shown.length })}
          </p>

          {filtersActive && (
            <button type="button" onClick={resetFilters} className="adm-btn-ghost">
              {ta("a.res.reset_filters")}
            </button>
          )}
        </div>
      </div>

      <section className="adm-card">
        {loading ? (
          <p className="adm-empty">{ta("a.res.loading")}</p>
        ) : shown.length === 0 ? (
          <p className="adm-empty">{ta("a.res.none")}</p>
        ) : (
          <div className="space-y-3">
            {shown.map((r) => (
              <article key={r.id} className="adm-row">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-sans font-semibold text-slate-100">
                        {r.circuits?.title || ta("a.res.deleted_circuit")}
                      </h3>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs ${
                          STATUS_CLASS[r.status] || STATUS_CLASS.pending
                        }`}
                      >
                        {STATUS_LABEL[r.status] ? ta(STATUS_LABEL[r.status]) : r.status}
                      </span>
                    </div>

                    {r.full_name && (
                      <p className="text-sm font-semibold text-slate-100">
                        {r.full_name}
                      </p>
                    )}

                    <p className="text-sm text-slate-300">
                      {ta("a.res.departure_label")}{" "}
                      {formatRange(
                        r.start_date,
                        r.circuits?.duration_days
                          ? endOf(r.start_date, r.circuits.duration_days)
                          : r.start_date,
                        locale,
                        ta
                      )}{" "}
                      · {ta("a.res.travelers", { n: r.travelers })}
                    </p>

                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                      <span>
                        {ta("a.res.phone_label")}{" "}
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
                        {ta("a.res.total", {
                          amount: formatExact(r.total_mga, "MGA", locale),
                        })}
                      </p>

                      {r.payment_status === "paid" ? (
                        <p className="text-sm font-semibold text-emerald-300">
                          ✓{" "}
                          {ta("a.res.deposit_paid", {
                            amount: formatExact(depositOf(r), "MGA", locale),
                          })}
                          {r.paid_currency && r.paid_display_amount != null && (
                            <span className="font-normal text-slate-300">
                              {" "}
                              {ta("a.res.client_paid", {
                                amount: formatInCurrency(
                                  r.paid_display_amount,
                                  r.paid_currency,
                                  locale
                                ),
                              })}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-amber-300">
                          {ta("a.res.deposit_unpaid", {
                            amount: formatExact(depositOf(r), "MGA", locale),
                          })}
                          {r.pay_deadline && (
                            <span className="text-slate-300">
                              {" "}
                              · {ta("a.res.deadline", {
                                date: formatDay(r.pay_deadline, locale),
                              })}
                            </span>
                          )}
                        </p>
                      )}

                      {r.cancel_reason === "unpaid_deadline" && (
                        <p className="text-xs text-red-300">
                          {ta("a.res.auto_cancelled")}
                        </p>
                      )}

                      <details className="text-xs text-slate-400">
                        <summary className="cursor-pointer select-none text-slate-300">
                          {ta("a.res.all_currencies")}
                        </summary>
                        <table className="mt-1 font-mono">
                          <thead>
                            <tr className="text-left text-slate-500">
                              <th className="pr-4 font-normal">{ta("a.res.col_currency")}</th>
                              <th className="pr-4 font-normal">{ta("a.res.col_total")}</th>
                              <th className="font-normal">{ta("a.res.col_deposit")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {CURRENCIES.map((c) => (
                              <tr key={c}>
                                <td className="pr-4">{c}</td>
                                <td className="pr-4">
                                  {formatExact(r.total_mga, c, locale)}
                                </td>
                                <td>{formatExact(depositOf(r), c, locale)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    </div>

                    <p className="text-xs text-slate-500">
                      {ta("a.res.received", {
                        date: new Date(r.created_at).toLocaleString(locale),
                      })}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {r.status !== "confirmed" && (
                      <button
                        type="button"
                        onClick={() => setStatus(r.id, "confirmed")}
                        className="adm-btn-ok"
                      >
                        {ta("a.res.btn_confirm")}
                      </button>
                    )}
                    {r.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => setStatus(r.id, "rejected")}
                        className="adm-btn-danger"
                      >
                        {ta("a.res.btn_reject")}
                      </button>
                    )}
                    {r.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => askCancel(r)}
                        className="adm-btn-danger"
                      >
                        {ta("a.res.btn_cancel")}
                      </button>
                    )}
                    {r.status !== "pending" && (
                      <button
                        type="button"
                        onClick={() => setStatus(r.id, "pending")}
                        className="adm-btn-ghost"
                      >
                        {ta("a.res.btn_reset_pending")}
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
