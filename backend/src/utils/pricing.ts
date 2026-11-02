// Tranches de groupe pour le prix par personne.
// (doit rester identique à frontend/src/lib/pricing.js)
export const TIER_KEYS = ["1-2", "3-4", "5-10", "11-20", "21+"] as const;

export function tierKeyFor(travelers: number): string {
  if (travelers <= 2) return "1-2";
  if (travelers <= 4) return "3-4";
  if (travelers <= 10) return "5-10";
  if (travelers <= 20) return "11-20";
  return "21+";
}

export function pricePerPerson(
  circuit: { price?: number | null; price_tiers?: Record<string, number> | null },
  travelers: number
): number {
  const tier = circuit.price_tiers?.[tierKeyFor(travelers)];

  if (typeof tier === "number" && tier >= 0) return tier;

  return Number(circuit.price || 0);
}

// Acompte demandé pour valider une réservation (non remboursable).
// (doit rester identique à frontend/src/lib/payment.js et à la fonction SQL pay_reservation)
export const DEPOSIT_RATE = 0.3;

export function depositFor(totalMga: number): number {
  return Math.round(totalMga * DEPOSIT_RATE);
}

// Délai de paiement : jours AVANT le départ au plus tard pour payer l'acompte.
// Plus le groupe est grand, plus l'agence a besoin de temps pour préparer.
// (doit rester identique à frontend/src/lib/payment.js)
export function deadlineDaysFor(travelers: number): number {
  if (travelers <= 4) return 3;
  if (travelers <= 10) return 7;
  return 14;
}
