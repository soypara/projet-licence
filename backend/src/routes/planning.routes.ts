import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import * as controller from "../controllers/planning.controller";

const router = Router();

// Planning (personnel) : ?from=AAAA-MM-JJ&to=AAAA-MM-JJ
router.get("/", authenticate, asyncHandler(controller.getPlanning));

// Recherche d'un voyageur (nom ou téléphone) : ?q=...
router.get("/search", authenticate, asyncHandler(controller.search));

export default router;
