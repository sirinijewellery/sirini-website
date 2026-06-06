import { prisma } from '../lib/prisma';

// Per-category compare-at multiplier → credible, varied "original" prices.
// Rounded UP to a ₹…99 ending for psychological pricing.
const MULT: Record<string, number> = {
  'necklace-sets': 2.1,
  'earrings': 1.9,
  'bangles': 2.0,
  'finger-rings': 1.85,
  'anklets': 1.9,
};

function roundTo99(x: number): number {
  return Math.ceil(x / 100) * 100 - 1;
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, category: true, price: true } });
  const sample: string[] = [];
  for (const p of products) {
    const mult = MULT[p.category] ?? 2.0;
    const compareAt = roundTo99(p.price * mult);
    await prisma.product.update({ where: { id: p.id }, data: { compareAtPrice: compareAt } });
    if (sample.length < 6) {
      const pct = Math.round(((compareAt - p.price) / compareAt) * 100);
      sample.push(`${p.category}: ₹${p.price} sell → ₹${compareAt} compare (${pct}% off, save ₹${compareAt - p.price})`);
    }
  }
  console.log(`Seeded compareAtPrice for ${products.length} products.`);
  sample.forEach(s => console.log('  ' + s));
  await prisma.$disconnect();
}
main();
