import { redirect } from "next/navigation";

// L'ajout de lieux se fait désormais depuis l'administration.
export default function NewTouristPlacePage() {
  redirect("/admin/places");
}
