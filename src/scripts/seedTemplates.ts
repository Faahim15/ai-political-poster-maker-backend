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
