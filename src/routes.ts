import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";
import templateRoutes from "./modules/templates/template.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import posterRoutes from "./modules/posters/poster.routes";

const router = Router();
router.use("/auth", authRoutes);
router.use("/templates", templateRoutes);
router.use("/upload", uploadRoutes);
router.use("/posters", posterRoutes);

export default router;
