import { z } from "zod";

export const hotelSchema = z.object({
  name: z
    .string()
    .min(
      2,
      "Le nom doit contenir au moins 2 caractères."
    ),

  address: z
    .string()
    .min(
      3,
      "L'adresse doit contenir au moins 3 caractères."
    ),

  tourist_place_id: z
    .string()
    .uuid()
    .optional(),
});

export const hotelUpdateSchema =
  hotelSchema.partial();

export type HotelInput =
  z.infer<typeof hotelSchema>;
