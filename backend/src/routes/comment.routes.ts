import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import { requireStaff } from "../middlewares/role.middleware";
import { validateBody } from "../middlewares/validate";

import {
  commentSchema,
  commentStatusSchema,
} from "../schemas/comment.schema";

import * as commentController from "../controllers/comment.controller";

const router = Router();

/*
 * Public : uniquement commentaires approuvés
 */
router.get(
  "/",
  asyncHandler(commentController.getAll)
);

/*
 * Création par utilisateur connecté
 */
router.post(
  "/",
  authenticate,
  validateBody(commentSchema),
  asyncHandler(commentController.create)
);

/*
 * Administration
 */
router.get(
  "/admin",
  authenticate,
  requireStaff,
  asyncHandler(commentController.getAdminAll)
);

// MODIFIÉ : PUT au lieu de PATCH (cohérent avec api.put du frontend)
router.put(
  "/:id/status",
  authenticate,
  requireStaff,
  validateBody(commentStatusSchema),
  asyncHandler(commentController.updateStatus)
);

router.delete(
  "/:id",
  authenticate,
  asyncHandler(commentController.remove)
);

export default router;

