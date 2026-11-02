"use client";

import { useState } from "react";
import { usePopup } from "@/components/PopupProvider";
import {
  endOf,
  formatRange,
  parseIso,
  toIso,
  todayIso,
} from "@/lib/dates";

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

const frT = (key, vars) =>
  key === "dep.one_day" ? `le ${vars.from}` : `du ${vars.from} au ${vars.to}`;

function monthLabel(year, month) {
  const label = new Date(year, month, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Les jours d'un mois, en commençant le lundi (null = case vide)
function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= count; d += 1) cells.push(toIso(new Date(year, month, d)));

  return cells;
}

function overlaps(startA, startB, duration) {
  return startA <= endOf(startB, duration) && startB <= endOf(startA, duration);
}

function Month({ year, month, duration, draft, hover, setHover, onDayClick }) {
  const today = todayIso();
  const hoverEnd = hover ? endOf(hover, duration) : null;
  const hoverConflict = hover
    ? draft.some((start) => overlaps(start, hover, duration))
    : false;

  return (
    <div>
      <p className="mb-2 text-center text-sm font-semibold text-slate-100">
        {monthLabel(year, month)}
      </p>

      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-slate-500">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}

        {monthCells(year, month).map((iso, index) => {
          if (!iso) return <span key={`e-${index}`} />;

          const past = iso < today;
          const chosen = draft.find((s) => iso >= s && iso <= endOf(s, duration));
          const isStart = chosen === iso;
          const isEnd = chosen && iso === endOf(chosen, duration);
          const inPreview =
            !chosen && hover && !past && iso >= hover && iso <= hoverEnd;

          let style = "text-slate-200 hover:bg-slate-800";

          if (past) style = "cursor-not-allowed text-slate-700";
          else if (chosen) style = "bg-emerald-500 text-slate-950 font-semibold";
          else if (inPreview) {
            style = hoverConflict
              ? "bg-red-500/30 text-red-100"
              : "bg-emerald-500/25 text-emerald-100";
          }

          const round = `${
            isStart || (!chosen && inPreview && iso === hover) ? "rounded-l-lg" : ""
          } ${isEnd || (!chosen && inPreview && iso === hoverEnd) ? "rounded-r-lg" : ""}`;

          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              onClick={() => onDayClick(iso)}
              onMouseEnter={() => setHover(iso)}
              onMouseLeave={() => setHover(null)}
              aria-label={parseIso(iso).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              aria-pressed={Boolean(chosen)}
              className={`h-10 text-sm transition ${style} ${
                chosen || inPreview ? round : "rounded-lg"
              }`}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Grande fenêtre : on clique le 1er jour d'un départ, et les jours suivants
// (selon la durée du circuit) se sélectionnent automatiquement, consécutifs.
// Re-cliquer sur un départ choisi le retire.
export default function DepartureCalendarModal({
  duration,
  selected,
  onSave,
  onClose,
}) {
  const { showPopup } = usePopup();

  const [draft, setDraft] = useState(() => [...selected].sort());
  const [hover, setHover] = useState(null);

  const [view, setView] = useState(() => {
    const base = parseIso(selected[0] && selected[0] >= todayIso() ? selected[0] : todayIso());

    return { year: base.getFullYear(), month: base.getMonth() };
  });

  function shift(delta) {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);

      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function onDayClick(iso) {
    // Jour d'un départ déjà choisi : on retire ce départ
    const existing = draft.find((s) => iso >= s && iso <= endOf(s, duration));

    if (existing) {
      setDraft((current) => current.filter((s) => s !== existing));
      return;
    }

    if (draft.some((s) => overlaps(s, iso, duration))) {
      showPopup({
        kind: "error",
        title: "Dates déjà prises",
        message:
          "Ces jours chevauchent un autre départ de ce circuit. Choisis un premier jour qui laisse la place aux " +
          `${duration} jours.`,
      });
      return;
    }

    setDraft((current) => [...current, iso].sort());
  }

  const second = new Date(view.year, view.month + 1, 1);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choisir les dates de départ"
        className="flex h-[min(90vh,780px)] w-[min(96vw,1040px)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-200 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              Dates de départ
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Durée du circuit : <strong>{duration} jour(s)</strong>. Clique le
              1er jour du départ : les {duration} jours se sélectionnent d&apos;un
              coup. Reclique pour retirer.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="adm-btn-ghost !px-3 !py-1.5"
          >
            ✕
          </button>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto p-4 sm:p-5 lg:grid-cols-[1fr_16rem]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shift(-1)}
                className="adm-btn-ghost !px-3"
                aria-label="Mois précédent"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => shift(1)}
                className="adm-btn-ghost !px-3"
                aria-label="Mois suivant"
              >
                →
              </button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Month
                year={view.year}
                month={view.month}
                duration={duration}
                draft={draft}
                hover={hover}
                setHover={setHover}
                onDayClick={onDayClick}
              />

              <div className="hidden md:block">
                <Month
                  year={second.getFullYear()}
                  month={second.getMonth()}
                  duration={duration}
                  draft={draft}
                  hover={hover}
                  setHover={setHover}
                  onDayClick={onDayClick}
                />
              </div>
            </div>
          </div>

          <aside className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Départs choisis ({draft.length})
            </p>

            {draft.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun pour l&apos;instant.</p>
            ) : (
              <ul className="space-y-2">
                {draft.map((start) => (
                  <li
                    key={start}
                    className="adm-row flex items-center justify-between gap-2 !py-2"
                  >
                    <span className="text-sm text-slate-100">
                      {formatRange(start, endOf(start, duration), "fr-FR", frT)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => current.filter((s) => s !== start))
                      }
                      aria-label="Retirer ce départ"
                      className="adm-btn-danger !px-2 !py-1"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-800 p-4 sm:flex-row sm:justify-end sm:p-5">
          <button type="button" onClick={onClose} className="adm-btn-ghost">
            Annuler
          </button>
          <button type="button" onClick={() => onSave(draft)} className="adm-btn">
            Valider ces dates
          </button>
        </footer>
      </div>
    </div>
  );
}
