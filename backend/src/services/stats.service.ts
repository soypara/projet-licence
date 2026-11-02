import { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middlewares/errorHandler";

// Toutes les statistiques du tableau de bord sont calculées par la fonction
// SQL admin_stats() (voir sql/phase5_notes_stats.sql), qui refuse les non-admins.
export async function getAdminStats(client: SupabaseClient) {
  const { data, error } = await client.rpc("admin_stats");

  if (error) {
    if (/admin_stats|does not exist|schema cache/i.test(error.message)) {
      throw new AppError(
        "Statistiques non installées : exécute sql/phase5_notes_stats.sql dans Supabase.",
        500
      );
    }

    throw new AppError(error.message, error.code === "42501" ? 403 : 500);
  }

  return data;
}
