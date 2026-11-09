import { Request, Response } from "express";
import * as discoverService from "../services/discover.service";

// Recherche intelligente : publique (comme le reste du site, sans connexion).
export async function search(req: Request, res: Response) {
  const q = String(req.query.q ?? "").slice(0, 300);
  const when = String(req.query.when ?? "").slice(0, 10);

  res.json(await discoverService.discover(q, when));
}
