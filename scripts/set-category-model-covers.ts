/**
 * Sets every category's cover image to a MODEL shot (model wearing jewellery),
 * not a bare product close-up.
 *
 * Only necklace-sets have model images, so:
 *   - necklace-sets → its own model shot
 *   - earrings / bangles / finger-rings / anklets → a DISTINCT model-wearing-
 *     full-necklace-set image each (per user: "if model not there, use a pic
 *     of full necklace set").
 */
import { prisma } from '../lib/prisma';
import { parseImages } from '../lib/parseImages';

async function main() {
  // Collect all model image URLs from necklace-set products
  const nsProducts = await prisma.product.findMany({
    where: { category: 'necklace-sets' },
    select: { images: true, price: true },
    orderBy: { price: 'desc' }, // premium sets first — nicer model shots
  });

  const modelUrls: string[] = [];
  for (const p of nsProducts) {
    for (const u of parseImages(p.images)) {
      if (/model/i.test(u)) modelUrls.push(u);
    }
  }
  // Fallback: if somehow few models, also allow clean full-set main shots
  const fullSetUrls: string[] = [];
  for (const p of nsProducts) {
    for (const u of parseImages(p.images)) {
      // main shot = ends with -<price>.jpg (no -1/-2 suffix, no cpt)
      if (!/model/i.test(u) && !/-\d{1,2}\.(jpe?g|png)$/i.test(u) && !/cpt/i.test(u)) {
        fullSetUrls.push(u);
      }
    }
  }

  const pool = [...modelUrls, ...fullSetUrls];
  console.log(`Found ${modelUrls.length} model images, ${fullSetUrls.length} full-set images.`);

  if (pool.length === 0) {
    console.log('No suitable images found. Aborting.');
    await prisma.$disconnect();
    return;
  }

  // Assign DISTINCT images to each category for visual variety
  const order = ['necklace-sets', 'earrings', 'anklets', 'bangles', 'finger-rings'];
  let i = 0;
  for (const slug of order) {
    const img = pool[i % pool.length];
    i++;
    const res = await prisma.category.updateMany({ where: { slug }, data: { image: img } });
    if (res.count > 0) console.log(`  ${slug} → ${img.split('/').pop()}`);
  }

  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
