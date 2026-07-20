# HaqSetu — Architecture & Technical Blueprint

> Companion to [`PROBLEM_STATEMENT.md`](PROBLEM_STATEMENT.md) (the locked anchor). This is **how** we build it. Codex reads this file to understand the system before writing code.

**Stack:** Node.js + TypeScript (full-stack) · GPT‑5.6 via the Responses API · React frontend · deterministic rules engine core.

---

## 1. The core principle (never violate this)

> **The LLM lives at the edges. A deterministic engine lives at the core.**

- **GPT‑5.6 (edges):** understands messy human input (speech, document photos), turns it into **typed facts**, and **explains** results in plain language.
- **Code (core):** the **eligibility decision** and the **form-filling** are plain deterministic functions. They are *checkable*. The model **never** decides eligibility by "vibes."

This is what makes HaqSetu **verifiable and not a chatbot.** Every "you qualify" is a boolean computed by code from typed facts; the model only helps *produce* the facts and *explain* the outcome.

---

## 2. System overview

```
┌──────────────────────────── FRONTEND (React) ────────────────────────────┐
│  🎤 Speak      📷 Upload document      →      📦 Claim Dossier screen       │
└───────────────────────────────┬───────────────────────────────────────────┘
                                 │ HTTP (JSON + files)
┌───────────────────────────────▼───────────────────────────────────────────┐
│                        BACKEND (Node + TypeScript)                          │
│                                                                             │
│  [1] INTAKE ────────▶ CitizenProfile (typed facts, each with provenance)    │
│       speech→text (GPT-5.6), short structured interview                      │
│                                                                             │
│  [2] DOCUMENT DECODER ─▶ decoded meaning + NEW facts merged into profile    │
│       vision (GPT-5.6): what is it, deadline, risk/opportunity              │
│                                                                             │
│  [3] ENTITLEMENT ENGINE ─▶ per-scheme verdicts                              │
│       • deterministic rules evaluator (CODE) = the decision                 │
│       • GPT-5.6 multi-agent = fact-mapping + "why" explanation, per scheme  │
│       • runs schemes CONCURRENTLY (multi-agent orchestration)              │
│                                                                             │
│  [4] ACTION BUILDER ─▶ filled PDF forms + document checklist + where/when   │
│       programmatic tool calling: map facts→form fields, fill PDF           │
│                                                                             │
│  [5] VERIFIER ─▶ gate: every claim cites a rule; every field cites a fact   │
│       drops/ő flags anything unverifiable                                    │
│                                                                             │
│         RULES BASE (data): /schemes/*.json  ·  /forms/*.pdf                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The data model (the heart of the system)

### 3.1 CitizenProfile — typed facts with provenance

Every fact carries **where it came from** (voice or which document) so the Verifier can trace it.

```ts
type Provenance =
  | { source: "voice"; utterance: string }
  | { source: "document"; docId: string; field: string };

interface Fact<T> {
  value: T;
  provenance: Provenance;
  confidence: number; // 0..1, from the extracting model
}

