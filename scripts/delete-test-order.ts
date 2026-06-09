/**
 * delete-test-order.ts
 * Removes the ₹0 TEST1 test order (orderNumber 1) and resets the orderNumber
 * sequence so the first real customer order is SR1.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const test = await prisma.order.findFirst({
    where: { orderNumber: 1, totalAmount: 0, couponCode: 'TEST1' },
    select: { id: true },
  });
  if (!test) {
    console.log('No matching test order (SR1 / ₹0 / TEST1) found — nothing deleted.');
  } else {
    await prisma.orderItem.deleteMany({ where: { orderId: test.id } });
    await prisma.order.delete({ where: { id: test.id } });
    console.log('Deleted test order SR1 and its items.');
  }

  const remaining = await prisma.order.count();
  if (remaining === 0) {
    const seq = await prisma.$queryRawUnsafe<{ seq: string }[]>(
      `SELECT pg_get_serial_sequence('"Order"', 'orderNumber') AS seq`
    );
    const seqName = seq?.[0]?.seq;
    if (seqName) {
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE ${seqName} RESTART WITH 1`);
      console.log(`Reset sequence ${seqName} → next order will be SR1.`);
    }
  } else {
    console.log(`${remaining} other order(s) remain — sequence left as-is.`);
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
