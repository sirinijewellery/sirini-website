/**
 * fix-22kt-descriptions.ts
 * GEO fact-consistency fix: normalizes "22kt"/"22KT" to "18–22K" in
 * Product.description, matching the karat range already normalized across
 * every other page (About, FAQ, Shipping, shop SEO copy, /world).
 * Mechanical token replace only — sentence structure is untouched.
 *
 * Run (dry run, default): npx tsx --env-file=.env.local scripts/fix-22kt-descriptions.ts
 * Run (apply):            npx tsx --env-file=.env.local scripts/fix-22kt-descriptions.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

function fix(description: string): string {
  return description.replace(/22\s?kt/gi, "18–22K");
}

async function main() {
  const rows = await prisma.product.findMany({
    where: { description: { contains: "22kt", mode: "insensitive" } },
    select: { id: true, slug: true, description: true },
  });

  console.log(`Found ${rows.length} products with "22kt" in description. Apply mode: ${APPLY}\n`);

  let changed = 0;
  for (const r of rows) {
    const next = fix(r.description);
    if (next === r.description) continue;
    changed++;
    if (!APPLY) {
      const idx = r.description.toLowerCase().indexOf("22kt");
      console.log(`[DRY] ${r.slug}: "...${r.description.slice(Math.max(0, idx - 20), idx + 30)}..." -> "...${next.slice(Math.max(0, idx - 20), idx + 34)}..."`);
    } else {
      await prisma.product.update({ where: { id: r.id }, data: { description: next } });
      console.log(`[UPDATED] ${r.slug}`);
    }
  }

  console.log(`\n${APPLY ? "Updated" : "Would update"} ${changed} of ${rows.length} products.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
