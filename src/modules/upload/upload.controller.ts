import { Response } from "express";
import { AppError } from "../../common/utils/AppError";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { AuthRequest } from "../../common/middleware/auth.middleware";
import { uploadBuffer } from "../../common/config/cloudinary";

export const uploadPhoto = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) throw new AppError("ছবি পাওয়া যায়নি", 400);

      const { url } = await uploadBuffer(file.buffer, "poster-photos");

      res.json({ url });
    } catch (error) {
      console.log("uploadPhoto error:", error);
      throw error;
    }
  },
);
