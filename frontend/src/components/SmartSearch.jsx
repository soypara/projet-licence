"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useT } from "./LanguageProvider";
import CircuitCard from "./CircuitCard";
import useCircuitsWithMedia from "./useCircuitsWithMedia";
import { dtext, monthName, normLang, tagLabel } from "@/lib/i18n/discover";

// Recherche intelligente : la personne décrit ce qu'elle aime, le serveur
// (GET /discover) classe les lieux et circuits RÉELS de la base.
// Rien n'est inventé : on n'affiche que ce que la base contient.

function nextMonths(n = 12) {
  const out = [];
  const d = new Date();

  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    const m = x.getMonth() + 1;

    out.push({ value: `${x.getFullYear()}-${String(m).padStart(2, "0")}`, m, y: x.getFullYear() });
  }

  return out;
}

function Reasons({ reasons, lang }) {
  const lines = [];

  (reasons || []).forEach((r, i) => {
    const tags = (r.tags || []).map((x) => tagLabel(lang, x)).join(", ");

    if (r.type === "tags") lines.push([i, dtext(lang, "r_tags", { tags })]);
    else if (r.type === "alt") lines.push([i, dtext(lang, "r_alt", { tags })]);
    else if (r.type === "text") lines.push([i, dtext(lang, "r_text")]);
    else if (r.type === "season_ok") lines.push([i, dtext(lang, "r_ok")]);
    else if (r.type === "season_off") lines.push([i, dtext(lang, "r_off")]);
    else if (r.type === "weather") lines.push([i, dtext(lang, `v_${r.verdict}`)]);
  });

  if (lines.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1 text-sm text-white/80">
      {lines.map(([k, text]) => (
        <li key={k} className="flex gap-2">
          <span aria-hidden="true" className="text-or-clair">•</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

function PlaceResultCard({ place, cover, reasons, lang }) {
  return (
    <article className="glass flex flex-col overflow-hidden p-0">
      <div className="h-40 w-full bg-emeraude-800/60">
        {cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h4 className="font-serif text-lg font-bold text-white">{place.name}</h4>

        {place.description && (
          <p className="line-clamp-3 text-sm text-white/80">{place.description}</p>
        )}

        <Reasons reasons={reasons} lang={lang} />

        <a
          href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glass mt-3 self-start !px-4 !py-2 text-sm"
        >
          {dtext(lang, "map")}
        </a>
      </div>
    </article>
  );
}

export default function SmartSearch() {
  const tx = useT();
  const lang = normLang(tx.lang || tx.language || tx.locale);

  const { circuits, media } = useCircuitsWithMedia();
  const [places, setPlaces] = useState([]);
  const [placeMedia, setPlaceMedia] = useState({});

  const [text, setText] = useState("");
  const [when, setWhen] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const askedFor = useRef(0);

  const months = useMemo(() => nextMonths(12), []);

  useEffect(() => {
    api
      .get("/tourist-places")
      .then((list) => setPlaces(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  const run = useCallback(async (q, w) => {
    const ticket = ++askedFor.current;

    setLoading(true);
    setError(false);

    try {
      const res = await api.get(`/discover?q=${encodeURIComponent(q)}&when=${encodeURIComponent(w)}`);

      if (ticket === askedFor.current) setData(res);
    } catch {
      if (ticket === askedFor.current) setError(true);
    } finally {
      if (ticket === askedFor.current) setLoading(false);
    }
  }, []);

  // Au chargement : suggestions pour qui n'a pas d'idée
  useEffect(() => {
    run("", "");
  }, [run]);

  // Photos des lieux affichés (une seule fois par lieu)
  useEffect(() => {
    const ids = (data?.places || []).map((p) => p.id).filter((id) => !(id in placeMedia));

    if (ids.length === 0) return;

    let active = true;

    Promise.all(
      ids.map((id) =>
        api
          .get(`/media/tourist_place/${id}`)
          .then((list) => [id, Array.isArray(list) ? list : []])
          .catch(() => [id, []])
      )
    ).then((entries) => {
      if (active) setPlaceMedia((cur) => ({ ...cur, ...Object.fromEntries(entries) }));
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function submit(e) {
    e?.preventDefault();
    run(text.trim(), when);
  }

  function pick(example) {
    setText(example);
    run(example, when);
  }

  const circuitById = useMemo(() => new Map(circuits.map((c) => [c.id, c])), [circuits]);
  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);

  const coverOf = (list) => {
    const photo = (list || []).find((m) => m.type === "photo");

    return photo ? photo.url : null;
  };

  const circuitHits = (data?.circuits || [])
    .map((r) => ({ r, c: circuitById.get(r.id) }))
    .filter((x) => x.c);

  const placeHits = (data?.places || [])
    .map((r) => ({ r, p: placeById.get(r.id) }))
    .filter((x) => x.p);

  const empty = data && !loading && circuitHits.length === 0 && placeHits.length === 0;

  let weatherNote = "";

  if (data?.weather_status === "unavailable") weatherNote = dtext(lang, "wx_ko");
  else if (data?.period === "month") weatherNote = dtext(lang, "wx_far");
  else if (data?.period === "week" && data?.weather_status === "ok") weatherNote = dtext(lang, "wx_note");

  return (
    <section id="find" className="scroll-mt-20 space-y-6 py-10">
      <div className="space-y-2">
        <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          {dtext(lang, "title")}
        </h2>
        <p className="text-white/80">{dtext(lang, "sub")}</p>
      </div>

      <form onSubmit={submit} className="glass space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder={dtext(lang, "ph")}
            aria-label={dtext(lang, "ph")}
            className="input-glass flex-1"
          />

          <label className="flex items-center gap-2 text-sm text-white/80">
            <span className="whitespace-nowrap">{dtext(lang, "when")}</span>
            <select
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="input-glass !w-auto"
            >
              <option value="">{dtext(lang, "w_any")}</option>
              <option value="week">{dtext(lang, "w_week")}</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {monthName(lang, m.m)} {m.y}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="btn-gold" disabled={loading}>
            {dtext(lang, "go")}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["ex1", "ex2", "ex3"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pick(dtext(lang, k))}
              className="chip cursor-pointer hover:bg-white/25"
            >
              {dtext(lang, k)}
            </button>
          ))}
        </div>
      </form>

      {loading && <p className="text-white/80">{dtext(lang, "loading")}</p>}
      {error && <p className="text-white">{dtext(lang, "err")}</p>}

      {weatherNote && !loading && <p className="text-sm text-white/70">{weatherNote}</p>}

      {data?.mode === "suggestions" && !loading && !empty && (
        <h3 className="font-serif text-xl font-bold text-white">{dtext(lang, "sugg")}</h3>
      )}

      {empty && <p className="text-white/80">{dtext(lang, "none")}</p>}

      {circuitHits.length > 0 && !loading && (
        <div className="space-y-3">
          {data?.mode !== "suggestions" && (
            <h3 className="font-serif text-xl font-bold text-white">{dtext(lang, "res_c")}</h3>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {circuitHits.map(({ r, c }) => (
              <div key={c.id} className="flex flex-col">
                <CircuitCard circuit={c} cover={coverOf(media[c.id])} via={[]} />
                <Reasons reasons={r.reasons} lang={lang} />
              </div>
            ))}
          </div>
        </div>
      )}

      {placeHits.length > 0 && !loading && (
        <div className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-white">{dtext(lang, "res_p")}</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {placeHits.map(({ r, p }) => (
              <PlaceResultCard
                key={p.id}
                place={p}
                cover={coverOf(placeMedia[p.id])}
                reasons={r.reasons}
                lang={lang}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
