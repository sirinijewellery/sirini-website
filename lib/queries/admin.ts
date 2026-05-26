import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalOrders,
    processingCount,
    totalRevenue,
    todayOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: "processing" } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "paid" },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        totalAmount: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
        items: { select: { id: true } },
      },
    }),
  ]);

  return {
    totalOrders,
    processingCount,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    todayOrders,
    recentOrders,
  };
}
