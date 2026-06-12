/**
 * assign-badges.ts
 * Owner rule: ~4 out of 5 products carry an image badge.
 * Rotation: Handcrafted / Traditional / Bestseller (deterministic per SKU).
 *  - Existing NEW / HOT / SALE badges are KEPT (they carry meaning).
 *  - Every 5th product (by SKU hash) stays badge-free so it doesn't look
 *    like everything is labelled.
 *  - Products tagged "bestsellers" get the Bestseller badge outright.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ROTATION = ["Handcrafted", "Traditional", "Bestseller"] as const;

function hash(sku: string): number {
  let h = 0;
  for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) >>> 0;
  return h;
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, badge: true, tags: true },
    orderBy: { sku: "asc" },
  });

  let assigned = 0;
  let kept = 0;
  let blank = 0;
  const counts: Record<string, number> = {};

  for (const p of products) {
    // Keep meaningful existing badges
    if (p.badge && ["NEW", "HOT", "SALE"].includes(p.badge)) { kept++; continue; }

    const h = hash(p.sku);

    // 1 in 5 stays badge-free
    if (h % 5 === 0) {
      if (p.badge) {
        await prisma.product.update({ where: { id: p.id }, data: { badge: null } });
      }
      blank++;
      continue;
    }

    const badge = p.tags?.includes("bestsellers")
      ? "Bestseller"
      : ROTATION[h % ROTATION.length];

    if (p.badge !== badge) {
      await prisma.product.update({ where: { id: p.id }, data: { badge } });
    }
    counts[badge] = (counts[badge] ?? 0) + 1;
    assigned++;
  }

  console.log(`Assigned: ${assigned}  |  kept NEW/HOT/SALE: ${kept}  |  badge-free: ${blank}`);
  console.log("Breakdown:", counts);
  console.log(`Coverage: ${(((assigned + kept) / products.length) * 100).toFixed(0)}% of ${products.length} products`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
