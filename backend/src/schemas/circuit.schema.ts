import { z } from "zod";

const i18nText = z
  .object({
    fr: z.string().optional(),
    en: z.string().optional(),
    mg: z.string().optional(),
  })
  .partial();

const priceTiers = z.object({
  "1-2": z.number().nonnegative(),
  "3-4": z.number().nonnegative(),
  "5-10": z.number().nonnegative(),
  "11-20": z.number().nonnegative(),
  "21+": z.number().nonnegative(),
});

export const circuitSchema = z.object({
  title: z
    .string()
    .min(
      3,
      "Le titre doit contenir au moins 3 caractères."
    ),

  description: z
    .string()
    .min(
      10,
      "La description doit contenir au moins 10 caractères."
    ),

  // Prix de départ (le plus bas des tarifs par tranche), en Ariary
  price: z
    .number()
    .nonnegative(
      "Le prix ne peut pas être négatif."
    ),

  tourist_place_id: z
    .string()
    .uuid()
    .optional(),

  duration_days: z
    .number()
    .int()
    .min(1)
    .max(60)
    .optional(),

  // Ancien champ (nord/sud) : conservé pour ne rien casser, plus utilisé
  direction: z
    .enum(["north_south", "south_north", "loop"])
    .optional(),

  title_i18n: i18nText.optional(),
  description_i18n: i18nText.optional(),
  price_tiers: priceTiers.optional(),
});

export const circuitUpdateSchema =
  circuitSchema.partial();

export const circuitPlacesSchema = z.object({
  place_ids: z.array(z.string().uuid()).max(30),
});

export const circuitDeparturesSchema = z.object({
  dates: z
    .array(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de départ invalide.")
    )
    .max(200),
});

export type CircuitInput =
  z.infer<typeof circuitSchema>;
