import { randomBytes } from "crypto";

// Faux prestataire de paiement (SIMULATION, aucun vrai argent).
// Il joue le rôle de Stripe / PayPal : plus tard, seule cette partie sera
// remplacée par le vrai prestataire.
//
// Cartes de test :
//   4242 4242 4242 4242  -> paiement accepté
//   4000 0000 0000 0002  -> carte refusée
//   4000 0000 0000 9995  -> fonds insuffisants
//   4000 0000 0000 0069  -> carte expirée
// Toute autre carte au numéro valide (Luhn) est acceptée.

export type CardInput = {
  card_number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
  holder: string;
};

export type ChargeResult = {
  ok: boolean;
  brand: string;
  last4: string;
  reference: string;
  reason?: "card_invalid" | "card_declined" | "insufficient_funds" | "card_expired";
};

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);

    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }

    sum += n;
    double = !double;
  }

  return sum % 10 === 0;
}

function brandOf(digits: string): string {
  if (digits.startsWith("4")) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  return "card";
}

export function chargeCard(card: CardInput): ChargeResult {
  const digits = card.card_number.replace(/\D/g, "");
  const year = card.exp_year < 100 ? 2000 + card.exp_year : card.exp_year;

  const result: ChargeResult = {
    ok: false,
    brand: brandOf(digits),
    last4: digits.slice(-4),
    reference: `SIM-${randomBytes(5).toString("hex").toUpperCase()}`,
  };

  if (digits.length < 13 || digits.length > 19 || !luhnValid(digits)) {
    return { ...result, reason: "card_invalid" };
  }

  // Valable jusqu'à la fin du mois indiqué
  const now = new Date();
  const expired =
    year < now.getFullYear() ||
    (year === now.getFullYear() && card.exp_month < now.getMonth() + 1);

  if (expired || digits === "4000000000000069") {
    return { ...result, reason: "card_expired" };
  }

  if (digits === "4000000000000002") {
    return { ...result, reason: "card_declined" };
  }

  if (digits === "4000000000009995") {
    return { ...result, reason: "insufficient_funds" };
  }

  return { ...result, ok: true };
}
