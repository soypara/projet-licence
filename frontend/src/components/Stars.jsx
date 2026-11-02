"use client";

import { useT } from "./LanguageProvider";

// Étoiles en lecture seule (value peut être null)
export function StarsDisplay({ value = null, className = "" }) {
  const rounded = typeof value === "number" ? Math.round(value) : 0;

  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rounded ? "text-or-clair" : "text-white/25"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// Ligne de note compacte : ★★★★☆ 4.5 (12 avis) ou "Pas encore noté"
export function RatingLine({ rating = null, count = 0, className = "" }) {
  const { t } = useT();
  const has = typeof rating === "number" && count > 0;

  return (
    <span className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <StarsDisplay value={has ? rating : null} />
      <span className="text-white/80">
        {has
          ? `${rating.toFixed(1)} · ${t("reviews.count", { n: count })}`
          : t("feed.not_rated")}
      </span>
    </span>
  );
}

// Étoiles cliquables (notation 1 à 5)
export function StarsInput({ value, onChange }) {
  const { t } = useT();

  return (
    <div
      className="flex gap-1"
      role="radiogroup"
      aria-label={t("reviews.your_rating")}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={t("reviews.stars_aria", { n: star })}
          onClick={() => onChange(star)}
          className={`text-3xl leading-none transition active:scale-90 ${
            star <= value ? "text-or-clair" : "text-white/30 hover:text-white/60"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
