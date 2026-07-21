# HaqSetu — हक़ सेतु · *"the bridge to your rights"*

> **From paper you can't read to the rights you're owed.**
> Built for the rural poor. Not advice. Not a chatbot. **A bridge.**

In India, the money and services meant for the poorest people — pensions,
scholarships, food rations, wage guarantees — are real, budgeted, and waiting.
Every year an enormous share is **never claimed**. Not because people are
ineligible, but because the benefit arrives as a **form they cannot read**, in a
language that isn't theirs, behind a process no one explained.

HaqSetu turns **a spoken sentence and a photographed document — in the user's own
language** — into one deliverable: **the Claim Dossier.**

1. **📄 What this paper means** — any official document, photographed, decoded in
   the user's language: what it is, the deadline, and whether it's an opportunity,
   a debt, or a scam.
2. **💰 What you're owed but aren't claiming** — a ranked list of the benefits they
   qualify for, each with a plain-language *"why you qualify"* that cites the exact
   eligibility rule it matched.
3. **✅ Your ready-to-file paperwork** — the **completed official form**, a *"bring
   these"* checklist, and where and by when to submit.

The conversation is only the door in. **The output is a verifiable packet — which
is exactly why HaqSetu is not a chatbot.**

---

## Why this is different: trust is an architecture, not a disclaimer

The core design decision: **the language model lives at the edges, and a
deterministic rules engine lives at the core.** The model does what only a model
can — understand messy speech, read a creased document, explain a rule in someone's
mother tongue. It is **never** trusted to decide who is eligible.

```
 VOICE ─┐
        ├─▶ [1] INTAKE        speech/text → provenance-carrying facts   (model)
 PHOTO ─┘
              [2] DECODER      document image → meaning, deadline, risk  (model, vision)
              [3] ENTITLEMENT  one agent per scheme, concurrently        (code decides; model explains)
              [4] ACTION       fills the real form, field by field       (model selects; code fills)
              [5] VERIFIER     every claim cites its rule; every field its fact  (code gate)
                    ▼
              📦 THE CLAIM DOSSIER
```

**Two hard invariants, enforced in code, not prompts:**

- **No entitlement is shown without a matched rule.** Eligibility is a pure boolean
  program over the citizen profile (`server/engine/evaluate.ts`). The model never
  sees or influences the eligible/not decision — it only writes the localized *why*.
- **No form field is filled without a source fact.** In the action builder the model
  *selects* which declared PDF fields have a backing fact, but code supplies every
  value from the fact itself and attaches its provenance. The model is structurally
  forbidden from inventing a value.

The **Verifier** (`server/engine/verifier.ts`) is the final gate: it re-checks every
matched rule against the real profile and **drops any filled field whose provenance
doesn't trace back to a genuine fact** before anything reaches the user. In a domain
where a hallucinated "you qualify" could send someone in a remote village on a
bus-ride to be turned away and humiliated, this isn't a nicety — it's the whole point.

---

## How I used Codex and GPT-5.6

I built HaqSetu **end-to-end with OpenAI Codex (CLI, inside VS Code)** driving the
`gpt-5.6-terra` model. My primary build session is recorded via Codex `/feedback`
(Session ID `019f7e4a-e251-7ca0-b345-534566d07c2e`), and the exact playbook I
worked through, prompt by prompt, is in [`CODEX_PROMPTS.md`](./CODEX_PROMPTS.md).

### How I used Codex (phase by phase)

I drove the whole build from the Codex CLI, one focused task per prompt, committing
after each phase so no rate-limit reset ever cost progress:

1. **Scaffold + vertical slice** — Codex set up the TypeScript/Express project, wrote
   the `zod` data model (`server/types.ts`), and built the deterministic evaluator
   (`server/engine/evaluate.ts`) with the first passing test — proving one scheme
   worked end-to-end before adding breadth.
2. **Intake agent** — Codex wrote `server/agents/intake.ts` (voice/text → structured,
   provenance-carrying facts), with a Hindi-transcript test.
3. **Entitlement engine** — the concurrent, one-agent-per-scheme fan-out in
   `server/agents/entitlement.ts`, with code as the sole eligibility authority.
4. **Action builder** — `server/agents/action.ts`, wiring `pdf-lib` to fill real
   government-form PDFs field by field via a tool call.
5. **Decoder + Verifier** — the GPT-5.6 vision decoder (`server/agents/decoder.ts`)
   and the citation gate (`server/engine/verifier.ts`).
6. **Frontend** — the phone-sized, voice-first React app in `web/` (Hindi/Marathi/English).
7. **Hardening** — with Codex I then made the model calls genuinely load-bearing,
   added the rate-limit + in-memory-PII security fixes, wired real cited rules from
   the UP SSPY portal, and fixed PDF encoding for non-Latin names.

