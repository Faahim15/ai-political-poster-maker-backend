This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: node_modules, dist, coverage, .git, uploads, logs, *.log, *.png, *.jpg, *.jpeg, *.svg, *.pdf
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
````
src/
  common/
    config/
      cloudinary.ts
      db.ts
    middleware/
      auth.middleware.ts
      error.middleware.ts
    utils/
      AppError.ts
      asyncHandler.ts
      jwt.ts
  modules/
    auth/
      auth.controller.ts
      auth.model.ts
      auth.routes.ts
    posters/
      gemini.service.ts
      poster.controller.ts
      poster.model.ts
      poster.routes.ts
      poster.service.ts
      rateLimiter.ts
      render.service.ts
    templates/
      template.controller.ts
      template.model.ts
      template.routes.ts
    upload/
      upload.controller.ts
      upload.middleware.ts
      upload.routes.ts
  scripts/
    seedTemplates.ts
    testGemini.ts
  app.ts
  routes.ts
  server.ts
.gitignore
insert-bijoy-dibosh-template.mjs
package.json
tsconfig.json
````

# Files

## File: src/common/config/cloudinary.ts
````typescript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function uploadBuffer(
  buffer: Buffer,
  folder: string,
  publicId?: string,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: "image" },
      (err, result) => {
        if (err || !result)
          return reject(err ?? new Error("Cloudinary upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export default cloudinary;
````

## File: src/common/config/db.ts
````typescript
import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("✅ MongoDB Atlas connected");

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
}
````

## File: src/common/middleware/auth.middleware.ts
````typescript
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
````

## File: src/common/middleware/error.middleware.ts
````typescript
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "সার্ভার সমস্যা, একটু পর আবার চেষ্টা করুন" });
}
````

## File: src/common/utils/AppError.ts
````typescript
export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
````

## File: src/common/utils/asyncHandler.ts
````typescript
import { Request, Response, NextFunction, RequestHandler } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
````

## File: src/common/utils/jwt.ts
````typescript
import jwt from "jsonwebtoken";

export function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ userId }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN as any) ?? "30d",
  });
}

export function verifyToken(token: string): { userId: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret) as { userId: string };
}
````

## File: src/modules/auth/auth.controller.ts
````typescript
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
````

