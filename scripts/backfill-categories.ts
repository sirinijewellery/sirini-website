// Backfill Product.categories[] from the existing primary `category` slug, so
// every product is assigned to its category under the new multi-category model.
// Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/backfill-categories.ts
import { prisma } from "../lib/prisma";
import { NAV_CATEGORIES } from "../lib/taxonomy";

const VALID = new Set(NAV_CATEGORIES.map((c) => c.slug));

(async () => {
  const products = await prisma.product.findMany({
    select: { id: true, category: true, categories: true, sku: true },
  });

  let updated = 0;
  const invalid: string[] = [];
  for (const p of products) {
    if (p.categories.length > 0) continue; // already set
    const cat = p.category;
    if (!VALID.has(cat)) invalid.push(`${p.sku}: "${cat}"`);
    await prisma.product.update({
      where: { id: p.id },
      data: { categories: cat ? [cat] : [] },
    });
    updated++;
  }

  // Report distribution
  const all = await prisma.product.findMany({ select: { categories: true } });
  const dist: Record<string, number> = {};
  for (const p of all) for (const c of p.categories) dist[c] = (dist[c] || 0) + 1;

  console.log("Backfilled:", updated);
  if (invalid.length) console.log("NON-CANONICAL primary categories:", invalid);
  console.log("categories[] distribution:", JSON.stringify(dist, null, 2));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
