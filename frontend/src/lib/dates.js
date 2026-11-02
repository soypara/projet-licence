// Dates "AAAA-MM-JJ" manipulées sans fuseau horaire (aucun décalage d'un jour).

export function parseIso(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);

  return new Date(y, m - 1, d, 12, 0, 0);
}

export function toIso(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso() {
  return toIso(new Date());
}

export function addDays(iso, days) {
  const date = parseIso(iso);

  date.setDate(date.getDate() + days);

  return toIso(date);
}

// Dernier jour d'un départ qui commence à `start` et dure `duration` jours
export function endOf(start, duration) {
  return addDays(start, Math.max(1, Number(duration) || 1) - 1);
}

// "12 mai", ou "12 mai 2027" avec l'année
export function formatDay(iso, locale = "fr-FR", withYear = true) {
  return parseIso(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

// Texte d'un départ. `t` : fonction de traduction (clés dep.range / dep.one_day).
export function formatRange(start, end, locale, t) {
  if (!end || end === start) {
    return t("dep.one_day", { from: formatDay(start, locale) });
  }

  const sameYear = start.slice(0, 4) === end.slice(0, 4);

  return t("dep.range", {
    from: formatDay(start, locale, !sameYear),
    to: formatDay(end, locale, true),
  });
}
