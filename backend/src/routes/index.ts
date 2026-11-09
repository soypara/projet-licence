import { Router } from "express";

import circuitRoutes from "./circuit.routes";
import touristPlaceRoutes from "./touristPlace.routes";
import mediaRoutes from "./media.routes";
import wikipediaRoutes from "./wikipedia.routes";
import placeSearchRoutes from "./placeSearch.routes";
import commentRoutes from "./comment.routes";
import reservationRoutes from "./reservation.routes";
import translateRoutes from "./translate.routes";
import statsRoutes from "./stats.routes";
import planningRoutes from "./planning.routes";
import financeRoutes from "./finance.routes";
import discoverRoutes from "./discover.routes";
import { rateLimit } from "../middlewares/rateLimit";

const router = Router();

// Limite générale : 300 requêtes par minute et par adresse IP
router.use(rateLimit(300, 60));

router.use("/circuits", circuitRoutes);
router.use("/tourist-places", touristPlaceRoutes);
router.use("/media", mediaRoutes);

// Routes qui appellent des services externes (gratuits, quotas) : limites plus basses
router.use("/wikipedia", rateLimit(30, 60), wikipediaRoutes);
router.use("/place-search", rateLimit(30, 60), placeSearchRoutes);
router.use("/translate", rateLimit(30, 60), translateRoutes);
router.use("/discover", rateLimit(40, 60), discoverRoutes);

router.use("/comments", rateLimit(30, 60), commentRoutes);
router.use("/reservations", rateLimit(60, 60), reservationRoutes);
router.use("/stats", statsRoutes);
router.use("/planning", planningRoutes);
router.use("/finance", financeRoutes);

export default router;
