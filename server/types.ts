import { z } from "zod";

export const ProvenanceSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("voice"), utterance: z.string() }),
  z.object({ source: z.literal("document"), docId: z.string(), field: z.string() })
]);
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const FactSchema = <T extends z.ZodTypeAny>(value: T) =>
  z.object({ value, provenance: ProvenanceSchema, confidence: z.number().min(0).max(1) });
export type Fact<T> = { value: T; provenance: Provenance; confidence: number };

const ProfileFactsSchema = z.object({
  full_name: FactSchema(z.string()).optional(),
  age: FactSchema(z.number()).optional(),
  gender: FactSchema(z.enum(["male", "female", "other"])).optional(),
  marital_status: FactSchema(z.enum(["single", "married", "widow", "divorced"])).optional(),
  annual_income_inr: FactSchema(z.number()).optional(),
  household_size: FactSchema(z.number()).optional(),
  state: FactSchema(z.string()).optional(),
  district: FactSchema(z.string()).optional(),
  category: FactSchema(z.enum(["general", "obc", "sc", "st"])).optional(),
  owns_land: FactSchema(z.boolean()).optional(),
  occupation: FactSchema(z.string()).optional(),
  children: FactSchema(z.object({ count: z.number(), girls: z.number(), in_school: z.number() })).optional()
  ,area_type: FactSchema(z.enum(["rural", "urban"])).optional()
  ,willing_unskilled_work: FactSchema(z.boolean()).optional()
});

export const DecodedDocumentSchema = z.object({
  docId: z.string(),
  doc_type: z.string(),
  summary: z.object({ en: z.string(), hi: z.string() }),
  deadline: z.string().optional(),
  risk_or_opportunity: z.object({
    level: z.enum(["info", "action", "warning"]),
    text: z.object({ en: z.string(), hi: z.string() })
  }),
  extracted_facts: ProfileFactsSchema.partial()
});
export type DecodedDocument = z.infer<typeof DecodedDocumentSchema>;

export const CitizenProfileSchema = ProfileFactsSchema.extend({ raw_documents: z.array(DecodedDocumentSchema) });
export type CitizenProfile = z.infer<typeof CitizenProfileSchema>;

export const LocalizedTextSchema = z.object({ en: z.string(), hi: z.string() });
export const RuleOperatorSchema = z.enum(["equals", "not_equals", "lte", "gte", "lt", "gt", "in", "exists"]);
export type RuleOperator = z.infer<typeof RuleOperatorSchema>;
export const SchemeRuleSchema = z.object({
  id: z.string(), fact: z.string(), op: RuleOperatorSchema, value: z.unknown().optional(), explain: LocalizedTextSchema
});
export const SchemeSchema = z.object({
  id: z.string(), name: LocalizedTextSchema, authority: z.string(), benefit: z.record(z.string(), z.unknown()),
  eligibility: z.array(SchemeRuleSchema),
  required_documents: z.array(z.object({ id: z.string(), name: LocalizedTextSchema })),
  form: z.object({ template: z.string(), fields: z.array(z.object({ pdf_field: z.string(), from_fact: z.string() })) }),
  submission: z.object({ where: LocalizedTextSchema, deadline: z.string().nullable() })
});
export type Scheme = z.infer<typeof SchemeSchema>;

export const EntitlementVerdictSchema = z.object({
  scheme_id: z.string(), scheme_name: LocalizedTextSchema,
  status: z.enum(["eligible", "likely", "missing_info", "not_eligible"]), benefit: z.record(z.string(), z.unknown()),
  matched_rules: z.array(z.object({ id: z.string(), explain: LocalizedTextSchema })),
  failed_rules: z.array(z.object({ id: z.string(), explain: LocalizedTextSchema })).optional(),
  missing_facts: z.array(z.string()).optional(), required_documents: z.array(z.unknown())
});
export type EntitlementVerdict = z.infer<typeof EntitlementVerdictSchema>;

export const FilledFormSchema = z.object({
  scheme_id: z.string(), pdf_url: z.string(),
  fields: z.array(z.object({ pdf_field: z.string(), value: z.string(), from_fact: z.string(), provenance: ProvenanceSchema })),
  needs_info: z.array(z.string()).optional(),
  required_documents: z.array(z.unknown()).optional(),
  submission: z.object({ where: LocalizedTextSchema, deadline: z.string().nullable() }).optional()
});
export type FilledForm = z.infer<typeof FilledFormSchema>;
export const ClaimDossierSchema = z.object({
  decoded_documents: z.array(DecodedDocumentSchema), entitlements: z.array(EntitlementVerdictSchema),
  filled_forms: z.array(FilledFormSchema), generated_at: z.string(), language: z.string()
});
export type ClaimDossier = z.infer<typeof ClaimDossierSchema>;
