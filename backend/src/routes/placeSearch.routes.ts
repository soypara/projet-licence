import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as placeSearchController from "../controllers/placeSearch.controller";
import * as placeImportController from "../controllers/placeImport.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireStaff } from "../middlewares/role.middleware";

const router = Router();

// GET /api/place-search/search?q=Allée%20des%20Baobabs
router.get("/search", asyncHandler(placeSearchController.search));

// POST /api/place-search/import
router.post(
  "/import",
  authenticate,
  requireStaff,
  asyncHandler(placeImportController.importPlace)
);

export default router;

