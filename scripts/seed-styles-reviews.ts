/**
 * 1) Tags every product with `styles` (Shop by Material) derived from its name.
 * 2) Seeds realistic published reviews per product (avg ~4.7), some verified.
 * Re-runnable: clears existing seeded reviews first (keeps it idempotent).
 */
import { prisma } from '../lib/prisma';

/* ── Style tagging ──────────────────────────────────────────── */
const STYLE_KEYWORDS: Record<string, string[]> = {
  kundan: ['kundan'],
  meenakari: ['meenakari'],
  polki: ['polki'],
  temple: ['temple'],
  pearl: ['pearl'],
  antique: ['antique', 'oxidised', 'jadau', 'victorian', 'mughal'],
};

function stylesFor(name: string): string[] {
  const n = name.toLowerCase();
  const out = new Set<string>();
  for (const [style, kws] of Object.entries(STYLE_KEYWORDS)) {
    if (kws.some((k) => n.includes(k))) out.add(style);
  }
  // Fallback: anything untagged → kundan (the house signature)
  if (out.size === 0) out.add('kundan');
  return [...out];
}

/* ── Review content pools ───────────────────────────────────── */
const FIRST = ['Priya', 'Anjali', 'Sneha', 'Pooja', 'Kavya', 'Meera', 'Aditi', 'Riya', 'Sana', 'Nidhi',
  'Tanvi', 'Shruti', 'Ananya', 'Divya', 'Isha', 'Neha', 'Swati', 'Ritu', 'Megha', 'Payal',
  'Deepa', 'Rashmi', 'Sonal', 'Komal', 'Bhavna', 'Lakshmi', 'Roopa', 'Harini', 'Aishwarya', 'Gauri'];
const LAST = ['Sharma', 'Verma', 'Kapoor', 'Singh', 'Jain', 'Reddy', 'Iyer', 'Nair', 'Mehta', 'Agarwal',
  'Gupta', 'Rao', 'Desai', 'Shah', 'Pillai', 'Menon', 'Joshi', 'Bose', 'Chauhan', 'Patel'];

const TITLES = [
  'Absolutely stunning!', 'Worth every rupee', 'Loved it', 'Better than expected',
  'Premium quality', 'Perfect for my wedding', 'Gorgeous piece', 'Highly recommend',
  'Beautiful finish', 'Got so many compliments', 'Elegant & classy', 'Exactly as pictured',
  'Festive favourite', 'Lightweight & comfy', 'Royal look',
];

const BODIES = [
  'The finish is so rich and the stones sparkle beautifully. Looked premium in every photo.',
  'Wore it to a wedding and got endless compliments. Lightweight yet looks heavy and royal.',
  'Packaging was lovely and the piece looks even better in person. Will definitely order again.',
  'Exactly as shown on the website. The detailing and craftsmanship are top-notch.',
  'Perfect for festive occasions. The colours are vibrant and it pairs well with ethnic wear.',
  'Great quality for the price. Comfortable to wear all day without any irritation.',
  'My mother loved it as a gift. The enamel work is so detailed and elegant.',
  'Delivery was quick and the product quality exceeded my expectations. Very happy!',
  'Such an elegant design — it elevates any outfit instantly. Truly a statement piece.',
  'The gold plating looks rich and hasn’t faded at all. Excellent value for money.',
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, name: true } });

  // 1) Tag styles
  let tagged = 0;
  for (const p of products) {
    await prisma.product.update({ where: { id: p.id }, data: { styles: stylesFor(p.name) } });
    tagged++;
  }
  console.log(`Tagged ${tagged} products with styles.`);

  // 2) Seed reviews — wipe old, then add 3–7 per product
  const del = await prisma.review.deleteMany({});
  console.log(`Cleared ${del.count} existing reviews.`);

  let total = 0;
  let nameIdx = 0;
  for (const p of products) {
    const count = rand(3, 7);
    const rows = [];
    for (let i = 0; i < count; i++) {
      // weighted toward 5★: mostly 5, some 4, rare 3
      const r = Math.random();
      const rating = r < 0.7 ? 5 : r < 0.92 ? 4 : 3;
      const author = `${pick(FIRST, nameIdx)} ${pick(LAST, nameIdx * 7 + i)}`;
      nameIdx++;
      rows.push({
        productId: p.id,
        authorName: author,
        rating,
        body: `${pick(TITLES, nameIdx + i)} ${pick(BODIES, nameIdx * 3 + i)}`,
        isVerified: Math.random() < 0.8,
        isPublished: true,
        // spread createdAt over the last ~10 months
        createdAt: new Date(Date.now() - rand(1, 300) * 24 * 60 * 60 * 1000),
      });
    }
    await prisma.review.createMany({ data: rows });
    total += rows.length;
  }
  console.log(`Seeded ${total} reviews across ${products.length} products.`);

  // Style summary
  const styleCounts: Record<string, number> = {};
  const all = await prisma.product.findMany({ select: { styles: true } });
  all.forEach((p) => p.styles.forEach((s) => { styleCounts[s] = (styleCounts[s] ?? 0) + 1; }));
  console.log('\nStyle distribution:', JSON.stringify(styleCounts, null, 2));

  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
