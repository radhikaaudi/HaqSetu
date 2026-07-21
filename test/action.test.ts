import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { buildActions } from "../server/agents/action.js";
import type { CitizenProfile, EntitlementVerdict } from "../server/types.js";

const voice = <T>(value: T) => ({ value, confidence: 1, provenance: { source: "voice" as const, utterance: "test" } });
const pdfBytes = (dataUrl: string) => Buffer.from(dataUrl.split(",")[1]!, "base64");

const widowVerdict: EntitlementVerdict = {
  scheme_id: "widow_pension", scheme_name: { en: "Widow Pension Scheme", hi: "विधवा पेंशन योजना" }, status: "eligible",
  benefit: {}, matched_rules: [], required_documents: []
};

test("action builder fills only source-backed widow-pension fields with provenance, in memory", async () => {
  const profile: CitizenProfile = { full_name: voice("Sita Devi"), age: voice(42), annual_income_inr: voice(50000), raw_documents: [] };
  const forms = await buildActions(profile, [widowVerdict], {
    toolCaller: { async callPdfMappingTool() { return ["applicant_name", "age", "annual_income"]; } }
  });
  assert.equal(forms.length, 1);
  assert.deepEqual(forms[0]?.fields.map((field) => field.pdf_field), ["applicant_name", "age", "annual_income"]);
  assert.equal(forms[0]?.fields[0]?.provenance.source, "voice");
  // The filled PDF is returned inline as a data URL — never written to disk.
  assert.ok(forms[0]?.pdf_url.startsWith("data:application/pdf;base64,"));
  const pdf = await PDFDocument.load(pdfBytes(forms[0]!.pdf_url));
  assert.equal(pdf.getForm().getTextField("applicant_name").getText(), "Sita Devi");
});

test("the model's field selection is load-bearing: an unselected field stays blank even when a fact backs it", async () => {
  const profile: CitizenProfile = { full_name: voice("Sita Devi"), age: voice(42), annual_income_inr: voice(50000), raw_documents: [] };
  // The model selects only two of the three backed fields; code must respect that and never invent annual_income.
  const forms = await buildActions(profile, [widowVerdict], {
    toolCaller: { async callPdfMappingTool() { return ["applicant_name", "age"]; } }
  });
  assert.deepEqual(forms[0]?.fields.map((field) => field.pdf_field), ["applicant_name", "age"]);
  assert.ok(forms[0]?.needs_info?.includes("annual_income_inr"));
  const pdf = await PDFDocument.load(pdfBytes(forms[0]!.pdf_url));
  assert.equal(pdf.getForm().getTextField("annual_income").getText(), undefined);
});
