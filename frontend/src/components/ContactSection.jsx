"use client";

import { AGENCY } from "@/lib/agency";
import { useT } from "./LanguageProvider";

function Row({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-0.5 text-white">{children}</p>
    </div>
  );
}

export default function ContactSection() {
  const { t } = useT();

  const delta = 0.02;
  const bbox = [
    AGENCY.longitude - delta,
    AGENCY.latitude - delta,
    AGENCY.longitude + delta,
    AGENCY.latitude + delta,
  ].join(",");

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${AGENCY.latitude},${AGENCY.longitude}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${AGENCY.latitude},${AGENCY.longitude}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">{t("nav.contact")}</p>
        <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          {t("contact.title")}
        </h2>
        <p className="text-white/80">{t("contact.subtitle")}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass space-y-4 p-5 sm:p-6">
          <Row label={t("contact.phone")}>{AGENCY.phone}</Row>
          <Row label={t("contact.email")}>{AGENCY.email}</Row>
          <Row label={t("contact.address")}>{AGENCY.address}</Row>
          <Row label={t("contact.hours")}>{AGENCY.hours}</Row>

          <div className="flex flex-wrap gap-3 pt-2">
            <a href={`tel:${AGENCY.phone.replace(/\s/g, "")}`} className="btn-gold">
              {t("contact.call")}
            </a>
            <a
              href={`https://wa.me/${AGENCY.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-glass"
            >
              WhatsApp
            </a>
            <a href={`mailto:${AGENCY.email}`} className="btn-glass">
              {t("contact.email")}
            </a>
          </div>
        </div>

        <div className="glass space-y-3 overflow-hidden p-3">
          <iframe
            title={t("contact.address")}
            src={mapSrc}
            loading="lazy"
            className="h-64 w-full rounded-2xl border-0 sm:h-72"
          />

          <a
            href={directions}
            target="_blank"
            rel="noreferrer"
            className="btn-glass w-full"
          >
            {t("contact.directions")}
          </a>
        </div>
      </div>
    </div>
  );
}
