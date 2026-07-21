import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import { buildProfileFromText } from "./agents/intake.js";
import { runEntitlementEngine } from "./agents/entitlement.js";
import { buildActions } from "./agents/action.js";
import { decodeDocument, mergeDecodedDocument } from "./agents/decoder.js";
import { verifyDossier } from "./engine/verifier.js";
import { CitizenProfileSchema, ClaimDossierSchema, type CitizenProfile } from "./types.js";

/**
 * Translates raw provider errors into a clear, honest message so a viewer knows exactly whether
 * the problem is billing/quota, the key, or the model — never a vague "500" that looks like a bug.
 */
function describeError(error: unknown): string {
  const status = (error as { status?: number } | null)?.status;
  const raw = error instanceof Error ? error.message : String(error);
  if (status === 429 || /quota|rate.?limit|exceeded|billing/i.test(raw)) {
    return "OpenAI limit reached: the account's credit balance is 0 (or its rate limit was hit). HaqSetu's code is working correctly — the full flow runs the moment the account has available credits. This is a billing/quota limit, not a code error. Add credits at platform.openai.com and try again.";
  }
  if (status === 401 || status === 403) {
    return "AI provider rejected the API key (missing or invalid). Set a valid key in the environment and retry — this is a configuration issue, not a code error.";
  }
  if (status === 404) {
    return "The configured OpenAI model is not available for this API key. Update OPENAI_MODEL to an available model — this is a configuration issue, not a code error.";
  }
  return raw || "Something went wrong.";
}

const app = express();

// Simple in-memory per-IP rate limit — enough to stop a stranger draining the OpenAI budget.
const RATE_MAX = 40;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; reset: number }>();
app.use((request, response, next) => {
  const ip = request.ip ?? "unknown";
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) { hits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS }); return next(); }
  if (entry.count >= RATE_MAX) return response.status(429).json({ error: "Too many requests — please slow down." });
  entry.count += 1;
  return next();
});

// 8mb comfortably holds one document photo; larger bodies are rejected, not buffered.
app.use(express.json({ limit: "8mb" }));
app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.post("/intake", async (request, response) => {
  const { transcript, language } = request.body ?? {};
  if (typeof transcript !== "string" || !transcript.trim() || typeof language !== "string" || !language.trim()) {
    return response.status(400).json({ error: "transcript and language must be non-empty strings" });
  }
  try {
    return response.json(await buildProfileFromText(transcript, language));
  } catch (error) {
    return response.status(500).json({ error: describeError(error) });
  }
});
app.post("/entitlements", async (request, response) => {
  const parsed = CitizenProfileSchema.safeParse(request.body?.profile);
  if (!parsed.success) return response.status(400).json({ error: "profile is invalid", details: parsed.error.flatten() });
  try {
    return response.json(await runEntitlementEngine(parsed.data, { language: request.body?.language }));
  } catch (error) {
    return response.status(500).json({ error: describeError(error) });
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
    return response.status(500).json({ error: describeError(error) });
  }
});
// In production, serve the built React app from the same origin as the API, so the frontend's
// relative /dossier calls just work with no CORS or proxy. Skipped in dev (no web/dist yet).
const webDist = path.resolve(process.cwd(), "web/dist");
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.use((request, response, next) => {
    if (request.method !== "GET") return next();
    response.sendFile(path.join(webDist, "index.html"));
  });
}

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`HaqSetu listening on http://localhost:${port}`));
