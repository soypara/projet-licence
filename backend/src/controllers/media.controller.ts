import { Request, Response } from "express";
import {
  mediaUploadSchema,
  mediaFromUrlSchema,
} from "../schemas/media.schema";
import { AppError } from "../middlewares/errorHandler";
import { createAuthenticatedSupabase } from "../config/supabaseAuth";
import * as mediaService from "../services/media.service";

function getToken(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(
      "Token d'authentification manquant.",
      401
    );
  }

  return authorization.replace("Bearer ", "");
}

export async function upload(
  req: Request,
  res: Response
) {
  if (!req.file) {
    throw new AppError(
      "Aucun fichier reçu.",
      422
    );
  }

  const parsed =
    mediaUploadSchema.safeParse(req.body);

  if (!parsed.success) {
    const message =
      parsed.error.issues
        .map((issue) => issue.message)
        .join(" | ");

    throw new AppError(
      `Données invalides — ${message}`,
      422
    );
  }

  const media =
    await mediaService.uploadMedia(
      req.file,
      parsed.data,
      getToken(req)
    );

  res.status(201).json(media);
}

export async function fromUrl(
  req: Request,
  res: Response
) {
  const parsed =
    mediaFromUrlSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(
      "Données média invalides.",
      422
    );
  }

  const client =
    createAuthenticatedSupabase(
      getToken(req)
    );

  const media =
    await mediaService.saveMediaFromUrl(
      client,
      parsed.data
    );

  res.status(201).json(media);
}

export async function listForEntity(
  req: Request,
  res: Response
) {
  const media =
    await mediaService.listMediaFor(
      String(req.params.entityType),
      String(req.params.entityId)
    );

  res.json(media);
}

export async function remove(
  req: Request,
  res: Response
) {
  const client =
    createAuthenticatedSupabase(
      getToken(req)
    );

  await mediaService.deleteMedia(
    client,
    String(req.params.id)
  );

  res.status(204).send();
}
