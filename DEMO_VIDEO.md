# 🎬 HaqSetu — Demo Video Script (read this while recording)

**Target length: 2 min 45 sec (hard limit 3:00).** Judges stop watching at 3:00.
**Narrate in English** (so judges can read the cited rules), but **keep the app in Hindi**
for the opening so it feels real, then switch to English for the walkthrough.

---

## 🎯 THE PROBLEM, THE PROBLEM STATEMENT & THE SOLUTION (explain this in the video)

> Read/adapt this so the judges understand **exactly** what you're solving and why it matters,
> before you show the app. The condensed spoken version is at the end of this section.

### A) The problem (the reality on the ground)
In India, hundreds of millions of low-income and rural people are **legally entitled** to real,
budgeted money and services — widow pensions, girl-child scholarships, food rations, old-age
pensions, wage-guarantee work. The money exists. It is set aside for them by law. And every year,
an enormous share of it is **never claimed** — not because people don't qualify, but because the
benefit reaches them as an **intimidating form, in a language that isn't theirs, behind a process
no one ever explained.**

For the poorest person, claiming a benefit demands the three things they are *least* equipped to do:
1. **Know it exists** — out of hundreds of overlapping central, state, and local schemes.
2. **Prove they qualify** — decode dense eligibility rules and gather the right documents.
3. **File it correctly** — the right form, the right office, the right way, before the deadline.

Because they often **cannot read the paper in front of them**, one of two unjust things happens:
- They **silently lose** what they're owed — the money is budgeted and simply never reaches them, or
- They **pay a middleman** (a *dalal*) a cut of their own entitlement to read and file for them —
  turning a right into a bribe, and routinely getting defrauded.

### B) The problem statement (one sentence — this is the anchor)
> **For hundreds of millions of low-income and rural people, the money and services they are legally
> entitled to are locked behind paperwork they cannot read and processes they cannot navigate — so
> they either silently lose what they're owed, or pay a middleman a cut of it to claim it for them.**

And the gap, stated plainly: **no tool today takes a person's *real situation* and their *real
documents*, in their *own spoken language*, and hands back a *verified list of what they can claim*
and the *completed paperwork* to claim it.** That missing bridge is what I'm building.

### C) Why everything that exists today fails this exact person
- **Government portals/apps** assume literacy, a smartphone, data, and that you already know which
  scheme to search for. Online-only forms are a wall, not a door.
- **Scheme-finder sites** give you a *list to read* — the one thing a low-literacy user can't do.
- **NGO camps** genuinely help but are human-bound; a fieldworker covers a village a week, not a state.
- **Middlemen** are effective but extract a cut and defraud people — they *are* the problem.
- **Generic AI chatbots** produce *words, not action* — they don't read your actual document, don't
  verify eligibility against real rules, don't hand back a filled form, and — most dangerously —
  they **hallucinate eligibility**, which in this domain means a wasted bus trip and humiliation.

### D) The solution I'm building — HaqSetu (*हक़ सेतु*, "the bridge to your rights")
**HaqSetu turns a spoken sentence and a photographed document — in the user's own language — into one
deliverable: the Claim Dossier.** The user just speaks, or snaps a photo of any official paper, and
HaqSetu returns three things:
1. **📄 What this paper means** — any document decoded in their language: what it is, the deadline,
   and whether it's an opportunity, a debt, or a scam.
2. **💰 What you're owed but aren't claiming** — a ranked list of every benefit they qualify for,
   each with a plain-language **"why you qualify"** that **cites the exact government rule** it matched.
3. **✅ Your ready-to-file paperwork** — the **completed official form**, a "bring these" checklist,
   and where and by when to submit.

The conversation is only the door in. **The output is a verifiable packet — that's exactly why
HaqSetu is not a chatbot.**

