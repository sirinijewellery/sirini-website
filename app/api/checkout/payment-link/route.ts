import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCommerceSettings } from "@/lib/queries/commerce";
import { computeTotals } from "@/lib/commerce/pricing";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().positive().max(100),
      })
    )
    .min(1)
    .max(50),
  address: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
    label: z.string().optional(),
  }),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^\d{10}$/),
  couponCode: z.string().optional(),
  totalAmount: z.number().nonnegative(),
  giftWrap: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Admin-only: this route creates an order (and reserves stock / consumes a
  // coupon use) WITHOUT taking payment. The storefront never calls it, so it
  // must not be reachable by unauthenticated users.
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const {
    items,
    address,
    customerName,
    customerEmail,
    customerPhone,
    couponCode,
    totalAmount,
    giftWrap,
    notes,
  } = parsed.data;

  const userId = session?.user?.id ?? null;

  // 1. Re-fetch product prices from DB — never trust client-supplied prices
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true, name: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more products not found" },
      { status: 400 }
    );
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  let recalculatedSubtotal = 0;
  for (const item of items) {
    const product = productMap.get(item.productId)!;
    recalculatedSubtotal += product.price * item.quantity;
  }

  // 2. Re-validate coupon fully (expiry + maxUses + minOrderAmount + isActive)
  let recalculatedDiscount = 0;
  let validatedCouponCode: string | null = null;
  let validatedCouponMaxUses: number | null = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });
    if (coupon && coupon.isActive) {
      const now = new Date();
      const notExpired = !coupon.expiresAt || coupon.expiresAt > now;
      const hasUses = coupon.maxUses === null || coupon.usedCount < coupon.maxUses;
      const meetsMin =
        coupon.minOrderAmount === null ||
        recalculatedSubtotal >= coupon.minOrderAmount;
      if (notExpired && hasUses && meetsMin) {
        if (coupon.discountType.toLowerCase() === "percentage") {
          recalculatedDiscount =
            (recalculatedSubtotal * coupon.discountValue) / 100;
        } else {
          recalculatedDiscount = coupon.discountValue;
        }
        recalculatedDiscount = Math.min(
          recalculatedDiscount,
          recalculatedSubtotal
        );
        validatedCouponCode = coupon.code;
        validatedCouponMaxUses = coupon.maxUses;
      }
    }
  }

  // Mirror the client total EXACTLY via the shared single source of truth
  // (same computeTotals() as create-order/cod/verify), so owner-edited
  // rates/fees can never cause a mismatch here.
  const settings = await getCommerceSettings();
  const { total: recalculatedTotal, totalPaise: recalculatedPaise } = computeTotals({
    subtotal: recalculatedSubtotal,
    discount: recalculatedDiscount,
    giftWrap: !!giftWrap,
    settings,
  });

  // 3. Exact paise comparison — no ±1 tolerance
  const clientPaise = Math.round(totalAmount * 100);
  if (recalculatedPaise !== clientPaise) {
    return NextResponse.json(
      { error: "Order amount mismatch. Please restart checkout." },
      { status: 400 }
    );
  }

  // 4. Write order atomically — order + stock + coupon in one transaction
  let order: { id: string };
  try {
    order = await prisma.$transaction(async (tx) => {
      // Sum quantity per product
      const qtyByProduct = new Map<string, number>();
      for (const item of items) {
        qtyByProduct.set(
          item.productId,
          (qtyByProduct.get(item.productId) ?? 0) + item.quantity
        );
      }

      const newOrder = await tx.order.create({
        data: {
          userId: userId ?? null,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress: address,
          notes: giftWrap
            ? `${notes ? `${notes} ` : ""}(Gift Wrapped)`
            : notes ?? null,
          totalAmount: recalculatedTotal,
          discountAmount: recalculatedDiscount,
          couponCode: validatedCouponCode,
          paymentStatus: "payment_link",
          paymentId: null,
          orderStatus: "processing",
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              quantity: item.quantity,
              priceAtPurchase: productMap.get(item.productId)!.price,
            })),
          },
        },
      });

      // Decrement product stock — conditional on sufficient stock so two
      // concurrent orders can never drive stock negative (oversell)
      for (const [productId, qty] of qtyByProduct) {
        const res = await tx.product.updateMany({
          where: { id: productId, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        });
        if (res.count === 0) {
          throw new Error(
            `Insufficient stock for ${productMap.get(productId)!.name}`
          );
        }
      }

      // Increment coupon usage — conditional on usedCount < maxUses so two
      // concurrent orders can't both consume the last remaining use
      if (validatedCouponCode) {
        const couponRes = await tx.coupon.updateMany({
          where: {
            code: validatedCouponCode,
            isActive: true,
            ...(validatedCouponMaxUses !== null
              ? { usedCount: { lt: validatedCouponMaxUses } }
              : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (couponRes.count === 0) {
          throw new Error("Coupon usage limit reached");
        }
      }

      return newOrder;
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Order creation failed";
    if (msg.includes("Insufficient stock")) {
      return NextResponse.json(
        { error: "Sorry, an item went out of stock. Please update your cart." },
        { status: 409 }
      );
    }
    if (msg.includes("Coupon usage limit")) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit." },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({ orderId: order.id });
}
