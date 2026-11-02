import { z } from "zod";

// Les avis portent sur les CIRCUITS (plus sur les lieux).
export const commentSchema = z.object({
  content: z
    .string()
    .min(2, "Le commentaire doit contenir au moins 2 caractères.")
    .max(1000, "Le commentaire est trop long."),

  rating: z
    .number()
    .int()
    .min(1, "La note minimale est 1.")
    .max(5, "La note maximale est 5."),

  circuit_id: z.string().uuid("Circuit invalide."),
});

export const commentUpdateSchema = z.object({
  content: z.string().min(2).max(1000).optional(),

  rating: z.number().int().min(1).max(5).optional(),

  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const commentStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

export type CommentInput = z.infer<typeof commentSchema>;
