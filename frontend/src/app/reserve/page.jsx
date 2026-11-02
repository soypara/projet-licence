"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import PageBackground from "@/components/PageBackground";
import BackArrow from "@/components/BackArrow";
import { usePopup } from "@/components/PopupProvider";
import useCircuitsWithMedia, { coverOf } from "@/components/useCircuitsWithMedia";
import { useT } from "@/components/LanguageProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { HEADLINE_CURRENCIES } from "@/lib/currency";
import { pricePerPerson } from "@/lib/pricing";
import { friendlyError } from "@/lib/friendlyError";
import { rememberCircuit, takePendingCircuit } from "@/lib/reserveFlow";
import { endOf, formatDay, formatRange, todayIso } from "@/lib/dates";
import {
  detectCountry,
  emptyPhone,
  fullPhone,
  phoneError,
} from "@/lib/phone";
import PhoneInput from "@/components/PhoneInput";
import PaymentModal from "@/components/PaymentModal";
import {
  deadlineDaysFor,
  depositFor,
  depositOf,
  isPayable,
  payDeadlineFor,
} from "@/lib/payment";

const STATUS_STYLE = {
  pending: "bg-amber-400/20 text-amber-200",
  confirmed: "bg-emerald-400/25 text-emerald-100",
  rejected: "bg-red-400/20 text-red-200",
  cancelled: "bg-white/15 text-white/70",
};

/* ---------- Carte de circuit sélectionnable ---------- */

