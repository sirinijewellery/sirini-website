import { prisma } from '../lib/prisma';

async function main() {
  const prods = await prisma.product.findMany({
    where: { category: 'necklace-sets' },
    select: { sku: true, images: true },
    take: 20,
  });
  for (const p of prods) {
    // images can be: string[], comma-sep string, or JSON string
    const raw = p.images;
    let imgs: string[] = [];
    if (Array.isArray(raw)) {
      imgs = raw as string[];
    } else if (typeof raw === 'string') {
      try { imgs = JSON.parse(raw); } catch { imgs = raw.split(',').map((s: string) => s.trim()).filter(Boolean); }
    } else if (raw && typeof raw === 'object') {
      imgs = Object.values(raw as Record<string, string>);
    }
    const modelImgs = imgs.filter((u: string) => u.toLowerCase().includes('model'));
    if (modelImgs.length > 0) {
      console.log(p.sku, '->', modelImgs[0]);
    }
  }
  await prisma.$disconnect();
}
main();
