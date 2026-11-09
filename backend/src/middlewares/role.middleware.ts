import { Request, Response, NextFunction } from "express";
import { createAuthenticatedSupabase } from "../config/supabaseAuth";

// À placer APRÈS authenticate. Vérifie le rôle réel dans la base (get_my_role),
// jamais une information envoyée par le navigateur.
// Rôles : tourist / admin ("Employé") / super_admin ("Admin").

async function roleOf(req: Request): Promise<string> {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const client = createAuthenticatedSupabase(token);
  const { data, error } = await client.rpc("get_my_role");

  if (error) return "";

  return String(data ?? "");
}

function guard(allowed: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await roleOf(req);

      if (!allowed.includes(role)) {
        return res.status(403).json({ message: "Accès réservé au personnel de l'agence." });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Admin et employés
export const requireStaff = guard(["admin", "super_admin"]);

// Admin seulement
export const requireSuperAdmin = guard(["super_admin"]);
