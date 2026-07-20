import type { CitizenProfile, EntitlementVerdict, Fact, RuleOperator, Scheme } from "../types.js";

export function evaluateRule(fact: Fact<unknown> | undefined, op: RuleOperator, value?: unknown): boolean {
  if (op === "exists") return fact !== undefined && fact.value !== undefined && fact.value !== null;
  if (!fact) return false;
  const actual = fact.value;
  switch (op) {
    case "equals": return actual === value;
    case "not_equals": return actual !== value;
    case "lte": return typeof actual === "number" && typeof value === "number" && actual <= value;
    case "gte": return typeof actual === "number" && typeof value === "number" && actual >= value;
    case "lt": return typeof actual === "number" && typeof value === "number" && actual < value;
    case "gt": return typeof actual === "number" && typeof value === "number" && actual > value;
    case "in": return Array.isArray(value) && value.includes(actual);
  }
}

export function evaluateScheme(profile: CitizenProfile, scheme: Scheme): EntitlementVerdict {
  const matched_rules: EntitlementVerdict["matched_rules"] = [];
  const failed_rules: NonNullable<EntitlementVerdict["failed_rules"]> = [];
  const missing_facts: string[] = [];

  for (const rule of scheme.eligibility) {
    const fact = profile[rule.fact as keyof CitizenProfile] as Fact<unknown> | undefined;
    if (!fact && rule.op !== "exists") { missing_facts.push(rule.fact); continue; }
    if (evaluateRule(fact, rule.op, rule.value)) matched_rules.push({ id: rule.id, explain: rule.explain });
    else failed_rules.push({ id: rule.id, explain: rule.explain });
  }
  const status = missing_facts.length > 0 ? "missing_info" : failed_rules.length > 0 ? "not_eligible" : "eligible";
  return {
    scheme_id: scheme.id, scheme_name: scheme.name, status, benefit: scheme.benefit, matched_rules,
    ...(failed_rules.length ? { failed_rules } : {}), ...(missing_facts.length ? { missing_facts } : {}),
    required_documents: scheme.required_documents
  };
}
