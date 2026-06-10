/**
 * rename-all-generics.ts
 * Gives proper descriptive names to all products that still have
 * auto-generated "Necklace Set XXXXX" / "Long Set XXXXX" style names.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Name map  (sku → new name) ───────────────────────────────────────────────
const RENAMES: Record<string, string> = {
  // ── Brass & Copper Necklace Sets ──────────────────────────────────────────
  "01NS706": "Bridal Brass Kundan Choker Set",
  "01NS707": "Festive Brass Polki Necklace Set",
  "01NS728": "Navratri Brass Temple Necklace Set",

  // ── Brass & Copper Long Sets ──────────────────────────────────────────────
  "02LG200": "Festive Brass Temple Long Haar",
  "02LG201": "Navratri Brass Kundan Long Set",
  "02LG202": "Dulhan Brass Polki Long Haar",

  // ── Silver Plated Pendant Set ─────────────────────────────────────────────
  "05PS140": "Festive Silver Polki Pendant Set",

  // ── Gold Plated Long Sets (10LG277 colour variants) ───────────────────────
  "10LG277":       "Bridal Kundan Long Haar – Green",
  "10LG277-MINT":  "Bridal Kundan Long Haar – Mint",
  "10LG277-PINK":  "Bridal Kundan Long Haar – Pink",

  // ── Gold Plated Necklace Sets ─────────────────────────────────────────────
  "10NS415": "Mehendi Kundan Necklace Set",
  "10NS517": "Vivaah Polki Gold Necklace Set",    // ₹999 – price TBD
  "10NS672": "Dulhan Meenakari Necklace Set",     // ₹999 – price TBD
  "10NS686": "Bridal Polki Choker Set",           // ₹999 – price TBD
  "10NS697": "Sangeet Temple Necklace Set",       // ₹999 – price TBD
  "10NS712": "Reception Kundan Necklace Set",     // ₹999 – price TBD
  "10NS716": "Festive Polki Gold Necklace Set",
  "10NS723": "Puja Antique Kundan Necklace Set",  // ₹999 – price TBD

  // ── Silver Plated Long Sets (15LG) ────────────────────────────────────────
  "15LG192": "Bridal Silver Kundan Long Haar",
  "15LG280": "Mehendi Silver Temple Long Haar",
  "15LG286": "Festive Silver Polki Long Set",
  "15LG289": "Sangeet Silver Meenakari Long Haar",
  "15LG299": "Navratri Silver Long Haar",

  // ── Silver Plated Pendant Sets (15PS) ─────────────────────────────────────
  "15PS179": "Bridal Silver Kundan Pendant Set",
  "15PS188": "Sangeet Silver Polki Pendant Set",

  // ── Gold Plated Long Sets (17LG) ──────────────────────────────────────────
  "17LG251": "Teej Polki Long Haar Set",
  "17LG254": "Puja Temple Gold Long Haar",

  // ── Gold Plated Necklace Sets (24NS) ─────────────────────────────────────
  "24NS1117": "Teej Kundan Gold Necklace Set",    // ₹999 – price TBD
  "24NS1140": "Reception Meenakari Necklace Set", // ₹999 – price TBD

  // ── Antique Gold Long Sets (30LG) ─────────────────────────────────────────
  "30LG203": "Dulhan Antique Kundan Long Haar",
  "30LG206": "Vivaah Antique Gold Polki Haar",

  // ── Antique Gold Necklace Sets (30NS) ─────────────────────────────────────
  "30NS695": "Puja Antique Gold Necklace Set",
  "30NS743": "Diwali Antique Gold Necklace Set",
};

async function main() {
  let updated = 0;
  let skipped = 0;

  for (const [sku, newName] of Object.entries(RENAMES)) {
    const product = await prisma.product.findFirst({ where: { sku } });
    if (!product) {
      console.log(`⚠  SKU not found: ${sku}`);
      skipped++;
      continue;
    }
    await prisma.product.update({
      where: { id: product.id },
      data: { name: newName },
    });
    console.log(`✓  ${sku}  →  "${newName}"`);
    updated++;
  }

  console.log(`\nDone. ${updated} renamed, ${skipped} skipped.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
