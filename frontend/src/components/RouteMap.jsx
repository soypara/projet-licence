"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// Carte du circuit : étapes numérotées reliées par la route.
// Le tracé suit les routes réelles (service OSRM public). S'il est
// indisponible, une ligne droite en pointillés relie les étapes.
export default function RouteMap({ stops = [] }) {
  const containerRef = useRef(null);
  const [roadFound, setRoadFound] = useState(true);

  useEffect(() => {
    const points = stops.filter(
      (s) => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude))
    );

    if (!containerRef.current || points.length === 0) return;

    let map;
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, { scrollWheelZoom: false });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const latLngs = points.map((p) => [Number(p.latitude), Number(p.longitude)]);

      points.forEach((p, index) => {
        const isEdge = index === 0 || index === points.length - 1;

        L.marker(latLngs[index], {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:28px;height:28px;border-radius:9999px;background:${
              isEdge ? "#d9a441" : "#0e7a4f"
            };color:${
              isEdge ? "#04261b" : "#fff"
            };display:flex;align-items:center;justify-content:center;font:700 13px sans-serif;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)">${
              index + 1
            }</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        })
          .addTo(map)
          .bindPopup(p.name || "");
      });

      if (latLngs.length === 1) {
        map.setView(latLngs[0], 9);
        return;
      }

      map.fitBounds(L.latLngBounds(latLngs), { padding: [30, 30] });

      // Tracé de la route
      try {
        const coords = points
          .map((p) => `${Number(p.longitude)},${Number(p.latitude)}`)
          .join(";");

        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
        );

        const json = await res.json();
        const route = json.routes?.[0]?.geometry?.coordinates;

        if (!route || cancelled) throw new Error("no route");

        const line = L.polyline(
          route.map(([lng, lat]) => [lat, lng]),
          { color: "#0e7a4f", weight: 5, opacity: 0.9 }
        ).addTo(map);

        map.fitBounds(line.getBounds(), { padding: [30, 30] });
      } catch {
        if (cancelled) return;

        setRoadFound(false);

        L.polyline(latLngs, {
          color: "#0e7a4f",
          weight: 4,
          dashArray: "8 8",
        }).addTo(map);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [stops]);

  if (stops.length === 0) return null;

  return (
    <div>
      <div
        ref={containerRef}
        className="relative isolate z-0 h-72 w-full overflow-hidden rounded-2xl sm:h-96"
      />
      {!roadFound && (
        <p className="mt-2 text-xs text-white/60">
          Tracé indicatif (la route détaillée n'a pas pu être chargée).
        </p>
      )}
    </div>
  );
}
