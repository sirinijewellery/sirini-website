/**
 * Auto-tag products with occasions: "bridal" and/or "festive".
 *
 * Rules (a product can match BOTH):
 *  BRIDAL  → premium statement pieces: necklace-sets priced >= 2500, or any
 *            product whose name signals bridal grandeur (bridal, choker, rani
 *            haar, jadau, polki, hasli, kundan bridal, maang tikka, layered).
 *  FESTIVE → colourful / traditional festive pieces: meenakari, temple, jhumka,
 *            kundan, peacock, kemp, enamel, ghungroo; plus most earrings,
 *            bangles, anklets, and mid-priced necklace sets (festive dressing).
 *
 * Re-runnable: recomputes occasions from scratch each time.
 */
import { prisma } from '../lib/prisma';

const BRIDAL_KEYWORDS = [
  'bridal', 'choker', 'rani haar', 'rani-haar', 'jadau', 'polki', 'hasli',
  'maang tikka', 'layered', 'victorian', 'mughal', 'jadau', 'bridal layered',
];

const FESTIVE_KEYWORDS = [
  'meenakari', 'temple', 'jhumka', 'jhumki', 'kundan', 'peacock', 'kemp',
  'enamel', 'ghungroo', 'chandbali', 'floral', 'antique', 'oxidised', 'payal',
];

function tagFor(name: string, category: string, price: number): string[] {
  const n = name.toLowerCase();
  const occasions = new Set<string>();

  // ── Bridal ────────────────────────────────────────────────
  const isPremiumSet = category === 'necklace-sets' && price >= 2500;
  const hasBridalWord = BRIDAL_KEYWORDS.some((k) => n.includes(k));
  if (isPremiumSet || hasBridalWord) occasions.add('bridal');

  // ── Festive ───────────────────────────────────────────────
  const hasFestiveWord = FESTIVE_KEYWORDS.some((k) => n.includes(k));
  // Earrings, bangles, anklets are festive staples; mid-priced necklace sets too.
  const festiveCategory =
    category === 'earrings' ||
    category === 'bangles' ||
    category === 'anklets' ||
    (category === 'necklace-sets' && price < 4000) ||
    category === 'finger-rings';
  if (hasFestiveWord || festiveCategory) occasions.add('festive');

  // Safety: every product should belong to at least one occasion so nothing
  // is orphaned. Default heavy/expensive pieces to bridal, the rest to festive.
  if (occasions.size === 0) {
    occasions.add(price >= 3000 ? 'bridal' : 'festive');
  }

  return [...occasions];
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true, price: true },
  });

  let bridal = 0;
  let festive = 0;
  let both = 0;

  for (const p of products) {
    const occasions = tagFor(p.name, p.category, p.price);
    await prisma.product.update({
      where: { id: p.id },
      data: { occasions },
    });
    if (occasions.includes('bridal')) bridal++;
    if (occasions.includes('festive')) festive++;
    if (occasions.length === 2) both++;
  }

  console.log(`Tagged ${products.length} products.`);
  console.log(`  Bridal:  ${bridal}`);
  console.log(`  Festive: ${festive}`);
  console.log(`  Both:    ${both}`);

  // Sample
  const sample = await prisma.product.findMany({
    take: 8,
    select: { name: true, category: true, price: true, occasions: true },
    orderBy: { price: 'desc' },
  });
  console.log('\nSample (highest priced):');
  sample.forEach((s) =>
    console.log(`  "${s.name}" [${s.category}] ₹${s.price} → ${s.occasions.join(', ')}`)
  );

  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
