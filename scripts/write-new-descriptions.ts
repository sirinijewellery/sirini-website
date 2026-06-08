/**
 * write-new-descriptions.ts
 *
 * Backfills tasteful 2–3 sentence descriptions for recently-added products
 * that have a blank, very short (<40 chars), or placeholder description.
 *
 * Scope: only products whose SKU is in the known recent batches (the 22 from
 * upload-new-products.ts + the batch-2 SKUs uploaded today), OR whose
 * description is detectably weak. We never touch the original catalog's
 * well-written copy.
 *
 * Run:
 *   cd D:\Owner\Desktop\Sirini_Website
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/write-new-descriptions.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/* Previous-batch SKUs (upload-new-products.ts). These currently carry generic,
 * near-identical boilerplate copy and are the main target for a varied rewrite. */
const PREV_BATCH_SKUS = new Set([
  '10NS517', '10NS672', '10NS686', '10NS697', '10NS712', '10NS723',
  '02LG200', '02LG201', '02LG202', '05PS140', '10LG277',
  '15LG192', '15LG280', '15LG286', '15LG289', '15LG299',
  '15PS179', '15PS188', '17LG251', '17LG254', '30LG203', '30LG206', '01NS708',
]);

/* Today's batch-2 SKUs already have rich, varied copy from the upload script —
 * leave them untouched. */
const BATCH2_SKUS = new Set([
  '01NS706', '01NS707', '01NS728', '10NS415', '10NS716',
  '24NS1117', '24NS1140', '30NS695', '30NS743',
]);

/* Signatures of the generic boilerplate produced by the previous upload script.
 * Matching one of these marks a description as "generic" and eligible for rewrite. */
const GENERIC_SIGNATURES = [
  'stunning', // "Stunning long/necklace set featuring..."
  'elegant pendant set with an intricately detailed centrepiece',
];

/* Category slug → singular noun + occasion/styling detail. */
function categoryDetail(slug: string, name: string): { singular: string; detail: string } {
  const n = name.toLowerCase();
  if (slug === 'long-sets' || n.startsWith('long set')) {
    return {
      singular: 'long haram-style set',
      detail: 'Perfect for bridal wear and festive celebrations, it drapes beautifully and pairs a layered necklace with matching earrings',
    };
  }
  if (n.startsWith('pendant set')) {
    return {
      singular: 'pendant set',
      detail: 'Ideal for receptions, gifting, and dressy evenings, its detailed centrepiece and matching earrings make an effortless statement',
    };
  }
  if (slug === 'earrings' || n.startsWith('earrings')) {
    return {
      singular: 'pair of earrings',
      detail: 'Lightweight and made for all-day comfort, they add a refined sparkle to everyday and occasion looks alike',
    };
  }
  if (slug === 'bangles' || n.startsWith('bangle')) {
    return {
      singular: 'set of bangles',
      detail: 'Stackable and versatile, they bring a touch of tradition to both festive and everyday styling',
    };
  }
  if (slug === 'finger-rings' || n.startsWith('finger ring')) {
    return {
      singular: 'finger ring',
      detail: 'A dainty everyday piece that layers effortlessly and elevates any look with a quiet shine',
    };
  }
  if (slug === 'anklets' || n.startsWith('anklet')) {
    return {
      singular: 'anklet',
      detail: 'A graceful finishing touch for festive and ethnic outfits, designed to move and shimmer with you',
    };
  }
  // necklace-sets default
  return {
    singular: 'necklace set',
    detail: 'Perfect for weddings, engagements, and festive occasions, it pairs a beautifully crafted necklace with matching earrings',
  };
}

/* Varied opening templates to avoid identical copy. */
const OPENERS = [
  (mat: string, singular: string) => `A handcrafted ${mat} ${singular} from Sirini's latest collection.`,
  (mat: string, singular: string) => `This ${mat} ${singular} is one of Sirini's newest arrivals.`,
  (mat: string, singular: string) => `Meet our latest ${mat} ${singular}, freshly added to the Sirini collection.`,
  (mat: string, singular: string) => `A statement ${mat} ${singular}, crafted for the Sirini woman.`,
];

const CLOSERS = [
  'Designed in Mumbai with a focus on everyday elegance and statement shine.',
  'Thoughtfully designed in Mumbai for lasting elegance and effortless shine.',
  'Made in Mumbai, where traditional craft meets a clean, modern finish.',
  'Crafted in Mumbai to balance heritage charm with contemporary polish.',
];

function buildDescription(name: string, categorySlug: string, material: string, idx: number): string {
  const { singular, detail } = categoryDetail(categorySlug, name);
  const opener = OPENERS[idx % OPENERS.length](material, singular);
  const closer = CLOSERS[idx % CLOSERS.length];
  return `${opener} ${detail}. ${closer}`;
}

/* Is a description weak (blank / very short / placeholder)? */
function isWeak(desc: string | null | undefined): boolean {
  if (!desc) return true;
  const d = desc.trim();
  if (d.length < 40) return true;
  const lower = d.toLowerCase();
  if (lower.includes('lorem ipsum')) return true;
  if (lower === 'description' || lower === 'no description' || lower === 'n/a') return true;
  return false;
}

/* Is a description the previous batch's generic boilerplate? */
function isGeneric(desc: string | null | undefined): boolean {
  if (!desc) return false;
  const lower = desc.trim().toLowerCase();
  return GENERIC_SIGNATURES.some((sig) => lower.startsWith(sig) || lower.includes(sig));
}

async function main() {
  console.log('Sirini — backfill product descriptions\n');

  const all = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, category: true, material: true, description: true },
  });

  let updated = 0;
  let idx = 0;
  const touched: string[] = [];

  for (const p of all) {
    const weak = isWeak(p.description);
    const generic = isGeneric(p.description);
    const isPrevBatch = PREV_BATCH_SKUS.has(p.sku);
    const isBatch2 = BATCH2_SKUS.has(p.sku);

    // Batch-2 products already have rich, varied copy — never touch.
    if (isBatch2) continue;

    // Update when:
    //   - the description is weak (blank/very short/placeholder), OR
    //   - it's a previous-batch SKU still carrying generic boilerplate.
    // This deliberately leaves the original catalog's hand-written copy alone.
    const shouldUpdate = weak || (isPrevBatch && generic);
    if (!shouldUpdate) continue;

    const newDesc = buildDescription(p.name, p.category, p.material, idx);
    await prisma.product.update({ where: { id: p.id }, data: { description: newDesc } });
    updated++;
    idx++;
    touched.push(`${p.sku} — ${p.name}`);
  }

  console.log(`Updated ${updated} product description(s):`);
  touched.forEach((t) => console.log('  - ' + t));
  console.log(`\nDone. ${updated} updated out of ${all.length} total products.`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
