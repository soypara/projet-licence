import { Request, Response } from "express";
import { placeImportSchema } from "../schemas/placeImport.schema";
import { importTouristPlace } from "../services/placeImport.service";

export async function importPlace(req: Request, res: Response) {
  const input = placeImportSchema.parse(req.body);

  const authorization = req.headers.authorization;
  const token = authorization?.replace("Bearer ", "");

  if (!token) {
    throw new Error("Token d'authentification manquant.");
  }

  const place = await importTouristPlace(input, token);

  res.status(201).json(place);
}