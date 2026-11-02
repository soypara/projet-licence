import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate";

import {
  touristPlaceSchema,
  touristPlaceUpdateSchema,
} from "../schemas/touristPlace.schema";

import * as touristPlaceController from "../controllers/touristPlace.controller";

const router = Router();

router.get(
  "/",
  asyncHandler(touristPlaceController.getAll)
);

router.get(
  "/:id",
  asyncHandler(touristPlaceController.getOne)
);

router.post(
  "/",
  authenticate,
  validateBody(touristPlaceSchema),
  asyncHandler(touristPlaceController.create)
);

router.put(
  "/:id",
  authenticate,
  validateBody(touristPlaceUpdateSchema),
  asyncHandler(touristPlaceController.update)
);

router.delete(
  "/:id",
  authenticate,
  asyncHandler(touristPlaceController.remove)
);

export default router;
