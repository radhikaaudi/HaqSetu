import { z } from "zod";
import { HaqSetuLlmClient } from "../llm/client.js";
import type { CitizenProfile } from "../types.js";

const ExtractedFactsSchema = z.object({
  // Responses structured outputs require all object properties. null means unknown.
  full_name: z.string().nullable(),
  age: z.number().nullable(),
  gender: z.enum(["male", "female", "other"]).nullable(),
  marital_status: z.enum(["single", "married", "widow", "divorced"]).nullable(),
  annual_income_inr: z.number().nullable(),
  household_size: z.number().nullable(),
  state: z.string().nullable(),
  district: z.string().nullable(),
  category: z.enum(["general", "obc", "sc", "st"]).nullable(),
  owns_land: z.boolean().nullable(),
  occupation: z.string().nullable(),
  children: z.object({ count: z.number(), girls: z.number(), in_school: z.number() }).nullable(),
  area_type: z.enum(["rural", "urban"]).nullable(),
  willing_unskilled_work: z.boolean().nullable(),
  confidence: z.number().min(0).max(1)
});
type ExtractedFacts = z.infer<typeof ExtractedFactsSchema>;

export interface IntakeStructuredOutputClient {
  parse<T>(input: string, instructions: string, schema: z.ZodType<T>, schemaName: string): Promise<T>;
}

const FACT_FIELDS = [
  "full_name", "age", "gender", "marital_status", "annual_income_inr", "household_size",
  "state", "district", "category", "owns_land", "occupation", "children", "area_type", "willing_unskilled_work"
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
    if (value != null) {
      (profile as Record<string, unknown>)[field] = { value, provenance, confidence: extracted.confidence };
    }
  }
  return profile;
}
