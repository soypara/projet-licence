"use client";

import { useMemo } from "react";
import { useT } from "./LanguageProvider";
import { COUNTRIES, cleanNational } from "@/lib/phone";

const CONTROL_KEYS = [
  "Backspace",
  "Delete",
  "Tab",
  "Enter",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
];

// Champ téléphone : on choisit le pays (indicatif automatique, +261 pour
// Madagascar), puis on tape le numéro. Seuls les chiffres sont acceptés :
// toute lettre ou tout symbole est ignoré (clavier, collage, mobile).
export default function PhoneInput({
  id,
  value,
  onChange,
  invalid = false,
  inputRef,
  className = "",
}) {
  const { t, lang } = useT();

  const options = useMemo(() => {
    let names;

    try {
      names = new Intl.DisplayNames([lang === "mg" ? "fr" : lang], {
        type: "region",
      });
    } catch {
      names = null;
    }

    const list = COUNTRIES.map(([code, dial]) => ({
      code,
      dial,
      name: names?.of(code) || code,
    }));

    // Madagascar en premier, les autres par ordre alphabétique
    return [
      ...list.filter((c) => c.code === "MG"),
      ...list
        .filter((c) => c.code !== "MG")
        .sort((a, b) => a.name.localeCompare(b.name, lang)),
    ];
  }, [lang]);

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (CONTROL_KEYS.includes(e.key)) return;
    if (/^\d$/.test(e.key)) return;

    e.preventDefault();
  }

  const ring = invalid ? "!border-red-400 !ring-1 !ring-red-400" : "";

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        aria-label={t("ph.country")}
        value={value.country}
        onChange={(e) => onChange({ ...value, country: e.target.value })}
        className={`input-glass !w-[9.5rem] shrink-0 !px-3 ${ring}`}
      >
        {options.map((c) => (
          <option key={c.code} value={c.code} className="text-emeraude-950">
            +{c.dial} {c.name}
          </option>
        ))}
      </select>

      <input
        id={id}
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        pattern="[0-9]*"
        placeholder={value.country === "MG" ? "34 12 345 67" : ""}
        value={value.national}
        onKeyDown={onKeyDown}
        onChange={(e) =>
          onChange({ ...value, national: cleanNational(e.target.value) })
        }
        aria-invalid={invalid}
        className={`input-glass min-w-0 flex-1 ${ring}`}
      />
    </div>
  );
}
