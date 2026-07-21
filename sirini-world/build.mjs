// Assemble dist/Sirini_World.html — one self-contained file, zero runtime requests.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), 'utf8');
const readBin = (p) => readFileSync(join(here, p));

// Guard: a literal "</script" inside an inline script closes the tag early.
const safeJS = (code, label) => {
  if (code.includes('</script')) {
    console.warn(`[build] escaping </script occurrences in ${label}`);
    return code.replace(/<\/script/g, '<\\/script');
  }
  return code;
};

let html = read('src/template.html');
const css = read('src/style.css');
const three = read('vendor/three-0.147.0.min.js');
const main = read('src/main.js');

// Fonts → @font-face with data URIs (latin subsets only)
let fontCss = '';
try {
  const manifest = JSON.parse(read('vendor/fonts/manifest.json'));
  for (const f of manifest) {
    const b64 = readBin(join('vendor/fonts', f.file)).toString('base64');
    fontCss += `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2013-2014,U+2018-2019,U+201C-201D,U+2022,U+2026;}\n`;
  }
} catch (e) {
  console.warn('[build] fonts unavailable, shipping system-serif fallback:', e.message);
}

// Images → SIRINI_ASSETS map (jpg + png, correct MIME per extension)
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const imgDir = join(here, 'assets', 'web');
const assets = {};
for (const file of readdirSync(imgDir).sort()) {
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
  const mime = MIME[ext];
  if (!mime) continue;
  const slug = file.slice(0, file.lastIndexOf('.'));
  assets[slug] = `data:${mime};base64,${readBin(join('assets/web', file)).toString('base64')}`;
}
const assetJs = `window.SIRINI_ASSETS=${JSON.stringify(assets)};`;

html = html
  .replace('<!--INLINE:FONTS-->', `<style>\n${fontCss}</style>`)
  .replace('<!--INLINE:CSS-->', `<style>\n${css}\n</style>`)
  .replace('<!--INLINE:THREE-->', `<script>\n${safeJS(three, 'three')}\n</script>`)
  .replace('<!--INLINE:ASSETS-->', `<script>${safeJS(assetJs, 'assets')}</script>`)
  .replace('<!--INLINE:MAIN-->', `<script>\n${safeJS(main, 'main')}\n</script>`);

for (const marker of html.match(/<!--INLINE:[A-Z]+-->/g) ?? []) {
  throw new Error(`unresolved marker ${marker}`);
}

mkdirSync(join(here, 'dist'), { recursive: true });
const out = join(here, 'dist', 'Sirini_World.html');
writeFileSync(out, html);
console.log(`[build] dist/Sirini_World.html — ${(html.length / 1024 / 1024).toFixed(2)} MB, ${Object.keys(assets).length} images inlined`);
