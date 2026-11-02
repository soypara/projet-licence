"use client";

import { useEffect, useState } from "react";
import PageBackground from "@/components/PageBackground";
import BackArrow from "@/components/BackArrow";
import { useT } from "@/components/LanguageProvider";
import { api } from "../../lib/api";
import { friendlyError } from "@/lib/friendlyError";

export default function TouristPlacesPage() {
  const { t } = useT();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setPlaces(await api.get("/tourist-places"));
      } catch (e) {
        setError(friendlyError(e, t));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <>
      <PageBackground name="lieux" />

      <div className="space-y-6 py-4">
        <BackArrow href="/#discover" />

        <div className="space-y-2">
          <p className="eyebrow">{t("places.eyebrow")}</p>
          <h1 className="hero-title">{t("places.title")}</h1>
          <p className="max-w-md text-white/80">{t("places.subtitle")}</p>
        </div>

        {error && <div className="glass p-4 text-sm text-red-100">{error}</div>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass h-40 animate-pulse" />
            ))}
          </div>
        ) : places.length === 0 && !error ? (
          <div className="glass p-6 text-center text-white/80">
            {t("places.empty")}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => (
              <li key={p.id} className="glass flex flex-col gap-3 p-5">
                <h2 className="font-serif text-xl font-semibold leading-snug">
                  {p.name}
                </h2>

                {p.description && (
                  <p className="line-clamp-4 text-sm text-white/80">
                    {p.description}
                  </p>
                )}

                <p className="mt-auto pt-2 font-mono text-xs text-or-clair">
                  {p.latitude}, {p.longitude}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
