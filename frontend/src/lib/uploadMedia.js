import { api } from "./api";

// Envoie des fichiers (photos / vidéos) vers /media.
// Retourne la liste des échecs : [{ name, message }].
export async function uploadFiles(entityType, entityId, files, firstOrder = 1) {
  const failures = [];
  let order = firstOrder;

  for (const file of files) {
    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("type", file.type.startsWith("video") ? "video" : "photo");
      formData.append("alt_text", file.name);
      formData.append("entity_type", entityType);
      formData.append("entity_id", entityId);
      formData.append("sort_order", String(order));

      await api.post("/media", formData);
      order += 1;
    } catch (err) {
      failures.push({ name: file.name, message: err.message });
    }
  }

  return failures;
}
