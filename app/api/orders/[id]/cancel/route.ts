import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = enforceRateLimit(req, "order-cancel", 20, 10 * 60_000);
  if (limited) return limited;

  // Require authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  // Fetch the order with its items (needed to restore product stock)
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        select: { productId: true, quantity: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Users may only cancel their OWN orders
  if (order.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only orders still being processed can be cancelled
  if (order.orderStatus !== "processing") {
    return NextResponse.json(
      { error: "This order can no longer be cancelled" },
      { status: 400 }
    );
  }

  // Cancel + restore stock atomically. The status flip is conditional on the
  // order still being "processing" so two concurrent cancel requests can't
  // both run the stock-restore (which would inflate stock).
  let cancelled = false;
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id, orderStatus: "processing" },
      data: { orderStatus: "cancelled" },
    });
    if (updated.count === 0) {
      return; // already cancelled/shipped by a concurrent request
    }
    cancelled = true;

    // Restore product stock — sum quantity per product, then increment.
    const qtyByProduct = new Map<string, number>();
    for (const item of order.items) {
      if (item.productId) {
        qtyByProduct.set(
          item.productId,
          (qtyByProduct.get(item.productId) ?? 0) + item.quantity
        );
      }
    }
    for (const [productId, qty] of qtyByProduct) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: qty } },
      });
    }
  });

  if (!cancelled) {
    return NextResponse.json(
      { error: "This order can no longer be cancelled" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
