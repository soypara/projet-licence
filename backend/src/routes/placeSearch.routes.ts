import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as placeSearchController from "../controllers/placeSearch.controller";
import * as placeImportController from "../controllers/placeImport.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/place-search/search?q=Allée%20des%20Baobabs
router.get("/search", asyncHandler(placeSearchController.search));

// POST /api/place-search/import
router.post(
  "/import",
  authenticate,
  asyncHandler(placeImportController.importPlace)
);

router.get("/auth-test", authenticate, (req, res) => {
  res.json({
    authenticated: true,
    userId: req.user?.id,
    email: req.user?.email,
  });
});

export default router;