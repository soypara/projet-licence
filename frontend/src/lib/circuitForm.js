import { TIERS } from "./pricing";
import { LANG_ORDER, filled } from "./localize";

export function emptyCircuitForm() {
  return {
    title: { fr: "", en: "", mg: "" },
    description: { fr: "", en: "", mg: "" },
    tiers: Object.fromEntries(TIERS.map((t) => [t.key, ""])),
    duration_days: "",
    stops: [], // ids des lieux, dans l'ordre : départ -> arrivée
    departures: [], // 1er jour de chaque départ (AAAA-MM-JJ), à venir
  };
}

// Formulaire rempli à partir d'un circuit venant de l'API
export function formFromCircuit(circuit) {
  const form = emptyCircuitForm();

  LANG_ORDER.forEach((lang) => {
    form.title[lang] = circuit.title_i18n?.[lang] || "";
    form.description[lang] = circuit.description_i18n?.[lang] || "";
  });

  // Ancien circuit sans textes par langue : le texte actuel va dans "fr"
  if (!LANG_ORDER.some((l) => filled(form.title[l]))) {
    form.title.fr = circuit.title || "";
  }

  if (!LANG_ORDER.some((l) => filled(form.description[l]))) {
    form.description.fr = circuit.description || "";
  }

  TIERS.forEach((t) => {
    const value = circuit.price_tiers?.[t.key];
    form.tiers[t.key] = value ?? (t.key === "1-2" ? circuit.price ?? "" : "");
  });

  form.duration_days = circuit.duration_days || "";
  form.stops = (circuit.stops || []).map((s) => s.id);
  form.departures = (circuit.departures || []).map((d) => d.start_date);

  return form;
}

function firstFilled(values) {
  for (const lang of LANG_ORDER) {
    if (filled(values[lang])) return values[lang].trim();
  }

  return "";
}

function cleanI18n(values) {
  const out = {};

  LANG_ORDER.forEach((lang) => {
    if (filled(values[lang])) out[lang] = values[lang].trim();
  });

  return out;
}

// Retourne { error } ou { payload, placeIds }
// ta : fonction de traduction de l'admin (useAT)
export function buildCircuitPayload(form, ta) {
  const title = firstFilled(form.title);
  const description = firstFilled(form.description);

  if (title.length < 3) {
    return { error: ta("a.cir.val_title") };
  }

  if (description.length < 10) {
    return { error: ta("a.cir.val_description") };
  }

  const tiers = {};

  for (const t of TIERS) {
    const raw = form.tiers[t.key];

    if (raw === "" || raw === null || Number.isNaN(Number(raw)) || Number(raw) < 0) {
      return { error: ta("a.cir.val_price", { group: t.label }) };
    }

    tiers[t.key] = Number(raw);
  }

  if (form.stops.length < 2) {
    return { error: ta("a.cir.val_stops") };
  }

  const payload = {
    title,
    description,
    title_i18n: cleanI18n(form.title),
    description_i18n: cleanI18n(form.description),
    price_tiers: tiers,
    // Prix de départ affiché sur les cartes : le plus bas des tarifs
    price: Math.min(...Object.values(tiers)),
  };

  if (form.duration_days) {
    payload.duration_days = Number(form.duration_days);
  }

  return { payload, placeIds: form.stops, departures: form.departures };
}
