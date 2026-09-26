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