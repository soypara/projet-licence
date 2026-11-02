import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate";
import {
  hotelSchema,
  hotelUpdateSchema,
} from "../schemas/hotel.schema";
import * as hotelController from "../controllers/hotel.controller";

const router = Router();

router.get("/", asyncHandler(hotelController.getAll));

router.get("/:id", asyncHandler(hotelController.getOne));

router.post(
  "/",
  authenticate,
  validateBody(hotelSchema),
  asyncHandler(hotelController.create)
);

router.put(
  "/:id",
  authenticate,
  validateBody(hotelUpdateSchema),
  asyncHandler(hotelController.update)
);

router.delete(
  "/:id",
  authenticate,
  asyncHandler(hotelController.remove)
);

export default router;