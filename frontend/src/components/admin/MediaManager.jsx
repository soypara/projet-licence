"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Photos / vidéos d'un circuit ou d'un lieu (admin).
// entityType : "circuit" | "tourist_place"
export default function MediaManager({ entityType, entityId }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api.get(`/media/${entityType}/${entityId}`);
      setMedia(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      let order = media.reduce((max, m) => Math.max(max, m.sort_order || 0), 0);

      for (const file of files) {
        order += 1;

        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "type",
          file.type.startsWith("video") ? "video" : "photo"
        );
        formData.append("alt_text", file.name);
        formData.append("entity_type", entityType);
        formData.append("entity_id", entityId);
        formData.append("sort_order", String(order));

        await api.post("/media", formData);
      }

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Supprimer ce média ?")) return;

    try {
      setError("");
      await api.del(`/media/${id}`);
      setMedia((current) => current.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {error && <div className="adm-alert mb-4">{error}</div>}

      {loading ? (
        <p className="adm-empty">Chargement...</p>
      ) : media.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">Aucun média.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => (
            <div
              key={m.id}
              className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
            >
              {m.type === "photo" ? (
                <img
                  src={m.url}
                  alt={m.alt_text || ""}
                  className="h-28 w-full object-cover"
                />
              ) : (
                <video src={m.url} className="h-28 w-full object-cover" controls />
              )}

              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-xs text-slate-400">
                  {m.caption || m.alt_text || m.type}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="adm-btn-danger !px-2 !py-1 !text-xs"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="adm-btn-ghost mt-4 w-full cursor-pointer !py-2.5 sm:w-auto">
        {uploading ? "Envoi en cours..." : "+ Ajouter des photos / vidéos"}
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          disabled={uploading}
          onChange={handleFiles}
          className="hidden"
        />
      </label>
    </div>
  );
}
