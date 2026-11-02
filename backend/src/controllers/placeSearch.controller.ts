import { Request, Response } from "express";
import { AppError } from "../middlewares/errorHandler";
import { searchPlace } from "../services/placeSearch.service";

export async function search(req: Request, res: Response) {
  const query = String(req.query.q || "").trim();

  if (!query) {
    throw new AppError("Le paramètre de recherche est requis.", 400);
  }

  const result = await searchPlace(query);

  res.json(result);
}