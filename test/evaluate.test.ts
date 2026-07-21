import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { evaluateScheme } from "../server/engine/evaluate.js";
import { SchemeSchema, type CitizenProfile } from "../server/types.js";

const scheme = SchemeSchema.parse(JSON.parse(readFileSync(new URL("../schemes/widow_pension.json", import.meta.url), "utf8")));
const voice = <T>(value: T) => ({ value, confidence: 1, provenance: { source: "voice" as const, utterance: "sample interview" } });

test("widow profile is deterministically eligible", () => {
  const profile: CitizenProfile = { marital_status: voice("widow"), age: voice(41), annual_income_inr: voice(120000), state: voice("Uttar Pradesh"), raw_documents: [] };
  const verdict = evaluateScheme(profile, scheme);
  assert.equal(verdict.status, "eligible");
  assert.deepEqual(verdict.matched_rules.map((rule) => rule.id), ["must_be_widow", "adult_age", "income_below_limit", "resident"]);
  assert.equal(verdict.failed_rules, undefined);
});

test("profile with an unknown eligibility fact needs more information", () => {
  const profile: CitizenProfile = { marital_status: voice("widow"), age: voice(65), state: voice("Uttar Pradesh"), raw_documents: [] };
  const verdict = evaluateScheme(profile, scheme);
  assert.equal(verdict.status, "missing_info");
  assert.deepEqual(verdict.missing_facts, ["annual_income_inr"]);
  assert.deepEqual(verdict.matched_rules.map((rule) => rule.id), ["must_be_widow", "adult_age", "resident"]);
});
