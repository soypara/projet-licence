// Dates "AAAA-MM-JJ" sans fuseau horaire (évite les décalages d'un jour).

const FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string) {
  if (!FORMAT.test(value)) return false;

  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

// Aujourd'hui à Madagascar (UTC+3), pas à l'heure du serveur
export function todayMada() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Antananarivo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));

  return date.toISOString().slice(0, 10);
}
