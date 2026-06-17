// One-off, user-authorised cleanup. Deletes ONLY the confirmed junk:
//   • all synthetic reviews (userId = null)
//   • the TEST1 coupon
//   • the two extra accounts (NEVER the main admin)
// Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/db-cleanup.ts
import { prisma } from "../lib/prisma";

const REMOVE_USERS = ["admin@sirinijewellery.com", "saloniasavla@gmail.com"];
const KEEP_ADMIN = "sirinijewellery@gmail.com";

(async () => {
  if (REMOVE_USERS.includes(KEEP_ADMIN)) throw new Error("Refusing: main admin in delete list");

  const before = {
    totalReviews: await prisma.review.count(),
    syntheticReviews: await prisma.review.count({ where: { userId: null } }),
    test1: await prisma.coupon.count({ where: { code: "TEST1" } }),
    targetUsers: await prisma.user.count({ where: { email: { in: REMOVE_USERS } } }),
  };

  const delReviews = await prisma.review.deleteMany({ where: { userId: null } });
  const delCoupon = await prisma.coupon.deleteMany({ where: { code: "TEST1" } });
  const delUsers = await prisma.user.deleteMany({ where: { email: { in: REMOVE_USERS } } });

  const after = {
    reviews: await prisma.review.count(),
    coupons: await prisma.coupon.count(),
    users: await prisma.user.count(),
    mainAdminStillThere: (await prisma.user.count({ where: { email: KEEP_ADMIN } })) === 1,
  };

  console.log("BEFORE:", JSON.stringify(before, null, 2));
  console.log("DELETED:", JSON.stringify({ reviews: delReviews.count, coupons: delCoupon.count, users: delUsers.count }, null, 2));
  console.log("AFTER:", JSON.stringify(after, null, 2));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
