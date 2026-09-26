import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { generationLimiter } from "./rateLimiter";
import {
  createPoster,
  getPoster,
  getUserPosters,
  regeneratePoster,
  deletePoster,
} from "./poster.controller";

const router = Router();
router.use(requireAuth);

router.post("/", generationLimiter, createPoster);
router.get("/user/:uid", getUserPosters);
router.get("/:id", getPoster);
router.post("/:id/regenerate", generationLimiter, regeneratePoster);
router.delete("/:id", deletePoster);

export default router;
