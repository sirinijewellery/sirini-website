// Extract embedded JPEG (DCTDecode) images from a PDF — zero dependencies.
// JPEG streams are stored verbatim in the PDF; we locate stream objects whose
// dictionary mentions /DCTDecode and dump the bytes between stream/endstream.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pdfPath = process.argv[2];
const outDir = join(here, 'assets', 'raw');
mkdirSync(outDir, { recursive: true });

const buf = readFileSync(pdfPath);
const latin = buf.toString('latin1');

const results = [];
let count = 0;
const re = /stream(\r\n|\n|\r)/g;
let m;
while ((m = re.exec(latin)) !== null) {
  const dictWindow = latin.slice(Math.max(0, m.index - 1500), m.index);
  const dictStart = dictWindow.lastIndexOf('<<');
  if (dictStart < 0) continue;
  const dict = dictWindow.slice(dictStart);
  if (!dict.includes('/DCTDecode')) continue;
  if (!dict.includes('/Image')) continue; // only image XObjects

  const dataStart = m.index + m[0].length;
  const end = latin.indexOf('endstream', dataStart);
  if (end < 0) continue;
  let data = buf.subarray(dataStart, end);
  while (data.length && (data[data.length - 1] === 0x0a || data[data.length - 1] === 0x0d)) {
    data = data.subarray(0, data.length - 1);
  }
  if (data[0] !== 0xff || data[1] !== 0xd8) continue; // JPEG SOI check

  const w = dict.match(/\/Width\s+(\d+)/)?.[1] ?? 'x';
  const h = dict.match(/\/Height\s+(\d+)/)?.[1] ?? 'x';
  count += 1;
  const name = `img_${String(count).padStart(2, '0')}_${w}x${h}.jpg`;
  writeFileSync(join(outDir, name), data);
  results.push({ name, w: Number(w), h: Number(h), kb: Math.round(data.length / 1024) });
}
console.log(JSON.stringify(results, null, 1));
console.log(`extracted ${count} JPEG images -> ${outDir}`);
