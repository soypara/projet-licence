import { z } from "zod";

const mediaBaseSchema = z.object({
  type: z.string().min(1),
  alt_text: z.string().optional().default(""),
  entity_type: z.enum(["tourist_place", "circuit", "hotel"]),
  entity_id: z.string().uuid(),
  caption: z.string().optional().default(""),
  sort_order: z.coerce.number().int().positive().default(1),
});

export const mediaUploadSchema = mediaBaseSchema;

export const mediaFromUrlSchema = mediaBaseSchema.extend({
  url: z.string().url(),
});

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;
export type MediaFromUrlInput = z.infer<typeof mediaFromUrlSchema>;