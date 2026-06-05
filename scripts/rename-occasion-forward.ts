/**
 * Renames all 129 products to an Occasion-Forward format:
 *   [Occasion/Festival] [Craft] [Product Type]
 * e.g. "Bridal Kundan Choker Set", "Navratri Meenakari Jhumkas", "Diwali Polki Haar"
 *
 * Logic:
 *   1. If product has occasions: ['bridal']  → use bridal occasions pool
 *   2. If product has occasions: ['festive'] → use festive occasions pool
 *   3. If both → alternate (bridal for even index, festive for odd)
 *   4. Style (craft word) comes from the product's styles[] field
 *   5. Product type comes from the category
 *
 * Names are unique within each category via a rotation + index counter.
 * Slug = slugify(name) + "-" + sku (always unique via SKU).
 */
import { prisma } from '../lib/prisma';

// ── Occasion words ──────────────────────────────────────────────────────────
const BRIDAL_OCC = [
  'Bridal', 'Wedding', 'Bridal', 'Sangeet', 'Mehendi', 'Reception',
  'Bridal', 'Wedding', 'Dulhan', 'Vivaah',
];
const FESTIVE_OCC = [
  'Festive', 'Navratri', 'Diwali', 'Festive', 'Karva Chauth', 'Teej',
  'Festive', 'Puja', 'Diwali', 'Navratri',
];

// ── Craft words (from styles[] — fallback kundan) ───────────────────────────
const CRAFT: Record<string, string> = {
  kundan: 'Kundan',
  meenakari: 'Meenakari',
  polki: 'Polki',
  temple: 'Temple',
  pearl: 'Pearl',
  antique: 'Antique Gold',
};

// ── Product type pools per category ────────────────────────────────────────
const TYPE: Record<string, string[]> = {
  'necklace-sets': [
    'Choker Set', 'Necklace Set', 'Haar Set', 'Rani Haar', 'Choker Set',
    'Necklace Set', 'Long Haar', 'Bridal Set', 'Layered Set', 'Pendant Set',
  ],
  'earrings': [
    'Jhumkas', 'Chandbali Earrings', 'Jhumkis', 'Drop Earrings',
    'Jhumkas', 'Earring Set', 'Chandelier Earrings', 'Jhumkis',
  ],
  'bangles': [
    'Bangles', 'Choodiyan', 'Bangle Set', 'Kada Set', 'Bangles', 'Choodiyan',
  ],
  'finger-rings': [
    'Ring', 'Statement Ring', 'Cocktail Ring', 'Ring', 'Finger Ring', 'Ring Set',
  ],
  'anklets': [
    'Payal', 'Ghungroo Payal', 'Anklet', 'Payal Set', 'Anklet Set', 'Ghungroo Payal',
  ],
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function pickOccasion(occasions: string[], idx: number): string {
  const hasBridal = occasions.includes('bridal');
  const hasFestive = occasions.includes('festive');
  if (hasBridal && hasFestive) {
    return idx % 2 === 0
      ? BRIDAL_OCC[idx % BRIDAL_OCC.length]
      : FESTIVE_OCC[idx % FESTIVE_OCC.length];
  }
  if (hasBridal) return BRIDAL_OCC[idx % BRIDAL_OCC.length];
  if (hasFestive) return FESTIVE_OCC[idx % FESTIVE_OCC.length];
  // fallback
  return FESTIVE_OCC[idx % FESTIVE_OCC.length];
}

function pickCraft(styles: string[], idx: number): string {
  if (styles.length === 0) return 'Kundan';
  return CRAFT[styles[idx % styles.length]] ?? 'Kundan';
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, category: true, sku: true, occasions: true, styles: true },
    orderBy: { createdAt: 'asc' },
  });

  const catIdx: Record<string, number> = {};
  const usedSlugs = new Set<string>();
  const samples: { name: string; cat: string }[] = [];

  for (const p of products) {
    const i = catIdx[p.category] ?? 0;
    catIdx[p.category] = i + 1;

    const occasion = pickOccasion(p.occasions, i);
    const craft = pickCraft(p.styles, i);
    const typePool = TYPE[p.category] ?? TYPE['necklace-sets'];
    const type = typePool[i % typePool.length];

    const name = `${occasion} ${craft} ${type}`;
    let slug = `${slugify(name)}-${p.sku.toLowerCase()}`;
    while (usedSlugs.has(slug)) slug = `${slug}-x`;
    usedSlugs.add(slug);

    await prisma.product.update({ where: { id: p.id }, data: { name, slug } });
    if (samples.length < 15) samples.push({ name, cat: p.category });
  }

  console.log(`Renamed ${products.length} products.\n`);
  console.log('Samples:');
  // group by category
  const grouped: Record<string, string[]> = {};
  for (const s of samples) {
    if (!grouped[s.cat]) grouped[s.cat] = [];
    grouped[s.cat].push(s.name);
  }
  for (const [cat, names] of Object.entries(grouped)) {
    console.log(`\n  ${cat}:`);
    names.forEach(n => console.log(`    → ${n}`));
  }

  await prisma.$disconnect();
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
