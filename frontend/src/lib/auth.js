import { supabase } from "./supabase";

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function getCurrentRole() {
  const { data, error } = await supabase.rpc("get_my_role");

  if (error) {
    console.error(
      "Erreur récupération rôle :",
      JSON.stringify(error, null, 2)
    );
    return null;
  }

  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}