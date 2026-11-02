// Numéros de téléphone : indicatif choisi dans une liste + chiffres seulement.
// Le numéro envoyé au serveur est au format international : +261341234567.

// [code pays, indicatif]
export const COUNTRIES = [
  ["MG", "261"],
  ["FR", "33"],
  ["RE", "262"],
  ["YT", "262"],
  ["MU", "230"],
  ["KM", "269"],
  ["SC", "248"],
  ["ZA", "27"],
  ["MZ", "258"],
  ["KE", "254"],
  ["TZ", "255"],
  ["SN", "221"],
  ["CI", "225"],
  ["CM", "237"],
  ["MA", "212"],
  ["DZ", "213"],
  ["TN", "216"],
  ["EG", "20"],
  ["BE", "32"],
  ["CH", "41"],
  ["LU", "352"],
  ["DE", "49"],
  ["IT", "39"],
  ["ES", "34"],
  ["PT", "351"],
  ["NL", "31"],
  ["GB", "44"],
  ["IE", "353"],
  ["SE", "46"],
  ["NO", "47"],
  ["DK", "45"],
  ["PL", "48"],
  ["RU", "7"],
  ["TR", "90"],
  ["AE", "971"],
  ["IN", "91"],
  ["CN", "86"],
  ["JP", "81"],
  ["KR", "82"],
  ["TH", "66"],
  ["VN", "84"],
  ["SG", "65"],
  ["AU", "61"],
  ["NZ", "64"],
  ["US", "1"],
  ["CA", "1"],
  ["BR", "55"],
  ["MX", "52"],
  ["AR", "54"],
];

const DIAL = Object.fromEntries(COUNTRIES);

const MAX_DIGITS = 12;

export function dialOf(country) {
  return DIAL[country] || "261";
}

// Pays par défaut : fuseau horaire (Madagascar → +261), sinon région de la
// langue du navigateur, sinon Madagascar.
const TIMEZONES = {
  "Indian/Antananarivo": "MG",
  "Indian/Reunion": "RE",
  "Indian/Mayotte": "YT",
  "Indian/Mauritius": "MU",
  "Indian/Comoro": "KM",
  "Indian/Mahe": "SC",
  "Europe/Paris": "FR",
  "Europe/Brussels": "BE",
  "Europe/Zurich": "CH",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/London": "GB",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "Africa/Johannesburg": "ZA",
};

export function detectCountry() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (TIMEZONES[zone] && DIAL[TIMEZONES[zone]]) return TIMEZONES[zone];

    const region = (navigator.language || "").split("-")[1]?.toUpperCase();

    if (region && DIAL[region]) return region;
  } catch {
    // on garde Madagascar
  }

  return "MG";
}

// Garde uniquement les chiffres ; retire le 0 du début (0341234567 → 341234567)
export function cleanNational(text) {
  const digits = String(text || "").replace(/\D/g, "").replace(/^0+/, "");

  return digits.slice(0, MAX_DIGITS);
}

export function emptyPhone(country = "MG") {
  return { country, national: "" };
}

export function fullPhone(phone) {
  return `+${dialOf(phone.country)}${phone.national}`;
}

// Retourne "" si le numéro est correct, sinon une clé d'erreur de traduction.
export function phoneError(phone) {
  if (!phone.national) return "v.phone";

  // Madagascar : 9 chiffres après +261 (ex. 34 12 345 67)
  if (phone.country === "MG") {
    return phone.national.length === 9 ? "" : "v.phone_mg";
  }

  return phone.national.length >= 6 ? "" : "v.phone_bad";
}
