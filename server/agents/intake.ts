import { z } from "zod";
import { HaqSetuLlmClient } from "../llm/client.js";
import type { CitizenProfile } from "../types.js";

const ExtractedFactsSchema = z.object({
  full_name: z.string().optional(),
  age: z.number().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  marital_status: z.enum(["single", "married", "widow", "divorced"]).optional(),
  annual_income_inr: z.number().optional(),
  household_size: z.number().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  category: z.enum(["general", "obc", "sc", "st"]).optional(),
  owns_land: z.boolean().optional(),
  occupation: z.string().optional(),
  children: z.object({ count: z.number(), girls: z.number(), in_school: z.number() }).optional(),
  confidence: z.number().min(0).max(1)
});
type ExtractedFacts = z.infer<typeof ExtractedFactsSchema>;

export interface IntakeStructuredOutputClient {
  parse<T>(input: string, instructions: string, schema: z.ZodType<T>, schemaName: string): Promise<T>;
}

const FACT_FIELDS = [
  "full_name", "age", "gender", "marital_status", "annual_income_inr", "household_size",
  "state", "district", "category", "owns_land", "occupation", "children"
] as const;

const extractionInstructions = (language: string) => `Extract only facts explicitly stated in this ${language} citizen description.
Do not infer, estimate, normalize ambiguous claims, or add facts from general knowledge. Omit unknown fields.
Annual income must be an INR number only when the speaker explicitly provides it. Return one confidence from 0 to 1 representing confidence in the extracted facts.`;

/**
 * Converts an unstructured voice transcript into provenance-carrying facts.
 * It intentionally does not make eligibility decisions; server/engine does that.
 */
export async function buildProfileFromText(
  transcript: string,
  language: string,
  client: IntakeStructuredOutputClient = new HaqSetuLlmClient()
): Promise<CitizenProfile> {
  const extracted = await client.parse(transcript, extractionInstructions(language), ExtractedFactsSchema, "citizen_facts");
  const provenance = { source: "voice" as const, utterance: transcript };
  const profile: CitizenProfile = { raw_documents: [] };

  for (const field of FACT_FIELDS) {
    const value = extracted[field];
    if (value !== undefined) {
      (profile as Record<string, unknown>)[field] = { value, provenance, confidence: extracted.confidence };
    }
  }
  return profile;
}
