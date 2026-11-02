import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { AppError } from "../middlewares/errorHandler";
import { ReservationInput } from "../schemas/reservation.schema";
import { deadlineDaysFor, depositFor, pricePerPerson } from "../utils/pricing";
import { addDays, todayMada } from "../utils/dates";
import { PaymentInput } from "../schemas/payment.schema";
import { chargeCard } from "../utils/fakeGateway";

const SELECT_WITH_CIRCUIT = `
  *,
  circuits (
    id,
    title,
    duration_days
  )
`;

// Annule les réservations non payées après leur date limite.
// (si le SQL phase8 n'est pas encore exécuté, on ignore l'erreur)
async function expireUnpaid(client: SupabaseClient) {
  try {
    await client.rpc("expire_unpaid_reservations");
  } catch {
    // ignoré
  }
}

// Date limite de paiement : "délai" jours avant le départ, mais jamais
// avant demain (réservation faite tard = à payer sous 24 h) ni après le départ.
function payDeadline(startDate: string, travelers: number) {
  const wanted = addDays(startDate, -deadlineDaysFor(travelers));
  const tomorrow = addDays(todayMada(), 1);
  const later = wanted > tomorrow ? wanted : tomorrow;

  return later < startDate ? later : startDate;
}

export async function createReservation(
  client: SupabaseClient,
  userId: string,
  input: ReservationInput
) {
  // Le prix est relu côté serveur : le client ne peut pas le falsifier.
  const { data: circuit, error: circuitError } = await supabase
    .from("circuits")
    .select("id, price, price_tiers")
    .eq("id", input.circuit_id)
    .single();

  if (circuitError || !circuit) {
    throw new AppError("Circuit introuvable.", 404);
  }

  // La date doit être l'un des départs prévus par l'agence (et pas passé)
  const { data: departure, error: departureError } = await supabase
    .from("circuit_departures")
    .select("id")
    .eq("circuit_id", input.circuit_id)
    .eq("start_date", input.start_date)
    .maybeSingle();

  if (departureError) {
    throw new AppError(departureError.message, 500);
  }

  if (!departure) {
    throw new AppError(
      "Cette date de départ n'est pas disponible. Choisis l'un des départs proposés.",
      400
    );
  }

  const total = pricePerPerson(circuit, input.travelers) * input.travelers;

  const { data, error } = await client
    .from("reservations")
    .insert({
      user_id: userId,
      circuit_id: input.circuit_id,
      // "date" et "total" : colonnes d'origine de ta table, obligatoires
      date: input.start_date,
      total: Math.round(total),
      start_date: input.start_date,
      travelers: input.travelers,
      full_name: input.full_name,
      pay_deadline: payDeadline(input.start_date, input.travelers),
      phone: input.phone,
      note: input.note || null,
      total_mga: Math.round(total),
      // Acompte à payer pour valider la réservation
      deposit_mga: depositFor(Math.round(total)),
      payment_status: "unpaid",
      status: "pending",
    })
    .select(SELECT_WITH_CIRCUIT)
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

export async function listMyReservations(
  client: SupabaseClient,
  userId: string
) {
  await expireUnpaid(client);

  const { data, error } = await client
    .from("reservations")
    .select(SELECT_WITH_CIRCUIT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

// Avec le client authentifié d'un admin, la RLS laisse voir toutes les lignes.
export async function listAllReservations(client: SupabaseClient) {
  await expireUnpaid(client);

  const { data, error } = await client
    .from("reservations")
    .select(SELECT_WITH_CIRCUIT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

export async function updateReservationStatus(
  client: SupabaseClient,
  id: string,
  status: string
) {
  const { data, error } = await client
    .from("reservations")
    .update({ status })
    .eq("id", id)
    .select(SELECT_WITH_CIRCUIT)
    .single();

  if (error || !data) {
    throw new AppError("Réservation introuvable ou accès refusé.", 404);
  }

  return data;
}

// Paiement de l'acompte (faux prestataire : aucun vrai argent).
// Les erreurs "métier" sont renvoyées sous forme de code (ex. "card_declined"),
// le site les traduit dans la langue du visiteur.
export async function payReservation(
  client: SupabaseClient,
  id: string,
  card: PaymentInput
) {
  await expireUnpaid(client);

  // La RLS ne laisse voir que les réservations de la personne connectée
  const { data: current } = await client
    .from("reservations")
    .select("id, status, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (!current) throw new AppError("reservation_not_found", 404);
  if (current.payment_status === "paid") throw new AppError("already_paid", 409);
  if (current.status === "rejected" || current.status === "cancelled") {
    throw new AppError("reservation_closed", 409);
  }

  const result = chargeCard(card);

  const { error } = await client.rpc("pay_reservation", {
    p_reservation_id: id,
    p_ok: result.ok,
    p_brand: result.brand,
    p_last4: result.last4,
    p_reference: result.reference,
    p_reason: result.reason ?? null,
    p_currency: card.currency ?? "MGA",
    p_display_amount: card.display_amount ?? null,
  });

  if (error) {
    const known = ["reservation_not_found", "already_paid", "reservation_closed"];
    const code = known.find((k) => error.message.includes(k));

    if (code) throw new AppError(code, code === "reservation_not_found" ? 404 : 409);

    throw new AppError(error.message, 500);
  }

  if (!result.ok) {
    throw new AppError(result.reason ?? "card_declined", 402);
  }

  const { data, error: readError } = await client
    .from("reservations")
    .select(SELECT_WITH_CIRCUIT)
    .eq("id", id)
    .single();

  if (readError || !data) {
    throw new AppError("Réservation introuvable.", 404);
  }

  return { ...data, payment_reference: result.reference };
}
