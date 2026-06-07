import { prisma } from '../lib/prisma';
async function main(){
  const oi = await prisma.orderItem.deleteMany({});
  const o = await prisma.order.deleteMany({});
  const c = await prisma.coupon.deleteMany({});
  console.log(`Cleared: ${o.count} orders, ${oi.count} order items, ${c.count} coupons.`);
  await prisma.$disconnect();
}
main().catch(e=>{console.error('ERR',e.message);process.exit(1);});
