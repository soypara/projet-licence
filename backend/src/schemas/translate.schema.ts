import { z } from "zod";

const lang = z.enum(["fr", "en", "mg"]);

export const translateSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  // "auto" : langue d'origine détectée (avis écrits dans n'importe quelle langue)
  source: z.enum(["fr", "en", "mg", "auto"]),
  target: lang,
});

export type TranslateInput = z.infer<typeof translateSchema>;