### E) How it works (say this to score on technical implementation)
The core design decision: **the AI lives at the edges; a deterministic rules engine lives at the core.**
- **Multimodal** — it reads the user's real documents by photo, and serves the non-literate user by voice.
- **Multi-agent orchestration** — it runs **one agent per scheme, concurrently** — a real parallel system.
- **Programmatic tool calling** — the model *selects* which form fields have a backing fact; **code**
  fills the value. The model can never invent one.
- **The Verifier (the moat)** — before anything reaches the user, every entitlement must cite the
  **rule** it matched and every filled field must cite the **fact** it came from. **No rule → no claim.
  No fact → no field.** It is structurally impossible for HaqSetu to hallucinate that you qualify.

### F) Why it matters (the stakes)
This isn't a convenience app. For these families, an unclaimed ₹1,000 pension or a missed scholarship
is the difference between eating and not, between a child staying in school and dropping out.
**North Star: no one should lose what they are legally owed simply because they cannot read a form.**

---

### 🎙️ Detailed spoken version (read this aloud — ~60–75 seconds)

> Use this as an extended opening if you want the problem explained in full before the live demo.
> If you're tight on time, use the shorter Beat 1 in PART 2 instead.

"In India, hundreds of millions of poor and rural people are legally owed real money and services —
pensions, scholarships, food rations, wage work. The money is budgeted. It's theirs by law. But every
year, a huge share of it is never claimed — not because they don't qualify, but because it arrives as
a form they cannot read, in a language that isn't theirs, behind a process no one explained.

So one of two unfair things happens. Either they silently lose what they're owed — or they pay a
middleman a cut of their own entitlement just to read and file the paperwork for them. A right becomes
a bribe the moment someone else has to read the paper for you.

I'm building HaqSetu — the bridge to your rights. You just speak your situation, or photograph any
official document, in your own language. HaqSetu decodes the paper, finds every benefit you qualify
for — citing the exact government rule for each one — and fills your real forms, ready to file.

And it never guesses. Eligibility is decided by a deterministic rules engine, not the AI, and a
verifier drops anything it can't back with a real rule and a real fact. No rule, no claim. No fact,
no field. That's why HaqSetu isn't a chatbot — it hands you a verified, filled, ready-to-submit
packet. Let me show you."

*(Then go straight into the live demo — Beats 2–4 in PART 2.)*

---

## ✅ PART 0 — Pre-flight checklist (do ALL of this before you hit record)

- [ ] **OpenAI credits added** and the smoke test returns a real dossier (not a 429 error).
- [ ] **Backend running** — Terminal 1: `npm run dev` → shows `HaqSetu listening on http://localhost:3000`
- [ ] **Frontend running** — Terminal 2: `npm run web` → open **http://localhost:5173**
- [ ] **Do ONE full dry run** end-to-end so you know exactly what the dossier shows. Note which cards appear (widow pension should be ✅ eligible with a filled form).
- [ ] Have **one document photo** ready on your desktop (an income certificate, a govt notice — anything official-looking).
- [ ] Browser in **full screen** (F11), bookmarks bar hidden, other tabs closed, notifications silenced (Focus Assist ON).
- [ ] Zoom the browser to ~110–125% (`Ctrl` + `+`) so the phone-sized UI fills the frame nicely.
- [ ] Make 2 simple slides in PowerPoint/Canva (see PART 5) for the open and close.

---

## 🎥 PART 1 — Recording setup

- **Recorder:** Press `Win + G` (Xbox Game Bar) → click record. *Or* install **OBS Studio** (free, sharper).
- **Record:** the browser window only, **1080p**, with your **microphone ON**.
- **Audio:** quiet room, speak slightly slower than feels natural. Smile while talking — it carries.
- Record the whole thing **twice**, keep the cleaner take. Don't try to be perfect in one go.

---

## 🎙️ PART 2 — The screen-by-screen script

> **How to read this table:** the middle column is *what you click / show*, the right column is
> *the exact words to say*. Say the words in the right column verbatim.

