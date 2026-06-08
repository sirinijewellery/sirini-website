import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CODES = [
  '10NS517','10NS672','10NS686','10NS697','10NS712','10NS723',
  '02LG200','02LG201','02LG202','05PS140','10LG277','15LG192','15LG280',
  '15LG286','15LG289','15LG299','15PS179','15PS188','17LG251','17LG254','30LG203','30LG206'
];

async function main() {
  for (const code of CODES) {
    const p = await prisma.product.findFirst({
      where: { sku: { equals: code.toUpperCase() } },
      select: { id: true, sku: true, name: true }
    });
    console.log(code, p ? 'EXISTS' : 'NEW');
  }
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
