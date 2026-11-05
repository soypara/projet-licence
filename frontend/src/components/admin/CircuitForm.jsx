"use client";

import { useState } from "react";
import { TIERS } from "@/lib/pricing";
import { endOf, formatRange } from "@/lib/dates";
import { usePopup } from "@/components/PopupProvider";
import DepartureCalendarModal from "./DepartureCalendarModal";
import { useAT } from "@/components/admin/AdminLanguage";

const LANGS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "mg", label: "Malagasy" },
];

// Formulaire circuit partagé par la création et la page "Gérer".
// value = objet venant de lib/circuitForm.js ; places = lieux disponibles.

export default function CircuitForm({ value, onChange, places, children }) {
  const { showPopup } = usePopup();
  const { ta, locale } = useAT();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const duration = Number(value.duration_days) || 0;

  function openCalendar() {
    if (duration < 1) {
      showPopup({
        kind: "error",
        title: ta("a.cir.form_missing_duration_title"),
        message: ta("a.cir.form_missing_duration_msg"),
      });
      return;
    }

    setCalendarOpen(true);
  }

  function setI18n(field, lang, text) {
    onChange({ ...value, [field]: { ...value[field], [lang]: text } });
  }

  function setTier(key, text) {
    onChange({ ...value, tiers: { ...value.tiers, [key]: text } });
  }

  function addStop(placeId) {
    if (!placeId) return;
    onChange({ ...value, stops: [...value.stops, placeId] });
  }

  function removeStop(index) {
    onChange({ ...value, stops: value.stops.filter((_, i) => i !== index) });
  }

  function moveStop(index, delta) {
    const target = index + delta;

    if (target < 0 || target >= value.stops.length) return;

    const next = [...value.stops];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...value, stops: next });
  }

  const nameOf = (id) => places.find((p) => p.id === id)?.name || ta("a.cir.form_deleted_place");

  return (
    <div className="grid gap-6">
      {/* Titre et description par langue */}
      <div className="grid gap-4">
        <p className="adm-note">
          {ta("a.cir.form_langs_note")}
        </p>

        {LANGS.map((l) => (
          <div key={l.code} className="grid gap-2 rounded-lg border border-slate-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              {l.label}
            </p>

            <div>
              <label className="adm-label">{ta("a.cir.form_title")}</label>
              <input
                value={value.title[l.code]}
                onChange={(e) => setI18n("title", l.code, e.target.value)}
                className="adm-input"
              />
            </div>

            <div>
              <label className="adm-label">{ta("a.cir.form_description")}</label>
              <textarea
                rows={3}
                value={value.description[l.code]}
                onChange={(e) => setI18n("description", l.code, e.target.value)}
                className="adm-input"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Étapes */}
      <div>
        <label className="adm-label">{ta("a.cir.form_stops_label")}</label>

        {value.stops.length === 0 ? (
          <p className="mb-3 text-sm text-slate-500">
            {ta("a.cir.form_no_stops")}
          </p>
        ) : (
          <ol className="mb-3 space-y-2">
            {value.stops.map((id, index) => (
              <li
                key={`${id}-${index}`}
                className="adm-row flex items-center gap-3 !py-2"
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-300">
                  {index + 1}
                </span>

                <span className="min-w-0 flex-1 truncate text-slate-100">
                  {nameOf(id)}
                </span>

                <span className="hidden text-xs text-slate-500 sm:block">
                  {index === 0
                    ? ta("a.cir.form_stop_start")
                    : index === value.stops.length - 1
                    ? ta("a.cir.form_stop_end")
                    : ta("a.cir.form_stop_middle")}
                </span>

                <button
                  type="button"
                  onClick={() => moveStop(index, -1)}
                  disabled={index === 0}
                  className="adm-btn-ghost !px-2 !py-1 disabled:opacity-30"
                  aria-label={ta("a.cir.form_move_up")}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStop(index, 1)}
                  disabled={index === value.stops.length - 1}
                  className="adm-btn-ghost !px-2 !py-1 disabled:opacity-30"
                  aria-label={ta("a.cir.form_move_down")}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="adm-btn-danger !px-2 !py-1"
                  aria-label={ta("a.cir.form_remove")}
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        )}

        <select
          value=""
          onChange={(e) => addStop(e.target.value)}
          className="adm-input"
        >
          <option value="">{ta("a.cir.form_add_place")}</option>
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
      </div>

      {/* Durée */}
      <div className="sm:max-w-xs">
        <label className="adm-label">{ta("a.cir.form_duration")}</label>
        <input
          type="number"
          min="1"
          max="60"
          value={value.duration_days}
          onChange={(e) => onChange({ ...value, duration_days: e.target.value })}
          className="adm-input"
        />
      </div>

      {/* Dates de départ */}
      <div>
        <label className="adm-label">{ta("a.cir.form_departures_label")}</label>

        <p className="adm-note mb-3">
          {ta("a.cir.form_departures_note")}
        </p>

        {value.departures.length === 0 ? (
          <p className="mb-3 text-sm text-slate-500">
            {ta("a.cir.form_no_departures")}
          </p>
        ) : (
          <ul className="mb-3 space-y-2">
            {[...value.departures].sort().map((start) => (
              <li
                key={start}
                className="adm-row flex items-center justify-between gap-3 !py-2"
              >
                <span className="text-slate-100">
                  {duration > 0
                    ? formatRange(start, endOf(start, duration), locale, ta)
                    : formatRange(start, start, locale, ta)}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      departures: value.departures.filter((d) => d !== start),
                    })
                  }
                  className="adm-btn-danger !px-2 !py-1"
                  aria-label={ta("a.cir.form_remove_departure")}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" onClick={openCalendar} className="adm-btn-ghost">
          {ta("a.cir.form_pick_dates")}
        </button>

        {calendarOpen && (
          <DepartureCalendarModal
            duration={duration}
            selected={value.departures}
            onClose={() => setCalendarOpen(false)}
            onSave={(dates) => {
              onChange({ ...value, departures: dates });
              setCalendarOpen(false);
            }}
          />
        )}
      </div>

      {/* Tarifs */}
      <div>
        <label className="adm-label">{ta("a.cir.form_prices_label")}</label>

        <div className="grid gap-3 sm:grid-cols-5">
          {TIERS.map((tier) => (
            <div key={tier.key}>
              <p className="mb-1 text-xs text-slate-400">{ta("a.cir.form_tier_people", { label: tier.label })}</p>
              <input
                type="number"
                min="0"
                value={value.tiers[tier.key]}
                onChange={(e) => setTier(tier.key, e.target.value)}
                className="adm-input"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Photos : juste sous les tarifs, avant d'enregistrer */}
      {children && (
        <div>
          <label className="adm-label">{ta("a.cir.form_media_label")}</label>
          {children}
        </div>
      )}
    </div>
  );
}
