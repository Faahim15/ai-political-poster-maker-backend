import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { upload } from "./upload.middleware";
import { uploadPhoto } from "./upload.controller";

const router = Router();
router.post("/", requireAuth, upload.single("file"), uploadPhoto);

export default router;
