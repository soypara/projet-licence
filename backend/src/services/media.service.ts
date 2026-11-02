import { randomUUID } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { createAuthenticatedSupabase } from "../config/supabaseAuth";
import { supabase } from "../config/supabase";
import { AppError } from "../middlewares/errorHandler";

import {
  MediaUploadInput,
  MediaFromUrlInput,
} from "../schemas/media.schema";

const BUCKET = "media";

export async function uploadMedia(
  file: Express.Multer.File,
  input: MediaUploadInput,
  token: string
) {
  const client =
    createAuthenticatedSupabase(token);

  const extension =
    file.originalname.split(".").pop() || "bin";

  const path =
    `${input.entity_type}/${input.entity_id}/${randomUUID()}.${extension}`;

  const { error: uploadError } =
    await client.storage
      .from(BUCKET)
      .upload(
        path,
        file.buffer,
        {
          contentType: file.mimetype,
          upsert: false,
        }
      );

  if (uploadError) {
    throw new AppError(
      uploadError.message,
      500
    );
  }

  const { data: publicUrlData } =
    client.storage
      .from(BUCKET)
      .getPublicUrl(path);

  const type =
    file.mimetype.startsWith("video")
      ? "video"
      : "photo";

  const { data, error } =
    await client
      .from("media")
      .insert({
        url: publicUrlData.publicUrl,
        type,
        alt_text: input.alt_text || null,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        caption: input.caption || null,
        sort_order: input.sort_order,
      })
      .select()
      .single();

  if (error) {
    throw new AppError(
      error.message,
      500
    );
  }

  return data;
}

export async function saveMediaFromUrl(
  client: SupabaseClient,
  input: MediaFromUrlInput
) {
  const { data, error } =
    await client
      .from("media")
      .insert({
        url: input.url,
        type: input.type,
        alt_text: input.alt_text || null,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        caption: input.caption || null,
        sort_order: input.sort_order,
      })
      .select()
      .single();

  if (error) {
    throw new AppError(
      error.message,
      500
    );
  }

  return data;
}

export async function listMediaFor(
  entityType: string,
  entityId: string
) {
  const { data, error } =
    await supabase
      .from("media")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("sort_order", {
        ascending: true,
      });

  if (error) {
    throw new AppError(
      error.message,
      500
    );
  }

  return data;
}

export async function deleteMedia(
  client: SupabaseClient,
  id: string
) {
  const { data: media, error: fetchError } =
    await client
      .from("media")
      .select("url")
      .eq("id", id)
      .single();

  if (fetchError || !media) {
    throw new AppError(
      "Média introuvable.",
      404
    );
  }

  if (media.url.includes(`/${BUCKET}/`)) {
    const path =
      new URL(media.url)
        .pathname
        .split(`/${BUCKET}/`)[1];

    if (path) {
      await client.storage
        .from(BUCKET)
        .remove([path]);
    }
  }

  const { error } =
    await client
      .from("media")
      .delete()
      .eq("id", id);

  if (error) {
    throw new AppError(
      error.message,
      500
    );
  }
}
