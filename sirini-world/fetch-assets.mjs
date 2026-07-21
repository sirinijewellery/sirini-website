// Download the Sirini world imagery from the live site's Cloudinary account.
// Every jewellery photograph is a REAL product photo from sirinijewellery.com
// (chosen from the production catalogue), delivered portrait 500x600 via
// Cloudinary transforms. Rerunnable. Requires scratch dump images.json
// (product name/price -> image URL) produced from the production DB, or falls
// back to the hardcoded URLs below.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'assets', 'web');
mkdirSync(outDir, { recursive: true });

const DUMP = 'C:/Users/Owner/AppData/Local/Temp/claude/D--Owner-Desktop-Sirini-Website/71fe944d-fe60-434d-bcf1-2c7e1a573a68/scratchpad/images.json';
const TRANSFORM = 'c_fill,g_auto,w_500,h_600,q_82,f_jpg';
const norm = (s) => s.replace(/\s+/g, ' ').replace(/–/g, '-').trim().toLowerCase();

// slug -> product (name, price) in the production catalogue
const PRODUCT_PICKS = [
  ['maang-tikka',        'Floral Kundan Maang Tikka With Ruby Bead Hanging | Antique Gold Finish', 1800],
  ['chandbali',          'Navratri Kundan Chandbali Earrings', 1350],
  ['meenakari-jhumki',   'Diwali Meenakari Jhumkis', 750],
  ['bridal-kundan-set',  'Bridal Carat Plating Kundan Set', 9000],
  ['royal-heritage-set', 'Royal Heritage Necklace Set', 6400],
  ['dulhan-long-haar',   'Dulhan Antique Kundan Long Haar', 12050],
  ['kundan-bangles',     'Festive Kundan Bangles', 4500],
  ['peacock-kada',       'Peacock Charm Statement Kada', 2100],
  ['kundan-ring',        'Festive Kundan Ring', 450],
  ['kundan-payal',       'Festive Kundan Payal', 4750],
  ['groom-mala',         'Classic Pearl Groom Mala', 5300],
  ['kundan-haar',        'Shimmering Kundan Haar Set', 12000],
  // editorial extras (model / campaign shots)
  ['white-statement',    'Elegant White Statement Set', 4500],
  ['polki-set',          'Navratri Mehendi Plated Polki Necklace Set', 4200],
  ['green-long-haar',    'Bridal Kundan Long Haar - Green', 13550],
];

// brand imagery straight from the site (about page, homepage story)
const BRAND_FIXED = [
  ['editorial-hero',   'https://res.cloudinary.com/dp8a2lvxg/image/upload/v1782829737/sirini-jewellery/brand/hero-editorial-3.png'],
  ['artisan-craft',    'https://res.cloudinary.com/dp8a2lvxg/image/upload/v1779798780/sirini-jewellery/brand/artisan-craft.jpg'],
  ['artisan-workshop', 'https://res.cloudinary.com/dp8a2lvxg/image/upload/v1779797844/sirini-jewellery/brand/artisan-workshop.jpg'],
];

const dump = JSON.parse(readFileSync(DUMP, 'utf8'));
const jobs = [];
const report = [];

for (const [slug, name, price] of PRODUCT_PICKS) {
  const p = dump.products.find((x) => norm(x.name) === norm(name) && x.price === price);
  if (!p) { console.warn(`[assets] MISSING product: ${name} (${price})`); continue; }
  const src = Array.isArray(p.images) ? p.images[0] : null;
  if (!src) { console.warn(`[assets] product has no image: ${name}`); continue; }
  jobs.push([slug, src.replace('/upload/', `/upload/${TRANSFORM}/`), { site: `https://sirinijewellery.com/shop/${p.slug}`, price: p.price, name: p.name.replace(/\s+/g, ' ').trim() }]);
}
for (const [slug, url] of BRAND_FIXED) {
  jobs.push([slug, url.replace('/upload/', `/upload/${TRANSFORM}/`), null]);
}

for (const [slug, url, meta] of jobs) {
  const res = await fetch(url);
  if (!res.ok) { console.warn(`[assets] fetch failed ${res.status}: ${slug}`); continue; }
  const bin = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(outDir, `${slug}.jpg`), bin);
  report.push({ slug, kb: Math.round(bin.length / 1024), ...(meta ?? {}) });
}

// Logo: resize the storefront logo.png (gold wordmark on transparency) with
// the main project's sharp so the veil/HUD copy stays crisp but small.
try {
  const require = createRequire('D:/Owner/Desktop/Sirini_Website/package.json');
  const sharp = require('sharp');
  const logoSrc = 'D:/Owner/Desktop/Sirini_Website/public/logo.png';
  if (existsSync(logoSrc)) {
    const buf = await sharp(logoSrc).resize({ width: 440 }).png({ compressionLevel: 9, palette: true }).toBuffer();
    writeFileSync(join(outDir, 'logo.png'), buf);
    report.push({ slug: 'logo', kb: Math.round(buf.length / 1024) });
  }
} catch (e) {
  console.warn('[assets] logo resize skipped:', e.message);
}

console.log(JSON.stringify(report, null, 1));
