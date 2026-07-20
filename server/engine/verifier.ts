import { loadSchemes } from "../agents/entitlement.js";
import { evaluateRule } from "./evaluate.js";
import type { ClaimDossier, CitizenProfile, Fact, FilledForm } from "../types.js";

function factAt(profile: CitizenProfile, path: string): Fact<unknown> | undefined {
  const [root, ...nested] = path.split(".");
  const source = profile[root as keyof CitizenProfile] as Fact<unknown> | undefined;
  if (!source) return undefined;
  let value: unknown = source.value;
  for (const part of nested) {
    if (!value || typeof value !== "object" || !(part in value)) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return { ...source, value };
}

/** Final code gate: keeps only rule claims and PDF fields traceable to real facts. */
export async function verifyDossier(dossier: ClaimDossier, profile: CitizenProfile): Promise<ClaimDossier> {
  const schemes = await loadSchemes();
  const schemeById = new Map(schemes.map((scheme) => [scheme.id, scheme]));
  const entitlements = dossier.entitlements.map((verdict) => {
    const scheme = schemeById.get(verdict.scheme_id);
    const valid = verdict.matched_rules.filter((matched) => {
      const rule = scheme?.eligibility.find((candidate) => candidate.id === matched.id);
      return !!rule && evaluateRule(factAt(profile, rule.fact), rule.op, rule.value);
    });
    if (valid.length === verdict.matched_rules.length) return verdict;
    const invalidIds = verdict.matched_rules.filter((matched) => !valid.some((item) => item.id === matched.id)).map((item) => `verification:${item.id}`);
    return { ...verdict, status: "missing_info" as const, matched_rules: valid, missing_facts: [...new Set([...(verdict.missing_facts ?? []), ...invalidIds])] };
  });
  const filled_forms = dossier.filled_forms.map((filled): FilledForm => {
    const validFields = filled.fields.filter((field) => {
      const source = factAt(profile, field.from_fact);
      return !!field.provenance && !!source && JSON.stringify(source.provenance) === JSON.stringify(field.provenance);
    });
    const missing = filled.fields.filter((field) => !validFields.includes(field)).map((field) => field.from_fact);
    return { ...filled, fields: validFields, ...(missing.length ? { needs_info: [...new Set([...(filled.needs_info ?? []), ...missing])] } : {}) };
  });
  return { ...dossier, entitlements, filled_forms };
}
