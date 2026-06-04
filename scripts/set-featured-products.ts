/**
 * set-featured-products.ts
 * Picks 8 products spread across real categories and marks them isFeatured = true.
 * Distribution: 2 necklace-sets, 2 earrings, 2 bangles, 1 anklets, 1 finger-rings
 *
 * Run: npx tsx --env-file=.env.local scripts/set-featured-products.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PICKS: { category: string; count: number }[] = [
  { category: "necklace-sets", count: 2 },
  { category: "earrings",      count: 2 },
  { category: "bangles",       count: 2 },
  { category: "anklets",       count: 1 },
  { category: "finger-rings",  count: 1 },
];

async function main() {
  console.log("Clearing all existing isFeatured flags...");
  const cleared = await prisma.product.updateMany({
    where: { isFeatured: true },
    data: { isFeatured: false },
  });
  console.log(`  Cleared ${cleared.count} previously featured products.\n`);

  const selectedIds: string[] = [];

  for (const { category, count } of PICKS) {
    // Prefer products that have images (non-empty images array / non-null)
    const products = await prisma.product.findMany({
      where: { category },
      take: count,
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, category: true, images: true },
    });

    if (products.length === 0) {
      console.log(`  SKIP: no products in category "${category}"`);
      continue;
    }

    for (const p of products) {
      selectedIds.push(p.id);
      const imgs = Array.isArray(p.images) ? p.images : [];
      const hasImage = imgs.length > 0;
      console.log(`  [${p.category}] ${p.name} ${hasImage ? "(has image)" : "(NO image)"}`);
    }
  }

  if (selectedIds.length === 0) {
    console.log("\nNo products selected — nothing to update.");
    return;
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: selectedIds } },
    data: { isFeatured: true },
  });

  console.log(`\nSet isFeatured = true on ${result.count} products.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
