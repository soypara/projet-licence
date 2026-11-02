import { Request, Response } from "express";
import { createAuthenticatedSupabase } from "../config/supabaseAuth";
import * as planningService from "../services/planning.service";
import * as financeService from "../services/finance.service";
import { AppError } from "../middlewares/errorHandler";

function getClient(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("Token d'authentification manquant.", 401);
  }

  return createAuthenticatedSupabase(authorization.replace("Bearer ", ""));
}

export async function getPlanning(req: Request, res: Response) {
  res.json(
    await planningService.getPlanning(
      getClient(req),
      String(req.query.from ?? ""),
      String(req.query.to ?? "")
    )
  );
}

export async function search(req: Request, res: Response) {
  res.json(
    await planningService.searchPlanning(
      getClient(req),
      String(req.query.q ?? "")
    )
  );
}

export async function getLedger(req: Request, res: Response) {
  res.json(await financeService.getLedger(getClient(req)));
}
