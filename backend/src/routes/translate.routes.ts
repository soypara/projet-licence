import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../middlewares/validate";
import { translateSchema } from "../schemas/translate.schema";
import * as translateService from "../services/translate.service";

const router = Router();

// Public : utilisé par le site pour traduire un titre / une description
// quand l'admin n'a pas saisi la version dans la langue demandée.
router.post(
  "/",
  validateBody(translateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await translateService.translate(req.body));
  })
);

export default router;
