"use client";

import { useState } from "react";
import { TIERS } from "@/lib/pricing";
import { endOf, formatRange } from "@/lib/dates";
import { usePopup } from "@/components/PopupProvider";
import DepartureCalendarModal from "./DepartureCalendarModal";

const LANGS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "mg", label: "Malagasy" },
];

// Formulaire circuit partagé par la création et la page "Gérer".
// value = objet venant de lib/circuitForm.js ; places = lieux disponibles.
const frT = (key, vars) =>
  key === "dep.one_day" ? `le ${vars.from}` : `du ${vars.from} au ${vars.to}`;

export default function CircuitForm({ value, onChange, places, children }) {
  const { showPopup } = usePopup();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const duration = Number(value.duration_days) || 0;

  function openCalendar() {
    if (duration < 1) {
      showPopup({
        kind: "error",
        title: "Durée manquante",
        message:
          "Renseigne d'abord la durée du circuit (en jours) : le calendrier en a besoin pour sélectionner les bons jours.",
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

  const nameOf = (id) => places.find((p) => p.id === id)?.name || "Lieu supprimé";

  return (
    <div className="grid gap-6">
      {/* Titre et description par langue */}
      <div className="grid gap-4">
        <p className="adm-note">
          Remplis une ou plusieurs langues. Une langue laissée vide est traduite
          automatiquement à partir de la première langue remplie ; une langue
          remplie est utilisée telle quelle.
        </p>

        {LANGS.map((l) => (
          <div key={l.code} className="grid gap-2 rounded-lg border border-slate-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              {l.label}
            </p>

            <div>
              <label className="adm-label">Titre</label>
              <input
                value={value.title[l.code]}
                onChange={(e) => setI18n("title", l.code, e.target.value)}
                className="adm-input"
              />
            </div>

            <div>
              <label className="adm-label">Description</label>
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
        <label className="adm-label">Étapes du circuit (départ → arrivée)</label>

        {value.stops.length === 0 ? (
          <p className="mb-3 text-sm text-slate-500">
            Aucune étape. Ajoute au moins 2 lieux.
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
                    ? "Départ"
                    : index === value.stops.length - 1
                    ? "Arrivée"
                    : "Étape"}
                </span>

                <button
                  type="button"
                  onClick={() => moveStop(index, -1)}
                  disabled={index === 0}
                  className="adm-btn-ghost !px-2 !py-1 disabled:opacity-30"
                  aria-label="Monter"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStop(index, 1)}
                  disabled={index === value.stops.length - 1}
                  className="adm-btn-ghost !px-2 !py-1 disabled:opacity-30"
                  aria-label="Descendre"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="adm-btn-danger !px-2 !py-1"
                  aria-label="Retirer"
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
          <option value="">+ Ajouter un lieu à la suite…</option>
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
      </div>

      {/* Durée */}
      <div className="sm:max-w-xs">
        <label className="adm-label">Durée (jours)</label>
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
        <label className="adm-label">Dates de départ</label>

        <p className="adm-note mb-3">
          Le client ne choisit plus une date libre : il choisit parmi ces
          départs. Les dates passées disparaissent toutes seules du site ; pense
          à en ajouter de nouvelles.
        </p>

        {value.departures.length === 0 ? (
          <p className="mb-3 text-sm text-slate-500">
            Aucun départ à venir. Le circuit ne peut pas être réservé tant
            qu&apos;il n&apos;y en a pas.
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
                    ? formatRange(start, endOf(start, duration), "fr-FR", frT)
                    : formatRange(start, start, "fr-FR", frT)}
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
                  aria-label="Retirer ce départ"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" onClick={openCalendar} className="adm-btn-ghost">
          Choisir / modifier les dates
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
        <label className="adm-label">Prix par personne selon le groupe (Ariary)</label>

        <div className="grid gap-3 sm:grid-cols-5">
          {TIERS.map((tier) => (
            <div key={tier.key}>
              <p className="mb-1 text-xs text-slate-400">{tier.label} pers.</p>
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
          <label className="adm-label">Photos et vidéos du circuit</label>
          {children}
        </div>
      )}
    </div>
  );
}
