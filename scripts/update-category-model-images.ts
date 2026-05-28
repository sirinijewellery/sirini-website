/**
 * Update category thumbnail images to use model shots where available,
 * otherwise the best full-product image.
 */
import { prisma } from '../lib/prisma';

function parseImgs(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return (raw as string).split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
}
function isModel(u: string) { return /-model\.(jpe?g|png|webp)$/i.test(u); }
function isDetailShot(u: string) { return /-\d{1,2}\.(jpe?g|png|webp)$/i.test(u); }
function isMain(u: string) { return !isDetailShot(u) && !isModel(u) && !/cpt/i.test(u); }

async function main() {
  const categories = await prisma.category.findMany();

  for (const cat of categories) {
    const products = await prisma.product.findMany({
      where: { category: cat.slug },
      select: { sku: true, images: true },
      take: 100,
    });

    const modelImgs: string[] = [];
    const mainImgs: string[] = [];
    const detailImgs: string[] = [];

    for (const p of products) {
      const imgs = parseImgs(p.images);
      imgs.filter(isModel).forEach(u => modelImgs.push(u));
      imgs.filter(isMain).forEach(u => mainImgs.push(u));
      imgs.filter(isDetailShot).forEach(u => detailImgs.push(u));
    }

    // Priority: model → main → detail
    const best = modelImgs[0] ?? mainImgs[0] ?? detailImgs[0] ?? null;

    if (best) {
      await prisma.category.update({ where: { id: cat.id }, data: { image: best } });
      const tag = isModel(best) ? '👤 model' : isMain(best) ? '🖼 main' : '🔍 detail';
      console.log(`✓ ${cat.name} [${tag}]: ${best.split('/').pop()}`);
    } else {
      console.log(`✗ ${cat.name}: no image found`);
    }
  }

  await prisma.$disconnect();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
