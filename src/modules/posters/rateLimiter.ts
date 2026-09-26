import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Response } from "express";
import { AuthRequest } from "../../common/middleware/auth.middleware";

export const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).userId;
    return userId ?? ipKeyGenerator(req.ip ?? "unknown");
  },
  handler: (_req, res: Response) => {
    res.status(429).json({
      message: "অনেকবার পোস্টার তৈরির চেষ্টা করেছেন, একটু পর আবার চেষ্টা করুন",
    });
  },
});
