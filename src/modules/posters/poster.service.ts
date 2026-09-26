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
