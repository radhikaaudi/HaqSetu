import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { loadSchemes } from "./entitlement.js";
import { HaqSetuLlmClient } from "../llm/client.js";
import type { CitizenProfile, EntitlementVerdict, Fact, FilledForm, Scheme } from "../types.js";

export interface PdfMappingToolCaller { callPdfMappingTool(input: string): Promise<string[]>; }
export interface ActionOptions { toolCaller?: PdfMappingToolCaller; publicDirectory?: string; schemesDirectory?: string; }

/** Builds verifiable PDF actions. Only code supplies field values and provenance. */
export async function buildActions(profile: CitizenProfile, eligibleVerdicts: EntitlementVerdict[], options: ActionOptions = {}): Promise<FilledForm[]> {
  const schemes = await loadSchemes(options.schemesDirectory);
  const eligible = new Set(eligibleVerdicts.filter((verdict) => verdict.status === "eligible").map((verdict) => verdict.scheme_id));
  const toolCaller = options.toolCaller ?? new HaqSetuLlmClient();
  const publicDirectory = options.publicDirectory ?? path.resolve(process.cwd(), "generated");
  return Promise.all(schemes.filter((scheme) => eligible.has(scheme.id) && scheme.form.template).map((scheme) =>
    buildSchemeAction(profile, scheme, toolCaller, publicDirectory)
  ));
}

async function buildSchemeAction(profile: CitizenProfile, scheme: Scheme, toolCaller: PdfMappingToolCaller, publicDirectory: string): Promise<FilledForm> {
  const declaredFields = scheme.form.fields;
  await toolCaller.callPdfMappingTool(JSON.stringify({
    task: "Map only source-backed form fields.", scheme_id: scheme.id, declared_fields: declaredFields, profile
  }));
  const fields: FilledForm["fields"] = [];
  const needs_info: string[] = [];
  const pdf = await PDFDocument.load(await readFile(path.resolve(process.cwd(), scheme.form.template)));
  const form = pdf.getForm();
  for (const field of declaredFields) {
    const fact = profile[field.from_fact as keyof CitizenProfile] as Fact<unknown> | undefined;
    // GPT's tool call is advisory; code maps every declared source-backed field.
    if (!fact) { needs_info.push(field.from_fact); continue; }
    form.getTextField(field.pdf_field).setText(String(fact.value));
    fields.push({ pdf_field: field.pdf_field, value: String(fact.value), from_fact: field.from_fact, provenance: fact.provenance });
  }
  await mkdir(publicDirectory, { recursive: true });
  const filename = `${scheme.id}-${randomUUID()}.pdf`;
  await writeFile(path.join(publicDirectory, filename), await pdf.save());
  return {
    scheme_id: scheme.id, pdf_url: `/generated/${filename}`, fields,
    ...(needs_info.length ? { needs_info } : {}), required_documents: scheme.required_documents, submission: scheme.submission
  };
}
