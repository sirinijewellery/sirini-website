import { prisma } from "@/lib/prisma";

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      totalAmount: true,
      discountAmount: true,
      orderStatus: true,
      paymentStatus: true,
      paymentMethod: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          priceAtPurchase: true,
          product: { select: { name: true, slug: true, images: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      shippingAddress: true,
      notes: true,
      totalAmount: true,
      discountAmount: true,
      couponCode: true,
      orderStatus: true,
      paymentStatus: true,
      paymentMethod: true,
      paymentId: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          priceAtPurchase: true,
          product: { select: { id: true, name: true, slug: true, images: true } },
        },
      },
    },
  });
}
