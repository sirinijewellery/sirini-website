import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["processing", "shipped", "delivered", "cancelled"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check — admin only
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Parse and validate body
  let status: string | undefined;
  try {
    const body = await req.json();
    status = body?.status;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      {
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      },
      { status: 400 }
    );
  }
  const newStatus = status;

  // Items are needed to move stock when crossing the cancelled boundary.
  const existing = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderStatus: true,
      items: { select: { productId: true, quantity: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (existing.orderStatus === newStatus) {
    return NextResponse.json({ orderStatus: newStatus });
  }

  // Sum quantity per product (skip items whose product was deleted).
  const qtyByProduct = new Map<string, number>();
  for (const item of existing.items) {
    if (item.productId) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.quantity
      );
    }
  }

  const becomesCancelled = newStatus === "cancelled";
  const leavesCancelled = existing.orderStatus === "cancelled";

  try {
    await prisma.$transaction(async (tx) => {
      // Conditional on the status we read, so a concurrent change (e.g. the
      // customer cancelling at the same moment) can't double-move stock.
      const flipped = await tx.order.updateMany({
        where: { id, orderStatus: existing.orderStatus },
        data: { orderStatus: newStatus },
      });
      if (flipped.count === 0) throw new Error("STATUS_CONFLICT");

      if (becomesCancelled) {
        // Cancelling returns the reserved stock — same as the customer
        // cancel route; without this, admin-cancelled orders leak inventory.
        for (const [productId, qty] of qtyByProduct) {
          await tx.product.update({
            where: { id: productId },
            data: { stock: { increment: qty } },
          });
        }
      } else if (leavesCancelled) {
        // Reactivating a cancelled order re-reserves stock — conditionally,
        // so it can't drive stock negative.
        for (const [productId, qty] of qtyByProduct) {
          const res = await tx.product.updateMany({
            where: { id: productId, stock: { gte: qty } },
            data: { stock: { decrement: qty } },
          });
          if (res.count === 0) throw new Error("INSUFFICIENT_STOCK");
        }
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "STATUS_CONFLICT") {
      return NextResponse.json(
        { error: "Order status changed elsewhere. Refresh and try again." },
        { status: 409 }
      );
    }
    if (msg === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Not enough stock to reactivate this order." },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({ orderStatus: newStatus });
}
