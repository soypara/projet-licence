import { addDays } from "@/lib/dates";

// Acompte demandé pour valider une réservation (non remboursable).
// (doit rester identique à backend/src/utils/pricing.ts et à la fonction SQL pay_reservation)
export const DEPOSIT_RATE = 0.3;

export function depositFor(totalMga) {
  return Math.round(Number(totalMga || 0) * DEPOSIT_RATE);
}

// Acompte d'une réservation (les anciennes n'ont pas la colonne remplie)
export function depositOf(reservation) {
  return reservation?.deposit_mga != null
    ? Number(reservation.deposit_mga)
    : depositFor(reservation?.total_mga);
}

export function isPayable(reservation) {
  return (
    reservation?.payment_status !== "paid" &&
    reservation?.status !== "rejected" &&
    reservation?.status !== "cancelled"
  );
}

// "4242424242424242" -> "4242 4242 4242 4242" (chiffres seulement)
export function formatCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 19);

  return digits.replace(/(.{4})/g, "$1 ").trim();
}

// Saisie logique de la date d'expiration (MM/AA).
// Chaque chiffre est contrôlé au moment où on le tape :
//  - 1er chiffre du mois : 0 ou 1 ; de 2 à 9 -> "0" ajouté tout seul (9 -> 09)
//  - mois : de 01 à 12 (pas de 00, pas de 13...)
//  - année : entre l'année en cours et 15 ans plus tard ; si c'est l'année en
//    cours, le mois ne peut pas être déjà passé.
// Un chiffre impossible est simplement refusé (rien ne s'écrit).
export function formatExpiry(value, now = new Date()) {
  const digits = String(value || "").replace(/\D/g, "");
  const nowYear = now.getFullYear() % 100;
  const nowMonth = now.getMonth() + 1;

  let month = "";
  let year = "";

  for (const d of digits) {
    if (month.length < 2) {
      if (month.length === 0) {
        // 2..9 : le mois ne peut pas commencer par ce chiffre, on met un 0
        month = d === "0" || d === "1" ? d : `0${d}`;
      } else if (month === "0") {
        if (d !== "0") month += d;
      } else if (month === "1") {
        if (d <= "2") month += d;
      } else {
        // le mois est déjà complet (ex. "09") : ce chiffre est le début de l'année
        year = tryYear(year, d, month, nowYear, nowMonth);
      }
    } else {
      year = tryYear(year, d, month, nowYear, nowMonth);
    }

    if (year.length === 2) break;
  }

  return year ? `${month}/${year}` : month;
}

// Ajoute le chiffre d à l'année si elle reste possible, sinon l'ignore
function tryYear(year, d, month, nowYear, nowMonth) {
  const next = year + d;
  const min = nowYear;
  const max = nowYear + 15;

  const candidates = [];

  for (let y = min; y <= max; y++) {
    const text = String(y % 100).padStart(2, "0");

    if (!text.startsWith(next)) continue;
    if (y === nowYear && next.length === 2 && Number(month) < nowMonth) continue;

    candidates.push(text);
  }

  return candidates.length > 0 ? next : year;
}

// "12/30" -> { month: 12, year: 2030 } ou null si invalide
export function parseExpiry(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(String(value || ""));

  if (!match) return null;

  const month = Number(match[1]);

  if (month < 1 || month > 12) return null;

  return { month, year: 2000 + Number(match[2]) };
}

// Délai de paiement : jours AVANT le départ au plus tard pour payer l'acompte.
// (doit rester identique à backend/src/utils/pricing.ts)
export function deadlineDaysFor(travelers) {
  const n = Number(travelers) || 1;

  if (n <= 4) return 3;
  if (n <= 10) return 7;
  return 14;
}

// Date limite de paiement affichée avant l'envoi (le serveur calcule la vraie).
// Jamais avant demain, jamais après le départ.
export function payDeadlineFor(startDate, travelers, today) {
  const wanted = addDays(startDate, -deadlineDaysFor(travelers));
  const tomorrow = addDays(today, 1);
  const later = wanted > tomorrow ? wanted : tomorrow;

  return later < startDate ? later : startDate;
}
