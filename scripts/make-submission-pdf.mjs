import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);

const PW = 595.28, PH = 841.89, M = 54;
const CW = PW - 2 * M;
const teal = rgb(0.06, 0.46, 0.43);
const saffron = rgb(0.92, 0.35, 0.05);
const green = rgb(0.08, 0.5, 0.24);
const ink = rgb(0.06, 0.13, 0.12);
const muted = rgb(0.36, 0.42, 0.41);
const line = rgb(0.86, 0.89, 0.89);
const gray = rgb(0.93, 0.94, 0.94);
const white = rgb(1, 1, 1);
const softwhite = rgb(0.92, 0.95, 0.94);

let page, y;
function newPage() { page = doc.addPage([PW, PH]); y = PH - M; }
newPage();

function wrap(text, f, size, maxW) {
  const words = String(text).split(/\s+/);
  const lines = []; let ln = "";
  for (const w of words) {
    const t = ln ? ln + " " + w : w;
    if (f.widthOfTextAtSize(t, size) > maxW && ln) { lines.push(ln); ln = w; }
    else ln = t;
  }
  if (ln) lines.push(ln);
  return lines;
}
function ensure(h) { if (y - h < M) newPage(); }
function para(text, { size = 10.5, f = font, color = ink, gap = 6, lh = 1.35, indent = 0 } = {}) {
  for (const l of wrap(text, f, size, CW - indent)) {
    ensure(size * lh);
    page.drawText(l, { x: M + indent, y: y - size, size, font: f, color });
    y -= size * lh;
  }
  y -= gap;
}
function heading(text) {
  ensure(30); y -= 8;
  page.drawText(text, { x: M, y: y - 13, size: 13, font: bold, color: teal });
  y -= 19;
  page.drawLine({ start: { x: M, y }, end: { x: M + CW, y }, thickness: 1, color: line });
  y -= 10;
}
function bullet(text) {
  const lines = wrap(text, font, 10.5, CW - 16);
  ensure(10.5 * 1.35 * lines.length + 4);
  page.drawText("-", { x: M + 4, y: y - 10.5, size: 10.5, font: bold, color: saffron });
  para(text, { indent: 16, gap: 4 });
}

/* ---------- Cover ---------- */
y -= 34;
page.drawText("HaqSetu", { x: M, y: y - 40, size: 44, font: bold, color: teal }); y -= 50;
page.drawText("the bridge to your rights", { x: M, y: y - 17, size: 17, font, color: saffron }); y -= 34;
para("From paper you can't read to the rights you're owed.", { size: 13, f: bold });
y -= 2;
para("HaqSetu turns a spoken sentence and a photographed document - in the user's own language - into a verified list of the benefits a person can claim and the completed paperwork to claim them.", { size: 11 });
para("Built with OpenAI Codex + GPT-5.6      |      Category: Apps for Your Life", { size: 10, f: bold, color: muted });

/* ---------- Problem ---------- */
heading("The problem");
para("In India, hundreds of millions of low-income and rural people are legally entitled to real, budgeted money and services - widow pensions, girl-child scholarships, food rations, old-age pensions, wage-guarantee work. Every year an enormous share is never claimed. Not because people are ineligible, but because the benefit arrives as a form they cannot read, in a language that isn't theirs, behind a process no one explained.");
para("Claiming a benefit demands the three things the poorest people are least equipped to do: know it exists, prove eligibility, and file correctly. So they either silently lose what they are owed, or pay a middleman a cut of their own entitlement to read and file for them - turning a right into a bribe.");
para("Meet Sunita: a widow with two children and no land, entitled to a widow's pension, a girl-child scholarship, and subsidised rations. She receives none of them - she doesn't know the first exists, can't read the second, and a middleman offered to 'arrange' the third for a cut.");

/* ---------- What it does ---------- */
heading("What HaqSetu does - the Claim Dossier");
bullet("What this paper means: any official document, photographed, decoded in the user's language - what it is, the deadline, and whether it's an opportunity, a debt, or a scam.");
bullet("What you're owed but aren't claiming: a ranked list of every benefit the person qualifies for, each with a plain-language 'why you qualify' that cites the exact government rule it matched.");
bullet("Your ready-to-file paperwork: the completed official form, a 'bring these' checklist, and where and by when to submit.");
para("The conversation is only the door in. The output is a verifiable packet - which is exactly why HaqSetu is not a chatbot.", { f: bold });

/* ---------- Architecture (own page) ---------- */
newPage();
heading("Architecture");
para("The core design decision: the language model lives at the edges, and a deterministic rules engine lives at the core. The model understands messy speech, reads creased documents, and explains rules in the user's mother tongue. It is never trusted to decide who is eligible.", { size: 10 });
y -= 6;

