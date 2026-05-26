import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Load .env so DATABASE_URL is available when running seed directly
dotenv.config();
dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "necklaces" }, update: {}, create: { name: "Necklaces", slug: "necklaces" } }),
    prisma.category.upsert({ where: { slug: "earrings" }, update: {}, create: { name: "Earrings", slug: "earrings" } }),
    prisma.category.upsert({ where: { slug: "bangles-bracelets" }, update: {}, create: { name: "Bangles & Bracelets", slug: "bangles-bracelets" } }),
    prisma.category.upsert({ where: { slug: "rings" }, update: {}, create: { name: "Rings", slug: "rings" } }),
    prisma.category.upsert({ where: { slug: "sets" }, update: {}, create: { name: "Sets", slug: "sets" } }),
    prisma.category.upsert({ where: { slug: "maang-tikka-bridal" }, update: {}, create: { name: "Maang Tikka / Bridal", slug: "maang-tikka-bridal" } }),
    prisma.category.upsert({ where: { slug: "ethnic-jewellery" }, update: {}, create: { name: "Ethnic Jewellery", slug: "ethnic-jewellery" } }),
  ]);

  // Admin user
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@sirinijewellery.com" },
    update: {},
    create: {
      email: "admin@sirinijewellery.com",
      name: "Admin",
      passwordHash: adminPassword,
      isAdmin: true,
    },
  });

  // Sample products
  const sampleProducts = [
    { name: "Rose Gold Layered Necklace", slug: "rose-gold-layered-necklace", description: "Elegant layered necklace in rose gold tone. Perfect for everyday wear.", price: 899, category: "Necklaces", material: "Rose Gold Plated", sku: "SRN-NK-001", badge: "NEW", isFeatured: true },
    { name: "Pearl Drop Earrings", slug: "pearl-drop-earrings", description: "Classic pearl drop earrings with gold tone hooks.", price: 649, category: "Earrings", material: "Pearl & Gold Plated", sku: "SRN-ER-001", badge: null, isFeatured: true },
    { name: "Oxidised Silver Bangle Set", slug: "oxidised-silver-bangle-set", description: "Set of 6 oxidised silver bangles with traditional motifs.", price: 799, category: "Bangles & Bracelets", material: "Oxidised Silver", sku: "SRN-BN-001", badge: "HOT", isFeatured: true },
    { name: "Kundan Finger Ring", slug: "kundan-finger-ring", description: "Stunning Kundan ring with floral design.", price: 549, category: "Rings", material: "Kundan", sku: "SRN-RG-001", badge: null, isFeatured: false },
    { name: "Bridal Jewellery Set", slug: "bridal-jewellery-set", description: "Complete bridal set including necklace, earrings, and maang tikka.", price: 2499, category: "Sets", material: "Gold Plated", sku: "SRN-ST-001", badge: "HOT", isFeatured: true },
    { name: "Meenakari Maang Tikka", slug: "meenakari-maang-tikka", description: "Vibrant Meenakari maang tikka in traditional Rajasthani style.", price: 699, category: "Maang Tikka / Bridal", material: "Meenakari", sku: "SRN-MT-001", badge: "NEW", isFeatured: false },
    { name: "Terracotta Jhumka Earrings", slug: "terracotta-jhumka-earrings", description: "Handcrafted terracotta jhumka earrings with ethnic motifs.", price: 449, category: "Ethnic Jewellery", material: "Terracotta", sku: "SRN-EJ-001", badge: null, isFeatured: true },
    { name: "Gold Tone Choker Necklace", slug: "gold-tone-choker-necklace", description: "Trendy choker necklace in bright gold tone.", price: 749, category: "Necklaces", material: "Gold Plated", sku: "SRN-NK-002", badge: "SALE", isFeatured: false },
  ];

  for (const product of sampleProducts) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        ...product,
        images: JSON.stringify([]),
      },
    });

    // Add variants
    await prisma.productVariant.upsert({
      where: { id: `${created.id}-v1` },
      update: {},
      create: {
        id: `${created.id}-v1`,
        productId: created.id,
        colour: "Gold Tone",
        stockQuantity: 25,
      },
    });
    await prisma.productVariant.upsert({
      where: { id: `${created.id}-v2` },
      update: {},
      create: {
        id: `${created.id}-v2`,
        productId: created.id,
        colour: "Rose Gold",
        stockQuantity: 15,
      },
    });
  }

  console.log("Seed complete ✓");
  console.log(`Created ${categories.length} categories`);
  console.log(`Created ${sampleProducts.length} products`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
