// Create the new product categories. Idempotent (upsert by slug).
// Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/add-categories.ts
import { prisma } from "../lib/prisma";

const NEW_CATEGORIES = [
  { name: "Bracelet", slug: "bracelet" },
  { name: "Tops", slug: "tops" },
  { name: "Nose Ring (Nath)", slug: "nose-ring" },
  { name: "Belt", slug: "belt" },
  { name: "Tikka", slug: "tikka" },
  { name: "Kalgi", slug: "kalgi" },
  { name: "Hathpaan", slug: "hathpaan" },
  { name: "Groom Mala", slug: "groom-mala" },
];

(async () => {
  for (const c of NEW_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug },
      update: { name: c.name },
    });
    console.log(`ready: ${c.name} (${c.slug})`);
  }
  const all = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } });
  console.log("\nAll categories now:", JSON.stringify(all.map((x) => `${x.name} [${x.slug}]`), null, 2));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
