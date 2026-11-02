"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import PageBackground from "@/components/PageBackground";
import BackArrow from "@/components/BackArrow";
import { useT } from "@/components/LanguageProvider";
import { api } from "../../lib/api";
import { friendlyError } from "@/lib/friendlyError";

/* =========================================================
   SQUELETTE
   ========================================================= */

function FeedSkeleton() {
  return (
    <article className="glass animate-pulse space-y-4 p-3">
      <div className="h-[340px] w-full rounded-2xl bg-white/10 sm:h-[420px]" />
      <div className="space-y-2 px-2 pb-2">
        <div className="h-4 w-1/3 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-3/4 rounded bg-white/10" />
      </div>
    </article>
  );
}

/* Bloc grisé de fin de feed : même forme qu'un post, mais vide */
function FeedEnd() {
  const { t } = useT();

  return (
    <article className="glass space-y-4 p-3 opacity-40" aria-live="polite">
      <div className="flex h-[340px] w-full items-center justify-center rounded-2xl bg-white/10 sm:h-[420px]">
        <p className="px-6 text-center font-serif text-lg text-white/90">
          {t("feed.end")}
        </p>
      </div>
      <div className="space-y-2 px-2 pb-2">
        <div className="h-4 w-1/3 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-3/4 rounded bg-white/10" />
      </div>
    </article>
  );
}

/* =========================================================
   CAROUSEL
   ========================================================= */

function PhotoCarousel({ place, media }) {
  const { t } = useT();
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);

  if (!media || media.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-2xl bg-white/5 text-center text-white/60 sm:h-[320px]">
        <div>
          <svg
            viewBox="0 0 24 24"
            width="36"
            height="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-2"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <circle cx="9" cy="11" r="2" />
            <path d="M21 16l-5-5-8 8" />
          </svg>
          <p className="text-sm">{t("feed.no_photo")}</p>
        </div>
      </div>
    );
  }

  function handleScroll() {
    const carousel = carouselRef.current;

    if (!carousel) return;

    const slideWidth = carousel.clientWidth;
    const index = Math.round(carousel.scrollLeft / slideWidth);

    setActiveIndex(index);
  }

  return (
    <div className="relative">
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth rounded-2xl"
      >
        {media.map((item, index) => {
          const caption = index === 0 ? place.name : item.caption || "";

          return (
            <div
              key={item.id}
              className="relative w-full flex-none snap-center snap-always"
            >
              {item.type === "photo" ? (
                <img
                  src={item.url}
                  alt={item.alt_text || place.name}
                  className="h-[340px] w-full object-cover sm:h-[420px]"
                />
              ) : (
                <video
                  src={item.url}
                  className="h-[340px] w-full object-cover sm:h-[420px]"
                  controls
                />
              )}

              {/* Légende sur dégradé */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-emeraude-950/90 via-emeraude-950/40 to-transparent p-4 pt-16">
                <p className="font-serif text-lg font-semibold text-white drop-shadow">
                  {caption}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Points flottants */}
      {media.length > 1 && (
        <div className="absolute inset-x-0 top-3 flex justify-center">
          <div className="flex gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 backdrop-blur">
            {media.map((item, index) => (
              <span
                key={item.id}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? "w-4 bg-or-clair" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   POST
   ========================================================= */

function FeedPost({ place, media }) {
  const router = useRouter();
  const { t } = useT();

  function openMap() {
    router.push(
      `/map?lat=${encodeURIComponent(
        place.latitude
      )}&lng=${encodeURIComponent(
        place.longitude
      )}&place=${encodeURIComponent(place.name)}`
    );
  }

  function openDetails() {
    router.push(`/tourist-places/${place.id}`);
  }

  return (
    <article className="glass space-y-4 p-3">
      <PhotoCarousel place={place} media={media} />

      <div className="space-y-3 px-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openMap}
            className="chip transition hover:bg-white/20"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1.5"
              aria-hidden="true"
            >
              <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {t("feed.location")}
          </button>

        </div>

        {place.description && (
          <p className="line-clamp-4 text-sm leading-relaxed text-white/80">
            {place.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-white/15 px-2 pb-1 pt-3">
        <button type="button" onClick={openDetails} className="btn-gold !px-5 !py-2">
          {t("feed.more")}
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   FEED
   ========================================================= */

export default function FeedPage() {
  const { t } = useT();
  const [places, setPlaces] = useState([]);
  const [mediaByPlace, setMediaByPlace] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const list = await api.get("/tourist-places");

        const placesList = Array.isArray(list) ? list : [];

        setPlaces(placesList);

        if (placesList.length > 0) {
          const entries = await Promise.all(
            placesList.map(async (place) => {
              try {
                const media = await api.get(
                  `/media/tourist_place/${place.id}`
                );

                return [
                  place.id,
                  Array.isArray(media)
                    ? media.sort(
                        (a, b) =>
                          (a.sort_order || 1) - (b.sort_order || 1)
                      )
                    : [],
                ];
              } catch {
                return [place.id, []];
              }
            })
          );

          setMediaByPlace(Object.fromEntries(entries));
        }
      } catch (e) {
        setError(friendlyError(e, t));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const visiblePlaces = places;

  return (
    <>
      <PageBackground name="feed" />

      <div className="mx-auto max-w-xl space-y-6 py-4 lg:max-w-5xl">
        <BackArrow href="/#discover" />

        <div className="space-y-2">
          <p className="eyebrow">{t("feed.eyebrow")}</p>
          <h1 className="hero-title !text-4xl sm:!text-5xl">{t("feed.title")}</h1>
          <p className="text-white/80">{t("feed.subtitle")}</p>
        </div>

        {error && <div className="glass p-4 text-sm text-red-100">{error}</div>}

        <div className="grid items-start gap-6 lg:grid-cols-2">
          {loading &&
            [0, 1, 2].map((i) => <FeedSkeleton key={`loading-${i}`} />)}

          {!loading &&
            visiblePlaces.map((place) => (
              <FeedPost
                key={place.id}
                place={place}
                media={mediaByPlace[place.id] || []}
              />
            ))}

          {!loading && visiblePlaces.length > 0 && <FeedEnd />}

          {!loading && places.length === 0 && !error && (
            <div className="glass p-6 text-center text-white/80 lg:col-span-2">
              {t("feed.empty")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