interface CitizenProfile {
  full_name?: Fact<string>;
  age?: Fact<number>;
  gender?: Fact<"male" | "female" | "other">;
  marital_status?: Fact<"single" | "married" | "widow" | "divorced">;
  annual_income_inr?: Fact<number>;
  household_size?: Fact<number>;
  state?: Fact<string>;
  district?: Fact<string>;
  category?: Fact<"general" | "obc" | "sc" | "st">;
  owns_land?: Fact<boolean>;
  occupation?: Fact<string>;
  children?: Fact<{ count: number; girls: number; in_school: number }>;
  // extensible — add fields only as a scheme needs them
  raw_documents: DecodedDocument[];
}
```

### 3.2 Scheme — one JSON file per scheme in `/schemes/`

The **rules base**. This is data, not code — adding a scheme = adding a file.

```json
{
  "id": "widow_pension",
  "name": { "en": "Widow Pension Scheme", "hi": "विधवा पेंशन योजना" },
  "authority": "State Social Welfare Department",
  "benefit": { "type": "cash", "amount_inr_per_month": 1000 },
  "eligibility": [
    {
      "id": "must_be_widow",
      "fact": "marital_status",
      "op": "equals",
      "value": "widow",
      "explain": { "en": "You are a widow", "hi": "आप एक विधवा हैं" }
    },
    {
      "id": "income_below_limit",
      "fact": "annual_income_inr",
      "op": "lte",
      "value": 200000,
      "explain": { "en": "Your annual income is below ₹2,00,000", "hi": "आपकी वार्षिक आय ₹2,00,000 से कम है" }
    },
    {
      "id": "resident",
      "fact": "state",
      "op": "equals",
      "value": "Uttar Pradesh",
      "explain": { "en": "You reside in the state", "hi": "आप राज्य में निवास करती हैं" }
    }
  ],
  "required_documents": [
    { "id": "aadhaar", "name": { "en": "Aadhaar card", "hi": "आधार कार्ड" } },
    { "id": "death_cert", "name": { "en": "Husband's death certificate", "hi": "पति का मृत्यु प्रमाण पत्र" } },
    { "id": "income_cert", "name": { "en": "Income certificate", "hi": "आय प्रमाण पत्र" } }
  ],
  "form": {
    "template": "forms/widow_pension.pdf",
    "fields": [
      { "pdf_field": "applicant_name", "from_fact": "full_name" },
      { "pdf_field": "age", "from_fact": "age" },
      { "pdf_field": "annual_income", "from_fact": "annual_income_inr" }
    ]
  },
  "submission": {
    "where": { "en": "Block Development Office / online state portal", "hi": "..." },
    "deadline": null
  }
}
```

**Supported `op` values (deterministic):** `equals`, `not_equals`, `lte`, `gte`, `lt`, `gt`, `in`, `exists`. Keep the set small and testable.

### 3.3 DecodedDocument — output of the Document Decoder

```ts
interface DecodedDocument {
  docId: string;
  doc_type: string;              // "income certificate", "govt notice", ...
  summary: { en: string; hi: string };   // "what this is", plain language
  deadline?: string;             // ISO date if the doc contains one
  risk_or_opportunity: { level: "info" | "action" | "warning"; text: {en:string;hi:string} };
  extracted_facts: Partial<CitizenProfile>; // facts to merge into the profile
}
```

### 3.4 ClaimDossier — the final artifact (the product)

```ts
interface EntitlementVerdict {
  scheme_id: string;
  scheme_name: { en: string; hi: string };
  status: "eligible" | "likely" | "missing_info" | "not_eligible";
  benefit: object;
  matched_rules: { id: string; explain: {en:string;hi:string} }[]; // WHY — cited
  failed_rules?: { id: string; explain: {en:string;hi:string} }[];
  missing_facts?: string[];      // what to ask/collect to decide
  required_documents: object[];
}

interface FilledForm {
  scheme_id: string;
  pdf_url: string;               // the downloadable artifact
  fields: { pdf_field: string; value: string; from_fact: string; provenance: Provenance }[];
}

