# HaqSetu — हक़ सेतु · "the bridge to your rights"

## 💡 Inspiration

I am building HaqSetu for the **poor people of rural areas** — the farmers,
widows, daily-wage workers, and first-generation students for whom a missed
pension or an unclaimed scholarship isn't an inconvenience, it's the difference
between eating and not, between a child staying in school and dropping out.

In India, the money and services meant for exactly these people are real,
budgeted, and waiting — pensions, scholarships, food rations, health cover,
wage guarantees. And every year, an enormous share of it is **never claimed**.

Not because people are ineligible. Because the benefit arrives as a **form they
cannot read**, in a language that isn't theirs, behind a process no one explained.

I kept coming back to one person — call her Sunita: a widow with two children and
no land, legally entitled to a widow's pension, a girl-child scholarship, and
subsidized rations. She receives **none of them**. She doesn't know the first
exists, can't read the second, and a local middleman offered to "arrange" the
third for a cut of her own entitlement.

That's the injustice that started this: **a right becomes a bribe the moment
someone else has to read the paper for you.** I didn't want to build another app
that *tells* people they "might be eligible." I wanted to build the bridge that
carries them the rest of the way — to the filled form, ready to file.

> **North Star:** *No one should lose what they are legally owed simply because
> they cannot read a form.*

## 🌉 What it does

HaqSetu turns **a spoken sentence and a photographed document — in the user's own
language** — into a single deliverable: **the Claim Dossier.**

1. **📄 "What this paper means"** — any official document the user photographs is
   decoded in their language: what it is, what it's asking, the deadline, and
   whether it's an opportunity, a debt, or a scam.
2. **💰 "What you're owed but not claiming"** — a ranked list of every benefit
   they qualify for, each with a plain-language *"why you qualify"* that cites the
   exact eligibility rule it matched.
3. **✅ "Your ready-to-file paperwork"** — the **completed official forms**, a
   *"bring these"* checklist, and where and by when to submit.

The conversation is only the door in. **The output is a verifiable packet — which
is exactly why HaqSetu is not a chatbot.**

## 🏗️ How I built it

The core design decision is architectural: **the language model lives at the
edges, and a deterministic rules engine lives at the core.** The model does what
only a model can — understand messy speech, read a creased document, explain a
rule in someone's mother tongue. It is *never* trusted to decide who is eligible.

```
 VOICE ─┐
        ├─▶ [1] INTAKE AGENT ────▶ structured citizen profile
 PHOTO ─┘         (speech + vision → facts)
                       │
              [2] DOCUMENT DECODER ── vision → meaning, deadlines, risk
                       │
              [3] ENTITLEMENT ENGINE ── one agent per scheme, concurrently,
                       │                  checked against a deterministic rule base
              [4] ACTION BUILDER ── fills the real forms, field by field
                       │
              [5] VERIFIER ── every claim cites its rule; every field cites its fact
                       ▼
                📦 THE CLAIM DOSSIER
```

**Stack:** TypeScript + Express, a multi-agent pipeline (`intake → decoder →
entitlement → action → verifier`), `pdf-lib` for filling real government form
PDFs, and `zod` schemas enforcing structured output at every model boundary so a
malformed response can never leak downstream.

**The multimodal + multi-agent + tool-calling trio** does the heavy lifting:
- **Multimodal** reads the user's actual documents by photo and handles the
  non-literate user by voice.
- **Multi-agent orchestration** fans out **one agent per scheme, concurrently** —
  a genuine parallel system, not a single mega-prompt.
- **Programmatic tool calling** drives the form-filling: the model *selects* which
  PDF fields have a backing fact, but is structurally forbidden from inventing a
  value.

### The Verifier is the moat

Every scheme \\(s\\) has a rule set \\(R_s\\), and eligibility is a **pure conjunction**
of checkable predicates over the citizen profile \\(p\\):

$$
E_s(p) = \bigwedge_{r \in R_s} r(p), \qquad r(p) \in \{\text{true}, \text{false}\}
$$

