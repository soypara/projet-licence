import { z } from "zod";

import { isIsoDate, todayMada } from "../utils/dates";

export const reservationSchema = z.object({
  circuit_id: z.string().uuid("Circuit invalide."),

  start_date: z
    .string()
    .refine(isIsoDate, "Date invalide.")
    .refine((d) => d >= todayMada(), "Cette date de départ est passée."),

  travelers: z
    .number()
    .int("Nombre de voyageurs invalide.")
    .min(1, "Au moins 1 voyageur.")
    .max(30, "Maximum 30 voyageurs."),

  full_name: z
    .string()
    .trim()
    .min(2, "Nom trop court.")
    .max(80, "Nom trop long."),

  phone: z
    .string()
    .trim()
    .regex(
      /^\+\d{8,15}$/,
      "Numéro de téléphone invalide (indicatif + chiffres uniquement)."
    ),

  note: z.string().trim().max(500, "Message trop long.").optional(),
});

export const reservationStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "rejected", "cancelled"]),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
