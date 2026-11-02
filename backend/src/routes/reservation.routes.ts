import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate";

import {
  reservationSchema,
  reservationStatusSchema,
} from "../schemas/reservation.schema";

import { paymentSchema } from "../schemas/payment.schema";

import * as reservationController from "../controllers/reservation.controller";

const router = Router();

// Le client connecté crée une demande de réservation
router.post(
  "/",
  authenticate,
  validateBody(reservationSchema),
  asyncHandler(reservationController.create)
);

// Ses propres réservations
router.get(
  "/mine",
  authenticate,
  asyncHandler(reservationController.getMine)
);

// Le client paie l'acompte de sa réservation
router.post(
  "/:id/pay",
  authenticate,
  validateBody(paymentSchema),
  asyncHandler(reservationController.pay)
);

// Admin : toutes les réservations (la RLS filtre pour les non-admins)
router.get(
  "/",
  authenticate,
  asyncHandler(reservationController.getAll)
);

// Admin : confirmer / refuser
router.put(
  "/:id/status",
  authenticate,
  validateBody(reservationStatusSchema),
  asyncHandler(reservationController.updateStatus)
);

export default router;