### BEAT 1 — The human (0:00–0:20) · SLIDE, not the app
| Show on screen | Say (verbatim) |
|---|---|
| **Slide 1**: a photo/illustration of a rural woman, and big text: **"₹34,000 owed. ₹0 received."** | "This is Sunita. A widow, two children, no land. Every year the government owes her about thirty-four thousand rupees — a pension, a scholarship, subsidised rations. She receives none of it. Not because she doesn't qualify — because it arrives as forms she cannot read." |

### BEAT 2 — The magic, live (0:20–1:05) · THE APP
| Show on screen | Say (verbatim) |
|---|---|
| Cut to **http://localhost:5173**, language set to **हिन्दी**. Slowly move the mouse to the **✨ सुनीता का उदाहरण आज़माएँ** ("Try Sunita's example") button and **click it** — the Hindi sentence fills the box. | "Sunita just speaks, in her own language." |
| Click the big **मेरे हक़ दिखाइए** ("Show my rights") button. The **loading screen** appears and the four stages light up one by one. | "One sentence in. Now watch — HaqSetu understands her, finds the benefits she qualifies for, fills her forms, and checks every claim against the actual rule. This is one AI agent per scheme, running on GPT-5.6." |
| The **dossier** appears. (Optional: click the **English** language pill so the cards become readable for judges.) | "And here it is — everything she's owed, in seconds." |

### BEAT 3 — The proof / your moat (1:05–1:50) · THE APP
| Show on screen | Say (verbatim) |
|---|---|
| Scroll to the **💰 What you can claim** section. Hover over the **Widow Pension** card — point at the green **✅ You qualify** tag and the **✓ Why** lines. | "It doesn't just say 'you might be eligible.' For every benefit it shows *why* — here: she's a widow, she's over eighteen, her income is under the limit, she's a resident." |
| Point at the **📖 Rule source: SSPY — Govt. of Uttar Pradesh** link under the card. | "And it cites the actual government rule it matched — this links to the real Uttar Pradesh pension portal. No citation, no claim." |
| Scroll to the **✅ Your ready paperwork** section. Point at the filled fields, then click **⬇ Download the filled form** and open the PDF to show it's really filled. | "Then it fills her real widow-pension form, field by field — her name, her age, her income. This isn't advice. It's filed-ready paperwork." |

### BEAT 4 — Reads any paper + never guesses (1:50–2:25) · THE APP
| Show on screen | Say (verbatim) |
|---|---|
| Click **Start over**, then click **📷 Add photo** and upload your document image. Click **Show my rights**. When the dossier returns, scroll to the top **📄 What your paper means** section showing the decoded summary + deadline badge + risk chip. | *(see the two narration options below — pick the one that matches what your document shows)* |
| Point at any card marked **❓ Needs more info**. | "And when it can't verify something, it says so — it marks it 'needs info' instead of guessing. In a village, a wrong 'you qualify' means a wasted bus trip and humiliation. So it never guesses." |

**Narration for the photo — pick ONE (check your dry run first):**
- **If the chip is blue/orange (a useful document):** "Photograph any official paper and it's decoded in her language — what it means, and the deadline. Here it read her income certificate and pulled the number straight onto her form."
- **If the chip is red/warning (a risky document):** "Photograph any paper and it tells her the truth — this one it flagged as a warning. If a middleman hands her a fake receipt or a predatory loan, she finds out instantly."

### BEAT 5 — The close (2:25–2:45) · SLIDE
| Show on screen | Say (verbatim) |
|---|---|
| **Slide 2**: black background, white text: **"A right becomes a bribe the moment someone else has to read the paper for you."** then fade to **"HaqSetu — the bridge to your rights."** | "A right becomes a bribe the moment someone else has to read the paper for you. HaqSetu is the bridge — from a paper she can't read, to the rights she's owed. Built with Codex and GPT-5.6. Thank you." |

