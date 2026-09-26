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
