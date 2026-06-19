// Give the "Long Sets" category an image so it becomes active: it then appears
// as a homepage card and its products show in the default shop/featured listings.
import { prisma } from "../lib/prisma";
import { parseImages } from "../lib/parseImages";

(async () => {
  const cat = await prisma.category.findUnique({ where: { slug: "long-sets" } });
  if (!cat) { console.log("No long-sets category row"); return; }
  if (cat.image) { console.log("Already has image:", cat.image); return; }

  const products = await prisma.product.findMany({
    where: { categories: { has: "long-sets" } },
    orderBy: { price: "desc" },
    select: { images: true, name: true },
  });
  let pick: string | null = null;
  for (const p of products) {
    const imgs = parseImages(p.images);
    pick = imgs.find((u) => /model/i.test(u)) ?? imgs[0] ?? null;
    if (pick) break;
  }
  if (!pick) { console.log("No long-sets product image found"); return; }

  await prisma.category.update({ where: { slug: "long-sets" }, data: { image: pick } });
  console.log("Set long-sets image ->", pick);
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
