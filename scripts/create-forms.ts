import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SchemeSchema } from "../server/types.js";

/**
 * Generates one representative fillable PDF per scheme that declares a form template.
 * Each declared pdf_field becomes a real AcroForm text field so the Action Builder can
 * fill it in-memory. These are demo forms; production would load the authority's PDF.
 */
const schemesDir = path.resolve(process.cwd(), "schemes");
const label = (field: string) => field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const names = (await readdir(schemesDir)).filter((name) => name.endsWith(".json"));
for (const name of names) {
  const scheme = SchemeSchema.parse(JSON.parse(await readFile(path.join(schemesDir, name), "utf8")));
  const template = scheme.form?.template;
  if (!template || !scheme.form.fields.length) continue;

  const output = path.resolve(process.cwd(), template);
  await mkdir(path.dirname(output), { recursive: true });
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText(`HaqSetu Demo - ${scheme.name.en}`, { x: 55, y: 790, size: 17, font, color: rgb(0.08, 0.2, 0.42) });
  page.drawText("Representative demo form. Production uses the authority's official form.", { x: 55, y: 766, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

  const form = pdf.getForm();
  let y = 690;
  for (const field of scheme.form.fields) {
    page.drawText(label(field.pdf_field), { x: 55, y: y + 8, size: 12, font });
    form.createTextField(field.pdf_field).addToPage(page, { x: 245, y, width: 280, height: 28, borderColor: rgb(0.35, 0.45, 0.6), borderWidth: 1 });
    y -= 70;
  }
  page.drawText("Every populated field cites a verified profile fact (see the HaqSetu dossier).", { x: 55, y: 80, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  await writeFile(output, await pdf.save());
  console.log(`Created ${template} with ${scheme.form.fields.length} field(s).`);
}
