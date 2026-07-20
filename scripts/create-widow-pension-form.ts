import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve(process.cwd(), "forms/widow_pension.pdf");
await mkdir(path.dirname(output), { recursive: true });
const pdf = await PDFDocument.create();
const page = pdf.addPage([595, 842]);
const font = await pdf.embedFont(StandardFonts.Helvetica);
page.drawText("HaqSetu Demo - Widow Pension Application", { x: 55, y: 780, size: 18, font, color: rgb(0.08, 0.2, 0.42) });
page.drawText("Representative demo form. Production uses the authority's official form.", { x: 55, y: 752, size: 10, font });
const form = pdf.getForm();
for (const [label, name, y] of [["Applicant name", "applicant_name", 670], ["Age", "age", 600], ["Annual income (INR)", "annual_income", 530]] as const) {
  page.drawText(label, { x: 55, y: y + 8, size: 12, font });
  form.createTextField(name).addToPage(page, { x: 245, y, width: 280, height: 28, borderColor: rgb(0.35, 0.45, 0.6), borderWidth: 1 });
}
page.drawText("All populated fields cite a verified profile fact.", { x: 55, y: 90, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
await writeFile(output, await pdf.save());
