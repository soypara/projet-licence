import { Router } from "express";
import multer from "multer";

import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import { requireStaff } from "../middlewares/role.middleware";
import { validateBody } from "../middlewares/validate";

import {
  mediaFromUrlSchema,
} from "../schemas/media.schema";

import * as mediaController from "../controllers/media.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

const router = Router();

router.post(
  "/",
  authenticate,
  requireStaff,
  upload.single("file"),
  asyncHandler(mediaController.upload)
);

router.post(
  "/from-url",
  authenticate,
  requireStaff,
  validateBody(mediaFromUrlSchema),
  asyncHandler(mediaController.fromUrl)
);

router.get(
  "/:entityType/:entityId",
  asyncHandler(mediaController.listForEntity)
);

router.delete(
  "/:id",
  authenticate,
  requireStaff,
  asyncHandler(mediaController.remove)
);

export default router;

