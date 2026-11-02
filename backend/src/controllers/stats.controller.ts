import { Request, Response } from "express";
import { createAuthenticatedSupabase } from "../config/supabaseAuth";
import * as statsService from "../services/stats.service";
import { AppError } from "../middlewares/errorHandler";

export async function getAdminStats(req: Request, res: Response) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("Token d'authentification manquant.", 401);
  }

  const client = createAuthenticatedSupabase(
    authorization.replace("Bearer ", "")
  );

  res.json(await statsService.getAdminStats(client));
}
