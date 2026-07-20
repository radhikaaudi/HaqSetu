
# HaqSetu — Build Guide & Ready-to-Paste Codex Prompts

> This is your **build playbook.** You run these prompts **inside Codex** (so your `/feedback` session captures the real work — a judging requirement). Do them in order; each phase leaves you with something that runs. Commit after every phase.

**Golden rules while building with Codex:**
- 🎯 **One task per prompt.** Small, clear asks beat giant ones. (GPT‑5.6/Codex works best with focused prompts — don't SHOUT in all-caps at it.)
- 💾 **Commit after every phase** (`git add -A && git commit -m "..."`) so a rate-limit reset never costs progress.
- 👀 **Read what Codex writes** before accepting — judges check that you understand your own repo.
- 🧭 Always tell Codex to **follow `PROBLEM_STATEMENT.md` and `ARCHITECTURE.md`.**
- 🧪 Ask for a **test or a runnable check** with each core piece — that's your "non-trivial implementation" proof.

---

## Phase 0 — Setup (do this once, ~10 min)

**A. Install the Codex CLI** (your terminal didn't have it). In PowerShell:
```powershell
npm install -g @openai/codex
codex --version
```
*(Or use the Codex VS Code extension — either is fine. The CLI gives the cleanest `/feedback` session.)*

**B. Get an OpenAI API key for runtime** (separate from Codex):
- Create a key at platform.openai.com → API keys.
- Add a small credit balance (demo usage is cents–a couple dollars).

**C. Start your Codex session** in the project folder:
```powershell
cd "C:\Users\Radhika Audichya\Documents\agentic_ai\haqsetu"
codex
```

> After the build, run `/feedback` in this session and copy the **Session ID** into your Devpost submission.

---

## Phase 1 — Scaffold + the vertical slice (ONE scheme, end-to-end)

> Goal: prove the whole pipeline on a single scheme before adding breadth.

**Paste to Codex:**
```
Read PROBLEM_STATEMENT.md and ARCHITECTURE.md in this folder — follow them exactly.

Scaffold a Node.js + TypeScript project for HaqSetu:
- package.json with: typescript, tsx, express, zod, dotenv, and the official openai SDK.
- The folder structure from ARCHITECTURE.md §6 (server/, schemes/, forms/, web/, test/).
- A .env.example with OPENAI_API_KEY=.
- A GPT-5.6 client wrapper in server/llm/ that calls the Responses API, reads the key from .env, and defaults to the gpt-5.6 "terra" tier with configurable reasoning effort.
- Implement the data types from ARCHITECTURE.md §3 (CitizenProfile, Fact, Scheme, EntitlementVerdict, FilledForm, ClaimDossier) in server/types.ts using zod schemas.

Then create ONE scheme file schemes/widow_pension.json using the example in ARCHITECTURE.md §3.2.

Add a deterministic rules evaluator in server/engine/evaluate.ts:
- evaluateRule(fact, op, value) supporting: equals, not_equals, lte, gte, lt, gt, in, exists.
- evaluateScheme(profile, scheme) returning an EntitlementVerdict where the pass/fail is computed ONLY by code (never by the model), with matched_rules / failed_rules / missing_facts populated.

Write a unit test in test/ that feeds a sample widow profile and asserts the verdict is "eligible" with the right matched_rules, and a second profile that should be "missing_info". Give me a command to run the tests.

```

**You should end with:** a project that installs, and a passing test proving the deterministic core works. **Commit.**

---

## Phase 2 — Intake agent (voice/text → profile)

**Paste to Codex:**
```
Follow ARCHITECTURE.md §4 (agent 1) and §3.1.

Build server/agents/intake.ts:
- A function buildProfileFromText(transcript: string, language: string): extracts CitizenProfile facts from a free-text description using GPT-5.6 structured output. Every extracted fact must include provenance {source:"voice", utterance} and a confidence.
- It must NOT invent facts; unknown fields stay undefined.

Add a POST /intake endpoint in server/index.ts that takes {transcript, language} and returns the CitizenProfile.

For now use text input (we add real speech in Phase 6). Add a test with a Hindi transcript like "मैं विधवा हूँ, मेरे दो बच्चे हैं, मेरी सालाना आय पचास हज़ार है" and show the extracted profile.
```

**Commit.**

---

## Phase 3 — Entitlement engine (the flagship: concurrent multi-agent)

**Paste to Codex:**
```
Follow ARCHITECTURE.md §4 (agent 3), §5, and the core principle in §1.

Add 4 more scheme JSON files to schemes/ (girl_child_scholarship, food_security_nfsa, old_age_pension, mgnrega_jobcard) using realistic, clearly-labeled DEMO eligibility rules in the same format as widow_pension.json.

Build server/agents/entitlement.ts:
- runEntitlementEngine(profile): loads ALL schemes and evaluates them CONCURRENTLY using GPT-5.6 multi-agent orchestration (one agent per scheme).
- Each scheme-agent's job: map/normalize the profile's messy facts into the typed fields the scheme's rules need, then call the DETERMINISTIC evaluateScheme() from engine/evaluate.ts to get the verdict, then write the plain-language "why" (matched_rules explanations) in the user's language.
- IMPORTANT: the eligible/not decision comes from evaluateScheme() (code), never from the model. Missing fact => status "missing_info".
- Returns EntitlementVerdict[] sorted eligible-first.

Add POST /entitlements {profile} -> verdicts. Add a test: a widow+2kids+low-income profile should return widow_pension and girl_child_scholarship as eligible.
```

**This is your "built with GPT‑5.6" hero.** **Commit.**

---

## Phase 4 — Action builder (fill the real PDF — the artifact)

**Paste to Codex:**
```
Follow ARCHITECTURE.md §4 (agent 4) and §3.4.

Put a simple fillable PDF (or generate one) at forms/widow_pension.pdf with fields matching the "form.fields" in widow_pension.json. Use pdf-lib.

Build server/agents/action.ts using GPT-5.6 programmatic tool calling:
- buildActions(profile, eligibleVerdicts): for each eligible scheme with a form template, map each profile fact to its pdf_field and fill the PDF, producing a FilledForm where EVERY field carries its provenance.
- Also assemble the required-documents checklist and the where/deadline from the scheme.
- If a required field has no matching fact, leave it blank and add it to a "needs_info" list (do NOT invent values).

Add POST /dossier {profile} that runs intake->entitlement->action and returns a full ClaimDossier with a downloadable filled PDF for the widow pension. Give me a curl command to test it.
```

**You now have the end-to-end artifact.** **Commit.**

---

## Phase 5 — Document decoder (the Kaagaz half) + Verifier

**Paste to Codex:**
```
Follow ARCHITECTURE.md §4 (agents 2 and 5), §3.3, and §9.

Build server/agents/decoder.ts using GPT-5.6 vision:
- decodeDocument(imageBase64, language): returns a DecodedDocument (doc_type, plain-language summary in the user's language, deadline if present, risk_or_opportunity, and extracted_facts to merge into the profile). Must stay grounded in the image; if unreadable, say so — never invent.

Build server/engine/verifier.ts:
- verifyDossier(dossier): drops/flags any entitlement whose matched_rules aren't backed by real facts, and any filled field lacking provenance. Marks unverifiable items as "needs info". This runs AFTER the agents, BEFORE returning.

Wire decoder into POST /dossier (accept optional document image) and run verifyDossier() as the final gate. Add a test that a decoded income certificate merges an income fact into the profile and unlocks/blocks a scheme correctly.
```

**Commit.**

---

## Phase 6 — Frontend + polish (this wins the Design score — spend real time here)

**Paste to Codex:**
```
Follow the PROBLEM_STATEMENT.md audience (low-literacy, rural). Build the React app in web/:

- A phone-sized, high-contrast, icon-driven UI. Big 🎤 mic button and 📷 upload button on the home screen. Minimal text.
- Use the browser SpeechRecognition API for voice input and SpeechSynthesis to READ the results aloud (accessibility for non-readers). Language selector: Hindi + one regional language.
- The Claim Dossier screen with three clear sections from ARCHITECTURE.md §6/§3.4: "What your paper means", "What you can claim" (each card shows the cited WHY), and "Your ready paperwork" (download the filled PDF).
- Every entitlement card visibly shows the matched rule ("Why: you are a widow ✓"). Items the Verifier couldn't confirm show a clear "Needs info" state — this is a feature, show it proudly.
- Connect to the backend endpoints. Make it feel finished, not a prototype.
```

**Commit.**

---

## Phase 7 — Ship (README, demo, submission)

**Paste to Codex:**
```
Write README.md for HaqSetu:
- What it is and the problem (pull from PROBLEM_STATEMENT.md, in my own voice — keep it human, judges dislike AI-written descriptions).
- Setup + run instructions (install, .env, npm run dev), with sample inputs so a judge can test without rebuilding.
- A clear section: "How we used Codex and GPT-5.6" — where Codex accelerated the build, where I made the key product/engineering decisions, and exactly which GPT-5.6 features power which agent (map from ARCHITECTURE.md §7).
- Note the demo scheme rules are representative, and that production would load official rules.
```

**Then, by hand (not AI — rules require your own voice for the description):**
- [ ] Record the <3-min demo video → the hero moment: **a spoken Hindi sentence becomes a filled government form on screen.** Narrate how you used Codex + GPT‑5.6.
- [ ] Upload to YouTube (public).
- [ ] In your Codex session, run `/feedback`, copy the **Session ID**.
- [ ] Push the repo (public, or share with testing@devpost.com + build-week-event@openai.com if private).
- [ ] Fill the Devpost submission; pick the category (**Apps for Your Life**).

---

## The demo script (memorize the 3 beats)

| Beat | On screen | Say |


|---|---|---|
| **1. The gap** | Sunita speaks: "I'm a widow, two kids, income ₹50k" | "She's owed three benefits. She's getting none — because she can't read the forms." |
| **2. The bridge** | Dossier fills in: 3 entitlements, each with a cited "why", + a filled widow-pension PDF | "HaqSetu found them, proved *why* she qualifies, and filled the form — powered by GPT‑5.6 running one agent per scheme in parallel." |
| **3. The proof** | Photograph a document → meaning + deadline appears; the Verifier marks one item "needs info" | "It reads her actual papers, and it never guesses — anything it can't verify, it says so. Built end-to-end with Codex." |

---

## If you get stuck

- **Codex CLI won't install:** use the VS Code Codex extension instead; the build steps are identical.
- **No API key / cost worry:** demo usage is tiny; a $5 top-up is plenty. Use the Terra tier (cheapest capable) for everything except the entitlement engine.
- **Speech flaky in the demo:** keep a typed-transcript fallback path and pre-record the clean run as backup.
- **Running out of time:** Phases 1→4 alone (voice → entitlements → filled form) is already a complete, winning demo. Document decoder (Phase 5) and the second language are the enhancers.
