import { prisma } from '../lib/prisma';

// Find one good model/representative image for each category and update the DB
async function main() {
  const categories = await prisma.category.findMany();
  console.log('Categories:', categories.map(c => `${c.slug} (id:${c.id})`));

  for (const cat of categories) {
    // Find a product in this category that has a model image
    const products = await prisma.product.findMany({
      where: { category: cat.slug },
      select: { sku: true, images: true },
      take: 50,
    });

    let bestImage: string | null = null;

    function parseImgs(raw: unknown): string[] {
      if (Array.isArray(raw)) return raw as string[];
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch { return (raw as string).split(',').map((s: string) => s.trim()).filter(Boolean); }
      }
      return [];
    }
    function isModel(u: string) { return /-model\.(jpe?g|png|webp)$/i.test(u); }
    function isDetailShot(u: string) { return /-\d{1,2}\.(jpe?g|png|webp)$/i.test(u); }
    function isMain(u: string) { return !isDetailShot(u) && !isModel(u) && !/cpt/i.test(u); }

    // Collect best images from all products in this category
    const modelCandidates: string[] = [];
    const mainCandidates: string[] = [];
    const detailCandidates: string[] = [];

    for (const p of products) {
      const imgs = parseImgs(p.images);
      imgs.filter(isModel).forEach(u => modelCandidates.push(u));
      imgs.filter(isMain).forEach(u => mainCandidates.push(u));
      imgs.filter(isDetailShot).forEach(u => detailCandidates.push(u));
    }

    // Priority: model → main full-set → detail shot
    bestImage = modelCandidates[0] ?? mainCandidates[0] ?? detailCandidates[0] ?? null;

    if (bestImage) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { image: bestImage },
      });
      console.log(`✓ ${cat.name}: ${bestImage.split('/').pop()}`);
    } else {
      console.log(`✗ ${cat.name}: no image found`);
    }
  }

  await prisma.$disconnect();
  console.log('\nDone! Category images updated.');
}

main().catch(e => { console.error(e); process.exit(1); });