interface ClaimDossier {
  decoded_documents: DecodedDocument[];   // Kaagaz half
  entitlements: EntitlementVerdict[];     // Haqdaar half (ranked, eligible first)
  filled_forms: FilledForm[];             // the action
  generated_at: string;
  language: string;
}
```

---

## 4. The five agents (what each does, and the GPT‑5.6 feature it uses)

| # | Agent | Input → Output | GPT‑5.6 feature | Verifiable? |
|---|-------|----------------|-----------------|-------------|
| 1 | **Intake** | voice/interview → `CitizenProfile` facts | speech-to-text, structured extraction | facts carry provenance |
| 2 | **Document Decoder** | photo → `DecodedDocument` + merged facts | **vision (multimodal)** | facts carry docId provenance |
| 3 | **Entitlement Engine** | profile + `/schemes/*` → `EntitlementVerdict[]` | **multi-agent orchestration** (one agent per scheme, concurrent) — but the **verdict boolean is computed by the deterministic rules evaluator in code** | ✅ decision is code |
| 4 | **Action Builder** | eligible schemes + profile → `FilledForm[]` + checklist | **programmatic tool calling** (map facts→fields, fill PDF in-memory) | each field cites a fact |
| 5 | **Verifier** | draft dossier → validated dossier | (code gate) | drops any claim/field lacking a citation |

**Critical rule for Agent 3:** the model reads the scheme + profile and **maps/interprets facts** and **writes the explanation**, but the pass/fail of each eligibility rule is decided by `evaluateRule(fact, op, value)` in code. If a required fact is missing, status = `missing_info` (never guess).

---

## 5. Runtime flow (one request)

1. User taps 🎤, speaks in Hindi/regional language → **Intake** builds the profile.
2. (Optional) User uploads a document photo → **Document Decoder** explains it + enriches the profile.
3. Backend loads all `/schemes/*.json`.
4. **Entitlement Engine** fans out concurrently (GPT‑5.6 multi-agent): per scheme, map facts → run deterministic rules → produce verdict + "why".
5. **Action Builder** fills PDFs for eligible schemes (programmatic tool calling) + builds checklist.
6. **Verifier** validates every citation, drops the unverifiable.
7. Frontend renders the **Claim Dossier**; TTS reads it aloud (accessibility).

---

## 6. Folder structure

```
haqsetu/
├── PROBLEM_STATEMENT.md        # locked anchor
├── ARCHITECTURE.md             # this file
├── CODEX_PROMPTS.md            # the build prompts
├── README.md                   # (built last — documents Codex + GPT-5.6 usage)
├── package.json
├── .env.example                # OPENAI_API_KEY=...
├── /schemes/                   # the rules base — one JSON per scheme
│   ├── widow_pension.json
│   ├── girl_child_scholarship.json
│   └── ...
├── /forms/                     # blank official PDF templates
├── /server/                    # Node + TS backend
│   ├── agents/                 # intake, decoder, entitlement, action, verifier
│   ├── engine/                 # deterministic rules evaluator + PDF filler
│   ├── llm/                    # GPT-5.6 Responses API wrapper
│   └── index.ts
├── /web/                       # React frontend
└── /test/                      # golden tests: sample profiles → expected verdicts
```

---

## 7. GPT‑5.6 usage map (for the README / judging)

| Where | Feature | Why it's needed (not decorative) |
|---|---|---|
| Intake | speech understanding + structured extraction | the user can't type; low-literacy |
| Document Decoder | **vision / multimodal** | reads the user's actual paper |
| Entitlement Engine | **multi-agent orchestration** | evaluate many schemes concurrently, one specialist each |
| Action Builder | **programmatic tool calling** | fills forms via a real in-memory program, not free text |
| All | local-language generation | every explanation in Hindi + regional language |

**"Built with 5.6" citation for the video:** the Entitlement Engine's concurrent multi-agent evaluation is the flagship — cite that as the piece that needs GPT‑5.6.

---

## 8. Demo scheme set (pick 5–6 real ones — lock before building)

Suggested high-impact, clearly-eligible-or-not set (India / Hindi demo):
1. **Widow Pension** — clean eligibility, emotional.
2. **Girl-Child Scholarship** — reveals the "you didn't know this existed" moment.
3. **Food Security / Ration (NFSA)** — near-universal relevance.
4. **Old-Age Pension** — simple age+income rules.
5. **Maternity Benefit** — another life-stage trigger.
6. **Wage-guarantee (MGNREGA) job-card** — the "know your rights" angle.

> ⚠️ Use **realistic but clearly-labeled demo rules** in the JSON. Do not present invented eligibility numbers as official on stage — say "representative rules for demo; production would load the authority's official rules."

---

## 9. Anti-hallucination (the Verifier, in detail)

- **Eligibility:** a verdict may only list a rule in `matched_rules` if `evaluateRule()` returned true against a real profile fact. No fact → `missing_info`, not a guess.
- **Forms:** a field may only be filled if a profile fact maps to it, and the `provenance` is attached. No source → field left blank + added to "needs info."
- **Documents:** the decoder's `summary` must be grounded in the image; if the image is unreadable → say so, don't invent.
- **The gate is code**, run after the agents, before the dossier is shown. This is the single most important trust feature — it is not optional.

---

## 10. Success = what a judge sees working

1. Speak a situation in Hindi → **3 real entitlements** appear, each with a cited "why".
2. Photograph a document → **plain-language meaning + deadline** appears, and it unlocks a new entitlement.
3. Click a scheme → a **filled PDF** downloads, every field traceable to a spoken/where-from fact.
4. The **Verifier** visibly marks anything it *couldn't* verify as "needs info" — proving it doesn't guess.
