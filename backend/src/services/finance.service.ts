import { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/errorHandler";

// Solde de l'agence (carte fictive) : réservé au super admin.
// Le contrôle est fait dans la fonction SQL agency_ledger().
export async function getLedger(client: SupabaseClient) {
  const { data, error } = await client.rpc("agency_ledger");

  if (error) {
    if (error.message.includes("forbidden")) {
      throw new AppError("Accès réservé à l'administrateur.", 403);
    }

    throw new AppError(error.message, 500);
  }

  return data;
}
