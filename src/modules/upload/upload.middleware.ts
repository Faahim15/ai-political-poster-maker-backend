import multer from "multer";
import { AppError } from "../../common/utils/AppError";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches frontend check
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("শুধু ছবি ফাইল দিন", 400));
    }
    cb(null, true);
  },
});
