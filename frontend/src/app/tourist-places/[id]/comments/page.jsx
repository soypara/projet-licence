import { redirect } from "next/navigation";

// Les avis se donnent maintenant sur les circuits, plus sur les lieux.
// Cet ancien fichier peut être supprimé ; en attendant il renvoie au lieu.
export default async function PlaceCommentsPage({ params }) {
  const { id } = await params;

  redirect(`/tourist-places/${id}`);
}
