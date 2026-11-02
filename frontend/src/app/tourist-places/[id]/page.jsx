"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageBackground from "@/components/PageBackground";
import BackArrow from "@/components/BackArrow";
import { useT } from "@/components/LanguageProvider";
import { api } from "../../../lib/api";
import { friendlyError } from "@/lib/friendlyError";

export default function TouristPlaceDetailPage() {
  const { id } = useParams();
  const { t } = useT();

  const [place, setPlace] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // On réutilise la liste déjà exposée par l'API et on cherche le lieu.
        const [list, m] = await Promise.all([
          api.get("/tourist-places"),
          api.get(`/media/tourist_place/${id}`),
        ]);
        setPlace((Array.isArray(list) ? list : []).find((p) => p.id === id) || null);
        setMedia(
          Array.isArray(m)
            ? m.sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1))
            : []
        );
      } catch (e) {
        setError(friendlyError(e, t));
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  return (
    <>
      <PageBackground name="lieux" />

      <div className="mx-auto max-w-3xl space-y-6 py-4">
        <BackArrow href="/feed" />

        {error && <div className="glass p-4 text-sm text-red-100">{error}</div>}

        {loading && <div className="glass h-48 animate-pulse" />}

        {!loading && !place && !error && (
          <div className="glass p-6 text-center text-white/80">
            {t("place.not_found")}
          </div>
        )}

        {place && (
          <>
            <div className="space-y-3">
              <p className="eyebrow">{t("place.eyebrow")}</p>
              <h1 className="hero-title !text-4xl sm:!text-5xl">{place.name}</h1>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/map?lat=${encodeURIComponent(
                    place.latitude
                  )}&lng=${encodeURIComponent(
                    place.longitude
                  )}&place=${encodeURIComponent(place.name)}`}
                  className="btn-glass"
                >
                  {t("place.map")}
                </Link>
              </div>
            </div>

            {media.length > 0 && (
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((m, i) => (
                  <div
                    key={m.id}
                    className={`glass overflow-hidden !rounded-2xl ${
                      i === 0 ? "col-span-2 sm:col-span-3" : ""
                    }`}
                  >
                    {m.type === "photo" ? (
                      <img
                        src={m.url}
                        alt={m.alt_text || place.name}
                        className={`w-full object-cover ${
                          i === 0 ? "h-64 sm:h-96" : "h-40"
                        }`}
                      />
                    ) : (
                      <video
                        src={m.url}
                        className="h-40 w-full object-cover"
                        controls
                      />
                    )}
                  </div>
                ))}
              </section>
            )}

            {place.description && (
              <section className="glass p-5 sm:p-6">
                <p className="whitespace-pre-line leading-relaxed text-white/90">
                  {place.description}
                </p>
                {place.source_url && (
                  <p className="mt-4 text-xs text-white/60">
                    {t("place.source")}{" "}
                    <a
                      href={place.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {place.source_url}
                    </a>
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