## File: src/modules/auth/auth.model.ts
````typescript
import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  phone: { type: String, unique: true, sparse: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

export default model<IUser>("User", userSchema);
````

## File: src/modules/auth/auth.routes.ts
````typescript
import { Router } from "express";
import { register, login } from "./auth.controller";

const router = Router();
router.post("/register", register);
router.post("/login", login);

export default router;
````

## File: src/modules/posters/gemini.service.ts
````typescript
import { GoogleGenAI } from "@google/genai";
import { Occasion } from "../templates/template.model";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

export interface Decoration {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const FALLBACK: Decoration = {
  primaryColor: "#006a4e",
  secondaryColor: "#004d39",
  accentColor: "#e8383d",
};

const OCCASION_HINT: Record<Occasion, string> = {
  victory: "বিজয় দিবস — লাল-সবুজ, উৎসবমুখর",
  condolence: "শোক/স্মরণ — গম্ভীর, সাদা-কালো/গাঢ় টোন",
  campaign: "নির্বাচনী প্রচার — দলের রং, শক্তিশালী কনট্রাস্ট",
  greeting: "শুভেচ্ছা — উষ্ণ, বন্ধুত্বপূর্ণ রং",
  festival: "ঈদ/উৎসব — উজ্জ্বল, আনন্দময়",
};

export async function suggestDecoration(
  occasion: Occasion,
): Promise<Decoration> {
  const prompt = `You are a graphic designer choosing a color palette for a Bangladeshi political poster.
Occasion: ${OCCASION_HINT[occasion]}
Return ONLY valid JSON, no markdown, no explanation, in this exact shape:
{"primaryColor":"#hex","secondaryColor":"#hex","accentColor":"#hex"}
Colors must be culturally appropriate for this occasion and have strong contrast with white text.`;

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const interaction = await ai.interactions.create({
        model: MODEL,
        input: prompt,
      });
      const text = (interaction.output_text ?? "").trim();
      const jsonStr = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.primaryColor && parsed.secondaryColor && parsed.accentColor) {
        return parsed as Decoration;
      }
      return FALLBACK;
    } catch (err: any) {
      const isRetryable =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.name === "APIConnectionError" ||
        /unusable|ECONNRESET|ETIMEDOUT/i.test(String(err?.message));

      if (isRetryable && attempt < maxRetries) {
        const waitMs = 3000 * (attempt + 1);
        console.log(
          `Gemini busy/network issue, retrying in ${waitMs / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      console.error(
        "Gemini decoration suggestion failed, using fallback:",
        err,
      );
      return FALLBACK;
    }
  }
  return FALLBACK;
}

/**
 * Picks readable text color ("white" or "dark") for a given background hex color,
 * using relative luminance. Kept as a plain deterministic function (no Gemini call)
 * since this needs to run per text zone and the free-tier daily quota is limited.
 */
export function suggestTextColor(backgroundHex: string): "white" | "dark" {
  const hex = backgroundHex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? "dark" : "white";
}
````

## File: src/modules/posters/poster.controller.ts
````typescript
import { Response } from "express";
import Poster from "./poster.model";
import Template from "../templates/template.model";
import { AppError } from "../../common/utils/AppError";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { AuthRequest } from "../../common/middleware/auth.middleware";

import { generatePosterAsync } from "./poster.service";

export const createPoster = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { templateId, formData, uploadedPhotoUrls } = req.body;
    if (!templateId || !formData)
      throw new AppError("templateId ও formData দিন", 400);

    const template = await Template.findById(templateId);
    if (!template) throw new AppError("টেমপ্লেট পাওয়া যায়নি", 404);

    const poster = await Poster.create({
      userId: req.userId,
      templateId,
      formData,
      uploadedPhotoUrls: uploadedPhotoUrls ?? [],
      status: "generating",
      retriesLeft: 3,
    });

    // fire-and-forget: client polls GET /posters/:id for status
    generatePosterAsync(String(poster._id));

    res.status(201).json(poster);
  },
);

export const getPoster = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const poster = await Poster.findById(req.params.id);
    if (!poster) throw new AppError("পোস্টার পাওয়া যায়নি", 404);
    if (String(poster.userId) !== req.userId)
      throw new AppError("অনুমতি নেই", 403);
    res.json(poster);
  },
);

export const getUserPosters = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // always scope to the authenticated user, regardless of the :uid param
    const posters = await Poster.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(posters);
  },
);

export const regeneratePoster = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const poster = await Poster.findById(req.params.id);
    if (!poster) throw new AppError("পোস্টার পাওয়া যায়নি", 404);
    if (String(poster.userId) !== req.userId)
      throw new AppError("অনুমতি নেই", 403);
    if (poster.retriesLeft <= 0)
      throw new AppError("আর regenerate করা যাবে না", 400);

    const { formData } = req.body;
    if (formData) poster.formData = formData;
    poster.status = "generating";
    poster.retriesLeft -= 1;
    await poster.save();

    generatePosterAsync(String(poster._id));

    res.json(poster);
  },
);

export const deletePoster = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const poster = await Poster.findById(req.params.id);
    if (!poster) throw new AppError("পোস্টার পাওয়া যায়নি", 404);
    if (String(poster.userId) !== req.userId)
      throw new AppError("অনুমতি নেই", 403);

    await poster.deleteOne();
    res.json({ ok: true });
  },
);
````

## File: src/modules/posters/poster.model.ts
````typescript
import { Schema, model, Document, Types } from "mongoose";
import { OCCASIONS, Occasion } from "../templates/template.model";

export interface IPosterForm {
  name: string;
  designation: string;
  party: string;
  area?: string;
  occasionType: Occasion;
  headline: string;
}

export type PosterStatus = "draft" | "generating" | "completed" | "failed";

export interface IPoster extends Document {
  userId: Types.ObjectId;
  templateId: Types.ObjectId;
  formData: IPosterForm;
  uploadedPhotoUrls: string[];
  generatedImageUrl?: string;
  status: PosterStatus;
  retriesLeft: number;
  geminiPromptUsed?: string;
  createdAt: Date;
}

const posterFormSchema = new Schema<IPosterForm>(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    party: { type: String, trim: true, default: "" },
    area: { type: String, trim: true, default: "" },
    occasionType: { type: String, enum: OCCASIONS, required: true },
    headline: { type: String, required: true, maxlength: 40 },
  },
  { _id: false },
);

const posterSchema = new Schema<IPoster>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
  formData: { type: posterFormSchema, required: true },
  uploadedPhotoUrls: { type: [String], default: [] },
  generatedImageUrl: { type: String },
  status: {
    type: String,
    enum: ["draft", "generating", "completed", "failed"],
    default: "draft",
  },
  retriesLeft: { type: Number, default: 3 },
  geminiPromptUsed: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default model<IPoster>("Poster", posterSchema);
````

## File: src/modules/posters/poster.routes.ts
````typescript
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
````

## File: src/modules/posters/poster.service.ts
````typescript
import Poster from "./poster.model";
import Template from "../templates/template.model";
import { suggestDecoration } from "./gemini.service";
import { renderPosterPng } from "./render.service";
import { uploadBuffer } from "../../common/config/cloudinary";

export async function generatePosterAsync(posterId: string): Promise<void> {
  try {
    const poster = await Poster.findById(posterId);
    if (!poster) return;

    const template = await Template.findById(poster.templateId);
    if (!template) throw new Error(`Template ${poster.templateId} not found`);

    const decoration = await suggestDecoration(poster.formData.occasionType);
    const pngBuffer = await renderPosterPng(
      poster.formData,
      poster.uploadedPhotoUrls,
      decoration,
      template.layoutConfig,
    );
    const { url } = await uploadBuffer(
      pngBuffer,
      "posters",
      String(poster._id),
    );

    poster.generatedImageUrl = url;
    poster.status = "completed";
    poster.geminiPromptUsed = JSON.stringify(decoration);
    await poster.save();
  } catch (err) {
    console.error(`Poster ${posterId} generation failed:`, err);
    await Poster.findByIdAndUpdate(posterId, { status: "failed" });
  }
}
````

## File: src/modules/posters/rateLimiter.ts
````typescript
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
````

## File: src/modules/posters/render.service.ts
````typescript
import puppeteer from "puppeteer";
import { IPosterForm } from "./poster.model";
import { Decoration } from "./gemini.service";
import { ILayoutConfig } from "../templates/template.model";

const OCCASION_LABEL: Record<string, string> = {
  victory: "বিজয় দিবস",
  condolence: "শোক/স্মরণ",
  campaign: "নির্বাচনী প্রচার",
  greeting: "শুভেচ্ছা",
  festival: "ঈদ/উৎসব",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&family=Noto+Serif+Bengali:wght@700;800&display=swap" rel="stylesheet">`;

function buildGradientHtml(
  form: IPosterForm,
  photos: string[],
  decoration: Decoration,
): string {
  const slots = (photos.length ? photos.slice(0, 3) : [""])
    .map(
      (u) =>
        `<div class="photo">${u ? `<img src="${u}" crossorigin="anonymous" />` : ""}</div>`,
    )
    .join("");

  const subLine = [form.designation, form.party, form.area]
    .filter((x): x is string => Boolean(x))
    .map(escapeHtml)
    .join(", ");

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
${FONT_LINK}
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 1600px; font-family: 'Hind Siliguri', sans-serif; }
  .poster {
    position: relative; width: 1200px; height: 1600px;
    background: linear-gradient(to bottom, ${decoration.secondaryColor}, ${decoration.primaryColor});
    color: white; overflow: hidden; display: flex; flex-direction: column;
  }
  .sun { position: absolute; top: -9%; right: -14%; width: 52%; aspect-ratio: 1; border-radius: 50%; background: ${decoration.accentColor}; }
  .photos { position: relative; z-index: 1; display: flex; justify-content: center; gap: 36px; padding: 84px 72px 0; }
  .photo { width: 324px; aspect-ratio: 4/5; border-radius: 999px 999px 0 0; background: rgba(255,255,255,0.15); border: 7px solid rgba(255,255,255,0.85); overflow: hidden; }
  .photo img { width: 100%; height: 100%; object-fit: cover; }
  h1 { position: relative; z-index: 1; margin-top: auto; padding: 0 72px; text-align: center; font-family: 'Noto Serif Bengali', serif; font-weight: 800; font-size: 108px; line-height: 1.15; text-shadow: 0 4px 12px rgba(0,0,0,0.35); word-break: break-word; }
  .footer { position: relative; z-index: 1; margin-top: 60px; background: white; color: #10231b; text-align: center; padding: 36px 60px; }
  .footer .name { font-size: 52px; font-weight: 700; line-height: 1.2; }
  .footer .sub { font-size: 34px; color: rgba(16,35,27,0.7); margin-top: 6px; }
  .footer .credit { margin-top: 14px; font-size: 30px; font-weight: 600; color: ${decoration.primaryColor}; }
</style>
</head>
<body>
  <div class="poster">
    <div class="sun"></div>
    <div class="photos">${slots}</div>
    <h1>${escapeHtml(form.headline)}</h1>
    <div class="footer">
      <p class="name">${escapeHtml(form.name)}</p>
      <p class="sub">${subLine || OCCASION_LABEL[form.occasionType]}</p>
      <p class="credit">প্রচারে: ${escapeHtml(form.name)}</p>
    </div>
  </div>
</body>
</html>`;
}

function buildBackgroundImageHtml(
  form: IPosterForm,
  photos: string[],
  layoutConfig: ILayoutConfig,
): string {
  const bg = layoutConfig.backgroundImageUrl!;
  const slot = layoutConfig.photoSlotPosition ?? {
    xPct: 35,
    yPct: 36,
    widthPct: 30,
    heightPct: 29,
    borderRadiusPx: 24,
  };
  const headlineYPct = layoutConfig.headlineYPct ?? 76;
  const headlineColor =
    layoutConfig.headlineTextColor === "dark" ? "#10231b" : "white";
  const headlineShadow =
    layoutConfig.headlineTextColor === "dark"
      ? "0 2px 6px rgba(255,255,255,0.4)"
      : "0 4px 14px rgba(0,0,0,0.55)";
  const photo = photos[0] ?? "";
  const zones = layoutConfig.textZones;
  const usesPositionedZones = !!(zones?.name || zones?.sub);

  const subLine = [form.designation, form.party, form.area]
    .filter((x): x is string => Boolean(x))
    .map(escapeHtml)
    .join(", ");

  const nameZoneHtml = zones?.name
    ? `<div class="zone name-zone" style="top:${zones.name.topPct}%; height:${zones.name.heightPct}%; color:${zones.name.textColor === "dark" ? "#10231b" : "white"};">
         <p class="name">${escapeHtml(form.name)}</p>
       </div>`
    : "";

  const subZoneHtml = zones?.sub
    ? `<div class="zone sub-zone" style="top:${zones.sub.topPct}%; height:${zones.sub.heightPct}%; color:${zones.sub.textColor === "dark" ? "#10231b" : "white"};">
         <p class="sub">${subLine || OCCASION_LABEL[form.occasionType]}</p>
       </div>`
    : "";

  // No dedicated bars on this template's artwork — use the standard bottom white footer (name+sub+credit).
  const defaultFooterHtml = !usesPositionedZones
    ? `<div class="footer">
         <p class="name">${escapeHtml(form.name)}</p>
         <p class="sub">${subLine || OCCASION_LABEL[form.occasionType]}</p>
         <p class="credit">প্রচারে: ${escapeHtml(form.name)}</p>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
${FONT_LINK}
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 1600px; font-family: 'Hind Siliguri', sans-serif; }
  .poster { position: relative; width: 1200px; height: 1600px; overflow: hidden; }
  .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .photo-slot {
    position: absolute; left: ${slot.xPct}%; top: ${slot.yPct}%; width: ${slot.widthPct}%; height: ${slot.heightPct}%;
    border-radius: ${slot.borderRadiusPx}px; overflow: hidden; background: #eee; box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  }
  .photo-slot img { width: 100%; height: 100%; object-fit: cover; }
  .headline {
    position: absolute; top: ${headlineYPct}%; left: 0; right: 0; text-align: center; padding: 0 72px;
    font-family: 'Noto Serif Bengali', serif; font-weight: 800; font-size: 84px; line-height: 1.15;
    color: ${headlineColor}; text-shadow: ${headlineShadow}; word-break: break-word;
  }
  .zone { position: absolute; left: 0; right: 0; display: flex; align-items: center; justify-content: center; padding: 0 60px; text-align: center; }
  .zone .name { font-size: 46px; font-weight: 700; line-height: 1.2; }
  .zone .sub { font-size: 32px; opacity: 0.85; }
  .footer { position: absolute; left: 0; right: 0; bottom: 0; background: white; color: #10231b; text-align: center; padding: 32px 60px; }
  .footer .name { font-size: 46px; font-weight: 700; line-height: 1.2; }
  .footer .sub { font-size: 30px; color: rgba(16,35,27,0.7); margin-top: 4px; }
  .footer .credit { margin-top: 10px; font-size: 26px; font-weight: 600; color: ${layoutConfig.primaryColor}; }
</style>
</head>
<body>
  <div class="poster">
    <img class="bg" src="${bg}" crossorigin="anonymous" />
    <div class="photo-slot">${photo ? `<img src="${photo}" crossorigin="anonymous" />` : ""}</div>
    <h1 class="headline">${escapeHtml(form.headline)}</h1>
    ${nameZoneHtml}
    ${subZoneHtml}
    ${defaultFooterHtml}
  </div>
</body>
</html>`;
}

function buildHtml(
  form: IPosterForm,
  photos: string[],
  decoration: Decoration,
  layoutConfig: ILayoutConfig,
): string {
  if (layoutConfig.backgroundImageUrl)
    return buildBackgroundImageHtml(form, photos, layoutConfig);
  return buildGradientHtml(form, photos, decoration);
}

export async function renderPosterPng(
  form: IPosterForm,
  photos: string[],
  decoration: Decoration,
  layoutConfig: ILayoutConfig,
): Promise<Buffer> {
  const html = buildHtml(form, photos, decoration, layoutConfig);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });
    const buffer = await page.screenshot({ type: "png" });
    return buffer as Buffer;
  } finally {
    await browser.close();
  }
}
````

## File: src/modules/templates/template.controller.ts
````typescript
import { Request, Response } from "express";
import Template, { Occasion, OCCASIONS } from "./template.model";
import { AppError } from "../../common/utils/AppError";
import { asyncHandler } from "../../common/utils/asyncHandler";

export const listTemplates = asyncHandler(
  async (req: Request, res: Response) => {
    const occasion = req.query.occasion as Occasion | undefined;
    const filter: Record<string, unknown> = { isActive: true };
    if (occasion) {
      if (!OCCASIONS.includes(occasion)) throw new AppError("ভুল উপলক্ষ", 400);
      filter.occasionType = occasion;
    }
    const templates = await Template.find(filter)
      .select("_id title occasionType thumbnailUrl layoutConfig")
      .sort({ createdAt: -1 });
    res.json(templates);
  },
);

export const getTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await Template.findById(req.params.id).select(
    "_id title occasionType thumbnailUrl layoutConfig",
  );
  if (!template) throw new AppError("টেমপ্লেট পাওয়া যায়নি", 404);
  res.json(template);
});
````

## File: src/modules/templates/template.model.ts
````typescript
import { Schema, model, Document } from "mongoose";

export type Occasion = "victory" | "condolence" | "campaign" | "greeting" | "festival";
export const OCCASIONS: Occasion[] = ["victory", "condolence", "campaign", "greeting", "festival"];

export interface IPhotoSlotPosition {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  borderRadiusPx: number;
}

export interface ITextZone {
  topPct: number;
  heightPct: number;
  textColor: "white" | "dark";
}

export interface ILayoutConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  photoSlots: number;

  backgroundImageUrl?: string;
  photoSlotPosition?: IPhotoSlotPosition;

  /** Legacy single headline position (used by templates with no dedicated name/sub bars). */
  headlineYPct?: number;
  headlineTextColor?: "white" | "dark";

  /** Positioned name/sub bars for templates whose artwork already has dedicated
   *  text bars (e.g. campaign, condolence) — when present, these REPLACE the
   *  default white footer (and the credit line is dropped, since there's no
   *  room in these designs). */
  textZones?: {
    name?: ITextZone;
    sub?: ITextZone;
  };
}

export interface ITemplate extends Document {
  title: string;
  occasionType: Occasion;
  thumbnailUrl: string;
  layoutConfig: ILayoutConfig;
  isActive: boolean;
  createdAt: Date;
}

const textZoneSchema = new Schema<ITextZone>(
  { topPct: Number, heightPct: Number, textColor: { type: String, enum: ["white", "dark"] } },
  { _id: false },
);

const photoSlotPositionSchema = new Schema<IPhotoSlotPosition>(
  {
    xPct: Number,
    yPct: Number,
    widthPct: Number,
    heightPct: Number,
    borderRadiusPx: { type: Number, default: 24 },
  },
  { _id: false },
);

const templateSchema = new Schema<ITemplate>({
  title: { type: String, required: true },
  occasionType: { type: String, enum: OCCASIONS, required: true },
  thumbnailUrl: { type: String, required: true },
  layoutConfig: {
    primaryColor: { type: String, default: "#006a4e" },
    secondaryColor: { type: String, default: "#004d39" },
    accentColor: { type: String, default: "#e8383d" },
    photoSlots: { type: Number, default: 3, min: 1, max: 3 },
    backgroundImageUrl: { type: String },
    photoSlotPosition: { type: photoSlotPositionSchema },
    headlineYPct: { type: Number },
    headlineTextColor: { type: String, enum: ["white", "dark"], default: "white" },
    textZones: {
      name: { type: textZoneSchema },
      sub: { type: textZoneSchema },
    },
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default model<ITemplate>("Template", templateSchema);
````

## File: src/modules/templates/template.routes.ts
````typescript
import { Router } from "express";
import { listTemplates, getTemplate } from "./template.controller";

const router = Router();
router.get("/", listTemplates);
router.get("/:id", getTemplate);

export default router;
````

## File: src/modules/upload/upload.controller.ts
````typescript
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
````

## File: src/modules/upload/upload.middleware.ts
````typescript
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
````

## File: src/modules/upload/upload.routes.ts
````typescript
import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { upload } from "./upload.middleware";
import { uploadPhoto } from "./upload.controller";

const router = Router();
router.post("/", requireAuth, upload.single("file"), uploadPhoto);

export default router;
````

## File: src/scripts/seedTemplates.ts
````typescript
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../common/config/db";
import Template from "../modules/templates/template.model";

const seed = [
  {
    title: "মহান বিজয় দিবস",
    occasionType: "victory" as const,
    thumbnailUrl:
      "https://res.cloudinary.com/byq1o9yf/image/upload/v1790405320/poster-photos/g89zfoqyxdmbmdwxwqhw.jpg",
    layoutConfig: {
      primaryColor: "#006a4e",
      secondaryColor: "#004d39",
      accentColor: "#e8383d",
      photoSlots: 1,
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790405320/poster-photos/g89zfoqyxdmbmdwxwqhw.jpg",
      photoSlotPosition: {
        xPct: 35,
        yPct: 36,
        widthPct: 30,
        heightPct: 29,
        borderRadiusPx: 24,
      },
      headlineYPct: 76,
      headlineTextColor: "white" as const,
    },
  },
  {
    title: "শুভেচ্ছা ও শুভকামনা",
    occasionType: "greeting" as const,
    thumbnailUrl:
      "https://res.cloudinary.com/byq1o9yf/image/upload/v1790426674/poster-photos/t67l49eoig8uyjoopadv.jpg",
    layoutConfig: {
      primaryColor: "#123056",
      secondaryColor: "#0d213d",
      accentColor: "#1e4a7a",
      photoSlots: 1,
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790426674/poster-photos/t67l49eoig8uyjoopadv.jpg",
      photoSlotPosition: {
        xPct: 30,
        yPct: 45,
        widthPct: 40,
        heightPct: 35,
        borderRadiusPx: 20,
      },
      headlineYPct: 28,
      headlineTextColor: "dark" as const,
    },
  },
  {
    title: "নির্বাচনী প্রচারণা",
    occasionType: "campaign" as const,
    thumbnailUrl:
      "https://res.cloudinary.com/byq1o9yf/image/upload/v1790427193/poster-photos/xdvqjvtcquuhfble2ptj.jpg",
    layoutConfig: {
      primaryColor: "#0b5ea8",
      secondaryColor: "#08406f",
      accentColor: "#e8383d",
      photoSlots: 1, // second (circle) slot in the artwork is a logo/marka spot, not filled by user photo
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790427193/poster-photos/xdvqjvtcquuhfble2ptj.jpg",
      photoSlotPosition: {
        xPct: 8,
        yPct: 15,
        widthPct: 41,
        heightPct: 17,
        borderRadiusPx: 12,
      },
      headlineYPct: 67,
      headlineTextColor: "dark" as const,
      textZones: {
        name: { topPct: 79, heightPct: 8, textColor: "dark" as const },
      },
    },
  },
  {
    title: "ঈদ মোবারক",
    occasionType: "festival" as const,
    thumbnailUrl:
      "https://res.cloudinary.com/byq1o9yf/image/upload/v1790427238/poster-photos/dmourfo1tolocaxj7gt0.jpg",
    layoutConfig: {
      primaryColor: "#b46b35",
      secondaryColor: "#8a5027",
      accentColor: "#fabd66",
      photoSlots: 1,
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790427238/poster-photos/dmourfo1tolocaxj7gt0.jpg",
      photoSlotPosition: {
        xPct: 26,
        yPct: 38,
        widthPct: 48,
        heightPct: 24,
        borderRadiusPx: 30,
      },
      headlineYPct: 14,
      headlineTextColor: "dark" as const,
    },
  },
  {
    title: "গভীর শোক ও শ্রদ্ধা",
    occasionType: "condolence" as const,
    thumbnailUrl:
      "https://res.cloudinary.com/byq1o9yf/image/upload/v1790427271/poster-photos/rnm01ftyvvjdeee38chy.jpg",
    layoutConfig: {
      primaryColor: "#8a8a8a",
      secondaryColor: "#2b2b2b",
      accentColor: "#5a5a5a",
      photoSlots: 1,
      backgroundImageUrl:
        "https://res.cloudinary.com/byq1o9yf/image/upload/v1790427271/poster-photos/rnm01ftyvvjdeee38chy.jpg",
      photoSlotPosition: {
        xPct: 30.5,
        yPct: 25,
        widthPct: 39,
        heightPct: 39,
        borderRadiusPx: 20,
      },
      headlineYPct: 10,
      headlineTextColor: "white" as const,
      textZones: {
        name: { topPct: 71, heightPct: 16, textColor: "white" as const },
        sub: { topPct: 88, heightPct: 8, textColor: "white" as const },
      },
    },
  },
];

async function run() {
  await connectDB();
  await Template.deleteMany({});
  await Template.insertMany(seed);
  console.log(`✅ Seeded ${seed.length} templates`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
````

## File: src/scripts/testGemini.ts
````typescript
import { suggestDecoration } from "../modules/posters/gemini.service";

async function run() {
  console.log("🎨 Testing Gemini decoration suggestion...\n");

  const occasions = ["victory", "condolence", "campaign"] as const;

  for (const occasion of occasions) {
    console.log(`Occasion: ${occasion}`);
    const decoration = await suggestDecoration(occasion);
    console.log(decoration, "\n");
  }
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
````

## File: src/routes.ts
````typescript
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
````

## File: src/server.ts
````typescript
import "dotenv/config";
import app from "./app";
import { connectDB } from "./common/config/db";

const PORT = process.env.PORT ?? 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
````

## File: .gitignore
````
.env* 
node_modules
````

## File: insert-bijoy-dibosh-template.mjs
````javascript
// One-off script to insert your generated poster as a real Template.
// Run with:  node insert-bijoy-dibosh-template.mjs
// (needs MONGODB_URI in your .env, same as the rest of the backend)

import "dotenv/config";
import mongoose from "mongoose";

const IMAGE_URL = "https://res.cloudinary.com/byq1o9yf/image/upload/v1790405320/poster-photos/g89zfoqyxdmbmdwxwqhw.jpg";

const templateSchema = new mongoose.Schema({}, { strict: false, collection: "templates" });
const Template = mongoose.model("Template", templateSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  await Template.create({
    title: "মহান বিজয় দিবস — মাঠে পতাকা",
    occasionType: "victory",
    thumbnailUrl: IMAGE_URL,
    backgroundImageUrl: IMAGE_URL,

    // Measured directly from the image's blank zones (896x1200 source,
    // rendered onto the app's 1200x1600 canvas — same percentages either way).
    textLayout: {
      headline: { top: 3, fontSize: 78, color: "#c0392b" },   // clear sky above the doves
      photo:    { top: 36, left: 38, width: 20, height: 25, borderRadius: 24 }, // the blank card
      sub:      { top: 74, fontSize: 30, color: "#3e2b12" },  // pale straw band
      name:     { top: 92, fontSize: 36, color: "#2b1d10" },  // bottom cream band
    },

    layoutConfig: {
      primaryColor: "#1f5c3d",
      secondaryColor: "#0b3d2e",
      accentColor: "#c0392b",
      photoSlots: 1, // this art only has one blank photo box
    },

    isActive: true,
    createdAt: new Date(),
  });

  console.log("✅ মহান বিজয় দিবস template inserted");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
````

## File: package.json
````json
{
  "name": "poster-ghor-backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "seed": "ts-node src/scripts/seedTemplates.ts",
    "test:gemini": "ts-node -r dotenv/config src/scripts/testGemini.ts"
  },
  "dependencies": {
    "@google/genai": "^2.24.0",
    "bcryptjs": "^2.4.3",
    "cloudinary": "^2.5.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "express-rate-limit": "^8.7.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.8.0",
    "multer": "^1.4.5-lts.1",
    "puppeteer": "^25.12.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.9.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.6.3"
  }
}
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
````

## File: src/app.ts
````typescript
import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./common/middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ??
      "https://ai-political-poster-maker-five.vercel.app/",
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.use(errorHandler);

export default app;
````