function PickCard({ circuit, cover, selected, onPick }) {
  const { t } = useT();
  const { format } = useCurrency();

  return (
    <div
      className={`glass overflow-hidden p-0 transition ${
        selected ? "ring-2 ring-or" : "hover:bg-white/15"
      }`}
    >
      <button
        type="button"
        onClick={() => onPick(circuit.id)}
        aria-pressed={selected}
        className="block w-full text-left"
      >
        <div className="relative h-36 w-full bg-emeraude-800/60">
          {cover && (
            <img
              src={cover}
              alt={circuit.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}

          {selected && (
            <span className="absolute right-3 top-3 rounded-full bg-or px-3 py-1 text-xs font-bold text-emeraude-950">
              ✓ {t("r.selected")}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-gradient-to-t from-emeraude-950/90 to-transparent p-3 pt-8">
            {circuit.stops?.length >= 2 && (
              <span className="chip">
                {circuit.stops[0].name} →{" "}
                {circuit.stops[circuit.stops.length - 1].name}
              </span>
            )}
            {circuit.duration_days && (
              <span className="chip">
                {t("c.days", { n: circuit.duration_days })}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1 p-4 pb-2">
          <h3 className="font-serif text-lg font-semibold leading-snug text-white">
            {circuit.title}
          </h3>

          <p className="text-sm text-white/80">
            {t("c.from")}{" "}
            <span className="font-semibold text-or-clair">
              {format(circuit.price)}
            </span>{" "}
            {t("c.per_person")}
          </p>
        </div>
      </button>

      <div className="px-4 pb-4">
        <Link
          href={`/circuits/${circuit.id}`}
          className="text-xs text-white/75 underline underline-offset-4 hover:text-white"
        >
          {t("c.details")}
        </Link>
      </div>
    </div>
  );
}

/* ---------- Champs ---------- */

function invalidClass(message) {
  return message ? "!border-red-400 !ring-1 !ring-red-400" : "";
}

function FieldHint({ text }) {
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

/* ---------- Page ---------- */

export default function ReservePage() {
  const { t, locale } = useT();
  const { showPopup, openAuth } = usePopup();
  const { format } = useCurrency();
  const { circuits, media, loading } = useCircuitsWithMedia();

  const [user, setUser] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    start_date: "",
    travelers: 2,
    note: "",
  });
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(emptyPhone());
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});
  const [mine, setMine] = useState([]);
  // Réservation dont on est en train de payer l'acompte
  const [paying, setPaying] = useState(null);

  const formRef = useRef(null);
  const fieldRefs = useRef({});

  const circuit = circuits.find((c) => c.id === selectedId);
  const departures = circuit?.departures || [];
  // La date choisie doit être l'un des départs du circuit
  const startDate = departures.some((d) => d.start_date === form.start_date)
    ? form.start_date
    : "";
  const travelers = Math.max(1, Number(form.travelers) || 1);
  const perPersonMga = circuit ? pricePerPerson(circuit, travelers) : 0;
  const totalMga = perPersonMga * travelers;

  // Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);

      // Compte Google : le nom est déjà connu, on le propose
      const known = data.session?.user?.user_metadata?.full_name;

      if (known) setFullName((current) => current || known);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Circuit présélectionné : ?circuit=ID, ou circuit gardé avant la connexion
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("circuit");
    const fromLogin = takePendingCircuit();
    const id = fromUrl || fromLogin;
    const date = params.get("date");

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) setSelectedId(id);

    if (date) setForm((current) => ({ ...current, start_date: date }));

    // Indicatif du pays détecté (+261 pour Madagascar)
    setPhone(emptyPhone(detectCountry()));
  }, []);

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

  function pick(id) {
    setSelectedId(id);
    setForm((current) => ({ ...current, start_date: "" }));
    setErrors({});

    // Sur téléphone, le formulaire est sous la liste : on y descend
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }

  function change(e) {
    const { name, value } = e.target;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  // Un message précis par champ manquant ou incorrect
  function validate() {
    const found = {};
    const count = Number(form.travelers);

    if (!startDate) {
      found.start_date =
        departures.length > 0 ? t("v.departure") : t("dep.none");
    }

    if (!Number.isInteger(count) || count < 1 || count > 30) {
      found.travelers = t("v.travelers");
    }

    if (fullName.trim().length < 2) found.full_name = t("v.name");

    const phoneKey = phoneError(phone);

    if (phoneKey) found.phone = t(phoneKey);

    return found;
  }

  // Après la fermeture du pop-up d'erreur : on place le curseur sur le 1er champ à corriger
  function focusFirst(found) {
    const first = ["start_date", "travelers", "full_name", "phone"].find((k) => found[k]);

    fieldRefs.current[first]?.focus();
  }

  async function sendReservation() {
    try {
      setSending(true);

      const created = await api.post("/reservations", {
        circuit_id: circuit.id,
        start_date: startDate,
        travelers,
        full_name: fullName.trim(),
        phone: fullPhone(phone),
        ...(form.note.trim() ? { note: form.note.trim() } : {}),
      });

      setForm((current) => ({ ...current, note: "" }));
      await loadMine();

      // La demande est enregistrée : on propose de payer l'acompte tout de suite
      setPaying({ ...created, circuitTitle: circuit.title });
    } catch (err) {
      showPopup({
        kind: "error",
        title: t("rsv.fail_title"),
        message: `${friendlyError(err, t)}\n\n${t("rsv.fail_hint")}`,
      });
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const found = validate();

    if (Object.keys(found).length > 0) {
      setErrors(found);

      const messages = Object.values(found);

      showPopup({
        kind: "error",
        title: messages.length === 1 ? t("v.title_one") : t("v.title_many"),
        message: messages.length === 1 ? messages[0] : "",
        items: messages.length === 1 ? [] : messages,
        onClose: () => focusFirst(found),
      });

      return;
    }

    // Pas connecté : pop-up de connexion, puis la demande part toute seule
    if (!user) {
      openAuth({
        reason: t("rsv.login_reason"),
        beforeGoogle: () => rememberCircuit(circuit.id),
        onSuccess: sendReservation,
      });

      return;
    }

    await sendReservation();
  }

  return (
    <>
      <PageBackground name="circuits" />

      <div className="space-y-8 py-4">
        <div className="space-y-3">
          <BackArrow href="/#circuits" />

          <p className="eyebrow">{t("nav.reserve")}</p>
          <h1 className="hero-title !text-4xl sm:!text-5xl">
            {t("r.page_title")}
          </h1>
          <p className="max-w-xl text-white/85">{t("r.page_subtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          {/* ---------- 1. Choix du circuit ---------- */}
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold text-white">
              {t("r.step1")}
            </h2>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="glass h-56 animate-pulse" />
                ))}
              </div>
            ) : circuits.length === 0 ? (
              <div className="glass p-6 text-center text-white/80">
                {t("c.none")}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {circuits.map((c) => (
                  <PickCard
                    key={c.id}
                    circuit={c}
                    cover={coverOf(media, c.id)}
                    selected={c.id === selectedId}
                    onPick={pick}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ---------- 2. Formulaire ---------- */}
          <section
            ref={formRef}
            className="scroll-mt-20 space-y-4 lg:sticky lg:top-20"
          >
            <h2 className="font-serif text-xl font-semibold text-white">
              {t("r.step2")}
            </h2>

            {!circuit ? (
              <div className="glass p-6 text-center text-white/80">
                {t("r.pick_first")}
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="glass space-y-4 p-5"
              >
                <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-emeraude-800/60">
                    {coverOf(media, circuit.id) && (
                      <img
                        src={coverOf(media, circuit.id)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-white/70">
                      {t("r.circuit")}
                    </p>
                    <p className="truncate font-serif text-lg font-semibold text-white">
                      {circuit.title}
                    </p>
                  </div>
                </div>

                <div>
                  <p
                    id="start_date_label"
                    className="mb-1.5 block text-xs font-medium text-white/80"
                  >
                    {t("dep.pick")} *
                  </p>

                  {departures.length === 0 ? (
                    <p className="rounded-2xl border border-white/20 bg-white/10 p-3 text-sm text-white/80">
                      {t("dep.none")}
                    </p>
                  ) : (
                    <div
                      role="radiogroup"
                      aria-labelledby="start_date_label"
                      ref={(el) => (fieldRefs.current.start_date = el)}
                      tabIndex={-1}
                      className={`grid gap-2 rounded-2xl p-1 ${
                        errors.start_date ? "ring-1 ring-red-400" : ""
                      }`}
                    >
                      {departures.map((d) => {
                        const active = d.start_date === startDate;

                        return (
                          <button
                            key={d.start_date}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                start_date: d.start_date,
                              }));
                              setErrors((current) => ({
                                ...current,
                                start_date: "",
                              }));
                            }}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                              active
                                ? "border-or bg-or/20 font-semibold text-white"
                                : "border-white/25 bg-white/10 text-white/90 hover:bg-white/15"
                            }`}
                          >
                            <span>
                              {formatRange(
                                d.start_date,
                                d.end_date,
                                locale,
                                t
                              )}
                            </span>
                            <span aria-hidden="true">{active ? "✓" : ""}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <FieldHint text={errors.start_date} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="travelers"
                      className="mb-1.5 block text-xs font-medium text-white/80"
                    >
                      {t("r.travelers")} *
                    </label>
                    <input
                      id="travelers"
                      ref={(el) => (fieldRefs.current.travelers = el)}
                      type="number"
                      name="travelers"
                      min="1"
                      max="30"
                      value={form.travelers}
                      onChange={change}
                      aria-invalid={Boolean(errors.travelers)}
                      className={`input-glass ${invalidClass(errors.travelers)}`}
                    />
                    <FieldHint text={errors.travelers} />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="full_name"
                    className="mb-1.5 block text-xs font-medium text-white/80"
                  >
                    {t("rsv.name")} *
                  </label>
                  <input
                    id="full_name"
                    ref={(el) => (fieldRefs.current.full_name = el)}
                    name="full_name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrors((current) => ({ ...current, full_name: "" }));
                    }}
                    aria-invalid={Boolean(errors.full_name)}
                    className={`input-glass ${invalidClass(errors.full_name)}`}
                  />
                  <p className="mt-1 text-xs text-white/60">{t("rsv.name_hint")}</p>
                  <FieldHint text={errors.full_name} />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-xs font-medium text-white/80"
                  >
                    {t("r.phone")} *
                  </label>
                  <PhoneInput
                    id="phone"
                    inputRef={(el) => (fieldRefs.current.phone = el)}
                    value={phone}
                    onChange={(next) => {
                      setPhone(next);
                      setErrors((current) => ({ ...current, phone: "" }));
                    }}
                    invalid={Boolean(errors.phone)}
                  />
                  <FieldHint text={errors.phone} />
                </div>

                <div>
                  <label
                    htmlFor="note"
                    className="mb-1.5 block text-xs font-medium text-white/80"
                  >
                    {t("r.note")}
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    rows={2}
                    value={form.note}
                    onChange={change}
                    className="input-glass"
                  />
                </div>

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
                    {HEADLINE_CURRENCIES.map((c) => format(totalMga, c)).join(" · ")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {t("pay.line", { amount: format(depositFor(totalMga)) })}
                  </p>
                </div>

                <p className="text-xs text-white/70">{t("r.policy")}</p>

                {startDate && (
                  <p className="rounded-2xl border border-white/20 bg-white/10 p-3 text-xs text-white/85">
                    {t("pay.rule_deadline", {
                      n: travelers,
                      days: deadlineDaysFor(travelers),
                      date: formatDay(
                        payDeadlineFor(startDate, travelers, todayIso()),
                        locale
                      ),
                    })}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-gold w-full"
                >
                  {sending ? t("r.sending") : t("r.submit")}
                </button>
              </form>
            )}
          </section>
        </div>

        {/* ---------- Mes réservations ---------- */}
        {user && (
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-white">
              {t("r.mine")}
            </h2>

            {mine.length === 0 ? (
              <p className="text-sm text-white/70">{t("r.none")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mine.map((r) => (
                  <article key={r.id} className="glass space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-sans font-semibold text-white">
                        {circuits.find((c) => c.id === r.circuit_id)?.title ||
                          r.circuits?.title ||
                          "—"}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_STYLE[r.status] || STATUS_STYLE.pending
                        }`}
                      >
                        {t(`r.status.${r.status}`)}
                      </span>
                    </div>

                    {r.cancel_reason === "unpaid_deadline" && (
                      <p className="text-xs text-red-200">
                        {t("pay.auto_cancelled")}
                      </p>
                    )}

                    <p className="text-sm text-white/80">
                      {formatRange(
                        r.start_date,
                        r.circuits?.duration_days
                          ? endOf(r.start_date, r.circuits.duration_days)
                          : r.start_date,
                        locale,
                        t
                      )}{" "}
                      · {t("r.people", { n: r.travelers })}
                    </p>

                    <p className="font-serif text-lg font-semibold text-or-clair">
                      {format(r.total_mga)}
                    </p>

                    {r.payment_status === "paid" ? (
                      <p className="text-sm font-semibold text-emerald-200">
                        ✓ {t("pay.paid")} · {format(depositOf(r))}
                      </p>
                    ) : isPayable(r) ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="btn-gold !px-4 !py-2"
                          onClick={() =>
                            setPaying({
                              ...r,
                              circuitTitle:
                                circuits.find((c) => c.id === r.circuit_id)
                                  ?.title ||
                                r.circuits?.title ||
                                "",
                            })
                          }
                        >
                          {t("pay.btn")}
                        </button>
                        <span className="text-xs text-white/75">
                          {format(depositOf(r))}
                        </span>
                        {r.pay_deadline && (
                          <span className="w-full text-xs font-semibold text-amber-200">
                            {t("pay.due_before", {
                              date: formatDay(r.pay_deadline, locale),
                            })}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {paying && (
        <PaymentModal
          reservation={paying}
          circuitTitle={paying.circuitTitle}
          onPaid={async (updated) => {
            const done = paying;

            setPaying(null);
            await loadMine();

            showPopup({
              kind: "success",
              title: t("pay.done_title"),
              message: t("pay.done_text", {
                amount: format(depositOf(updated)),
                circuit: done.circuitTitle,
                ref: updated.payment_reference || "—",
              }),
              confirmLabel: t("pay.done_ok"),
            });
          }}
          onLater={() => {
            const later = paying;

            setPaying(null);

            showPopup({
              kind: "success",
              title: t("pay.later_title"),
              message: t("pay.later_text2", {
                date: later.pay_deadline
                  ? formatDay(later.pay_deadline, locale)
                  : "—",
              }),
              confirmLabel: t("rsv.sent_ok"),
            });
          }}
        />
      )}
    </>
  );
}
