"use client";

import { useMemo, useState } from "react";
import PageBackground from "@/components/PageBackground";
import BackArrow from "@/components/BackArrow";
import CircuitCard from "@/components/CircuitCard";
import CircuitSearch from "@/components/CircuitSearch";
import { circuitMatches, matchedStops } from "@/lib/search";
import useCircuitsWithMedia, { coverOf } from "@/components/useCircuitsWithMedia";
import { useT } from "@/components/LanguageProvider";

export default function CircuitsPage() {
  const { t } = useT();
  const { circuits, media, loading } = useCircuitsWithMedia();
  const [query, setQuery] = useState("");

  const shown = useMemo(
    () => circuits.filter((c) => circuitMatches(c, query)),
    [circuits, query]
  );

  return (
    <>
      <PageBackground name="circuits" />

      <div className="space-y-6 py-4">
        <BackArrow href="/" />

        <div className="space-y-2">
          <p className="eyebrow">{t("circuits.eyebrow")}</p>
          <h1 className="hero-title">{t("circuits.title")}</h1>
          <p className="max-w-md text-white/80">{t("circuits.subtitle")}</p>
        </div>

        {!loading && circuits.length > 0 && (
          <CircuitSearch value={query} onChange={setQuery} />
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass h-72 animate-pulse" />
            ))}
          </div>
        ) : circuits.length === 0 ? (
          <div className="glass p-6 text-center text-white/80">
            {t("circuits.empty")}
          </div>
        ) : shown.length === 0 ? (
          <div className="glass p-6 text-center text-white/80">
            {t("search.none", { q: query.trim() })}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((c) => (
              <CircuitCard
                key={c.id}
                circuit={c}
                cover={coverOf(media, c.id)}
                via={matchedStops(c, query)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
