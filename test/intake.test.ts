import assert from "node:assert/strict";
import test from "node:test";
import { buildProfileFromText, type IntakeStructuredOutputClient } from "../server/agents/intake.js";

const hindiTranscript = "मैं विधवा हूँ, मेरे दो बच्चे हैं, मेरी सालाना आय पचास हज़ार है";

const fakeClient: IntakeStructuredOutputClient = {
  async parse<T>() {
    return {
      marital_status: "widow",
      children: { count: 2, girls: 0, in_school: 0 },
      annual_income_inr: 50000,
      confidence: 0.98
    } as T;
  }
};

test("Hindi intake transcript produces only grounded, provenance-carrying facts", async () => {
  const profile = await buildProfileFromText(hindiTranscript, "hi", fakeClient);
  assert.deepEqual(profile, {
    marital_status: { value: "widow", confidence: 0.98, provenance: { source: "voice", utterance: hindiTranscript } },
    annual_income_inr: { value: 50000, confidence: 0.98, provenance: { source: "voice", utterance: hindiTranscript } },
    children: { value: { count: 2, girls: 0, in_school: 0 }, confidence: 0.98, provenance: { source: "voice", utterance: hindiTranscript } },
    raw_documents: []
  });
  assert.equal(profile.state, undefined);
  assert.equal(profile.age, undefined);
});
