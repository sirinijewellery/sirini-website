// Download latin woff2 subsets for the Sirini brand fonts from Google Fonts.
// EB Garamond (display serif) + DM Sans (labels) — the same pairing the
// Sirini storefront uses. Saved into vendor/fonts/ so the build can inline
// them as base64 @font-face. If anything fails, the experience falls back
// to system serif stacks.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'vendor', 'fonts');
mkdirSync(outDir, { recursive: true });

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

const families = [
  { css: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;1,500&display=swap', tag: 'ebgaramond' },
  { css: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400&display=swap', tag: 'dmsans' },
];

const manifest = [];
for (const fam of families) {
  const res = await fetch(fam.css, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`css fetch failed ${res.status} for ${fam.tag}`);
  const css = await res.text();
  // Split into blocks; keep only the /* latin */ subsets.
  const blocks = css.split('/*').filter((b) => b.startsWith(' latin */'));
  for (const block of blocks) {
    const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    const family = block.match(/font-family:\s*'([^']+)'/)?.[1];
    const style = block.match(/font-style:\s*(\w+)/)?.[1];
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
    if (!url || !family) continue;
    const fname = `${fam.tag}-${weight}-${style}.woff2`;
    const bin = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
    writeFileSync(join(outDir, fname), bin);
    manifest.push({ file: fname, family, style, weight, kb: Math.round(bin.length / 1024) });
  }
}
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(JSON.stringify(manifest, null, 1));
