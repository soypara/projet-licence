// Tranches de groupe pour le prix par personne (en Ariary).
// (doit rester identique à backend/src/utils/pricing.ts)
export const TIERS = [
  { key: "1-2", label: "1 – 2" },
  { key: "3-4", label: "3 – 4" },
  { key: "5-10", label: "5 – 10" },
  { key: "11-20", label: "11 – 20" },
  { key: "21+", label: "21 +" },
];

export function tierKeyFor(travelers) {
  if (travelers <= 2) return "1-2";
  if (travelers <= 4) return "3-4";
  if (travelers <= 10) return "5-10";
  if (travelers <= 20) return "11-20";
  return "21+";
}

// Prix par personne (Ariary) pour un groupe de n personnes
export function pricePerPerson(circuit, travelers) {
  const tier = circuit?.price_tiers?.[tierKeyFor(travelers)];

  if (typeof tier === "number" && tier >= 0) return tier;

  return Number(circuit?.price || 0);
}
