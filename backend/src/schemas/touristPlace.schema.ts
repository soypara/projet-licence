import { z } from "zod";

export const touristPlaceSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z.string().optional().default(""),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  // Lien vers l'article Wikipédia d'origine, pour l'attribution dans le feed.
  // Vide si le lieu a été créé entièrement à la main.
  source_url: z
    .string()
    .url("URL invalide.")
    .optional()
    .or(z.literal("")),
});

export const touristPlaceUpdateSchema = touristPlaceSchema.partial();

export type TouristPlaceInput = z.infer<typeof touristPlaceSchema>;
