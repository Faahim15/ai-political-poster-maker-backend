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
