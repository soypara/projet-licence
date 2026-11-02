import { redirect } from "next/navigation";

// Les hôtels ne font plus partie du site. Cet ancien fichier peut être
// supprimé ; en attendant il renvoie à l'accueil.
export default function HotelsPage() {
  redirect("/");
}
