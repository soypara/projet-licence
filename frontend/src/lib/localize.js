// Textes multilingues des circuits.
// Un circuit peut avoir title_i18n / description_i18n = { fr, en, mg }.
// Si la langue demandée est remplie : on l'utilise telle quelle.
// Sinon : traduction automatique depuis la première langue remplie.

export const LANG_ORDER = ["fr", "en", "mg"];

export function filled(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// { lang, text } : version de départ (fr, puis en, puis mg, puis texte brut)
export function sourceOf(i18n, fallback) {
  for (const lang of LANG_ORDER) {
    if (filled(i18n?.[lang])) return { lang, text: i18n[lang].trim() };
  }

  return { lang: "fr", text: fallback || "" };
}

// Retourne soit { text } (final), soit { text, translateFrom } (à traduire)
export function resolveText(i18n, fallback, lang) {
  if (filled(i18n?.[lang])) return { text: i18n[lang].trim() };

  const source = sourceOf(i18n, fallback);

  if (source.lang === lang || !source.text) return { text: source.text };

  return { text: source.text, translateFrom: source.lang };
}
