/**
 * Recomputes occasions[] for all products across 4 occasions:
 *   bridal, festive, party, daily   (a product can have several)
 *
 * - bridal  : name carries a bridal word (Bridal/Wedding/Sangeet/Mehendi/
 *             Reception/Dulhan/Vivaah) OR premium necklace set (>= 2500)
 * - festive : name carries a festive word (Festive/Navratri/Diwali/Karva/
 *             Teej/Puja) OR earrings/bangles/anklets/finger-rings
 * - party   : statement mid-range pieces, price 1500–8000
 * - daily   : lightweight / affordable, price < 2000
 */
import { prisma } from '../lib/prisma';

const BRIDAL_WORDS = ['bridal', 'wedding', 'sangeet', 'mehendi', 'reception', 'dulhan', 'vivaah'];
const FESTIVE_WORDS = ['festive', 'navratri', 'diwali', 'karva', 'teej', 'puja'];

function occasionsFor(name: string, category: string, price: number): string[] {
  const n = name.toLowerCase();
  const out = new Set<string>();

  if (BRIDAL_WORDS.some((w) => n.includes(w)) || (category === 'necklace-sets' && price >= 2500)) {
    out.add('bridal');
  }
  if (
    FESTIVE_WORDS.some((w) => n.includes(w)) ||
    category === 'earrings' || category === 'bangles' ||
    category === 'anklets' || category === 'finger-rings'
  ) {
    out.add('festive');
  }
  if (price >= 1500 && price <= 8000) out.add('party');
  if (price < 2000) out.add('daily');

  // never orphan
  if (out.size === 0) out.add(price >= 3000 ? 'bridal' : 'festive');
  return [...out];
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true, price: true },
  });

  const counts: Record<string, number> = { bridal: 0, festive: 0, party: 0, daily: 0 };
  for (const p of products) {
    const occ = occasionsFor(p.name, p.category, p.price);
    await prisma.product.update({ where: { id: p.id }, data: { occasions: occ } });
    occ.forEach((o) => { counts[o] = (counts[o] ?? 0) + 1; });
  }

  console.log(`Tagged ${products.length} products.`);
  console.log('Counts:', JSON.stringify(counts, null, 2));
  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
