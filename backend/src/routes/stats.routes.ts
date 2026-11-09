import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import { requireStaff } from "../middlewares/role.middleware";
import * as statsController from "../controllers/stats.controller";

const router = Router();

// Statistiques du tableau de bord (admin : vérifié côté base)
router.get("/", authenticate, requireStaff, asyncHandler(statsController.getAdminStats));

export default router;
