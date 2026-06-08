import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.category.findUnique({ where: { slug: 'long-sets' } });
  if (existing) {
    console.log('Category already exists:', existing.id, existing.name);
  } else {
    const cat = await prisma.category.create({
      data: { name: 'Long Sets', slug: 'long-sets' }
    });
    console.log('Created category:', cat.id, cat.name);
  }
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
