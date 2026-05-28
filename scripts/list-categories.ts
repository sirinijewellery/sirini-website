import { prisma } from '../lib/prisma';
async function main() {
  const cats = await prisma.category.findMany({ select: { name: true, slug: true, image: true } });
  cats.forEach(c => console.log(c.slug, '| image:', c.image ? 'YES (' + c.image.split('/').pop() + ')' : 'NO'));
  await prisma.$disconnect();
}
main();
