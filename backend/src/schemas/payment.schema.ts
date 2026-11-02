import { z } from "zod";

// Données de carte envoyées par le formulaire de paiement.
// Elles ne sont JAMAIS enregistrées : on garde seulement la marque
// et les 4 derniers chiffres.
export const paymentSchema = z.object({
  card_number: z
    .string()
    .trim()
    .regex(/^[\d\s]{12,23}$/, "card_invalid"),

  exp_month: z.number().int().min(1, "card_expired").max(12, "card_expired"),

  exp_year: z.number().int().min(0, "card_expired").max(2200, "card_expired"),

  cvc: z.string().trim().regex(/^\d{3,4}$/, "card_invalid"),

  holder: z.string().trim().min(2, "card_invalid").max(60, "card_invalid"),

  // Devise et montant affichés au client (ex. 30 EUR), gardés pour l'agence
  currency: z
    .enum(["MGA", "EUR", "USD", "CNY", "JPY", "KRW", "INR", "AED", "TRY", "RUB"])
    .optional(),

  display_amount: z.number().positive().max(1e12).optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
