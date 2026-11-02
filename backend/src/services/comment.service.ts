import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { AppError } from "../middlewares/errorHandler";
import { CommentInput } from "../schemas/comment.schema";
import { containsBadWords } from "../utils/profanity";

type CommentRow = {
  circuit_id?: string | null;
  tourist_place_id?: string | null;
  [key: string]: unknown;
};

// Ajoute le nom du circuit (et du lieu, pour les anciens avis) à chaque avis.
// Deux petites requêtes à la place d'une jointure SQL imbriquée : la jointure
// plantait quand la base n'avait pas la relation attendue.
async function withTargets(rows: CommentRow[]) {
  const circuitIds = [
    ...new Set(rows.map((r) => r.circuit_id).filter(Boolean)),
  ] as string[];
  const placeIds = [
    ...new Set(rows.map((r) => r.tourist_place_id).filter(Boolean)),
  ] as string[];

  const circuits = new Map<string, { id: string; title: string }>();
  const places = new Map<string, { id: string; name: string }>();

  if (circuitIds.length > 0) {
    const { data } = await supabase
      .from("circuits")
      .select("id, title")
      .in("id", circuitIds);

    (data || []).forEach((c) => circuits.set(c.id, c));
  }

  if (placeIds.length > 0) {
    const { data } = await supabase
      .from("tourist_places")
      .select("id, name")
      .in("id", placeIds);

    (data || []).forEach((p) => places.set(p.id, p));
  }

  return rows.map((r) => ({
    ...r,
    circuits: r.circuit_id ? circuits.get(r.circuit_id) || null : null,
    tourist_places: r.tourist_place_id
      ? places.get(r.tourist_place_id) || null
      : null,
  }));
}

// Tous les avis (modération). Reçoit le client authentifié : sans lui, la RLS
// ne montrerait que les avis approuvés.
export async function listComments(client: SupabaseClient) {
  const { data, error } = await client
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return withTargets(data || []);
}

export async function listApprovedComments(
  touristPlaceId?: string,
  circuitId?: string
) {
  let query = supabase
    .from("comments")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (touristPlaceId) {
    query = query.eq("tourist_place_id", touristPlaceId);
  }

  if (circuitId) {
    query = query.eq("circuit_id", circuitId);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(error.message, 500);
  }

  return withTargets(data || []);
}

export async function createComment(
  client: SupabaseClient,
  userId: string,
  input: CommentInput,
  authorInitial: string | null = null
) {
  const { data, error } = await client
    .from("comments")
    .insert({
      user_id: userId,
      content: input.content,
      rating: input.rating,
      circuit_id: input.circuit_id,
      author_initial: authorInitial,
      // Publié tout de suite, sauf si un mot interdit est détecté :
      // l'avis attend alors la validation d'un employé.
      status: containsBadWords(input.content) ? "pending" : "approved",
    })
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

export async function updateComment(
  client: SupabaseClient,
  id: string,
  input: Partial<CommentInput>
) {
  const { data, error } = await client
    .from("comments")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError("Commentaire introuvable.", 404);
  }

  return data;
}

export async function updateCommentStatus(
  client: SupabaseClient,
  id: string,
  status: "pending" | "approved" | "rejected"
) {
  const { data, error } = await client
    .from("comments")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError("Commentaire introuvable.", 404);
  }

  return data;
}

export async function deleteComment(client: SupabaseClient, id: string) {
  const { error } = await client.from("comments").delete().eq("id", id);

  if (error) {
    throw new AppError(error.message, 500);
  }
}
