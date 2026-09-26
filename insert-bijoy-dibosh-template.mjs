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
