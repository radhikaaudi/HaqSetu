import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { buildActions } from "../server/agents/action.js";
import type { CitizenProfile, EntitlementVerdict } from "../server/types.js";

const voice = <T>(value: T) => ({ value, confidence: 1, provenance: { source: "voice" as const, utterance: "test" } });

test("action builder fills only source-backed widow-pension fields with provenance", async () => {
  const profile: CitizenProfile = { full_name: voice("Sita Devi"), age: voice(42), annual_income_inr: voice(50000), raw_documents: [] };
  const verdict: EntitlementVerdict = {
    scheme_id: "widow_pension", scheme_name: { en: "Widow Pension Scheme", hi: "विधवा पेंशन योजना" }, status: "eligible",
    benefit: {}, matched_rules: [], required_documents: []
  };
  const directory = await mkdtemp(path.join(tmpdir(), "haqsetu-action-"));
  const forms = await buildActions(profile, [verdict], {
    publicDirectory: directory,
    toolCaller: { async callPdfMappingTool() { return ["applicant_name", "age", "annual_income"]; } }
  });
  assert.equal(forms.length, 1);
  assert.deepEqual(forms[0]?.fields.map((field) => field.pdf_field), ["applicant_name", "age", "annual_income"]);
  assert.equal(forms[0]?.fields[0]?.provenance.source, "voice");
  const file = path.join(directory, forms[0]!.pdf_url.split("/").at(-1)!);
  const pdf = await PDFDocument.load(await readFile(file));
  assert.equal(pdf.getForm().getTextField("applicant_name").getText(), "Sita Devi");
});
