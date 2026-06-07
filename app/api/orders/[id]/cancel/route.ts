import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  // Fetch the order with its items (needed to restore variant stock)
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        select: { variantId: true, quantity: true },
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

  // Cancel + restore stock atomically
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { orderStatus: "cancelled" },
    });

    // Restore stock for items that have a variant (non-variant products
    // do not track stock at the variant level, so there is nothing to restore).
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}
