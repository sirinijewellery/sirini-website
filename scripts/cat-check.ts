import { prisma } from "../lib/prisma";
(async () => {
  const catCount = await prisma.category.count();
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const productCount = await prisma.product.count();
  const distinctProductCats = await prisma.product.findMany({
    select: { category: true }, distinct: ["category"],
  });
  console.log("category.count() =", catCount);
  console.log("Category rows:");
  for (const c of cats) console.log(`  - ${c.name} | slug=${c.slug} | image=${c.image ? c.image.slice(0, 70) : "(none)"}`);
  console.log("product.count() =", productCount);
  console.log("distinct product.category values:", distinctProductCats.map((p) => p.category).sort());
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
