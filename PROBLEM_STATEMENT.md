# HaqSetu — Problem Statement & Project Brief
### *हक़ सेतु — "the bridge to your rights"*

> **This is the anchor document. It is locked.** Every product, design, and demo decision must trace back to the problem defined here. If a feature does not serve this problem, it does not get built. We do not re-litigate the problem — we build against it.

**Category:** OpenAI Build Week — *Apps for Your Life* (primary) / *Work & Productivity* (secondary)
**Built with:** OpenAI Codex + GPT‑5.6 (multimodal + multi‑agent orchestration + programmatic tool calling)
**Owner:** Radhika Audichya · **Status:** LOCKED · **Last updated:** 2026‑07‑20

---

## 0. The one sentence

**HaqSetu turns any official paper and a spoken conversation — in the user's own language — into a verified list of the benefits they can claim and the completed paperwork to claim them.**

## 0.1 The North Star

> *No one should lose what they are legally owed simply because they cannot read a form.*

Every decision we make is measured against one question: **does this get a real person closer to money or a service they are entitled to but not receiving?** If yes, build it. If no, cut it.

---

## 1. THE PROBLEM STATEMENT (locked)

**For hundreds of millions of low-income and rural people, the money and services they are legally entitled to — pensions, subsidies, scholarships, health coverage, food rations, housing support, wage guarantees — are locked behind paperwork they cannot read and processes they cannot navigate.**

Every interaction with the state arrives as an **intimidating document written in formal language.** Every benefit requires three things the poorest people are least equipped to do:

1. **Know it exists** — out of hundreds of overlapping central, state, and local schemes.
2. **Prove eligibility** — decode dense rules and assemble the right supporting documents.
3. **File correctly** — fill the right form, in the right way, at the right office, before the right deadline.

Because a person often **cannot read the document in front of them, does not know what they qualify for, and cannot fill the forms**, one of two things happens — both unjust:

- They **silently lose** what they are owed. The benefit exists, the money is budgeted, and it never reaches them.
- They **pay a middleman** (a *dalal*/agent) who charges a cut of their entitlement to read, fill, and file on their behalf — turning a right into a transaction, and often defrauding them.

**No tool today takes a person's *real situation* and their *real documents* and turns them — in their own spoken language — into a verified list of what they can claim and the completed paperwork to claim it.** That missing bridge is HaqSetu.

---

## 2. Why this problem is real, urgent, and worth winning on

This is not a convenience problem. It is a **dignity and survival** problem. The people affected are the ones for whom an unclaimed ₹1,000/month pension, a missed scholarship, or a wrongly-denied ration card is the difference between eating and not, between a child staying in school and dropping out.

Three forces make it worse every year, not better:

- **The state is digitizing faster than its citizens.** Portals, apps, and online-only forms assume literacy, a smartphone, data, a supported language, and the knowledge of *what to search for*. Each of these is a wall for the exact people the schemes are meant to help. Digitization without accessibility **widens** the gap.
- **Complexity compounds.** Every new scheme adds eligibility rules, documents, and deadlines. The catalog of "what you might be owed" is now beyond what any human — let alone a non-literate one — can hold in their head.
- **The middleman economy is entrenched.** Where the state is illegible, informal agents fill the gap and extract rent. The harder the paperwork, the more profitable the exploitation.

> ### ⚠️ Evidence to nail down before the pitch (do not fabricate — verify these)
> - The scale of **unclaimed welfare** in the target region (a headline currency figure the judges will remember).
> - **Rural / female adult literacy** rates in the target region (establishes who cannot read the forms).
> - The **number of active central + state schemes** (establishes the navigation impossibility).
> - A documented case of **middleman exploitation** or **wrongful denial** (one real story beats ten statistics).
>
> *These make the pitch bulletproof. Use directionally in the brief; cite precisely on stage.*

---

## 3. Who this is for (the real user, not a persona sketch)

