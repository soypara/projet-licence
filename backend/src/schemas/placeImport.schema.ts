import { z } from "zod";

const placeImportMediaSchema = z.object({
  url: z.string().url(),
  caption: z.string().min(1),
  sort_order: z.number().int().positive(),
  type: z.string().default("photo"),
  alt_text: z.string().optional().default(""),
});

export const placeImportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  latitude: z.number(),
  longitude: z.number(),
  source_url: z.string().url().optional().or(z.literal("")),
  media: z.array(placeImportMediaSchema).optional().default([]),
});

export type PlaceImportInput = z.infer<typeof placeImportSchema>;