import assert from "node:assert/strict";
import test from "node:test";
import { createCanvas } from "@napi-rs/canvas";
import { readResumePdf } from "./resume-pdf";

const ascii = (value: string) => Buffer.from(value, "ascii");
function makePdf(objects: Array<string | Buffer>): Buffer {
  const chunks = [ascii("%PDF-1.4\n")];
  const offsets: number[] = [];
  let size = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(size);
    const chunk = Buffer.concat([
      ascii(`${index + 1} 0 obj\n`),
      Buffer.isBuffer(object) ? object : ascii(object),
      ascii("\nendobj\n"),
    ]);
    chunks.push(chunk);
    size += chunk.length;
  });
  chunks.push(ascii(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${size}\n%%EOF`));
  return Buffer.concat(chunks);
}
const catalog = "<< /Type /Catalog /Pages 2 0 R >>";
const pages = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
const stream = (content: string) => `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;

test("reads a searchable PDF using the intact PDF worker", async () => {
  const content = "BT /F1 16 Tf 50 740 Td (Sample Candidate - Software Engineering Student - React and TypeScript) Tj ET";
  const pdf = makePdf([
    catalog, pages,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    stream(content),
  ]);
  const result = await readResumePdf(pdf);
  assert.equal(result.usedOcr, false);
  assert.match(result.text, /React and TypeScript/);
});

// Opt-in because this uses the configured, billed AI provider. All text is synthetic.
test("transcribes an image-only PDF server-side", { skip: process.env.RUN_RESUME_OCR_TEST !== "1" }, async () => {
  const canvas = createCanvas(900, 1200);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, 900, 1200);
  context.fillStyle = "#000";
  context.font = "32px sans-serif";
  ["SAMPLE CANDIDATE", "Software Engineering Student", "Skills: React, TypeScript, CSS", "Projects: Built an accessible study planner."].forEach((text, i) => context.fillText(text, 50, 100 + i * 70));
  const image = canvas.toBuffer("image/jpeg", 90);
  const pdf = makePdf([
    catalog, pages,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>",
    Buffer.concat([ascii(`<< /Type /XObject /Subtype /Image /Width 900 /Height 1200 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`), image, ascii("\nendstream")]),
    stream("q 612 0 0 792 0 0 cm /Im1 Do Q"),
  ]);
  const result = await readResumePdf(pdf);
  assert.equal(result.usedOcr, true);
  assert.match(result.text, /React/);
  assert.match(result.text, /TypeScript/);
});
