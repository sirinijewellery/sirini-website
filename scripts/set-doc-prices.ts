/**
 * set-doc-prices.ts
 * Applies the owner's price sheet (Sirini Pending Tasks.docx, Section 1).
 * Doc values are WHOLESALE — website price = 2× wholesale.
 * compareAtPrice = selling + varied ₹1,500–₹6,000 markup (organic-looking discounts).
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// sku → [wholesale, sellingPrice, compareAtPrice]
const PRICES: Record<string, [number, number, number]> = {
  "10NS517":  [3725, 7450, 12899],
  "10NS672":  [2925, 5850, 9899],
  "10NS686":  [2250, 4500, 7899],
  "10NS697":  [2600, 5200, 8899],
  "10NS712":  [2300, 4600, 7799],
  "10NS723":  [2550, 5100, 8699],
  "24NS1117": [1175, 2350, 3899],
  "24NS1140": [1225, 2450, 4199],
};

async function main() {
  for (const [sku, [wholesale, price, compareAtPrice]] of Object.entries(PRICES)) {
    const product = await prisma.product.findFirst({ where: { sku } });
    if (!product) {
      console.log(`⚠  SKU not found: ${sku}`);
      continue;
    }
    await prisma.product.update({
      where: { id: product.id },
      data: { price, compareAtPrice },
    });
    console.log(
      `✓ ${sku}  wholesale ₹${wholesale} → selling ₹${price}, struck ₹${compareAtPrice}`
    );
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
