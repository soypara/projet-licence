import { Request, Response } from "express";
import { createAuthenticatedSupabase } from "../config/supabaseAuth";
import * as touristPlaceService from "../services/touristPlace.service";
import { AppError } from "../middlewares/errorHandler";

function getClient(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(
      "Token d'authentification manquant.",
      401
    );
  }

  return createAuthenticatedSupabase(
    authorization.replace("Bearer ", "")
  );
}

export async function getAll(
  _req: Request,
  res: Response
) {
  const places =
    await touristPlaceService.listTouristPlaces();

  res.json(places);
}

export async function getOne(
  req: Request,
  res: Response
) {
  const place =
    await touristPlaceService.getTouristPlaceById(
      String(req.params.id)
    );

  res.json(place);
}

export async function create(
  req: Request,
  res: Response
) {
  const place =
    await touristPlaceService.createTouristPlace(
      getClient(req),
      req.body
    );

  res.status(201).json(place);
}

export async function update(
  req: Request,
  res: Response
) {
  const place =
    await touristPlaceService.updateTouristPlace(
      getClient(req),
      String(req.params.id),
      req.body
    );

  res.json(place);
}

export async function remove(
  req: Request,
  res: Response
) {
  await touristPlaceService.deleteTouristPlace(
    getClient(req),
    String(req.params.id)
  );

  res.status(204).send();
}
