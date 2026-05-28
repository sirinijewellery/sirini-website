import { prisma } from '../lib/prisma';

// Delete old seed categories that have no products and were created from the initial seed.
// Keep only the 5 real categories: earrings, anklets, bangles, finger-rings, necklace-sets
const KEEP = ['earrings', 'anklets', 'bangles', 'finger-rings', 'necklace-sets'];

async function main() {
  const toDelete = await prisma.category.findMany({
    where: { slug: { notIn: KEEP } },
    select: { id: true, slug: true, name: true },
  });

  if (toDelete.length === 0) {
    console.log('Nothing to delete.');
  } else {
    for (const cat of toDelete) {
      // Safety: only delete if no products reference this category slug
      const productCount = await prisma.product.count({ where: { category: cat.slug } });
      if (productCount > 0) {
        console.log(`SKIP ${cat.slug} — has ${productCount} products`);
        continue;
      }
      await prisma.category.delete({ where: { id: cat.id } });
      console.log(`Deleted: ${cat.slug}`);
    }
  }

  const remaining = await prisma.category.findMany({ select: { slug: true, name: true } });
  console.log('\nRemaining categories:', remaining.map(c => c.slug).join(', '));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
