import { createAuthenticatedSupabase } from "../config/supabaseAuth";
import { AppError } from "../middlewares/errorHandler";
import { PlaceImportInput } from "../schemas/placeImport.schema";

export async function importTouristPlace(
  input: PlaceImportInput,
  token: string
) {
  const client =
    createAuthenticatedSupabase(token);

  const {
    data: place,
    error: placeError,
  } = await client
    .from("tourist_places")
    .insert({
      name: input.name,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      source_url: input.source_url || null,
    })
    .select()
    .single();

  if (placeError || !place) {
    throw new AppError(
      placeError?.message ||
        "Impossible de créer le lieu.",
      500
    );
  }

  if (input.media.length > 0) {
    const mediaRows = input.media.map((media) => ({
      url: media.url,
      type: media.type,
      alt_text: media.alt_text || null,
      entity_type: "tourist_place",
      entity_id: place.id,
      caption: media.caption,
      sort_order: media.sort_order,
    }));

    const { error: mediaError } =
      await client
        .from("media")
        .insert(mediaRows);

    if (mediaError) {
      // RESTAURÉ (présent dans ton ancienne version) : si les médias
      // échouent, on supprime le lieu pour ne pas laisser une fiche incomplète.
      await client
        .from("tourist_places")
        .delete()
        .eq("id", place.id);

      throw new AppError(
        mediaError.message,
        500
      );
    }
  }

  return {
    place,
  };
}
