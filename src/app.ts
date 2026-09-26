import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./common/middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ??
      "https://ai-political-poster-maker-37jrjonrl.vercel.app/",
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.use(errorHandler);

export default app;
