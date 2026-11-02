"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import useLocalizedCircuits from "./useLocalizedCircuits";

export function sortMedia(list) {
  return Array.isArray(list)
    ? [...list].sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1))
    : [];
}

// Circuits (dans la langue courante) + leurs photos.
// Mêmes appels qu'avant : GET /circuits puis GET /media/circuit/:id.
export default function useCircuitsWithMedia() {
  const [raw, setRaw] = useState([]);
  const [media, setMedia] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await api.get("/circuits");
        const list = Array.isArray(data) ? data : [];

        if (!active) return;
        setRaw(list);

        const entries = await Promise.all(
          list.map(async (c) => {
            try {
              return [c.id, sortMedia(await api.get(`/media/circuit/${c.id}`))];
            } catch {
              return [c.id, []];
            }
          })
        );

        if (active) setMedia(Object.fromEntries(entries));
      } catch {
        // les pages affichent leur message "aucun circuit"
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const circuits = useLocalizedCircuits(raw);

  return { circuits, media, loading };
}

export function coverOf(media, circuitId) {
  return media[circuitId]?.find((m) => m.type === "photo")?.url || "";
}
