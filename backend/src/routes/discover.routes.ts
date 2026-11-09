import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as controller from "../controllers/discover.controller";

const router = Router();

// ?q=je veux des plages tranquilles&when=week  (ou when=2026-11, ou rien)
router.get("/", asyncHandler(controller.search));

export default router;
