import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const coupon = await prisma.coupon.upsert({
    where: { code: "FREE1" },
    create: {
      code: "FREE1",
      discountType: "PERCENTAGE",
      discountValue: 100,
      minOrderAmount: null,
      maxUses: null, // unlimited uses for testing
      isActive: true,
    },
    update: {
      discountType: "PERCENTAGE",
      discountValue: 100,
      isActive: true,
    },
  });
  console.log("Created FREE1 coupon:", coupon);
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