---

## 🗣️ PART 3 — Clean narration script (copy this, read it aloud)

> This is the whole voiceover in one block — practice reading it 2–3 times before recording.

"This is Sunita. A widow, two children, no land. Every year the government owes her about thirty-four thousand rupees — a pension, a scholarship, subsidised rations. She receives none of it. Not because she doesn't qualify — because it arrives as forms she cannot read.

Sunita just speaks, in her own language. One sentence in. Now watch — HaqSetu understands her, finds the benefits she qualifies for, fills her forms, and checks every claim against the actual rule. This is one AI agent per scheme, running on GPT-5.6. And here it is — everything she's owed, in seconds.

It doesn't just say 'you might be eligible.' For every benefit it shows why — she's a widow, she's over eighteen, her income is under the limit, she's a resident. And it cites the actual government rule it matched — this links to the real Uttar Pradesh pension portal. No citation, no claim. Then it fills her real widow-pension form, field by field. This isn't advice. It's filed-ready paperwork.

Photograph any official paper and it's decoded in her language — what it means, and the deadline. And when it can't verify something, it says so — it marks it 'needs info' instead of guessing. In a village, a wrong 'you qualify' means a wasted bus trip. So it never guesses.

A right becomes a bribe the moment someone else has to read the paper for you. HaqSetu is the bridge — from a paper she can't read, to the rights she's owed. Built with Codex and GPT-5.6. Thank you."

---

## 🎨 PART 4 — The 2 slides you need

**Slide 1 (opening):** a rural-woman photo or simple illustration + huge text **"₹34,000 owed. ₹0 received."** Underneath, small: *HaqSetu — हक़ सेतु*.

**Slide 2 (closing):** black background. Line 1 (fades in): *"A right becomes a bribe the moment someone else has to read the paper for you."* Line 2 (fades in after): **HaqSetu — the bridge to your rights.** Tiny footer: *Built with Codex + GPT-5.6.*

Make them in Canva or PowerPoint, export as images, and either show them full-screen while recording or splice them in during editing.

---

## ⭐ PART 5 — Optional killer beat (only if you have time): "watch it refuse to lie"

If you can, add a 15-second beat between Beat 3 and Beat 4:
- Type a transcript that *should* fail one rule (e.g. income above the limit).
- Submit, and show the card land on **❓ Needs more info / Not eligible** instead of approving.
- Say: "Watch me try to make it approve someone who doesn't qualify. It won't. The eligibility decision is code, not the model — so it structurally cannot hallucinate a 'yes.'"

This is the single most memorable beat for technical judges. Add it if your dry run leaves room under 3:00.

---

## 🚫 PART 6 — Do's and don'ts

**DO**
- Lead with Sunita, not the tech. Emotion first.
- Show the **cited rule** and the **downloaded PDF** clearly — those are your proof.
- Keep the mouse slow and deliberate; pause on the thing you're describing.
- Say **"GPT-5.6"** and **"Codex"** out loud at least once each (judging criterion #1).

**DON'T**
- Don't use the live microphone in the recording — click **Try Sunita's example** instead (browser speech is flaky on camera).
- Don't read the architecture or explain the code. Show outcomes.
- Don't go over 3:00. Cut Beat 4's photo or Part 5 if you're tight.
- Don't show any terminal, error screen, or your API key.

---

## 📤 PART 7 — After recording

1. Trim to **under 3:00**. Cut dead air at the start/end.
2. Upload to **YouTube** set to **Public** (or Unlisted if the rules allow — check Devpost).
3. Title: **"HaqSetu — from a paper you can't read to the rights you're owed (Built with Codex + GPT-5.6)"**.
4. Paste the link into your Devpost submission.
5. Also grab a **screenshot of the filled dossier** for the README hero image and the Devpost gallery.

---

**Remember:** open on the human, prove with the cited rule + filled form, close on the North Star line. That arc wins the room.
