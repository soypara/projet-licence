"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAT } from "@/components/admin/AdminLanguage";
import { useAdminRole } from "@/components/admin/AdminRole";
import { isSuperAdmin } from "@/lib/roles";
import { CURRENCIES, formatExact, formatInCurrency } from "@/lib/currency";
import { formatDay } from "@/lib/dates";

// Solde de l'agence : une carte FICTIVE sur laquelle tombe chaque acompte payé.
// Réservé à l'Admin (super_admin). Le solde est la somme des acomptes reçus
// (non remboursables). Montants exacts, sans arrondi.

function AgencyCard({ balanceMga }) {
  const { ta, locale } = useAT();

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-emerald-800 bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 p-5 text-white shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-100/80">
            {ta("a.fin.card_title")}
          </p>
          <p className="mt-0.5 font-sans text-lg font-semibold">
            Madagascar Tour
          </p>
        </div>

        <span className="h-8 w-11 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500" />
      </div>

      <p className="mt-6 font-mono text-lg tracking-[0.25em] text-emerald-50">
        •••• •••• •••• 0001
      </p>

      <p className="mt-5 text-xs uppercase tracking-wider text-emerald-100/80">
        {ta("a.fin.balance")}
      </p>
      <p className="font-mono text-3xl font-semibold">
        {formatExact(balanceMga, "MGA", locale)}
      </p>
    </div>
  );
}

export default function FinancesPage() {
  const { ta, locale } = useAT();
  const role = useAdminRole();
  const router = useRouter();

  const [ledger, setLedger] = useState(null);
  const [error, setError] = useState("");

  const allowed = isSuperAdmin(role);

  useEffect(() => {
    // Les employés n'ont pas accès : retour au dashboard
    if (role && !allowed) router.replace("/admin");
  }, [role, allowed, router]);

  useEffect(() => {
    if (!allowed) return;

    api
      .get("/finance")
      .then(setLedger)
      .catch((e) => setError(e.message));
  }, [allowed]);

  if (!allowed) return null;

  const balance = Number(ledger?.balance_mga || 0);
  const entries = ledger?.entries || [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-slate-50">
          {ta("a.fin.title")}
        </h1>
        <p className="text-sm text-slate-400">
          {ta("a.fin.subtitle")}
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!ledger && !error && (
        <p className="text-sm text-slate-400">{ta("a.fin.loading")}</p>
      )}

      {ledger && (
        <>
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
            <AgencyCard balanceMga={balance} />

            <div className="adm-card">
              <h2 className="mb-2 font-sans text-base font-semibold text-slate-50">
                {ta("a.fin.all_currencies")}
              </h2>

              <table className="w-full font-mono text-sm">
                <tbody>
                  {CURRENCIES.map((c) => (
                    <tr key={c} className="border-t border-slate-800">
                      <td className="py-1.5 pr-4 text-slate-400">{c}</td>
                      <td className="py-1.5 text-right text-slate-100">
                        {formatExact(balance, c, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-2 text-xs text-slate-500">
                {ta("a.fin.payments_count", { n: ledger.count })}
              </p>
            </div>
          </div>

          <div className="adm-card">
            <h2 className="mb-3 font-sans text-base font-semibold text-slate-50">
              {ta("a.fin.payments_received")}
            </h2>

            {entries.length === 0 ? (
              <p className="text-sm text-slate-400">
                {ta("a.fin.no_payments")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">{ta("a.fin.col_date")}</th>
                      <th className="py-2 pr-3">{ta("a.fin.col_client")}</th>
                      <th className="py-2 pr-3">{ta("a.fin.col_circuit")}</th>
                      <th className="py-2 pr-3">{ta("a.fin.col_paid_by_client")}</th>
                      <th className="py-2 pr-3 text-right">{ta("a.fin.col_received_ariary")}</th>
                      <th className="py-2">{ta("a.fin.col_card_ref")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id} className="border-t border-slate-800 align-top">
                        <td className="py-2 pr-3 text-slate-300">
                          {new Date(e.created_at).toLocaleString(locale)}
                        </td>
                        <td className="py-2 pr-3 text-slate-100">
                          {e.full_name || "—"}
                        </td>
                        <td className="py-2 pr-3 text-slate-300">
                          {e.circuit_title || "—"}
                          {e.start_date && (
                            <span className="block text-xs text-slate-500">
                              {ta("a.fin.departure", { date: formatDay(e.start_date, locale) })}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 font-mono text-emerald-300">
                          {e.display_currency && e.display_amount != null
                            ? formatInCurrency(e.display_amount, e.display_currency, locale)
                            : "—"}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-100">
                          {formatExact(e.amount_mga, "MGA", locale)}
                        </td>
                        <td className="py-2 font-mono text-xs text-slate-400">
                          {e.card_brand} •••• {e.card_last4}
                          <span className="block">{e.reference}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
