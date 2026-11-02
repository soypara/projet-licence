import { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/errorHandler";
import { isIsoDate } from "../utils/dates";

// Planning : réservé au personnel (employés et admin).
async function requireStaff(client: SupabaseClient) {
  const { data, error } = await client.rpc("get_my_role");

  if (error) throw new AppError(error.message, 500);

  const role = String(data ?? "");

  if (role !== "admin" && role !== "super_admin") {
    throw new AppError("Accès réservé au personnel de l'agence.", 403);
  }
}

// Départs et voyageurs d'une période. Le téléphone n'est JAMAIS renvoyé ici.
export async function getPlanning(
  client: SupabaseClient,
  from: string,
  to: string
) {
  await requireStaff(client);

  if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
    throw new AppError("Période invalide.", 400);
  }

  // Les départs ne sont jamais effacés : le planning sert d'archive.
  const { data: departures, error: depError } = await client
    .from("circuit_departures")
    .select("circuit_id, start_date, circuits ( id, title, duration_days )")
    .gte("start_date", from)
    .lte("start_date", to)
    .order("start_date", { ascending: true });

  if (depError) throw new AppError(depError.message, 500);

  const { data: reservations, error: resError } = await client
    .from("reservations")
    .select(
      "id, circuit_id, start_date, travelers, status, payment_status, full_name, circuits ( id, title, duration_days )"
    )
    .gte("start_date", from)
    .lte("start_date", to)
    .order("start_date", { ascending: true });

  if (resError) throw new AppError(resError.message, 500);

  return { departures: departures ?? [], reservations: reservations ?? [] };
}

const RES_SELECT =
  "id, circuit_id, start_date, travelers, status, payment_status, full_name, circuits ( id, title, duration_days )";

// "10/11/2026" ou "2026-11-10" -> "2026-11-10" (sinon chaîne vide)
function toIsoDate(text: string) {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  const fr = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  const parts = iso ? [iso[1], iso[2], iso[3]] : fr ? [fr[3], fr[2], fr[1]] : null;

  if (!parts) return "";

  const value = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;

  return isIsoDate(value) ? value : "";
}

function likePattern(q: string) {
  return `%${q.replace(/[%_\\]/g, "\\$&")}%`;
}

// Recherche GÉNÉRALE dans le planning (archives comprises) :
//  - voyageurs : par nom ou par téléphone (le téléphone n'est jamais renvoyé)
//  - circuits : par titre, ou par lieu visité (ex. "Morondava") -> tous leurs départs
//  - dates : "10/11/2026" ou "2026-11-10" -> départs et voyageurs de ce jour
export async function searchPlanning(client: SupabaseClient, query: string) {
  await requireStaff(client);

  const q = query.trim();

  if (q.length < 2) return { travelers: [], trips: [] };

  const found = new Map<string, unknown>();
  const add = (rows: { id: unknown }[] | null) =>
    (rows ?? []).forEach((row) => found.set(String(row.id), row));

  // 1) Voyageurs : nom
  const byName = await client
    .from("reservations")
    .select(RES_SELECT)
    .ilike("full_name", likePattern(q))
    .order("start_date", { ascending: false })
    .limit(100);

  if (byName.error) throw new AppError(byName.error.message, 500);
  add(byName.data);

  // 2) Voyageurs : téléphone (chiffres seulement)
  const digits = q.replace(/\D/g, "");

  if (digits.length >= 4 && !toIsoDate(q)) {
    const byPhone = await client
      .from("reservations")
      .select(RES_SELECT)
      .ilike("phone", `%${digits}%`)
      .order("start_date", { ascending: false })
      .limit(100);

    if (byPhone.error) throw new AppError(byPhone.error.message, 500);
    add(byPhone.data);
  }

  // 3) Circuits : titre, ou lieu visité
  const circuitIds = new Set<string>();

  const byTitle = await client
    .from("circuits")
    .select("id")
    .ilike("title", likePattern(q))
    .limit(50);

  (byTitle.data ?? []).forEach((c) => circuitIds.add(String(c.id)));

  try {
    const places = await client
      .from("tourist_places")
      .select("id")
      .ilike("name", likePattern(q))
      .limit(50);

    const placeIds = (places.data ?? []).map((p) => p.id);

    if (placeIds.length > 0) {
      const links = await client
        .from("circuit_places")
        .select("circuit_id")
        .in("tourist_place_id", placeIds);

      (links.data ?? []).forEach((l) => circuitIds.add(String(l.circuit_id)));
    }
  } catch {
    // table absente : on cherche seulement par titre
  }

  // 4) Date précise
  const day = toIsoDate(q);

  type Trip = {
    circuit_id: string;
    start_date: string;
    circuits: unknown;
    travelers: number;
  };

  const depQuery = client
    .from("circuit_departures")
    .select("circuit_id, start_date, circuits ( id, title, duration_days )")
    .order("start_date", { ascending: false })
    .limit(200);

  let departures: { circuit_id: string; start_date: string; circuits: unknown }[] = [];

  if (day) {
    const res = await depQuery.eq("start_date", day);

    departures = (res.data ?? []) as typeof departures;

    const byDay = await client
      .from("reservations")
      .select(RES_SELECT)
      .eq("start_date", day)
      .limit(200);

    add(byDay.data);
  } else if (circuitIds.size > 0) {
    const res = await depQuery.in("circuit_id", Array.from(circuitIds));

    departures = (res.data ?? []) as typeof departures;
  }

  // Nombre de voyageurs (non annulés) de chaque départ trouvé
  const counts = new Map<string, number>();

  if (departures.length > 0) {
    const ids = Array.from(new Set(departures.map((d) => d.circuit_id)));

    const res = await client
      .from("reservations")
      .select("circuit_id, start_date, travelers, status")
      .in("circuit_id", ids)
      .limit(5000);

    for (const r of res.data ?? []) {
      if (r.status === "cancelled" || r.status === "rejected") continue;

      const key = `${r.circuit_id}|${r.start_date}`;

      counts.set(key, (counts.get(key) ?? 0) + (Number(r.travelers) || 0));
    }
  }

  const trips: Trip[] = departures.map((d) => ({
    ...d,
    travelers: counts.get(`${d.circuit_id}|${d.start_date}`) ?? 0,
  }));

  return { travelers: Array.from(found.values()), trips };
}
