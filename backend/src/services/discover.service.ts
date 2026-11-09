import { supabase } from "../config/supabase";
import { AppError } from "../middlewares/errorHandler";
import { listCircuits } from "./circuit.service";
import {
  Interpretation,
  Tag,
  TAGS,
  interpretQuery,
  normalize,
} from "../utils/discoverTags";
import {
  WeatherSummary,
  WeatherVerdict,
  getWeather,
  judgeWeather,
} from "../utils/weather";

// Recherche touristique intelligente.
// Les résultats viennent TOUJOURS de la base : rien n'est inventé.

export type PlaceRow = {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  tags?: string[] | null;
  best_months?: number[] | null;
};

export type CircuitRow = {
  id: string;
  title?: string;
  stops?: PlaceRow[];
};

export type Reason =
  | { type: "tags"; tags: string[] }
  | { type: "text" }
  | { type: "alt"; tags: string[] }
  | { type: "season_ok" }
  | { type: "season_off" }
  | { type: "weather"; verdict: WeatherVerdict };

export type PlaceResult = {
  id: string;
  score: number;
  reasons: Reason[];
  weather: WeatherSummary | null;
};

export type CircuitResult = {
  id: string;
  score: number;
  reasons: Reason[];
  matched_place_ids: string[];
};

export type DiscoverResponse = {
  interpreted: { tags: string[]; month: number | null; words: string[] };
  mode: "search" | "suggestions";
  // "none" : pas de date ; "week" : prévisions 7 jours ; "month" : saisons seulement
  period: "none" | "week" | "month";
  // ok : météo utilisée ; unavailable : service indisponible ; not_applicable : période trop lointaine
  weather_status: "ok" | "unavailable" | "not_applicable";
  places: PlaceResult[];
  circuits: CircuitResult[];
};

type Weather = Map<string, WeatherSummary>;

const MAX_PLACES = 9;
const MAX_CIRCUITS = 6;

function placeBase(place: PlaceRow, it: Interpretation) {
  const tags = (place.tags || []) as string[];
  const matched = it.tags.filter((t) => tags.includes(t));
  const tagScore = it.tags.length ? matched.length / it.tags.length : 0;

  const name = normalize(place.name || "");
  const desc = normalize(place.description || "");
  let hits = 0;

  for (const word of it.words) {
    if (name.includes(word)) hits += 2;
    else if (desc.includes(word)) hits += 0.5;
  }

  const textScore = Math.min(1, hits / 3);

  let base: number;

  if (it.tags.length && it.words.length) base = 0.65 * tagScore + 0.35 * textScore;
  else if (it.tags.length) base = tagScore;
  else if (it.words.length) base = textScore;
  else base = 0.3; // "propose-moi des idées" : tous les lieux partent à égalité

  return { base, matched, textHit: hits > 0, tags };
}

function scorePlace(
  place: PlaceRow,
  it: Interpretation,
  suggestions: boolean,
  weather: Weather | null
): PlaceResult | null {
  const { base, matched, textHit, tags } = placeBase(place, it);

  if (base <= 0) return null;

  const reasons: Reason[] = [];
  let score = base;

  if (matched.length > 0) reasons.push({ type: "tags", tags: matched });
  else if (textHit) reasons.push({ type: "text" });

  // Autres atouts du lieu (alternatives pertinentes)
  const others = tags.filter((t) => !it.tags.includes(t as Tag));

  if (it.tags.length > 0 && matched.length > 0 && others.length > 0) {
    reasons.push({ type: "alt", tags: others.slice(0, 3) });
    score += 0.03;
  }

  // Saison : seulement si le lieu a des mois recommandés renseignés
  const months = place.best_months || [];

  if (it.month && months.length > 0) {
    if (months.includes(it.month)) {
      score += 0.15;
      reasons.push({ type: "season_ok" });
    } else {
      score -= 0.15;
      reasons.push({ type: "season_off" });
    }
  }

  // Météo : prévisions des 7 prochains jours
  const w = weather?.get(place.id) || null;

  if (w) {
    const relevant = it.tags.length
      ? tags.filter((t) => it.tags.includes(t as Tag))
      : tags;
    const { verdict, factor } = judgeWeather(relevant, w);

    score *= factor;

    if (verdict !== "ok") reasons.push({ type: "weather", verdict });
  }

  if (suggestions && tags.length === 0 && months.length === 0 && !w) {
    // aucune donnée : reste possible mais en bas de liste
    score *= 0.6;
  }

  return { id: place.id, score: Math.max(0, score), reasons, weather: w };
}