For example, an income-tested pension is simply:

$$
r_{\text{income}}(p) = \big[\, I(p) \le \tau_s \,\big]
$$

where \\(I(p)\\) is the citizen's annual income and \\(\tau_s\\) the scheme threshold.
Because these are ordinary boolean programs — not model opinions — the result is
reproducible and auditable.

The Verifier then enforces one hard invariant before anything reaches the user:

$$
\forall e \in \text{Dossier} : \operatorname{cite}(e) \neq \varnothing
$$

**No entitlement is ever shown without a matched rule; no form field is ever
filled without a source fact.** In a domain where a hallucinated "you qualify"
could send someone in a remote village to an office a bus-ride away only to be
turned away and humiliated, this isn't a nicety — it's the whole point.

### How I collaborated with Codex

I built HaqSetu with **OpenAI Codex — the CLI version — running inside VS Code,
driving the `gpt-5.6-terra` model.** Working from the terminal, Codex made me
genuinely faster: I could describe a piece of the system and watch it come
together, then iterate on it in seconds instead of hours. It scaffolded the
five-agent pipeline, generated the `zod` schemas that guard every model boundary,
wired `pdf-lib` to fill real form fields — and, importantly, **helped me write the
test cases** so I could trust the pieces as I built them. That let me build things
*well*, not just quickly.

The decisions I owned were the ones that make or break the product — **putting the
rules engine at the core instead of the model, and making the Verifier a hard gate
rather than a warning.** Codex accelerated the *how*; the *what to refuse to build*
stayed with me.

## 📚 What I learned

- **The output is the product, not the conversation.** The hardest discipline was
  resisting "just make it a chatbot." Judging every feature by *"does this get a
  real person closer to money they're owed?"* killed a lot of clever ideas and
  saved the project.
- **Trust is an architecture, not a disclaimer.** You can't *prompt* your way to
  "never hallucinate eligibility." You have to make it structurally impossible —
  which is why the rules engine and citation invariant exist.
- **Constrain the model, don't beg it.** Forcing structured output with schemas
  and using tool-calling to *select* rather than *generate* form values turned a
  flaky demo into a reliable one.
- **Depth beats breadth.** Covering 5–6 real schemes end-to-end is far more
  convincing — and honest — than claiming to cover 500.

## 🧗 Challenges I faced

- **Making hallucination impossible, not just rare.** The Verifier invariant went
  through several iterations before "no citation ⇒ not shown" became a true hard
  gate instead of a soft filter.
- **Filling *real* government PDFs.** Mapping loosely-extracted facts onto rigid,
  inconsistently-named form fields — without ever fabricating a value — was
  fiddlier than any AI part of the build.
- **Structured output under pressure.** Getting reliable, schema-valid JSON out of
  a multimodal model for every document, every time, drove the decision to
  validate at every boundary and fail loud rather than pass bad data on.
- **Language and literacy as first-class constraints, not settings.** Designing so
  the *conversation* is optional and the *dossier* is the deliverable meant
  rethinking the flow around a rural user who may not read at all and may share one
  basic smartphone for a whole household.
- **Building rigorously on a shrinking budget.** My biggest real-world constraint
  wasn't a bug — it was **API credits.** With `gpt-5.6-terra` quota running low, I
  couldn't iterate as freely as the work deserved: every test run, every document
  I wanted to try, every re-run of the pipeline cost credits I had to ration. It
  forced a discipline I didn't expect — leaning on the test cases Codex helped me
  write to catch problems *before* spending a live call, and architecting the model
  client so the provider is **switchable behind one config flag**, so the system
  could keep being built and demoed even when the primary model's quota ran dry.
  Building something this ambitious under a hard resource limit was the toughest —
  and most honest — part of the whole project.

---

> **HaqSetu** — *from paper you can't read to the rights you're owed.*
> Built for the rural poor. Not advice. Not a chatbot. **A bridge.**