**Primary user:** a low-income or rural adult with **limited literacy**, a **basic or shared smartphone**, and an **entitlement they are not receiving** — or an **official document they cannot act on.** They speak a regional language, not bureaucratic Hindi/English.

Concretely, three faces of the same user:

- **Sunita, 41, widow, two children, no land.** Eligible for a widow pension, a girl-child scholarship, and subsidized rations. She receives **none of them** because she doesn't know they exist and can't read the application. A local agent offered to "arrange it" for a cut.
- **Ramesh, 58, marginal farmer.** Gets a **notice** from a government office. It could be a subsidy approval or a land dispute — he cannot tell. He will lose weeks and money finding someone to read it, and may miss a deadline printed on it.
- **Meena, 19, first in her family to reach college.** A **scholarship exists** for exactly her caste, income, and course. The form is online, in English, and asks for documents no one told her to keep.

**Secondary user (a force multiplier):** the **frontline worker** — an ASHA/Anganwadi worker, NGO field volunteer, or panchayat helper — who serves dozens of Sunitas and Rameshes and needs to do it **10× faster and correctly.**

---

## 4. Why every existing solution fails this user

| Existing "solution" | Why it fails the person in Section 3 |
|---|---|
| **Government portals & apps** | Assume literacy, a personal smartphone, data, a supported language, and that you already know which scheme to search for. Online-only forms are a wall, not a door. |
| **Scheme-finder websites / PDFs** | Give you a *list to read* — the exact thing a low-literacy user can't do. They stop at "you might be eligible," never "here is your filled form." |
| **NGOs & camps** | Genuinely help, but are **human-bound and don't scale** — a fieldworker can serve a village a week, not a state a day. Coverage is a lottery of geography. |
| **Middlemen (*dalals*)** | Available and effective — but **extract a cut of the entitlement and routinely defraud** the illiterate. They are the problem, not the solution. |
| **Generic AI chatbots** | Will *talk about* schemes, but produce **words, not action.** They don't read the user's actual document, don't verify eligibility against real rules, and don't hand back a completed form. They also **hallucinate eligibility**, which is actively dangerous here. |
| **Existing eligibility services** (e.g. welfare navigators) | Do real work on *eligibility*, but are typically **text-in / literacy-assumed**, don't **decode the user's own documents by photo**, and don't **auto-generate the filled paperwork**. None fuse all three. |

**The gap, stated plainly:** every existing option stops before the finish line. They inform, or they list, or they talk — none take a real person + a real document and return a **verified, filled, ready-to-submit claim** in a language and modality the user can actually use.

---

## 5. The fusion insight (why Kaagaz + Haqdaar = one product)

The two ideas we merged are the **same problem seen from opposite directions:**

- **Kaagaz (reactive):** *"A paper was handed to me. What is it, and what do I do?"*
- **Haqdaar (proactive):** *"Given who I am, what am I owed that I'm not getting?"*

Both are the **"paperwork wall."** A poor person's entire relationship with the state is mediated by **documents they can't read** and **entitlements they can't find.** Solve one without the other and you've built half a bridge.

**Fused, they reinforce each other:**
- A **document the user photographs** is not just decoded — it becomes **evidence that unlocks eligibility.** (A ration card reveals household size; an income certificate proves a scholarship threshold; a land record establishes a subsidy category.)
- A **spoken profile** is not just an eligibility query — it tells the system **which documents to ask for and how to fill them.**

So HaqSetu is a single loop: **understand the person + their papers → determine everything they can claim → produce the filled paperwork to claim it.**

---

## 6. What HaqSetu is (and the artifact it produces)

**HaqSetu is an agentic system that converts voice + documents into a verified, actionable claim packet.** The user speaks their situation and/or snaps a photo of any official document; HaqSetu returns a single deliverable:

### 📦 The Claim Dossier (the output — this is the product)

