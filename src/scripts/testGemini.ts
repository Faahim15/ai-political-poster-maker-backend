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