const cx = M + CW / 2;
const BW = 360, BH = 46, GAP = 20;
function abox(top, title, sub, fill, tcolor = white, scolor = softwhite) {
  const x = cx - BW / 2;
  page.drawRectangle({ x, y: top - BH, width: BW, height: BH, color: fill });
  page.drawText(title, { x: x + 14, y: top - 18, size: 11, font: bold, color: tcolor });
  if (sub) page.drawText(sub, { x: x + 14, y: top - 34, size: 8.5, font, color: scolor });
  return top - BH;
}
function arrow(fromY) {
  const toY = fromY - GAP;
  page.drawLine({ start: { x: cx, y: fromY }, end: { x: cx, y: toY + 1 }, thickness: 1.4, color: muted });
  page.drawLine({ start: { x: cx, y: toY + 1 }, end: { x: cx - 4, y: toY + 7 }, thickness: 1.4, color: muted });
  page.drawLine({ start: { x: cx, y: toY + 1 }, end: { x: cx + 4, y: toY + 7 }, thickness: 1.4, color: muted });
  return toY;
}
let top = y - 4;
top = arrow(abox(top, "VOICE  +  PHOTO", "in the user's own language", gray, ink, muted));
top = arrow(abox(top, "1   INTAKE", "speech / text  ->  provenance-carrying facts", teal));
top = arrow(abox(top, "2   DOCUMENT DECODER", "photo  ->  meaning, deadline, risk   (vision)", teal));
top = arrow(abox(top, "3   ENTITLEMENT ENGINE", "one agent per scheme, concurrent - code decides", teal));
top = arrow(abox(top, "4   ACTION BUILDER", "fills the real government PDF, field by field", saffron));
top = arrow(abox(top, "5   VERIFIER", "every claim cites a rule; every field a fact", green));
top = abox(top, "THE CLAIM DOSSIER", "verified, filled, ready to file", ink);
y = top - 22;
para("Model at the edges (teal): understands speech, reads documents, explains rules. Deterministic engine + Verifier at the core (green): decide eligibility and gate the output. Hard invariant: no rule -> no claim; no fact -> no field.", { size: 9.5, color: muted });

/* ---------- How it works ---------- */
heading("How it works: the multimodal + multi-agent + tool-calling trio");
bullet("Multimodal: reads the user's real documents by photo, and serves the non-literate user by voice.");
bullet("Multi-agent orchestration: one GPT-5.6 agent per scheme, running concurrently - a genuine parallel system, not one mega-prompt.");
bullet("Programmatic tool calling: the model selects which PDF fields have a backing fact; code fills the value. The model is structurally forbidden from inventing one.");

heading("The Verifier - why it cannot lie");
para("Eligibility is a pure boolean program over the citizen profile, not a model opinion - so the result is reproducible and auditable. Before anything reaches the user, the Verifier enforces one hard invariant: no entitlement is shown without a matched rule, and no form field is filled without a source fact. The widow-pension scheme uses the real eligibility rules from the Uttar Pradesh SSPY portal, and the dossier cites that source on screen.");

/* ---------- Built with ---------- */
heading("Built with Codex & GPT-5.6");
para("Built end-to-end with OpenAI Codex driving GPT-5.6. Codex scaffolded the five-agent pipeline, generated the zod schemas guarding every model boundary, wired pdf-lib to fill real forms, and wrote the test suite. GPT-5.6 capabilities used: structured output (schema-enforced JSON at every boundary), multimodal vision (document decoding), multi-agent orchestration (one agent per scheme), and programmatic tool calling (form-field selection).");
para("Stack: TypeScript, Express, React, Vite, zod, pdf-lib. 7 passing tests; strict TypeScript typecheck clean.", { f: bold, color: muted });

/* ---------- Impact ---------- */
heading("Why it matters");
para("This is not a convenience app. For these families, an unclaimed Rs. 1,000-a-month pension or a missed scholarship is the line between dignity and desperation. HaqSetu closes the gap with the one thing that scales where fieldworkers can't: an AI that reads for you, proves why you qualify, and hands you the filled paper - in your own voice, in your own language.");
para("North Star: No one should lose what they are legally owed simply because they cannot read a form.", { f: bold, color: teal });

/* ---------- Submission ---------- */
heading("Submission");
para("Code:  https://github.com/radhikaaudi/HaqSetu", { size: 10 });
para("Category:  Apps for Your Life        Built with:  OpenAI Codex + GPT-5.6", { size: 10 });
y -= 4;
para("HaqSetu - Not advice. Not a chatbot. A bridge.", { f: bold, color: saffron });

const bytes = await doc.save();
writeFileSync("HaqSetu-Submission.pdf", bytes);
console.log(`WROTE HaqSetu-Submission.pdf  |  ${doc.getPageCount()} pages  |  ${bytes.length} bytes`);
