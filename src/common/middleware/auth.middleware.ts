import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("অনুমতি নেই, লগইন করুন", 401));
  }
  try {
    const { userId } = verifyToken(header.slice(7));
    req.userId = userId;
    next();
  } catch {
    next(new AppError("সেশনের মেয়াদ শেষ, আবার লগইন করুন", 401));
  }
}
