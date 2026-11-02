import { Request, Response } from "express";
import * as wikipediaService from "../services/wikipedia.service";
import { AppError } from "../middlewares/errorHandler";

export async function search(req: Request, res: Response) {
  const q = String(req.query.q || "").trim();
  if (!q) throw new AppError("Le paramètre q est requis.", 422);

  const results = await wikipediaService.searchWikipedia(q);
  res.json(results);
}

export async function summary(req: Request, res: Response) {
  const title = String(req.query.title || "").trim();
  if (!title) throw new AppError("Le paramètre title est requis.", 422);

  const data = await wikipediaService.getWikipediaSummary(title);
  res.json(data);
}