1. **📄 "What this paper means"** — every uploaded document decoded in the user's language: what it is, what it's asking, the **deadline**, and the **risk or opportunity** it represents (an approval, a debt, a right, a scam).
2. **💰 "What you're owed but not claiming"** — a ranked list of every benefit the person qualifies for, each with a plain-language **"why you qualify"** that cites the exact eligibility rule matched.
3. **✅ "Your ready-to-file paperwork"** — the **completed official forms**, a **document checklist** ("bring these"), and **where and by when to submit** — with every filled field traceable to its source.

The user speaks or photographs; HaqSetu hands back a **dossier they can act on.** The conversation is only the door in. **The deliverable is a verifiable packet — which is precisely why HaqSetu is not a chatbot.**

---

## 7. Why HaqSetu is NOT a chatbot (the architecture is the proof)

We judge by the **output**: a chatbot produces *words in a bubble*; HaqSetu produces a **verifiable artifact and a real-world action.** The architecture enforces this — the LLM sits at the **edges** (understanding messy human input, explaining in plain language), while a **checkable rules engine sits at the core.**

```
 VOICE  ──┐
          ├─▶ [1] INTAKE AGENT ───────▶ structured citizen profile
 PHOTO ───┘        (speech + vision → facts)
                              │
                              ▼
          [2] DOCUMENT DECODER  ── vision → meaning, deadlines, risks   (Kaagaz)
                              │        + extracts profile-enriching facts
                              ▼
          [3] ENTITLEMENT ENGINE  ── concurrent agents, one per scheme, (Haqdaar)
                              │        checking the profile against a
                              │        DETERMINISTIC rules base
                              ▼
          [4] ACTION BUILDER  ── fills official forms, drafts responses,
                              │      assembles the document checklist
                              ▼
          [5] VERIFIER  ── every entitlement cites the exact rule it matched;
                              │   every filled field cites its source fact
                              ▼
                     📦  THE CLAIM DOSSIER
```

**Why this scores on "skillful, non-trivial implementation":**
- **Multi-agent orchestration (GPT‑5.6):** the entitlement engine fans out **one agent per scheme concurrently** — a real parallel system, not a single prompt.
- **Programmatic tool calling (GPT‑5.6):** the eligibility rules and form-filling run as **in-memory programs** the model writes and executes — deterministic, checkable math, not vibes.
- **Multimodal (GPT‑5.6):** vision reads the user's real documents; speech handles the non-literate user.
- **The Verifier is the moat:** because every claim cites a **rule** and every form field cites a **source fact**, HaqSetu **cannot hallucinate an entitlement** — the single most dangerous failure mode in this domain, and the thing a generic chatbot gets fatally wrong.

---

## 8. Scope — what we firmly build, and firmly refuse (v1 / demo)

Discipline is how we win. **This scope is locked.**

### ✅ We WILL (v1)
- Support **Hindi + at least one regional language**, **voice-first**, with a photo-upload path for documents.
- Cover a **small, real, high-impact set of ~5–6 schemes** in **one domain/state** (chosen for demo clarity — e.g. widow pension, girl-child scholarship, ration/food security, a health card, a wage-guarantee claim).
- Produce a **real, filled form artifact** (a downloadable/printable PDF) for at least one scheme, end-to-end.
- Show the **Verifier**: rule-citation for eligibility and source-citation for filled fields.

### ❌ We will NOT (and won't be argued into)
- ❌ Be a general chatbot, general legal advisor, or medical diagnostician.
- ❌ **Auto-submit** to any government system — HaqSetu **drafts and guides; the human submits.** (Trust, safety, and legality.)
- ❌ Claim to cover "every scheme in the country" — breadth is a lie we won't tell; depth on a few is the honest, winning demo.
- ❌ Build SMS/IVR/offline for the hackathon — we **demo as a web app that simulates the low-end channel**, and design so it *could* degrade to those later.
- ❌ Ever show an entitlement the Verifier can't back with a rule. **No unverifiable claims, ever.**

---

## 9. Novelty & defensibility (honest, so we build the right part)

