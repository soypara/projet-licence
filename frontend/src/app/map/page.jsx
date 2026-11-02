"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageBackground from "@/components/PageBackground";
import BackArrow from "@/components/BackArrow";
import { useT } from "@/components/LanguageProvider";

function MapView() {
  const { t } = useT();
  const params = useSearchParams();
  const lat = parseFloat(params.get("lat"));
  const lng = parseFloat(params.get("lng"));
  const name = params.get("place") || t("map.default_name");
  const valid = Number.isFinite(lat) && Number.isFinite(lng);

  const d = 0.05;
  const src = valid
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`
    : "";

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-4">
      <BackArrow href="/feed" />

      <div className="space-y-2">
        <p className="eyebrow">{t("map.eyebrow")}</p>
        <h1 className="hero-title !text-4xl">{name}</h1>
      </div>

      {valid ? (
        <div className="glass overflow-hidden !rounded-3xl p-2">
          <iframe
            title={t("map.iframe_title", { name })}
            src={src}
            className="h-[60svh] w-full rounded-2xl border-0"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="glass p-6 text-center text-white/80">
          {t("map.missing")}
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <>
      <PageBackground name="lieux" />
      <Suspense fallback={<div className="glass h-48 animate-pulse" />}>
        <MapView />
      </Suspense>
    </>
  );
}
