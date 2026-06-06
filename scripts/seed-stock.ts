import { prisma } from '../lib/prisma';
// Realistic stock: ~20% low (2-5) for urgency, rest healthy (8-30).
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
async function main() {
  const products = await prisma.product.findMany({ select: { id: true } });
  let low = 0;
  for (const p of products) {
    const isLow = Math.random() < 0.2;
    const stock = isLow ? rand(2, 5) : rand(8, 30);
    if (isLow) low++;
    await prisma.product.update({ where: { id: p.id }, data: { stock } });
  }
  console.log(`Seeded stock for ${products.length} products (${low} low-stock <=5).`);
  await prisma.$disconnect();
}
main();
