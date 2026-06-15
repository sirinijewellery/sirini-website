// READ-ONLY database audit. Lists counts + likely-junk records so we can decide
// what (if anything) to delete. Makes NO changes.
// Run: DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/db-audit.ts
import { prisma } from "../lib/prisma";

function j(label: string, v: unknown) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(v, null, 2));
}

async function main() {
  // ── Totals ──────────────────────────────────────────────────────────────
  const counts = {
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    users: await prisma.user.count(),
    reviews: await prisma.review.count(),
    coupons: await prisma.coupon.count(),
    wishlistItems: await prisma.wishlistItem.count(),
    addresses: await prisma.address.count(),
    newsletter: await prisma.newsletterSubscriber.count(),
    categories: await prisma.category.count(),
  };
  j("TABLE COUNTS", counts);

  // ── Orders by payment status (real vs test/abandoned) ────────────────────
  const ordersByPay = await prisma.order.groupBy({
    by: ["paymentStatus"],
    _count: { _all: true },
  });
  j("ORDERS BY paymentStatus", ordersByPay);

  const orders = await prisma.order.findMany({
    select: {
      orderNumber: true, customerName: true, customerEmail: true,
      totalAmount: true, paymentStatus: true, paymentId: true,
      orderStatus: true, createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  j("ALL ORDERS (summary)", orders);

  // ── Users (spot test accounts) ───────────────────────────────────────────
  const users = await prisma.user.findMany({
    select: {
      email: true, name: true, isAdmin: true, createdAt: true,
      _count: { select: { orders: true, reviews: true, addresses: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  j("ALL USERS", users);

  // ── Reviews (spot test reviews) ──────────────────────────────────────────
  const reviews = await prisma.review.findMany({
    select: {
      authorName: true, rating: true, body: true, isVerified: true,
      isPublished: true, createdAt: true, productId: true, userId: true,
    },
    orderBy: { createdAt: "asc" },
  });
  j("ALL REVIEWS", reviews);

  // ── Coupons ──────────────────────────────────────────────────────────────
  j("ALL COUPONS", await prisma.coupon.findMany());

  // ── Newsletter subscribers ───────────────────────────────────────────────
  j("NEWSLETTER SUBSCRIBERS", await prisma.newsletterSubscriber.findMany({
    select: { email: true, createdAt: true }, orderBy: { createdAt: "asc" },
  }));

  // ── Product anomalies (price 0, no images, test-ish names) ───────────────
  const products = await prisma.product.findMany({
    select: { sku: true, name: true, price: true, stock: true, images: true, category: true },
  });
  const suspectProducts = products.filter((p) => {
    const imgs = Array.isArray(p.images) ? p.images : [];
    const nameJunk = /\btest\b|\bsample\b|\bdemo\b|\bdummy\b|lorem/i.test(p.name);
    return p.price <= 0 || imgs.length === 0 || nameJunk;
  });
  j("SUSPECT PRODUCTS (price<=0 / no images / test-name)", suspectProducts);

  // ── Newsletter / order test-email heuristics ─────────────────────────────
  const testEmailRx = /test|example\.com|mailinator|\+test|asdf|qwerty|temp/i;
  j("ORDERS w/ test-looking email", orders.filter((o) => testEmailRx.test(o.customerEmail)).map((o) => o.orderNumber));
  j("USERS w/ test-looking email", users.filter((u) => testEmailRx.test(u.email)).map((u) => u.email));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