**Honest prior art:** welfare-eligibility services exist (e.g. Haqdarshak in India; GetCalFresh / mRelief for SNAP in the US). "Eligibility checker" alone is **not** novel, and we will not pretend it is.

**Our defensible wedge is the fusion no one has shipped as one pipeline:**

> **document-vision decoding + voice-first, local-language intake + an agentic, verifiable entitlement engine + auto-generated, source-cited filled forms.**

- Existing tools are **text-in and literacy-assumed** → we are **voice- and photo-in, literacy-optional.**
- Existing tools **stop at "you may be eligible"** → we **finish at "here is your completed form."**
- Existing tools can **hallucinate** → our **Verifier makes every claim rule-backed and every field source-backed.**

That combination is the thing to demo, defend, and put in the video's hero moment.

---

## 10. How this maps to the 4 judging criteria (equally weighted)

| Criterion | How HaqSetu wins it |
|---|---|
| **Technological Implementation** | Genuine multi-agent orchestration + programmatic tool calling + multimodal + a deterministic rules/verifier core. The repo reads as a real system, not a wrapper. |
| **Design** | One coherent flow — *speak/snap → dossier* — with a clean, low-literacy-friendly UI. The Claim Dossier is a complete product, not a POC. (Design is where most teams lose; we spend real time here.) |
| **Potential Impact** | Among the highest-stakes real problems in the whole hackathon: unclaimed entitlements for the poorest people. Specific audience, specific pain, demonstrable fix. |
| **Quality of the Idea** | The fusion is genuinely un-shipped; the "verifiable, filled-form, voice-first bridge" reframes a known problem into a new product category. |

---

## 11. The three journeys the demo must show

1. **The proactive claim (Haqdaar half):** Sunita *speaks* her situation → HaqSetu returns **three benefits she qualifies for**, each with "why," and a **filled widow-pension form** + document checklist.
2. **The reactive decode (Kaagaz half):** Ramesh *photographs a notice* → HaqSetu tells him **what it is, the deadline, and the exact response**, and if the notice reveals a new eligibility, surfaces it.
3. **The verifier moment (the trust anchor):** on screen, an eligibility card shows the **exact rule it matched**, and a filled form field shows the **source fact it came from** — proving HaqSetu doesn't guess.

**The demo's hero 20 seconds:** a real person's spoken sentence in a regional language becomes a **printed, filled government form** — the middleman, eliminated, on camera.

---h

## 12. Risks & how we defuse them

| Risk | Mitigation |
|---|---|
| **Hallucinated eligibility (dangerous)** | The Verifier: no entitlement is shown without a matched rule; no field is filled without a source fact. This is a hard gate, not a nicety. |
| **"Isn't this just a chatbot?"** | The output is a filled form + a rule-cited dossier. Lead the demo with the *artifact*, never the conversation. |
| **Prior art (Haqdarshak etc.)** | We name it openly and demo the fusion wedge (photo + voice + filled forms + verifier) that they don't do. |
| **Scope creep / trying to cover everything** | Section 8 is locked. Depth on 5–6 schemes, not breadth on 500. |
| **Speech/vision accuracy in a regional language on a live demo** | Pre-capture a clean real run as a fallback; keep one genuinely-live path on a reliable example. |
| **Trust & legality of acting for a citizen** | We never auto-submit. We draft and guide; the human stays in control. |

---

## 13. Identity

- **Name:** **HaqSetu** (*हक़ सेतु*) — literally **"bridge to your rights."** *Haq* = right/entitlement; *Setu* = bridge.
- **Tagline:** **"From paper you can't read to the rights you're owed."**
- **The pitch, in one breath:** *"Hundreds of millions of people lose money and services they're legally entitled to because they can't read the forms. HaqSetu lets anyone speak their situation or photograph a document, and hands back — in their language — a verified list of what they can claim and the completed paperwork to claim it. Not advice. Not a chatbot. A bridge."*

---

> **This document is locked. We build against it. We do not reopen the problem — we make it true.**
