/**
 * rename-products.ts
 * Updates every product name to a descriptive, SEO-friendly jewellery name
 * and regenerates the product slug from the new name + existing SKU.
 *
 * Run: npx tsx --env-file=.env.local scripts/rename-products.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Name pools ───────────────────────────────────────────────────────────────

const POOLS: Record<string, string[]> = {
  "necklace-sets": [
    "Kundan Bridal Choker Set",
    "Meenakari Long Necklace Set",
    "Pearl & Gold Layered Necklace Set",
    "Temple Jewellery Necklace Set",
    "Polki Rani Haar Set",
    "Antique Gold Coin Necklace Set",
    "Lakshmi Temple Necklace Set",
    "Rajasthani Kundan Necklace Set",
    "Bridal Choker with Maang Tikka",
    "Mughal-Era Inspired Necklace Set",
    "Ruby Kundan Necklace Set",
    "Emerald Meenakari Necklace Set",
    "Hasli Necklace with Earrings",
    "Jadau Bridal Necklace Set",
    "Kemp Stone Necklace Set",
    "Filigree Gold Necklace Set",
    "Victorian-Style Choker Set",
    "Floral Kundan Long Set",
    "Peacock Meenakari Necklace Set",
    "Bridal Layered Kundan Set",
  ],
  earrings: [
    "Kundan Jhumka Earrings",
    "Gold-Plated Chandbali Earrings",
    "Meenakari Jhumki Drop Earrings",
    "Temple Style Jhumka",
    "Pearl Cluster Drop Earrings",
    "Antique Filigree Jhumka",
    "Long Tassel Jhumki Earrings",
    "Polki Stud Earrings",
    "Enamel Hoop Jhumka",
    "Kemp Stone Drop Earrings",
    "Floral Gold Stud Earrings",
    "Jadau Chandbali",
    "Bridal Jhumka with Pearls",
    "Peacock Jhumki Earrings",
    "Layered Chain Drop Earrings",
  ],
  bangles: [
    "Kundan Bangle Set",
    "Gold-Plated Meenakari Bangle",
    "Antique Kada Bangle",
    "Floral Kundan Choori",
    "Temple Bangle Set",
    "Rose Gold Meenakari Bangle",
    "Pearl-Edged Gold Bangle",
    "Jadau Bangle Set",
    "Rajasthani Lac-Style Bangle",
    "Filigree Cuff Bangle",
  ],
  "finger-rings": [
    "Kundan Cocktail Ring",
    "Meenakari Statement Ring",
    "Antique Gold Adjustable Ring",
    "Polki Floral Ring",
    "Enamel Flower Ring",
    "Jadau Kundan Ring",
    "Rose Gold Filigree Ring",
    "Temple-Style Gold Ring",
    "Pearl Cluster Ring",
    "Peacock Kundan Ring",
    "Ruby Red Stone Ring",
    "Emerald Stone Cocktail Ring",
  ],
  anklets: [
    "Gold Ghungroo Payal",
    "Silver-Finish Anklet",
    "Kundan Anklet Set",
    "Layered Chain Anklet",
    "Temple Bell Payal",
    "Bridal Gold Anklet",
    "Beaded Charm Anklet",
  ],
};

const ROMAN = ["", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function toSlug(name: string, sku: string): string {
  const namePart = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${namePart}-${sku.toLowerCase()}`;
}

/**
 * Given the pool for a category and the 0-based index of the product
 * within that category, return the descriptive name with a roman numeral
 * suffix only when that base name is being repeated.
 */
function buildName(pool: string[], idx: number): string {
  const base = pool[idx % pool.length];
  // How many full cycles before this item, plus earlier items in current cycle
  // that share the same base name.
  const cycleNumber = Math.floor(idx / pool.length); // 0 = first pass, 1 = second …
  // Within the same pool position, each cycle gives a new occurrence.
  // occurrence = cycleNumber  (0-based)
  if (cycleNumber === 0) return base;
  // suffix is II for 1st repeat, III for 2nd repeat, etc.
  const suffix = ROMAN[cycleNumber] ?? `${cycleNumber + 1}`;
  return `${base} ${suffix}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Sirini Jewellery — Rename Products (SEO-Friendly Names)\n");

  const REAL_CATEGORIES = [
    "anklets",
    "bangles",
    "earrings",
    "finger-rings",
    "necklace-sets",
  ];

  const products = await prisma.product.findMany({
    where: { category: { in: REAL_CATEGORIES } },
    select: { id: true, name: true, sku: true, category: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${products.length} products to rename.\n`);

  // Group by category, preserving createdAt order
  const byCategory: Record<string, typeof products> = {};
  for (const cat of REAL_CATEGORIES) byCategory[cat] = [];
  for (const p of products) {
    if (byCategory[p.category]) byCategory[p.category].push(p);
  }

  let totalUpdated = 0;
  const SAMPLE_SIZE = 5;

  for (const cat of REAL_CATEGORIES) {
    const catProducts = byCategory[cat];
    const pool = POOLS[cat];

    if (!pool) {
      console.warn(`  No pool defined for category "${cat}" — skipping.`);
      continue;
    }

    console.log(
      `\n──── ${cat} (${catProducts.length} products, pool size ${pool.length}) ────`
    );

    const samples: string[] = [];

    for (let i = 0; i < catProducts.length; i++) {
      const prod = catProducts[i];
      const newName = buildName(pool, i);
      const newSlug = toSlug(newName, prod.sku);

      await prisma.product.update({
        where: { id: prod.id },
        data: { name: newName, slug: newSlug },
      });

      totalUpdated++;

      if (i < SAMPLE_SIZE) {
        samples.push(
          `  [${i + 1}] "${prod.name}" → "${newName}"\n      slug: ${newSlug}`
        );
      }
    }

    console.log(`Sample renames (first ${Math.min(SAMPLE_SIZE, catProducts.length)}):`);
    for (const s of samples) console.log(s);
    console.log(`  … ${catProducts.length} products renamed in this category.`);
  }

  console.log(`\n✓ Total products renamed: ${totalUpdated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
