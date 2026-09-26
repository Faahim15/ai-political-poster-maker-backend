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
