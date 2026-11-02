import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
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
  validateBody(circuitSchema),
  asyncHandler(circuitController.create)
);

router.put(
  "/:id",
  authenticate,
  validateBody(circuitUpdateSchema),
  asyncHandler(circuitController.update)
);

router.delete(
  "/:id",
  authenticate,
  asyncHandler(circuitController.remove)
);

// Nouveau : remplace toutes les étapes, dans l'ordre (départ -> arrivée)
router.put(
  "/:id/places",
  authenticate,
  validateBody(circuitPlacesSchema),
  asyncHandler(circuitController.replacePlaces)
);

// Dates de départ (à venir) du circuit
router.put(
  "/:id/departures",
  authenticate,
  validateBody(circuitDeparturesSchema),
  asyncHandler(circuitController.replaceDepartures)
);

router.post(
  "/:id/places/:placeId",
  authenticate,
  asyncHandler(circuitController.linkTouristPlace)
);

router.delete(
  "/:id/places/:placeId",
  authenticate,
  asyncHandler(circuitController.unlinkTouristPlace)
);

export default router;
