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
