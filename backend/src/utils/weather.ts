// Météo des lieux via Open-Meteo (gratuit, sans clé) : prévisions des 7 prochains jours.
// Les résultats sont gardés 3 heures en mémoire (une case de 0,1° par lieu).
// Si le service ne répond pas, on renvoie "unavailable" : la recherche continue sans météo.

export type WeatherSummary = {
  rain_mm_avg: number; // pluie moyenne par jour (mm)
  rain_days: number; // jours avec au moins 1 mm
  rain_mm_max: number; // pire journée (mm)
  tmax_avg: number; // température maximale moyenne (°C)
};

type Point = { id: string; latitude: number; longitude: number };

const TTL_MS = 3 * 60 * 60 * 1000;
const CHUNK = 25;
const cache = new Map<string, { at: number; value: WeatherSummary }>();

const cellOf = (lat: number, lon: number) =>
  `${lat.toFixed(1)},${lon.toFixed(1)}`;

type Fetcher = (url: string, signal: AbortSignal) => Promise<unknown>;

const defaultFetcher: Fetcher = async (url, signal) => {
  const res = await fetch(url, { signal });

  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

  return res.json();
};

function summarize(daily: {
  precipitation_sum?: (number | null)[];
  temperature_2m_max?: (number | null)[];
}): WeatherSummary | null {
  const rain = (daily.precipitation_sum || []).map((v) => Number(v ?? 0));
  const temp = (daily.temperature_2m_max || [])
    .map((v) => (v == null ? NaN : Number(v)))
    .filter((v) => !Number.isNaN(v));

  if (rain.length === 0) return null;

  const sum = rain.reduce((a, b) => a + b, 0);

  return {
    rain_mm_avg: sum / rain.length,
    rain_days: rain.filter((v) => v >= 1).length,
    rain_mm_max: Math.max(...rain),
    tmax_avg: temp.length ? temp.reduce((a, b) => a + b, 0) / temp.length : 25,
  };
}

// Renvoie { status, byId }. status : "ok" (tout ou partie), "unavailable" (aucune donnée)
export async function getWeather(
  points: Point[],
  fetcher: Fetcher = defaultFetcher
): Promise<{ status: "ok" | "unavailable"; byId: Map<string, WeatherSummary> }> {
  const byId = new Map<string, WeatherSummary>();
  const now = Date.now();
  const missing = new Map<string, Point>(); // une case par appel

  for (const p of points) {
    const cell = cellOf(p.latitude, p.longitude);
    const hit = cache.get(cell);

    if (hit && now - hit.at < TTL_MS) {
      byId.set(p.id, hit.value);
    } else if (!missing.has(cell)) {
      missing.set(cell, p);
    }
  }

  const cells = Array.from(missing.entries());

  for (let i = 0; i < cells.length; i += CHUNK) {
    const chunk = cells.slice(i, i + CHUNK);
    const lat = chunk.map(([, p]) => p.latitude.toFixed(1)).join(",");
    const lon = chunk.map(([, p]) => p.longitude.toFixed(1)).join(",");
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${lat}&longitude=${lon}` +
      "&daily=precipitation_sum,temperature_2m_max&forecast_days=7&timezone=auto";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const data = await fetcher(url, controller.signal);
      const list = Array.isArray(data) ? data : [data];

      list.forEach((entry, index) => {
        const summary = summarize(
          (entry as { daily?: Parameters<typeof summarize>[0] }).daily || {}
        );

        if (summary && chunk[index]) {
          cache.set(chunk[index][0], { at: Date.now(), value: summary });
        }
      });
    } catch {
      // service indisponible : on continue sans cette partie
    } finally {
      clearTimeout(timer);
    }
  }

  for (const p of points) {
    const hit = cache.get(cellOf(p.latitude, p.longitude));

    if (hit) byId.set(p.id, hit.value);
  }

  return { status: byId.size > 0 ? "ok" : "unavailable", byId };
}

// Effet de la météo sur la pertinence d'un lieu, selon son type d'activité.
// Ce n'est PAS une règle "pluie = mauvais" : une cascade profite de la pluie,
// la culture et la ville sont presque indifférentes, la plage et la plongée y
// sont très sensibles.
export type WeatherVerdict = "good" | "ok" | "rain" | "heat";

const FACTOR: Record<WeatherVerdict, number> = {
  good: 1.12,
  ok: 1,
  rain: 0.55,
  heat: 0.85,
};

export function judgeWeather(
  tags: string[],
  w: WeatherSummary
): { verdict: WeatherVerdict; factor: number } {
  const wet = w.rain_mm_avg >= 6 || w.rain_days >= 4;
  const veryWet = w.rain_mm_avg >= 12 || w.rain_mm_max >= 40;
  const dry = w.rain_mm_avg < 2 && w.rain_days <= 2;

  const verdicts: WeatherVerdict[] = [];

  for (const tag of tags) {
    if (tag === "beach" || tag === "water_sports") {
      if (wet) verdicts.push("rain");
      else if (dry && w.tmax_avg >= 26) verdicts.push("good");
      else verdicts.push("ok");
    } else if (
      tag === "hiking" ||
      tag === "mountain" ||
      tag === "forest" ||
      tag === "park" ||
      tag === "wildlife"
    ) {
      if (veryWet) verdicts.push("rain");
      else if (dry && w.tmax_avg <= 33) verdicts.push("good");
      else verdicts.push("ok");
    } else if (tag === "waterfall") {
      // une cascade est plus belle après la pluie, sauf déluge
      if (veryWet) verdicts.push("rain");
      else if (w.rain_mm_avg >= 3 && w.rain_mm_avg < 12) verdicts.push("good");
      else verdicts.push("ok");
    } else if (w.rain_mm_avg >= 25) {
      verdicts.push("rain");
    } else {
      verdicts.push("ok");
    }
  }

  if (verdicts.length === 0) return { verdict: "ok", factor: 1 };

  // le pire verdict compte, sauf si tout est "good"
  const order: WeatherVerdict[] = ["rain", "heat", "ok", "good"];
  const verdict = order.find((v) => verdicts.includes(v)) as WeatherVerdict;

  return { verdict, factor: FACTOR[verdict] };
}
