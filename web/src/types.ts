// Mirrors the ClaimDossier shape returned by POST /dossier (see server/types.ts).
export type Lang = "hi" | "en" | "mr";

export interface Localized {
  en: string;
  hi: string;
  [key: string]: string;
}

export interface RuleCitation {
  id: string;
  explain: Localized;
}

export type VerdictStatus = "eligible" | "likely" | "missing_info" | "not_eligible";

export interface Entitlement {
  scheme_id: string;
  scheme_name: Localized;
  status: VerdictStatus;
  benefit: Record<string, unknown>;
  matched_rules: RuleCitation[];
  failed_rules?: RuleCitation[];
  missing_facts?: string[];
  required_documents: { id: string; name: Localized }[];
}

export interface DecodedDocument {
  docId: string;
  doc_type: string;
  summary: Localized;
  deadline?: string;
  risk_or_opportunity: { level: "info" | "action" | "warning"; text: Localized };
}

export interface FilledFormField {
  pdf_field: string;
  value: string;
  from_fact: string;
}

export interface FilledForm {
  scheme_id: string;
  pdf_url: string;
  fields: FilledFormField[];
  needs_info?: string[];
  required_documents?: { id: string; name: Localized }[];
  submission?: { where: Localized; deadline: string | null };
}

export interface ClaimDossier {
  decoded_documents: DecodedDocument[];
  entitlements: Entitlement[];
  filled_forms: FilledForm[];
  generated_at: string;
  language: string;
}
