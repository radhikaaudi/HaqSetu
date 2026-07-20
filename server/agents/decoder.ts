import { randomUUID } from "node:crypto";
import { z } from "zod";
import { HaqSetuLlmClient } from "../llm/client.js";
import type { CitizenProfile, DecodedDocument, Fact } from "../types.js";

const documentFact = <T extends z.ZodTypeAny>(value: T) => z.object({ value: value.nullable(), confidence: z.number().min(0).max(1) });
const DecodedDocumentOutputSchema = z.object({
  doc_type: z.string(),
  summary: z.object({ en: z.string(), hi: z.string() }),
  deadline: z.string().nullable(),
  risk_or_opportunity: z.object({ level: z.enum(["info", "action", "warning"]), text: z.object({ en: z.string(), hi: z.string() }) }),
  extracted_facts: z.object({
    full_name: documentFact(z.string()), age: documentFact(z.number()), gender: documentFact(z.enum(["male", "female", "other"])),
    marital_status: documentFact(z.enum(["single", "married", "widow", "divorced"])), annual_income_inr: documentFact(z.number()),
    household_size: documentFact(z.number()), state: documentFact(z.string()), district: documentFact(z.string()),
    category: documentFact(z.enum(["general", "obc", "sc", "st"])), owns_land: documentFact(z.boolean()), occupation: documentFact(z.string()),
    children: documentFact(z.object({ count: z.number(), girls: z.number(), in_school: z.number() })),
    area_type: documentFact(z.enum(["rural", "urban"])), willing_unskilled_work: documentFact(z.boolean())
  })
});
type DecodedDocumentOutput = z.infer<typeof DecodedDocumentOutputSchema>;

export interface VisionStructuredOutputClient {
  parseVision<T>(imageBase64: string, instructions: string, schema: z.ZodType<T>, schemaName: string): Promise<T>;
}

const fields = ["full_name", "age", "gender", "marital_status", "annual_income_inr", "household_size", "state", "district", "category", "owns_land", "occupation", "children", "area_type", "willing_unskilled_work"] as const;

/** Extracts only image-grounded facts. Unreadable images must produce no extracted facts. */
export async function decodeDocument(imageBase64: string, language: string, client: VisionStructuredOutputClient = new HaqSetuLlmClient()): Promise<DecodedDocument> {
  const docId = randomUUID();
  const output = await client.parseVision(imageBase64,
    `Read this document image and return a grounded plain-language explanation in ${language}. Extract only text or values visibly present. If unreadable, set doc_type to "unreadable document", explain that it is unreadable, set risk level to warning, and set every fact value to null. Never guess.`,
    DecodedDocumentOutputSchema, "decoded_document");
  const extracted_facts: DecodedDocument["extracted_facts"] = {};
  for (const field of fields) {
    const candidate = output.extracted_facts[field];
    if (candidate.value != null) (extracted_facts as Record<string, unknown>)[field] = {
      value: candidate.value, confidence: candidate.confidence, provenance: { source: "document", docId, field }
    } satisfies Fact<unknown>;
  }
  return { docId, doc_type: output.doc_type, summary: output.summary, ...(output.deadline ? { deadline: output.deadline } : {}), risk_or_opportunity: output.risk_or_opportunity, extracted_facts };
}

/** Adds document facts to a profile; document values are explicit, provenance-carrying evidence. */
export function mergeDecodedDocument(profile: CitizenProfile, document: DecodedDocument): CitizenProfile {
  return { ...profile, ...document.extracted_facts, raw_documents: [...profile.raw_documents, document] };
}
