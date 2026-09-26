import { Response } from "express";
import bcrypt from "bcryptjs";
import User from "./auth.model";
import { signToken } from "../../common/utils/jwt";
import { AppError } from "../../common/utils/AppError";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { AuthRequest } from "../../common/middleware/auth.middleware";

function isEmail(v: string) {
  return /\S+@\S+\.\S+/.test(v);
}

export const register = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { name, identifier, password } = req.body as {
      name: string;
      identifier: string;
      password: string;
    };
    if (!name || !identifier || !password) {
      throw new AppError("নাম, ইমেইল/মোবাইল এবং পাসওয়ার্ড দিন", 400);
    }
    if (password.length < 6)
      throw new AppError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", 400);

    const field = isEmail(identifier) ? "email" : "phone";
    const existing = await User.findOne({ [field]: identifier });
    if (existing)
      throw new AppError("এই ইমেইল/মোবাইল দিয়ে অ্যাকাউন্ট আছে", 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, [field]: identifier, passwordHash });

    const token = signToken(String(user._id));
    res.status(201).json({ token, user: { _id: user._id, name: user.name } });
  },
);

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier, password } = req.body as {
    identifier: string;
    password: string;
  };
  if (!identifier || !password)
    throw new AppError("ইমেইল/মোবাইল এবং পাসওয়ার্ড দিন", 400);

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  });
  if (!user) throw new AppError("অ্যাকাউন্ট খুঁজে পাওয়া যায়নি", 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("পাসওয়ার্ড সঠিক নয়", 401);

  const token = signToken(String(user._id));
  res.json({ token, user: { _id: user._id, name: user.name } });
});
