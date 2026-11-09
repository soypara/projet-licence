import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import { requireStaff } from "../middlewares/role.middleware";
import { validateBody } from "../middlewares/validate";

import {
  circuitSchema,
  circuitUpdateSchema,
  circuitPlacesSchema,
  circuitDeparturesSchema,
} from "../schemas/circuit.schema";

import * as circuitController from "../controllers/circuit.controller";

const router = Router();

router.get(
  "/",
  asyncHandler(circuitController.getAll)
);

router.get(
  "/:id",
  asyncHandler(circuitController.getOne)
);

router.post(
  "/",
  authenticate,
  requireStaff,
  validateBody(circuitSchema),
  asyncHandler(circuitController.create)
);

router.put(
  "/:id",
  authenticate,
  requireStaff,
  validateBody(circuitUpdateSchema),
  asyncHandler(circuitController.update)
);

router.delete(
  "/:id",
  authenticate,
  requireStaff,
  asyncHandler(circuitController.remove)
);

// Nouveau : remplace toutes les étapes, dans l'ordre (départ -> arrivée)
router.put(
  "/:id/places",
  authenticate,
  requireStaff,
  validateBody(circuitPlacesSchema),
  asyncHandler(circuitController.replacePlaces)
);

// Dates de départ (à venir) du circuit
router.put(
  "/:id/departures",
  authenticate,
  requireStaff,
  validateBody(circuitDeparturesSchema),
  asyncHandler(circuitController.replaceDepartures)
);

router.post(
  "/:id/places/:placeId",
  authenticate,
  requireStaff,
  asyncHandler(circuitController.linkTouristPlace)
);

router.delete(
  "/:id/places/:placeId",
  authenticate,
  requireStaff,
  asyncHandler(circuitController.unlinkTouristPlace)
);

export default router;
