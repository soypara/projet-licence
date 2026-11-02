import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { AppError } from "../middlewares/errorHandler";
import { TouristPlaceInput } from "../schemas/touristPlace.schema";

export async function listTouristPlaces() {
  const { data, error } = await supabase
    .from("tourist_places")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data ?? [];
}

export async function getTouristPlaceById(
  id: string
) {
  const { data, error } = await supabase
    .from("tourist_places")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new AppError(
      "Lieu touristique introuvable.",
      404
    );
  }

  return data;
}

export async function createTouristPlace(
  client: SupabaseClient,
  input: TouristPlaceInput
) {
  const { data, error } = await client
    .from("tourist_places")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

export async function updateTouristPlace(
  client: SupabaseClient,
  id: string,
  input: Partial<TouristPlaceInput>
) {
  const { data, error } = await client
    .from("tourist_places")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError(
      "Lieu touristique introuvable.",
      404
    );
  }

  return data;
}

export async function deleteTouristPlace(
  client: SupabaseClient,
  id: string
) {
  const { error } = await client
    .from("tourist_places")
    .delete()
    .eq("id", id);

  if (error) {
    throw new AppError(error.message, 500);
  }
}
