import * as dotenv from 'dotenv';
dotenv.config(); dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CODES = ['01ns705', '01ns708', '01ns830', '10ns700', '10ns714'];

async function main() {
  for (const code of CODES) {
    const p = await prisma.product.findFirst({
      where: { slug: { contains: code } },
      select: { id: true, slug: true, name: true, images: true },
    });
    console.log(JSON.stringify({ code, id: p?.id, slug: p?.slug, name: p?.name, images: p?.images }, null, 2));
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
