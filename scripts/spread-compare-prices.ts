/**
 * spread-compare-prices.ts
 * Gives every product its own organic-looking strikethrough (compareAtPrice).
 *
 * Owner's rule: the gap between cancelled price and real price should vary
 * per product, from ₹1,500 to ₹6,000 — not a uniform 2× everywhere.
 *
 * Implementation:
 *  - gap is deterministic per SKU (stable across re-runs)
 *  - price ≥ ₹1,000  → gap in [1500, 6000], capped at 2.33×price (≤70% off)
 *  - price <  ₹1,000 → gap in [1.0×price, 2.33×price] (50–70% off, varied)
 *  - compareAt rounded to end in 99 (matches existing convention)
 *  - the 8 SKUs priced from the owner's sheet are SKIPPED (already varied)
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Already set from the owner's price sheet — gaps verified in [1500, 6000].
const SKIP_SKUS = new Set([
  "10NS517", "10NS672", "10NS686", "10NS697",
  "10NS712", "10NS723", "24NS1117", "24NS1140",
]);

// Deterministic hash so each SKU always lands on the same gap.
function hash(sku: string): number {
  let h = 0;
  for (let i = 0; i < sku.length; i++) {
    h = (h * 31 + sku.charCodeAt(i)) >>> 0;
  }
  return h;
}

function computeCompareAt(sku: string, price: number): number {
  let gapMin: number;
  let gapMax: number;

  if (price >= 1000) {
    gapMin = 1500;
    gapMax = Math.min(6000, Math.round(price * 2.33)); // never show >70% off
    if (gapMax < gapMin) gapMax = gapMin;
  } else {
    gapMin = Math.round(price * 1.0);   // at least ~50% off
    gapMax = Math.round(price * 2.33);  // at most ~70% off
  }

  const gap = gapMin + (hash(sku) % (gapMax - gapMin + 1));
  // Round to end in 99, never dipping below price + gapMin.
  let compareAt = Math.round((price + gap) / 100) * 100 - 1;
  if (compareAt < price + gapMin) compareAt += 100;
  return compareAt;
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, price: true, compareAtPrice: true },
    orderBy: { sku: "asc" },
  });

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    if (SKIP_SKUS.has(p.sku)) { skipped++; continue; }

    const compareAt = computeCompareAt(p.sku, p.price);
    if (compareAt === p.compareAtPrice) { skipped++; continue; }

    await prisma.product.update({
      where: { id: p.id },
      data: { compareAtPrice: compareAt },
    });
    const gap = compareAt - p.price;
    const pct = Math.round((gap / compareAt) * 100);
    console.log(
      `✓ ${p.sku.padEnd(14)} ₹${String(p.price).padStart(6)} → struck ₹${String(compareAt).padStart(6)}  (gap ₹${gap}, ${pct}% off)`
    );
    updated++;
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped/unchanged.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
