import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import * as controller from "../controllers/planning.controller";

const router = Router();

// Solde de l'agence et paiements reçus (super admin seulement)
router.get("/", authenticate, asyncHandler(controller.getLedger));

export default router;
