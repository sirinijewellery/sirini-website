import { prisma } from '../lib/prisma';
import { parseImages } from '../lib/parseImages';

// Clean full-product shot: not a model, not a CPT composite, not a -N close-up.
function mainImage(images: string[]): string | null {
  const main = images.find(
    (u) => !/model/i.test(u) && !/cpt/i.test(u) && !/-\d{1,2}\.(jpe?g|png)$/i.test(u)
  );
  return main ?? images.find((u) => !/model/i.test(u) && !/cpt/i.test(u)) ?? images[0] ?? null;
}
function modelImage(images: string[]): string | null {
  return images.find((u) => /model/i.test(u)) ?? null;
}

async function main() {
  // necklace-sets → MODEL shot
  const ns = await prisma.product.findMany({
    where: { category: 'necklace-sets' }, orderBy: { price: 'desc' },
    select: { images: true }, take: 40,
  });
  let nsCover: string | null = null;
  for (const p of ns) { const m = modelImage(parseImages(p.images)); if (m) { nsCover = m; break; } }
  if (nsCover) await prisma.category.updateMany({ where: { slug: 'necklace-sets' }, data: { image: nsCover } });

  // earrings / bangles / finger-rings / anklets → REAL product image (no model)
  for (const slug of ['earrings', 'bangles', 'finger-rings', 'anklets']) {
    const prods = await prisma.product.findMany({
      where: { category: slug }, orderBy: { price: 'desc' },
      select: { images: true }, take: 25,
    });
    let cover: string | null = null;
    for (const p of prods) { const im = mainImage(parseImages(p.images)); if (im) { cover = im; break; } }
    if (cover) await prisma.category.updateMany({ where: { slug }, data: { image: cover } });
  }

  const cats = await prisma.category.findMany({ select: { slug: true, image: true } });
  cats.forEach((c) => console.log(`${c.slug} → ${c.image?.split('/').pop()}`));
  await prisma.$disconnect();
}
main();
