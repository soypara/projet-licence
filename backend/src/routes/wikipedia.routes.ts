import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as wikipediaController from "../controllers/wikipedia.controller";

const router = Router();

// GET /api/wikipedia/search?q=Isalo
router.get("/search", asyncHandler(wikipediaController.search));

// GET /api/wikipedia/summary?title=Parc%20national%20de%20l%27Isalo
router.get("/summary", asyncHandler(wikipediaController.summary));

export default router;
