"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAT } from "@/components/admin/AdminLanguage";
import { TAGS, interpretQuery } from "@/lib/discoverTags";
import { monthName, normLang, tagLabel } from "@/lib/i18n/discover";

// Admin : catégories et meilleurs mois de chaque lieu.
// Ces informations alimentent la recherche intelligente des touristes.

const TXT = {
  fr: {
    title: "Catégories et saisons des lieux",
    sub: "Cochez les catégories de chaque lieu et ses meilleurs mois. La recherche des touristes s'appuie sur ces informations.",
    back: "Retour aux lieux",
    search: "Rechercher un lieu…",
    cats: "Catégories",
    months: "Meilleurs mois (laisser vide = toute l'année)",
    suggest: "Suggérer depuis la description",
    save: "Enregistrer",
    saved: "Enregistré",
    saving: "…",
    none: "Aucun lieu.",
    loading: "Chargement…",
    untagged: "Sans catégorie",
    only: "Seulement les lieux sans catégorie",
  },
  en: {
    title: "Place categories and seasons",
    sub: "Tick each place's categories and best months. Tourists' smart search relies on this.",
    back: "Back to places",
    search: "Search a place…",
    cats: "Categories",
    months: "Best months (empty = all year)",
    suggest: "Suggest from description",
    save: "Save",
    saved: "Saved",
    saving: "…",
    none: "No places.",
    loading: "Loading…",
    untagged: "No category",
    only: "Only places without a category",
  },
};

function PlaceTags({ place, tx, lang, onSaved }) {
  const [tags, setTags] = useState(place.tags || []);
  const [months, setMonths] = useState(place.best_months || []);
  const [state, setState] = useState("idle"); // idle | saving | saved | error
  const [error, setError] = useState("");

  const toggle = (list, setList, v) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function suggest() {
    const found = interpretQuery(`${place.name} ${place.description || ""}`).tags;

    setTags((cur) => Array.from(new Set([...cur, ...found])));
    setState("idle");
  }

  async function save() {
    try {
      setState("saving");
      setError("");
      // On renvoie aussi les champs existants : la mise à jour ne perd rien
      await api.put(`/tourist-places/${place.id}`, {
        name: place.name,
        description: place.description || "",
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        tags,
        best_months: [...months].sort((a, b) => a - b),
      });
      setState("saved");
      onSaved?.(place.id, tags, months);
    } catch (e) {
      setError(e.message || "Erreur");
      setState("error");
    }
  }

  const chip = (on) =>
    `rounded-full border px-3 py-1 text-sm transition ${
      on ? "border-transparent bg-emerald-600 text-white" : "border-current/30 opacity-80 hover:opacity-100"
    }`;

  return (
    <div className="adm-card space-y-3">
      <h2 className="font-semibold">{place.name}</h2>

      <div>
        <p className="adm-label">{tx.cats}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                toggle(tags, setTags, t);
                setState("idle");
              }}
              className={chip(tags.includes(t))}
              aria-pressed={tags.includes(t)}
            >
              {tagLabel(lang, t)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="adm-label">{tx.months}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                toggle(months, setMonths, m);
                setState("idle");
              }}
              className={chip(months.includes(m))}
              aria-pressed={months.includes(m)}
            >
              {monthName(lang, m, "short")}
            </button>
          ))}
        </div>
      </div>

      {state === "error" && <div className="adm-alert">{error}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={suggest} className="adm-btn-ghost">
          {tx.suggest}
        </button>
        <button type="button" onClick={save} disabled={state === "saving"} className="adm-btn-ok">
          {state === "saving" ? tx.saving : tx.save}
        </button>
        {state === "saved" && <span className="text-sm">✓ {tx.saved}</span>}
      </div>
    </div>
  );
}

export default function AdminPlaceTagsPage() {
  const at = useAT();
  const lang = normLang(at.lang);
  const tx = TXT[lang] || TXT.en;

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [onlyUntagged, setOnlyUntagged] = useState(false);

  useEffect(() => {
    api
      .get("/tourist-places")
      .then((list) => setPlaces(Array.isArray(list) ? list : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();

    return places.filter(
      (p) =>
        (!q || p.name?.toLowerCase().includes(q)) &&
        (!onlyUntagged || !(p.tags && p.tags.length))
    );
  }, [places, search, onlyUntagged]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="adm-h1">{tx.title}</h1>
        <p className="adm-sub">{tx.sub}</p>
        <Link href="/admin/places/list" className="adm-btn-ghost mt-3 inline-block">
          {tx.back}
        </Link>
      </div>

      {error && <div className="adm-alert">{error}</div>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tx.search}
          className="adm-input sm:max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyUntagged}
            onChange={(e) => setOnlyUntagged(e.target.checked)}
          />
          {tx.only}
        </label>
      </div>

      {loading ? (
        <p className="adm-empty">{tx.loading}</p>
      ) : shown.length === 0 ? (
        <p className="adm-empty">{tx.none}</p>
      ) : (
        shown.map((p) => <PlaceTags key={p.id} place={p} tx={tx} lang={lang} />)
      )}
    </div>
  );
}
