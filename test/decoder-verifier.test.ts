import assert from "node:assert/strict";
import test from "node:test";
import { decodeDocument, mergeDecodedDocument, type VisionStructuredOutputClient } from "../server/agents/decoder.js";
import { evaluateScheme } from "../server/engine/evaluate.js";
import { SchemeSchema, type CitizenProfile } from "../server/types.js";

const fakeVision: VisionStructuredOutputClient = {
  async parseVision<T>() {
    const empty = { value: null, confidence: 0 };
    return {
      doc_type: "income certificate", summary: { en: "Income certificate showing annual income of INR 50,000.", hi: "आय प्रमाण पत्र में वार्षिक आय ₹50,000 है।" },
      deadline: null, risk_or_opportunity: { level: "info", text: { en: "Useful for income-based schemes.", hi: "आय-आधारित योजनाओं के लिए उपयोगी।" } },
      extracted_facts: { full_name: empty, age: empty, gender: empty, marital_status: empty, annual_income_inr: { value: 50000, confidence: 0.99 }, household_size: empty, state: empty, district: empty, category: empty, owns_land: empty, occupation: empty, children: empty, area_type: empty, willing_unskilled_work: empty }
    } as T;
  }
};
const voice = <T>(value: T) => ({ value, confidence: 1, provenance: { source: "voice" as const, utterance: "test" } });

test("decoded income certificate merges a sourced fact and unlocks widow pension", async () => {
  const profile: CitizenProfile = { marital_status: voice("widow"), age: voice(45), state: voice("Uttar Pradesh"), raw_documents: [] };
  const document = await decodeDocument("aGVsbG8=", "hi", fakeVision);
  const merged = mergeDecodedDocument(profile, document);
  const scheme = SchemeSchema.parse(JSON.parse(await (await import("node:fs/promises")).readFile(new URL("../schemes/widow_pension.json", import.meta.url), "utf8")));
  const verdict = evaluateScheme(merged, scheme);
  assert.equal(merged.annual_income_inr?.value, 50000);
  assert.equal(merged.annual_income_inr?.provenance.source, "document");
  assert.equal(verdict.status, "eligible");
});
