import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { AppError } from "../middlewares/errorHandler";
import { CircuitInput } from "../schemas/circuit.schema";
import { addDays, todayMada } from "../utils/dates";

type Stop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  position: number;
  [key: string]: unknown;
};

// Étapes (lieux) de plusieurs circuits, dans l'ordre : sans jointure SQL
// imbriquée, pour éviter les ambiguïtés de relations de PostgREST.
async function loadStops(circuitIds: string[]) {
  const byCircuit = new Map<string, Stop[]>();

  if (circuitIds.length === 0) return byCircuit;

  const { data: links, error } = await supabase
    .from("circuit_places")
    .select("circuit_id, tourist_place_id, position")
    .in("circuit_id", circuitIds);

  if (error) {
    throw new AppError(error.message, 500);
  }

  const placeIds = [...new Set((links || []).map((l) => l.tourist_place_id))];

  if (placeIds.length === 0) return byCircuit;

  const { data: places, error: placesError } = await supabase
    .from("tourist_places")
    .select("*")
    .in("id", placeIds);

  if (placesError) {
    throw new AppError(placesError.message, 500);
  }

  const placeById = new Map((places || []).map((p) => [p.id, p]));

  for (const link of links || []) {
    const place = placeById.get(link.tourist_place_id);

    if (!place) continue;

    const list = byCircuit.get(link.circuit_id) || [];
    list.push({ ...place, position: link.position ?? 0 });
    byCircuit.set(link.circuit_id, list);
  }

  byCircuit.forEach((list) => list.sort((a, b) => a.position - b.position));

  return byCircuit;
}

// Note moyenne (1 décimale) et nombre d'avis APPROUVÉS de chaque circuit.
// Si les avis sont indisponibles, le circuit s'affiche quand même (sans note).
async function loadRatings(circuitIds: string[]) {
  const ratings = new Map<string, { rating: number | null; rating_count: number }>();

  if (circuitIds.length === 0) return ratings;

  const { data, error } = await supabase
    .from("comments")
    .select("circuit_id, rating")
    .eq("status", "approved")
    .in("circuit_id", circuitIds);

  if (error) {
    console.error("Notes des circuits indisponibles :", error.message);
    return ratings;
  }

  const totals = new Map<string, { sum: number; count: number }>();

  for (const row of data || []) {
    if (!row.circuit_id || typeof row.rating !== "number") continue;

    const current = totals.get(row.circuit_id) || { sum: 0, count: 0 };

    current.sum += row.rating;
    current.count += 1;
    totals.set(row.circuit_id, current);
  }

  totals.forEach((value, id) => {
    ratings.set(id, {
      rating: Math.round((value.sum / value.count) * 10) / 10,
      rating_count: value.count,
    });
  });

  return ratings;
}

const NOT_RATED = { rating: null, rating_count: 0 };

type Departure = { start_date: string; end_date: string };

// Départs À VENIR de chaque circuit (les dates passées disparaissent du public).
// end_date = dernier jour, calculé avec la durée du circuit.
// Si la table n'existe pas encore, les circuits s'affichent sans départs.
async function loadDepartures(
  circuits: { id: string; duration_days?: number | null }[]
) {
  const byCircuit = new Map<string, Departure[]>();

  if (circuits.length === 0) return byCircuit;

  const { data, error } = await supabase
    .from("circuit_departures")
    .select("circuit_id, start_date")
    .in(
      "circuit_id",
      circuits.map((c) => c.id)
    )
    .gte("start_date", todayMada())
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Départs indisponibles :", error.message);
    return byCircuit;
  }

  const duration = new Map(
    circuits.map((c) => [c.id, Math.max(1, Number(c.duration_days) || 1)])
  );

  for (const row of data || []) {
    const list = byCircuit.get(row.circuit_id) || [];

    list.push({
      start_date: row.start_date,
      end_date: addDays(row.start_date, (duration.get(row.circuit_id) || 1) - 1),
    });
    byCircuit.set(row.circuit_id, list);
  }

  return byCircuit;
}

