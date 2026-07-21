import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { loadSchemes } from "./entitlement.js";
import { HaqSetuLlmClient } from "../llm/client.js";
import type { CitizenProfile, EntitlementVerdict, Fact, FilledForm, Scheme } from "../types.js";

export interface PdfMappingToolCaller { callPdfMappingTool(input: string): Promise<string[]>; }
export interface ActionOptions { toolCaller?: PdfMappingToolCaller; schemesDirectory?: string; }

/** Builds verifiable PDF actions. Only code supplies field values and provenance. */
export async function buildActions(profile: CitizenProfile, eligibleVerdicts: EntitlementVerdict[], options: ActionOptions = {}): Promise<FilledForm[]> {
  const schemes = await loadSchemes(options.schemesDirectory);
  const eligible = new Set(eligibleVerdicts.filter((verdict) => verdict.status === "eligible").map((verdict) => verdict.scheme_id));
  const toolCaller = options.toolCaller ?? new HaqSetuLlmClient();
  const candidates = await Promise.all(
    schemes
      .filter((scheme) => eligible.has(scheme.id) && scheme.form.template)
      .map(async (scheme) => (await templateExists(scheme) ? buildSchemeAction(profile, scheme, toolCaller) : null))
  );
  // A missing template PDF is skipped, never fatal — the rest of the dossier still builds.
  return candidates.filter((form): form is FilledForm => form !== null);
}

/** True only if every character is Latin-1 — the range pdf-lib's built-in fonts can render. */
function isPdfEncodable(value: string): boolean {
  return /^[\x00-\xFF]*$/.test(value);
}

async function templateExists(scheme: Scheme): Promise<boolean> {
  try {
    await access(path.resolve(process.cwd(), scheme.form.template));
    return true;
  } catch {
    return false;
  }
}

/**
 * Asks the model to select which declared PDF fields have a backing fact (programmatic tool call).
 * Only field names the scheme actually declares are honoured — anything the model invents is dropped.
 * If the model is unavailable or returns nothing usable, we fall back to all declared fields and let
 * code's provenance guard decide, so a flaky model call can never blank out a whole form mid-demo.
 */
async function selectBackedFields(toolCaller: PdfMappingToolCaller, scheme: Scheme, declaredFields: Scheme["form"]["fields"], profile: CitizenProfile): Promise<Set<string>> {
  const declared = new Set(declaredFields.map((field) => field.pdf_field));
  try {
    const chosen = await toolCaller.callPdfMappingTool(JSON.stringify({
      task: "Select only the declared form fields that have a matching, already-known profile fact. Never provide a value.",
      scheme_id: scheme.id, declared_fields: declaredFields, profile
    }));
    const recognised = chosen.filter((name) => declared.has(name));
    return recognised.length ? new Set(recognised) : declared;
  } catch {
    return declared;
  }
}

async function buildSchemeAction(profile: CitizenProfile, scheme: Scheme, toolCaller: PdfMappingToolCaller): Promise<FilledForm> {
  const declaredFields = scheme.form.fields;
  // The model SELECTS which declared fields it believes have a backing fact. That selection is
  // load-bearing — a field it does not pick is left blank — but the model can never supply a value.
  const selected = await selectBackedFields(toolCaller, scheme, declaredFields, profile);
  const fields: FilledForm["fields"] = [];
  const needs_info: string[] = [];
  const pdf = await PDFDocument.load(await readFile(path.resolve(process.cwd(), scheme.form.template)));
  const form = pdf.getForm();
  for (const field of declaredFields) {
    const fact = profile[field.from_fact as keyof CitizenProfile] as Fact<unknown> | undefined;
    // A field is filled ONLY when the model selected it AND a real, provenance-carrying fact backs it.
    // The value is always copied from that fact — code, never the model, decides the value.
    if (!fact || !selected.has(field.pdf_field)) { needs_info.push(field.from_fact); continue; }
    const value = String(fact.value);
    // pdf-lib's standard fonts only encode Latin-1. A non-encodable value (e.g. a Devanagari name)
    // is skipped and flagged, never written — otherwise it would crash the whole dossier at save time.
    if (!isPdfEncodable(value)) { needs_info.push(field.from_fact); continue; }
    form.getTextField(field.pdf_field).setText(value);
    fields.push({ pdf_field: field.pdf_field, value, from_fact: field.from_fact, provenance: fact.provenance });
  }
  // The filled form carries the applicant's PII, so it is never written to disk or served from a
  // static route. It is returned once, inline, as a data URL the browser downloads directly.
  const bytes = await pdf.save();
  const pdf_url = `data:application/pdf;base64,${Buffer.from(bytes).toString("base64")}`;
  return {
    scheme_id: scheme.id, pdf_url, fields,
    ...(needs_info.length ? { needs_info } : {}), required_documents: scheme.required_documents, submission: scheme.submission
  };
}
