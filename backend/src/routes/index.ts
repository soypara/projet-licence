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

const router = Router();

router.use("/circuits", circuitRoutes);
router.use("/tourist-places", touristPlaceRoutes);
router.use("/media", mediaRoutes);
router.use("/wikipedia", wikipediaRoutes);
router.use("/place-search", placeSearchRoutes);
router.use("/comments", commentRoutes);
router.use("/reservations", reservationRoutes);
router.use("/translate", translateRoutes);
router.use("/stats", statsRoutes);
router.use("/planning", planningRoutes);
router.use("/finance", financeRoutes);

export default router;