// Fonction pure (testable sans base ni internet).
export function rank(
  places: PlaceRow[],
  circuits: CircuitRow[],
  it: Interpretation,
  weather: Weather | null
): Pick<DiscoverResponse, "places" | "circuits" | "mode"> {
  const suggestions = it.tags.length === 0 && it.words.length === 0;

  const placeResults = new Map<string, PlaceResult>();

  for (const place of places) {
    const result = scorePlace(place, it, suggestions, weather);

    if (result && result.score > 0) placeResults.set(place.id, result);
  }

  const circuitResults: CircuitResult[] = [];

  for (const circuit of circuits) {
    const scored = (circuit.stops || [])
      .map((stop) => placeResults.get(stop.id))
      .filter((r): r is PlaceResult => Boolean(r))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) continue;

    const top = scored[0];
    const second = scored[1]?.score ?? 0;
    const matchedStops = scored.filter((r) =>
      r.reasons.some((x) => x.type === "tags" || x.type === "text")
    );

    // Un circuit qui combine plusieurs lieux pertinents passe devant
    const score = top.score * 0.7 + second * 0.3 + Math.min(0.1, matchedStops.length * 0.03);

    const reasons: Reason[] = [];
    const tagSet = new Set<string>();

    scored.forEach((r) =>
      r.reasons.forEach((x) => {
        if (x.type === "tags") x.tags.forEach((t) => tagSet.add(t));
      })
    );

    if (tagSet.size > 0) reasons.push({ type: "tags", tags: Array.from(tagSet) });
    if (top.reasons.some((x) => x.type === "season_ok")) reasons.push({ type: "season_ok" });

    const weatherReason = top.reasons.find((x) => x.type === "weather");

    if (weatherReason) reasons.push(weatherReason);

    circuitResults.push({
      id: circuit.id,
      score,
      reasons,
      matched_place_ids: scored.slice(0, 3).map((r) => r.id),
    });
  }

  const sortBy = <T extends { score: number }>(list: T[]) =>
    list.sort((a, b) => b.score - a.score);

  return {
    mode: suggestions ? "suggestions" : "search",
    places: sortBy(Array.from(placeResults.values())).slice(0, MAX_PLACES),
    circuits: sortBy(circuitResults).slice(0, MAX_CIRCUITS),
  };
}

// when : "" (pas de date), "week" (7 prochains jours) ou "2026-11" (un mois)
export async function discover(
  query: string,
  when: string,
  weatherFetcher?: Parameters<typeof getWeather>[1]
): Promise<DiscoverResponse> {
  const it = interpretQuery(query);

  let period: DiscoverResponse["period"] = "none";

  if (when === "week") {
    period = "week";
  } else if (/^\d{4}-(0[1-9]|1[0-2])$/.test(when)) {
    period = "month";
    it.month = Number(when.slice(5));
  }

  const { data: placeData, error } = await supabase
    .from("tourist_places")
    .select("id, name, description, latitude, longitude, tags, best_months");

  if (error) throw new AppError(error.message, 500);

  const places = (placeData || []) as PlaceRow[];
  const circuits = (await listCircuits()) as unknown as CircuitRow[];

  // 1) classement sans météo, pour savoir quels lieux méritent une prévision
  let ranked = rank(places, circuits, it, null);

  let weatherStatus: DiscoverResponse["weather_status"] =
    period === "month" ? "not_applicable" : "not_applicable";
  let weather: Weather | null = null;

  if (period === "week") {
    const candidates = new Map<string, PlaceRow>();
    const byId = new Map(places.map((p) => [p.id, p]));

    ranked.places.forEach((r) => {
      const p = byId.get(r.id);
      if (p) candidates.set(p.id, p);
    });

    ranked.circuits.forEach((c) => {
      (circuits.find((x) => x.id === c.id)?.stops || []).forEach((s) => {
        const p = byId.get(s.id);
        if (p) candidates.set(p.id, p);
      });
    });

    // On regarde aussi les lieux qui matchent mais ne sont pas dans le top 9
    // (la pluie peut en faire remonter d'autres).
    const wide = rank(places, circuits, { ...it }, null);
    wide.places.forEach((r) => {
      const p = byId.get(r.id);
      if (p) candidates.set(p.id, p);
    });

    const points = Array.from(candidates.values())
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .slice(0, 60)
      .map((p) => ({ id: p.id, latitude: Number(p.latitude), longitude: Number(p.longitude) }));

    const result = await getWeather(points, weatherFetcher);

    weatherStatus = result.status;

    if (result.status === "ok") {
      weather = result.byId;
      // 2) classement final avec la météo
      ranked = rank(places, circuits, it, weather);
    }
  }

  // Seuls les mois/tags connus sont renvoyés
  return {
    interpreted: {
      tags: it.tags.filter((t) => (TAGS as readonly string[]).includes(t)),
      month: it.month,
      words: it.words,
    },
    mode: ranked.mode,
    period,
    weather_status: weatherStatus,
    places: ranked.places,
    circuits: ranked.circuits,
  };
}
