"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import PhotoMosaic from "@/components/PhotoMosaic";
import ReserveAd from "@/components/ReserveAd";
import CircuitCard from "@/components/CircuitCard";
import ContactSection from "@/components/ContactSection";
import HScroller from "@/components/HScroller";
import CircuitSearch from "@/components/CircuitSearch";
import { circuitMatches, matchedStops } from "@/lib/search";
import useCircuitsWithMedia, {
  coverOf,
  sortMedia,
} from "@/components/useCircuitsWithMedia";
import { useT } from "@/components/LanguageProvider";
import { api } from "@/lib/api";

/* ---------- Page ---------- */

export default function HomePage() {
  const { t } = useT();

  const { circuits, media: circuitMedia, loading: loadingCircuits } =
    useCircuitsWithMedia();

  const [query, setQuery] = useState("");

  const [places, setPlaces] = useState([]);
  const [placeMedia, setPlaceMedia] = useState({});
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  const loading = loadingCircuits || loadingPlaces;

  const shownCircuits = useMemo(
    () => circuits.filter((c) => circuitMatches(c, query)),
    [circuits, query]
  );

  // Lieux à découvrir, avec leurs photos
  useEffect(() => {
    async function load() {
      try {
        const placeList = await api.get("/tourist-places");

        const ps = (Array.isArray(placeList) ? placeList : [])
          .slice(0, 8);

        setPlaces(ps);

        const entries = await Promise.all(
          ps.map(async (p) => {
            try {
              return [
                p.id,
                sortMedia(await api.get(`/media/tourist_place/${p.id}`)),
              ];
            } catch {
              return [p.id, []];
            }
          })
        );

        setPlaceMedia(Object.fromEntries(entries));
      } catch {
        // la page reste utilisable : la section n'affiche rien
      } finally {
        setLoadingPlaces(false);
      }
    }

    load();
  }, []);

  // Photos du fond : circuits d'abord, puis lieux
  const photos = useMemo(() => {
    const urls = [];

    Object.values(circuitMedia).forEach((list) =>
      list.forEach((m) => m.type === "photo" && urls.push(m.url))
    );
    Object.values(placeMedia).forEach((list) =>
      list.forEach((m) => m.type === "photo" && urls.push(m.url))
    );

    return urls;
  }, [circuitMedia, placeMedia]);

  return (
    <>
      <PhotoMosaic photos={photos} />

      {/* ---------- Présentation ---------- */}
      <section
        id="top"
        className="flex min-h-[78svh] flex-col items-center justify-center gap-6 py-12 text-center"
      >
        <p className="eyebrow [text-shadow:0_2px_12px_rgb(0_0_0/0.7)]">{t("h.eyebrow")}</p>

        <h1 className="hero-title">{t("h.title")}</h1>

        <p className="max-w-xl text-lg text-white [text-shadow:0_2px_14px_rgb(0_0_0/0.7)]">{t("h.subtitle")}</p>

        <div className="flex flex-wrap justify-center gap-3">
          <a href="#circuits" className="btn-gold">
            {t("h.cta_circuits")}
          </a>
          <a href="#reserve" className="btn-glass">
            {t("h.cta_reserve")}
          </a>
        </div>
      </section>

      {/* ---------- Circuits ---------- */}
      <section id="circuits" className="scroll-mt-20 space-y-6 py-10">
        <div className="space-y-2">
          <p className="eyebrow">{t("nav.circuits")}</p>
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            {t("c.title")}
          </h2>
          <p className="text-white/80">{t("c.subtitle")}</p>
        </div>

        {!loading && circuits.length > 0 && (
          <CircuitSearch value={query} onChange={setQuery} />
        )}

        {!loading && circuits.length === 0 ? (
          <div className="glass p-6 text-center text-white/80">
            {t("c.none")}
          </div>
        ) : !loading && shownCircuits.length === 0 ? (
          <div className="glass p-6 text-center text-white/80">
            {t("search.none", { q: query.trim() })}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading &&
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="glass h-72 animate-pulse bg-white/5"
                />
              ))}

            {shownCircuits.map((circuit) => (
              <CircuitCard
                key={circuit.id}
                circuit={circuit}
                via={matchedStops(circuit, query)}
                cover={coverOf(circuitMedia, circuit.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Annonce de réservation (formulaire sur /reserve) ---------- */}
      <section id="reserve" className="scroll-mt-20 py-10">
        <ReserveAd />
      </section>

      {/* ---------- À découvrir (feed réduit) ---------- */}
      <section id="discover" className="scroll-mt-20 space-y-6 py-10">
        <div className="space-y-2">
          <p className="eyebrow">{t("nav.discover")}</p>
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            {t("d.title")}
          </h2>
          <p className="text-white/80">{t("d.subtitle")}</p>
        </div>

        {places.length > 0 && (
          <HScroller>
            {places.map((place) => {
              const photo = placeMedia[place.id]?.find(
                (m) => m.type === "photo"
              )?.url;

              return (
                <Link
                  key={place.id}
                  href={`/tourist-places/${place.id}`}
                  className="glass w-[72%] flex-none snap-start overflow-hidden p-0 sm:w-64"
                >
                  <div className="h-36 bg-emeraude-800/60">
                    {photo && (
                      <img
                        src={photo}
                        alt={place.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="space-y-1 p-3">
                    <h3 className="truncate font-serif text-lg font-semibold">
                      {place.name}
                    </h3>
                    {place.description && (
                      <p className="line-clamp-2 text-xs text-white/75">
                        {place.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </HScroller>
        )}

        <Link href="/feed" className="btn-glass">
          {t("d.all")} →
        </Link>
      </section>

      {/* ---------- Contact ---------- */}
      <section id="contact" className="scroll-mt-20 py-10">
        <ContactSection />
      </section>
    </>
  );
}
