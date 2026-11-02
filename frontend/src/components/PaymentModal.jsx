"use client";

import { useEffect, useRef, useState } from "react";

import { useT } from "@/components/LanguageProvider";
import TestCardAutofill from "@/components/TestCardAutofill";
import { useCurrency } from "@/components/CurrencyProvider";
import { api } from "@/lib/api";
import { friendlyError } from "@/lib/friendlyError";
import { convert } from "@/lib/currency";
import { formatDay } from "@/lib/dates";
import {
  DEPOSIT_RATE,
  depositOf,
  formatCardNumber,
  formatExpiry,
  parseExpiry,
} from "@/lib/payment";

const ERROR_CODES = [
  "card_invalid",
  "card_declined",
  "insufficient_funds",
  "card_expired",
  "already_paid",
  "reservation_closed",
  "reservation_not_found",
];

function Hint({ text }) {
  if (!text) return null;

  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-red-200">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
      >
        !
      </span>
      {text}
    </p>
  );
}

// Fenêtre de paiement de l'acompte (SIMULATION : fausses cartes de test).
// reservation : la réservation à payer
// onPaid(reservationMiseAJour) : paiement réussi
// onLater() : la personne ferme sans payer
export default function PaymentModal({ reservation, circuitTitle, onPaid, onLater }) {
  const { t, locale } = useT();
  const { format, currency } = useCurrency();

  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [holder, setHolder] = useState("");
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [paying, setPaying] = useState(false);

  const cardRef = useRef(null);

  const deposit = depositOf(reservation);

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  function validate() {
    const found = {};
    const digits = card.replace(/\D/g, "");

    if (digits.length < 13) found.card = t("pay.v.number");

    const exp = parseExpiry(expiry);

    if (!exp) found.expiry = t("pay.v.expiry");

    if (!/^\d{3,4}$/.test(cvc)) found.cvc = t("pay.v.cvc");

    if (holder.trim().length < 2) found.holder = t("pay.v.holder");

    return found;
  }

  async function submit(e) {
    e.preventDefault();
    setFailure("");

    const found = validate();

    setErrors(found);

    if (Object.keys(found).length > 0) return;

    const exp = parseExpiry(expiry);

    try {
      setPaying(true);

      const updated = await api.post(`/reservations/${reservation.id}/pay`, {
        card_number: card,
        exp_month: exp.month,
        exp_year: exp.year,
        cvc,
        holder: holder.trim(),
        // Montant et devise vus par le client (gardés pour l'agence)
        currency,
        display_amount: convert(deposit, currency),
      });

      onPaid(updated);
    } catch (err) {
      const code = ERROR_CODES.find((c) => err?.message === c);

      setFailure(
        code
          ? t(`pay.err.${code}`)
          : err?.code === "network"
            ? friendlyError(err, t)
            : t("pay.err.generic")
      );
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="popup-overlay fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-lg sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-title"
        className="popup-box w-full max-w-md rounded-3xl border border-white/20 bg-emeraude-900/95 p-6 shadow-2xl sm:p-8"
      >
        <h2 id="pay-title" className="font-serif text-2xl font-bold text-white">
          {t("pay.title")}
        </h2>
        <p className="mt-1 text-sm text-white/80">{t("pay.saved")}</p>

        <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4">
          <p className="truncate text-xs text-white/70">
            {t("pay.circuit")} : {circuitTitle}
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-white/70">
            {t("pay.amount")}
          </p>
          <p className="font-serif text-3xl font-bold text-or-clair">
            {format(deposit)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {format(deposit, "MGA")}
          </p>
        </div>

        <p className="mt-3 text-xs text-white/75">
          {t("pay.rule", { pct: Math.round(DEPOSIT_RATE * 100) })}
        </p>

        <div className="mt-3 rounded-2xl border border-white/20 bg-white/10 p-3 text-xs text-white/85">
          <p>{t("pay.validated_rule")}</p>
          {reservation.pay_deadline && (
            <p className="mt-1.5 font-semibold text-or-clair">
              {t("pay.deadline", {
                date: formatDay(reservation.pay_deadline, locale),
              })}
            </p>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-3 text-xs text-amber-100">
          <p className="font-semibold">{t("pay.test_title")}</p>
          <p className="mt-0.5">{t("pay.test_text")}</p>
          <div className="mt-2">
            <TestCardAutofill
              holder={reservation.full_name}
              fields={{
                setCard: (v) => setCard(formatCardNumber(v)),
                setExpiry: (v) => setExpiry(formatExpiry(v)),
                setCvc,
                setHolder,
              }}
            />
          </div>
        </div>

        <form onSubmit={submit} noValidate className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="pay-card"
              className="mb-1.5 block text-xs font-medium text-white/80"
            >
              {t("pay.card_number")}
            </label>
            <input
              id="pay-card"
              ref={cardRef}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={card}
              onChange={(e) => setCard(formatCardNumber(e.target.value))}
              aria-invalid={Boolean(errors.card)}
              className="input-glass"
              dir="ltr"
            />
            <Hint text={errors.card} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="pay-exp"
                className="mb-1.5 block text-xs font-medium text-white/80"
              >
                {t("pay.expiry")}
              </label>
              <input
                id="pay-exp"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="12/30"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                aria-invalid={Boolean(errors.expiry)}
                className="input-glass"
                dir="ltr"
              />
              <Hint text={errors.expiry} />
            </div>

            <div>
              <label
                htmlFor="pay-cvc"
                className="mb-1.5 block text-xs font-medium text-white/80"
              >
                {t("pay.cvc")}
              </label>
              <input
                id="pay-cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                value={cvc}
                onChange={(e) =>
                  setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                aria-invalid={Boolean(errors.cvc)}
                className="input-glass"
                dir="ltr"
              />
              <Hint text={errors.cvc} />
            </div>
          </div>

          <div>
            <label
              htmlFor="pay-holder"
              className="mb-1.5 block text-xs font-medium text-white/80"
            >
              {t("pay.holder")}
            </label>
            <input
              id="pay-holder"
              autoComplete="cc-name"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              aria-invalid={Boolean(errors.holder)}
              className="input-glass"
            />
            <Hint text={errors.holder} />
          </div>

          {failure && (
            <div
              role="alert"
              className="rounded-2xl border border-red-400/50 bg-red-500/15 p-3 text-sm text-red-100"
            >
              <p className="font-semibold">{t("pay.fail_title")}</p>
              <p>{failure}</p>
            </div>
          )}

          <p className="text-xs text-white/60">{t("pay.secure")}</p>

          <button type="submit" disabled={paying} className="btn-gold w-full">
            {paying
              ? t("pay.processing")
              : t("pay.submit", { amount: format(deposit) })}
          </button>

          <button
            type="button"
            onClick={onLater}
            disabled={paying}
            className="w-full text-center text-sm text-white/75 underline underline-offset-4 hover:text-white"
          >
            {t("pay.later")}
          </button>
          <p className="text-center text-xs text-white/65">
            {t("pay.later_hint")}
          </p>
        </form>
      </div>
    </div>
  );
}
