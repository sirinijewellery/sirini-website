import 'dotenv/config';
import { prisma } from '../lib/prisma';

// One-time migration: before dropping the ProductVariant model, copy each
// product's total variant stock onto Product.stock (the new single source of
// truth). Products without variants are left untouched (they already rely on
// Product.stock).
async function main() {
  const products = await prisma.product.findMany({
    where: { variants: { some: {} } },
    select: { id: true, sku: true, stock: true, variants: { select: { stockQuantity: true } } },
  });

  console.log(`Found ${products.length} products with variants. Migrating stock…`);

  for (const p of products) {
    const total = p.variants.reduce((s, v) => s + v.stockQuantity, 0);
    await prisma.product.update({ where: { id: p.id }, data: { stock: total } });
    console.log(`  ${p.sku}: stock ${p.stock} → ${total}`);
  }

  console.log('Done.');
  await prisma.$disconnect();
}

main().catch((e) => { console.error('ERR', e); process.exit(1); });