export async function listCircuits() {
  const { data, error } = await supabase
    .from("circuits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500);
  }

  const circuits = data || [];
  const ids = circuits.map((c) => c.id);
  const stops = await loadStops(ids);
  const ratings = await loadRatings(ids);
  const departures = await loadDepartures(circuits);

  return circuits.map((c) => ({
    ...c,
    stops: stops.get(c.id) || [],
    departures: departures.get(c.id) || [],
    ...(ratings.get(c.id) || NOT_RATED),
  }));
}

export async function getCircuitById(id: string) {
  const { data: circuit, error } = await supabase
    .from("circuits")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // Vraie erreur (et non plus "introuvable" pour tout)
  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!circuit) {
    throw new AppError("Circuit introuvable.", 404);
  }

  const stops = (await loadStops([id])).get(id) || [];

  const rating = (await loadRatings([id])).get(id) || NOT_RATED;

  const departures = (await loadDepartures([circuit])).get(id) || [];

  // "stops" ordonnés (+ circuit_places, même forme qu'avant)
  return {
    ...circuit,
    stops,
    departures,
    ...rating,
    circuit_places: stops.map((s) => ({
      position: s.position,
      tourist_places: s,
    })),
  };
}

export async function createCircuit(
  client: SupabaseClient,
  input: CircuitInput
) {
  const { data, error } = await client
    .from("circuits")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

export async function updateCircuit(
  client: SupabaseClient,
  id: string,
  input: Partial<CircuitInput>
) {
  const { data, error } = await client
    .from("circuits")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError(
      "Circuit introuvable.",
      404
    );
  }

  return data;
}

export async function deleteCircuit(
  client: SupabaseClient,
  id: string
) {
  const { error } = await client
    .from("circuits")
    .delete()
    .eq("id", id);

  if (error) {
    throw new AppError(error.message, 500);
  }
}

// Remplace toutes les étapes du circuit, dans l'ordre donné
// (1re = départ, dernière = arrivée).
export async function replaceTouristPlaces(
  client: SupabaseClient,
  circuitId: string,
  placeIds: string[]
) {
  const { error: deleteError } = await client
    .from("circuit_places")
    .delete()
    .eq("circuit_id", circuitId);

  if (deleteError) {
    throw new AppError(deleteError.message, 500);
  }

  if (placeIds.length === 0) return;

  const rows = placeIds.map((placeId, index) => ({
    circuit_id: circuitId,
    tourist_place_id: placeId,
    position: index + 1,
  }));

  const { error } = await client.from("circuit_places").insert(rows);

  if (error) {
    throw new AppError(error.message, 500);
  }
}

export async function attachTouristPlace(
  client: SupabaseClient,
  circuitId: string,
  touristPlaceId: string
) {
  const { count } = await supabase
    .from("circuit_places")
    .select("*", { count: "exact", head: true })
    .eq("circuit_id", circuitId);

  const { error } = await client
    .from("circuit_places")
    .insert({
      circuit_id: circuitId,
      tourist_place_id: touristPlaceId,
      position: (count || 0) + 1,
    });

  if (error) {
    throw new AppError(error.message, 500);
  }
}

export async function detachTouristPlace(
  client: SupabaseClient,
  circuitId: string,
  touristPlaceId: string
) {
  const { error } = await client
    .from("circuit_places")
    .delete()
    .eq("circuit_id", circuitId)
    .eq("tourist_place_id", touristPlaceId);

  if (error) {
    throw new AppError(error.message, 500);
  }
}

// Remplace les départs À VENIR du circuit par la liste donnée (dates de début).
// Les départs passés restent en base : ils ne sont ni touchés ni montrés.
export async function replaceDepartures(
  client: SupabaseClient,
  circuitId: string,
  dates: string[]
) {
  const today = todayMada();
  const future = [...new Set(dates)].filter((d) => d >= today);

  const { error: deleteError } = await client
    .from("circuit_departures")
    .delete()
    .eq("circuit_id", circuitId)
    .gte("start_date", today);

  if (deleteError) {
    throw new AppError(deleteError.message, 500);
  }

  if (future.length === 0) return;

  const { error } = await client.from("circuit_departures").insert(
    future.map((start_date) => ({ circuit_id: circuitId, start_date }))
  );

  if (error) {
    throw new AppError(error.message, 500);
  }
}
