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
