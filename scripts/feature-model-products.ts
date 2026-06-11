/**
 * feature-model-products.ts
 * Home page "Featured" should showcase products WITH model photography.
 * Swaps isFeatured from the current 8 (no model shots) to a curated set of
 * 8 model-shot products spanning bridal/festive styles and ₹1.5k–₹22k.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// All have model images (verified). Mix: chokers, haars, long sets, pendant
// sets; price spread ₹1,550 – ₹22,450.
const FEATURE_SKUS = [
  "10NS714",  // Bridal Kundan Haar Set — ₹12,000
  "30NS08",   // Bridal Kundan Choker Set — ₹7,250
  "10NS09",   // Mehendi Kundan Choker Set — ₹6,400
  "30LG203",  // Dulhan Antique Kundan Long Haar — ₹12,050
  "02LG202",  // Dulhan Brass Polki Long Haar — ₹1,550
  "01NS830",  // Bridal Meenakari Haar Set — ₹4,500
  "10NS787",  // Navratri Pearl Pendant Set — ₹22,450
  "10NS812",  // Festive Kundan Rani Haar — ₹1,900
];

async function main() {
  const unfeature = await prisma.product.updateMany({
    where: { isFeatured: true, sku: { notIn: FEATURE_SKUS } },
    data: { isFeatured: false },
  });
  console.log(`Unfeatured ${unfeature.count} products without model shots.`);

  for (const sku of FEATURE_SKUS) {
    const res = await prisma.product.updateMany({
      where: { sku },
      data: { isFeatured: true },
    });
    console.log(res.count ? `✓ Featured ${sku}` : `⚠ SKU not found: ${sku}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
