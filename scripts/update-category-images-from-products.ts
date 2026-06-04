/**
 * Updates each Category's image field with the first Cloudinary URL
 * from the first product in that category (real product SKUs only).
 * Run: npx tsx --env-file=.env.local scripts/update-category-images-from-products.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Map of category slugs used by the real-product upload script
const REAL_CATEGORY_SLUGS = ["anklets", "bangles", "earrings", "finger-rings", "necklace-sets"];

async function main() {
  console.log("Updating category images from first product image...\n");

  for (const slug of REAL_CATEGORY_SLUGS) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      console.log(`  SKIP (category not found): ${slug}`);
      continue;
    }

    // Find first product in this category that has images
    const product = await prisma.product.findFirst({
      where: { category: slug },
      orderBy: { sku: "asc" },
      select: { sku: true, images: true },
    });

    if (!product) {
      console.log(`  SKIP (no products found): ${slug}`);
      continue;
    }

    const imgs = Array.isArray(product.images)
      ? product.images
      : typeof product.images === "string"
      ? JSON.parse(product.images)
      : [];

    if ((imgs as unknown[]).length === 0) {
      console.log(`  SKIP (no images for first product ${product.sku}): ${slug}`);
      continue;
    }

    const firstUrl = String((imgs as unknown[])[0]);
    await prisma.category.update({
      where: { slug },
      data: { image: firstUrl },
    });
    console.log(`  Updated ${slug}: ${firstUrl.substring(0, 70)}...`);
  }

  console.log("\nDone.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
