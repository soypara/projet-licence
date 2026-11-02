"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CURRENCIES } from "@/lib/currency";
import { pricePerPerson } from "@/lib/pricing";
import { signInWithGoogle, GOOGLE_DISABLED } from "@/lib/google";
import { useT } from "./LanguageProvider";
import { useCurrency } from "./CurrencyProvider";
import { friendlyError } from "@/lib/friendlyError";

const STATUS_STYLE = {
  pending: "bg-amber-400/20 text-amber-200",
  confirmed: "bg-emerald-400/25 text-emerald-100",
  rejected: "bg-red-400/20 text-red-200",
  cancelled: "bg-white/15 text-white/70",
};

function todayIso() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${d.getFullYear()}-${month}-${day}`;
}

export default function ReserveSection({
  user,
  circuits,
  selectedId,
  onSelect,
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const { format } = useCurrency();

  const [form, setForm] = useState({
    start_date: "",
    travelers: 2,
    phone: "",
    note: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mine, setMine] = useState([]);

  const circuit = circuits.find((c) => c.id === selectedId);
  const travelers = Math.max(1, Number(form.travelers) || 1);
  const perPersonMga = circuit ? pricePerPerson(circuit, travelers) : 0;
  const totalMga = perPersonMga * travelers;

  async function loadMine() {
    try {
      const data = await api.get("/reservations/mine");
      setMine(Array.isArray(data) ? data : []);
    } catch {
      setMine([]);
    }
  }

  useEffect(() => {
    if (user) {
      loadMine();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMine([]);
    }
  }, [user]);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
  }

  async function handleGoogle() {
    const message = await signInWithGoogle();

    if (message === GOOGLE_DISABLED) router.push("/login");
    else if (message) setError(message);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!circuit || !form.start_date || form.phone.trim().length < 6) {
      setError(t("r.err_fields"));
      return;
    }

    try {
      setSending(true);

      await api.post("/reservations", {
        circuit_id: circuit.id,
        start_date: form.start_date,
        travelers,
        phone: form.phone.trim(),
        ...(form.note.trim() ? { note: form.note.trim() } : {}),
      });

      setSuccess(true);
      setForm({ ...form, note: "" });
      await loadMine();
    } catch (err) {
      setError(friendlyError(err, t));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">{t("nav.reserve")}</p>
        <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          {user ? t("r.title") : t("r.login_title")}
        </h2>
      </div>

      {!user ? (
        <div className="glass mx-auto max-w-md space-y-5 p-6 text-center">
          <p className="text-white/85">{t("r.login_text")}</p>

          {error && <p className="text-sm text-red-200">{error}</p>}

          <Link href="/login" className="btn-gold w-full">
            {t("auth.login_btn")}
          </Link>

          <Link href="/register" className="btn-glass w-full">
            {t("auth.create_account")}
          </Link>

          <button
            type="button"
            onClick={handleGoogle}
            className="btn-glass w-full"
          >
            {t("r.google")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass space-y-4 p-5 sm:p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/80">
              {t("r.circuit")}
            </label>
            <select
              value={selectedId || ""}
              onChange={(e) => {
                onSelect(e.target.value);
                setSuccess(false);
              }}
              className="input-glass"
            >
              <option value="" className="text-black">
                —
              </option>
              {circuits.map((c) => (
                <option key={c.id} value={c.id} className="text-black">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/80">
                {t("r.date")}
              </label>
              <input
                type="date"
                name="start_date"
                min={todayIso()}
                value={form.start_date}
                onChange={change}
                className="input-glass"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/80">
                {t("r.travelers")}
              </label>
              <input
                type="number"
                name="travelers"
                min="1"
                max="30"
                value={form.travelers}
                onChange={change}
                className="input-glass"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/80">
              {t("r.phone")}
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={change}
              placeholder="+261 34 00 000 00"
              className="input-glass"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/80">
              {t("r.note")}
            </label>
            <textarea
              name="note"
              rows={2}
              value={form.note}
              onChange={change}
              className="input-glass"
            />
          </div>

          {circuit && (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">
                {t("r.total")}
              </p>
              <p className="mt-1 font-serif text-3xl font-bold text-or-clair">
                {format(totalMga)}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {t("r.per_person")} : {format(perPersonMga)}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {CURRENCIES.map((c) => format(totalMga, c)).join(" · ")}
              </p>
            </div>
          )}

          <p className="text-xs text-white/70">{t("r.policy")}</p>

          {error && (
            <p className="rounded-xl bg-red-500/20 p-3 text-sm text-red-100">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-xl bg-emerald-400/20 p-3 text-sm text-emerald-50">
              {t("r.success")}
            </p>
          )}

          <button type="submit" disabled={sending} className="btn-gold w-full">
            {sending ? t("r.sending") : t("r.submit")}
          </button>
        </form>
      )}

      {user && (
        <div className="space-y-3">
          <h3 className="font-serif text-xl font-semibold text-white">
            {t("r.mine")}
          </h3>

          {mine.length === 0 ? (
            <p className="text-sm text-white/70">{t("r.none")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {mine.map((r) => (
                <article key={r.id} className="glass space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-sans font-semibold text-white">
                      {circuits.find((c) => c.id === r.circuit_id)?.title ||
                        r.circuits?.title ||
                        "—"}
                    </h4>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_STYLE[r.status] || STATUS_STYLE.pending
                      }`}
                    >
                      {t(`r.status.${r.status}`)}
                    </span>
                  </div>

                  <p className="text-sm text-white/80">
                    {new Date(`${r.start_date}T00:00:00`).toLocaleDateString(
                      locale
                    )}{" "}
                    · {t("r.people", { n: r.travelers })}
                  </p>

                  <p className="font-serif text-lg font-semibold text-or-clair">
                    {format(r.total_mga)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
