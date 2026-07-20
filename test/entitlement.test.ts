import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { runEntitlementEngine, type EntitlementLlmClient } from "../server/agents/entitlement.js";
import type { CitizenProfile } from "../server/types.js";

const fakeLlm: EntitlementLlmClient = {
  async parse<T>(_input: string, _instructions: string, _schema: z.ZodType<T>, schemaName: string) {
    return (schemaName === "scheme_fact_mapping" ? { mappings: [] } : { explanations: [] }) as T;
  }
};
const voice = <T>(value: T) => ({ value, confidence: 1, provenance: { source: "voice" as const, utterance: "test" } });

test("concurrent scheme engine keeps eligibility deterministic and ranks eligible schemes first", async () => {
  const profile: CitizenProfile = {
    marital_status: voice("widow"), annual_income_inr: voice(50000), state: voice("Uttar Pradesh"), household_size: voice(3),
    children: voice({ count: 2, girls: 1, in_school: 1 }), raw_documents: []
  };
  const verdicts = await runEntitlementEngine(profile, { llm: fakeLlm, language: "hi" });
  const eligible = verdicts.filter((verdict) => verdict.status === "eligible").map((verdict) => verdict.scheme_id);
  assert.ok(eligible.includes("widow_pension"));
  assert.ok(eligible.includes("girl_child_scholarship"));
  assert.equal(verdicts[0]?.status, "eligible");
  assert.equal(verdicts.find((verdict) => verdict.scheme_id === "old_age_pension")?.status, "missing_info");
});
