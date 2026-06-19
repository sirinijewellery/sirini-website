// Normalize product.category to canonical lowercase SLUGS.
// Products added via admin were saved with the category NAME ("Earrings",
// "Bangles") instead of the slug ("earrings", "bangles"), so they didn't match
// the cards/links/filters. Map every category name -> its slug and fix.
// Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/fix-category-slugs.ts
import { prisma } from "../lib/prisma";

(async () => {
  const cats = await prisma.category.findMany({ select: { name: true, slug: true } });

  // before snapshot
  const products = await prisma.product.findMany({ select: { category: true } });
  const before: Record<string, number> = {};
  for (const p of products) before[p.category] = (before[p.category] || 0) + 1;
  console.log("BEFORE:", JSON.stringify(before, null, 2));

  let total = 0;
  for (const { name, slug } of cats) {
    if (name === slug) continue;
    const res = await prisma.product.updateMany({
      where: { category: name },
      data: { category: slug },
    });
    if (res.count) {
      console.log(`  "${name}" -> "${slug}": ${res.count}`);
      total += res.count;
    }
  }

  const after = await prisma.product.findMany({ select: { category: true }, distinct: ["category"] });
  console.log("UPDATED:", total);
  console.log("AFTER distinct:", after.map((a) => a.category).sort());
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
