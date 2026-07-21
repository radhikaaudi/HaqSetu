import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { evaluateScheme } from "../engine/evaluate.js";
import { HaqSetuLlmClient } from "../llm/client.js";
import { SchemeSchema, type CitizenProfile, type EntitlementVerdict, type Scheme } from "../types.js";

const WhySchema = z.object({
  explanations: z.array(z.object({ id: z.string(), text: z.string() }))
});

export interface EntitlementLlmClient {
  parse<T>(input: string, instructions: string, schema: z.ZodType<T>, schemaName: string): Promise<T>;
}
export interface EntitlementOptions { language?: string; llm?: EntitlementLlmClient; schemesDirectory?: string; }

export async function loadSchemes(schemesDirectory = path.resolve(process.cwd(), "schemes")): Promise<Scheme[]> {
  const names = (await readdir(schemesDirectory)).filter((name) => name.endsWith(".json")).sort();
  return Promise.all(names.map(async (name) => SchemeSchema.parse(JSON.parse(await readFile(path.join(schemesDirectory, name), "utf8")))));
}

/**
 * Runs one GPT-backed scheme agent per scheme concurrently. Each agent writes the localized,
 * plain-language "why" in the user's language; evaluateScheme (code) remains the sole eligibility
 * authority — the model never sees or influences the eligible/not decision.
 */
export async function runEntitlementEngine(profile: CitizenProfile, options: EntitlementOptions = {}): Promise<EntitlementVerdict[]> {
  const schemes = await loadSchemes(options.schemesDirectory);
  const llm = options.llm ?? new HaqSetuLlmClient();
  const language = options.language ?? "en";
  const verdicts = await Promise.all(schemes.map((scheme) => runSchemeAgent(profile, scheme, language, llm)));
  const rank: Record<EntitlementVerdict["status"], number> = { eligible: 0, likely: 1, missing_info: 2, not_eligible: 3 };
  return verdicts.sort((a, b) => rank[a.status] - rank[b.status] || a.scheme_id.localeCompare(b.scheme_id));
}

async function runSchemeAgent(profile: CitizenProfile, scheme: Scheme, language: string, llm: EntitlementLlmClient): Promise<EntitlementVerdict> {
  // Code decides eligibility first; the model is only ever asked to explain that decision.
  const verdict = evaluateScheme(profile, scheme);
  const explanations = await llm.parse(JSON.stringify({ scheme, verdict, language }),
    "Write one short, plain-language explanation for each supplied matched or failed rule in the requested language. Do not change rule IDs, add rules, infer facts, or state eligibility; eligibility is code-determined.",
    WhySchema, "scheme_rule_explanations");
  return applyLocalizedWhy(verdict, explanations, language);
}

function applyLocalizedWhy(verdict: EntitlementVerdict, generated: z.infer<typeof WhySchema>, language: string): EntitlementVerdict {
  const byId = new Map(generated.explanations.map((entry) => [entry.id, entry.text]));
  // Store the generated "why" under the requested language key; en/hi baked text stays as fallback.
  const localize = (rules: EntitlementVerdict["matched_rules"] | undefined) => rules?.map((rule) => {
    const text = byId.get(rule.id);
    return text ? { ...rule, explain: { ...rule.explain, [language]: text } } : rule;
  });
  return { ...verdict, matched_rules: localize(verdict.matched_rules) ?? [], ...(verdict.failed_rules ? { failed_rules: localize(verdict.failed_rules) } : {}) };
}
