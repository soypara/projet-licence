import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { AppError } from "../middlewares/errorHandler";
import { HotelInput } from "../schemas/hotel.schema";

export async function listHotels() {
  const { data, error } = await supabase
    .from("hotels")
    .select(`
      *,
      tourist_places (
        id,
        name
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

export async function getHotelById(id: string) {
  const { data, error } = await supabase
    .from("hotels")
    .select(`
      *,
      tourist_places (
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new AppError(
      "Hôtel introuvable.",
      404
    );
  }

  return data;
}

export async function createHotel(
  client: SupabaseClient,
  input: HotelInput
) {
  const { data, error } = await client
    .from("hotels")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  return data;
}

export async function updateHotel(
  client: SupabaseClient,
  id: string,
  input: Partial<HotelInput>
) {
  const { data, error } = await client
    .from("hotels")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!data) {
    throw new AppError(
      "Hôtel introuvable.",
      404
    );
  }

  return data;
}

export async function deleteHotel(
  client: SupabaseClient,
  id: string
) {
  const { error } = await client
    .from("hotels")
    .delete()
    .eq("id", id);

  if (error) {
    throw new AppError(error.message, 500);
  }
}
