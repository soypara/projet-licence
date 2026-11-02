import { afterLoginPath } from "./reserveFlow";
import { supabase } from "./supabase";

export const GOOGLE_DISABLED = "GOOGLE_DISABLED";

// Google est-il activé dans Supabase ? (Authentication > Providers)
export async function isGoogleEnabled() {
  try {
    const res = await fetch(`${supabase.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabase.supabaseKey },
    });

    const json = await res.json();

    return json?.external?.google === true;
  } catch {
    return false;
  }
}

// Lance la connexion Google. Retourne null si la page part vers Google,
// GOOGLE_DISABLED si Google n'est pas activé (l'appelant envoie alors vers
// /login), ou un message d'erreur.
export async function signInWithGoogle() {
  if (!(await isGoogleEnabled())) return GOOGLE_DISABLED;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${afterLoginPath()}`,
    },
  });

  return error ? error.message : null;
}
