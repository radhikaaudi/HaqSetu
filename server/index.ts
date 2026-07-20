import "dotenv/config";
import express from "express";
import { buildProfileFromText } from "./agents/intake.js";
import { runEntitlementEngine } from "./agents/entitlement.js";
import { buildActions } from "./agents/action.js";
import { decodeDocument, mergeDecodedDocument } from "./agents/decoder.js";
import { verifyDossier } from "./engine/verifier.js";
import { CitizenProfileSchema, ClaimDossierSchema, type CitizenProfile } from "./types.js";

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use("/generated", express.static("generated"));
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
app.post("/dossier", async (request, response) => {
  const language = typeof request.body?.language === "string" ? request.body.language : "en";
  const transcript = typeof request.body?.transcript === "string" ? request.body.transcript.trim() : "";
  const hasImage = typeof request.body?.document_image_base64 === "string" && request.body.document_image_base64.trim();
  let profile: CitizenProfile;
  if (request.body?.profile !== undefined) {
    const parsed = CitizenProfileSchema.safeParse(request.body.profile);
    if (!parsed.success) return response.status(400).json({ error: "profile is invalid", details: parsed.error.flatten() });
    profile = parsed.data;
  } else if (transcript) {
    profile = { raw_documents: [] };
  } else if (hasImage) {
    profile = { raw_documents: [] };
  } else {
    return response.status(400).json({ error: "Provide a profile, a transcript, or a document image." });
  }
  try {
    if (transcript && request.body?.profile === undefined) {
      profile = { ...(await buildProfileFromText(transcript, language)), raw_documents: profile.raw_documents };
    }
    if (typeof request.body?.document_image_base64 === "string" && request.body.document_image_base64.trim()) {
      profile = mergeDecodedDocument(profile, await decodeDocument(request.body.document_image_base64, language));
    }
    const entitlements = await runEntitlementEngine(profile, { language });
    const filled_forms = await buildActions(profile, entitlements);
    const dossier = ClaimDossierSchema.parse({ decoded_documents: profile.raw_documents, entitlements, filled_forms, generated_at: new Date().toISOString(), language });
    return response.json(await verifyDossier(dossier, profile));
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : "Dossier generation failed" });
  }
});
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`HaqSetu listening on http://localhost:${port}`));
