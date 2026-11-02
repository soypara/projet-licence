// Devises affichées sur le site.
// Les prix de la base (colonne circuits.price) sont en Ariary (MGA).
// Chaque devise est calculée DIRECTEMENT depuis le prix en Ariary, puis
// arrondie (jamais une devise depuis une autre : pas de dérive 100 -> 100,1).
//
// Pour changer les taux : modifie PER_EUR (combien d'unités pour 1 euro).
// >>> Les taux ci-dessous sont APPROXIMATIFS : à vérifier avant une démo. <<<

export const BASE_CURRENCY = "MGA";

// Ordre du sélecteur : Madagascar, Europe, Amériques, puis Asie
export const CURRENCIES = [
  "MGA",
  "EUR",
  "USD",
  "CNY",
  "JPY",
  "KRW",
  "INR",
  "AED",
  "TRY",
  "RUB",
];

// Devises montrées sous le total d'une réservation
export const HEADLINE_CURRENCIES = ["MGA", "EUR", "USD"];

// Unités pour 1 euro
export const PER_EUR = {
  EUR: 1,
  USD: 1.1,
  MGA: 5000,
  CNY: 7.9,
  JPY: 165,
  KRW: 1600,
  INR: 92,
  AED: 4.1,
  TRY: 40,
  RUB: 95,
};

// Pas d'arrondi : environ 5 € partout (EUR et USD au 5, Ariary aux 5 000)
const STEP = {
  EUR: 5,
  USD: 5,
  MGA: 5000,
  CNY: 50,
  JPY: 1000,
  KRW: 10000,
  INR: 500,
  AED: 20,
  TRY: 250,
  RUB: 500,
};

// Devise proposée quand on choisit une langue
export const LANG_CURRENCY = {
  fr: "EUR",
  en: "USD", // l'anglais accepte aussi l'euro, voir currencyForLang
  mg: "MGA",
  es: "EUR",
  "zh-CN": "CNY",
  ja: "JPY",
  ko: "KRW",
  it: "EUR",
  "pt-BR": "USD",
  ar: "AED",
  la: "EUR",
  de: "EUR",
  ru: "RUB",
  hi: "INR",
  tr: "TRY",
};

// Devise à afficher après un changement de langue.
// Anglais : on garde l'euro ou le dollar si l'un des deux est déjà choisi
// (anglais britannique ou américain), sinon le dollar.
export function currencyForLang(lang, current) {
  if (lang === "en" && (current === "EUR" || current === "USD")) return current;

  return LANG_CURRENCY[lang] || "EUR";
}

export function convert(priceMga, currency) {
  const eur = Number(priceMga || 0) / PER_EUR.MGA;
  const value = eur * PER_EUR[currency];
  const step = STEP[currency];

  const rounded = Math.round(value / step) * step;

  // Un prix non nul ne s'affiche jamais à 0
  return value > 0 && rounded === 0 ? step : rounded;
}

export function formatPrice(priceMga, currency, locale = "fr-FR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(convert(priceMga, currency));
}

// ---- Côté ADMIN : montants exacts, sans arrondi "commercial" ----
// (le client voit des prix arrondis ; l'admin voit la valeur exacte,
// à la virgule près, dans chaque devise)

export function convertExact(priceMga, currency) {
  return (Number(priceMga || 0) / PER_EUR.MGA) * PER_EUR[currency];
}

export function formatExact(priceMga, currency, locale = "fr-FR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "MGA" ? 0 : 2,
    maximumFractionDigits: currency === "MGA" ? 2 : 2,
  }).format(convertExact(priceMga, currency));
}

// Montant déjà exprimé dans une devise (ex. "120 €" payé par le client)
export function formatInCurrency(amount, currency, locale = "fr-FR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "MGA" || currency === "JPY" || currency === "KRW" ? 0 : 2,
  }).format(Number(amount || 0));
}
