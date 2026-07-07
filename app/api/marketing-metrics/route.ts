import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

// Read-only aggregate metrics for the local Sirini Marketing Studio dashboard.
// Machine-to-machine (no browser session), so auth is a shared secret header
// rather than the admin cookie session — never returns customer PII, only
// aggregates and order totals.

function isAuthorized(req: Request): boolean {
  const expectedSecret = process.env.MARKETING_METRICS_API_KEY;
  if (!expectedSecret) return false; // fail closed if the env var is unset

  const provided = Buffer.from(req.headers.get("x-api-key") ?? "");
  const expected = Buffer.from(expectedSecret);
  // Timing-safe comparison — a plain !== leaks how many leading characters
  // match via response timing (same pattern as the cron route's guard).
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  const [
    totalOrders,
    totalRevenue,
    todayOrders,
    todayRevenue,
    ordersByDay,
    statusBreakdown,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "paid" },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "paid", createdAt: { gte: startOfToday } },
    }),
    prisma.$queryRaw<{ day: string; orders: bigint; revenue: number | null }[]>`
      SELECT to_char("createdAt", 'YYYY-MM-DD') AS day,
             COUNT(*) AS orders,
             SUM(CASE WHEN "paymentStatus" = 'paid' THEN "totalAmount" ELSE 0 END) AS revenue
      FROM "Order"
      WHERE "createdAt" >= ${since30d}
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.order.groupBy({ by: ["orderStatus"], _count: { _all: true } }),
  ]);

  return NextResponse.json({
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    todayOrders,
    todayRevenue: todayRevenue._sum.totalAmount ?? 0,
    dailySeries: ordersByDay.map((r) => ({
      day: r.day,
      orders: Number(r.orders),
      revenue: Number(r.revenue ?? 0),
    })),
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.orderStatus,
      count: s._count._all,
    })),
  });
}
