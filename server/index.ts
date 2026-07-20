import "dotenv/config";
import express from "express";
import { buildProfileFromText } from "./agents/intake.js";
import { runEntitlementEngine } from "./agents/entitlement.js";
import { CitizenProfileSchema } from "./types.js";

const app = express();
app.use(express.json());
app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.post("/intake", async (request, response) => {
  const { transcript, language } = request.body ?? {};
  if (typeof transcript !== "string" || !transcript.trim() || typeof language !== "string" || !language.trim()) {
    return response.status(400).json({ error: "transcript and language must be non-empty strings" });
  }
  try {
    return response.json(await buildProfileFromText(transcript, language));
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : "Intake failed" });
  }
});
app.post("/entitlements", async (request, response) => {
  const parsed = CitizenProfileSchema.safeParse(request.body?.profile);
  if (!parsed.success) return response.status(400).json({ error: "profile is invalid", details: parsed.error.flatten() });
  try {
    return response.json(await runEntitlementEngine(parsed.data, { language: request.body?.language }));
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : "Entitlement evaluation failed" });
  }
});
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`HaqSetu listening on http://localhost:${port}`));