Codex also **wrote the test suite** (`npm test`, 7 passing) — and because those tests
mock the model, they run for free, which let me catch regressions *before* spending a
live API call. Throughout, Codex accelerated the *how*; the decisions that make or
break the product stayed with me: **putting a deterministic rules engine at the core
instead of the model, making the Verifier a hard gate rather than a warning, refusing
to auto-submit on a citizen's behalf, and choosing depth (real, cited rules for a few
schemes) over breadth.**

### How GPT-5.6 powers each stage (concretely)

All model access goes through one thin edge wrapper, `server/llm/client.ts`, using the
OpenAI SDK's `chat.completions` API with a configurable `reasoning_effort` knob.

| GPT-5.6 capability | How it's used, and where |
|---|---|
| **Structured output** (schema-enforced JSON) | `client.parse()` uses `chat.completions.parse` with `zodResponseFormat`, so the model *must* return schema-valid JSON or it is rejected — used for intake facts (`intake.ts`) and the localized "why" explanations (`entitlement.ts`). Every extracted fact carries `provenance` + `confidence`. |
| **Multimodal / vision** | `client.parseVision()` sends the photographed document as an `image_url` (`detail: "high"`); `decoder.ts` returns the doc type, plain-language summary, deadline, risk level, and **only image-grounded facts** (nulls if the page is unreadable — it never guesses). |
| **Multi-agent orchestration** | `entitlement.ts` runs one `runSchemeAgent` per scheme via `Promise.all` — **concurrent GPT-5.6 agents**, each explaining its scheme in the user's language, while `evaluateScheme()` (code) alone decides eligibility. |
| **Programmatic tool calling** | `client.callPdfMappingTool()` defines a `strict` `map_pdf_fields` function; in `action.ts` the model's field **selection is load-bearing**, but code supplies every value from a provenance-carrying fact — the model is structurally forbidden from inventing one. |

---

## Quickstart

**Prerequisites:** Node.js 20+. An OpenAI API key with a small credit balance
(a full demo run costs cents).

```bash
# 1. Install
npm install
npm --prefix web install

# 2. Configure the key
cp .env.example .env        # then edit .env and set OPENAI_API_KEY=...
                            # OPENAI_MODEL defaults to gpt-5.6-terra

# 3. Run the backend (http://localhost:3000)
npm run dev

# 4. In a second terminal, run the web app (http://localhost:5173)
npm run web
```

Open **http://localhost:5173**, pick a language, and either tap 🎤 to speak, type
in the box, or 📷 upload a photo of a document. The web app proxies the API to the
backend automatically (see `web/vite.config.ts`) — no CORS setup needed.

### Test it without the UI

The whole pipeline (intake → decode → entitlement → action → verify) is one endpoint:

```bash
curl -s http://localhost:3000/dossier \
  -H "Content-Type: application/json" \
  -d '{"language":"hi","transcript":"मेरा नाम सुनीता है और मेरी उम्र 41 साल है। मैं विधवा हूँ। मेरे दो बच्चे हैं, जिनमें एक बेटी स्कूल जाती है। मेरी सालाना आय पचास हज़ार रुपये है। मैं उत्तर प्रदेश में रहती हूँ।"}'
```

You'll get back the ranked entitlements (each with cited rules) and a link under
`/generated/...` to the filled widow-pension PDF.

### Run the tests

```bash
npm test          # 7 tests: deterministic engine, verifier gate, load-bearing tool call, intake grounding
npm run typecheck # strict TypeScript, no emit
```

---

## Project layout

```
server/
  llm/client.ts         Edge-only GPT-5.6 wrapper (structured output, vision, tools)
  agents/intake.ts      Voice/text  → provenance-carrying facts
  agents/decoder.ts     Document photo → meaning + facts (vision)
  agents/entitlement.ts One concurrent agent per scheme; code decides, model explains
  agents/action.ts      Fills real PDFs; model selects fields, code supplies values
  engine/evaluate.ts    The deterministic eligibility engine (the core)
  engine/verifier.ts    The citation gate (runs last, before returning)
schemes/*.json          One file per benefit — rules are data, not code
forms/*.pdf             Real fillable government-style form templates
web/                    Phone-sized, icon-driven, voice-first React app (Hindi/Marathi/English)
test/                   Unit tests for every core guarantee
```

---

## A note on scope (read this before judging accuracy)

The eligibility rules in `schemes/*.json` are **clearly-labeled representative demo
rules**, not the authorities' live policy text. That's a deliberate honesty choice:
adding or correcting a scheme is a **JSON file, with zero model retraining** — the
architecture is built so production would load official rules the same way. Covering
5 real schemes *end-to-end and correctly* is more convincing, and more honest, than
claiming to cover 500.

---

> **North Star:** *No one should lose what they are legally owed simply because they
> cannot read a form.*
