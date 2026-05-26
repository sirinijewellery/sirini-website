import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/payment";

const bodySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variantId: z.string().optional(),
      quantity: z.number().int().positive(),
      // priceAtPurchase is intentionally ignored — we use server DB price
    })
  ).min(1),
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
  // totalAmount / discountAmount from client are used only for cross-check, not stored
  totalAmount: z.number().positive(),
  notes: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
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
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    items,
    address,
    customerName,
    customerEmail,
    customerPhone,
    couponCode,
    totalAmount,
    notes,
    userId,
  } = parsed.data;

  // 1. Verify Razorpay signature — proves the payment is authentic
  const isValid = verifyRazorpaySignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );
  if (!isValid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // 2. Re-fetch product prices from DB — never trust client-supplied prices
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  let recalculatedSubtotal = 0;
  for (const item of items) {
    const product = productMap.get(item.productId)!;
    recalculatedSubtotal += product.price * item.quantity;
  }

  // 3. Re-validate coupon fully (expiry + maxUses + isActive)
  let recalculatedDiscount = 0;
  let validatedCouponCode: string | null = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });
    if (coupon && coupon.isActive) {
      const now = new Date();
      const notExpired = !coupon.expiresAt || coupon.expiresAt > now;
      const hasUses = coupon.maxUses === null || coupon.usedCount < coupon.maxUses;
      if (notExpired && hasUses) {
        if (coupon.discountType === "percentage") {
          recalculatedDiscount = (recalculatedSubtotal * coupon.discountValue) / 100;
        } else {
          recalculatedDiscount = coupon.discountValue;
        }
        recalculatedDiscount = Math.min(recalculatedDiscount, recalculatedSubtotal);
        validatedCouponCode = coupon.code;
      }
    }
  }

  const recalculatedTotal = Math.max(0, recalculatedSubtotal - recalculatedDiscount);

  // 4. Exact paise comparison — no ±1 tolerance that could be exploited
  const recalculatedPaise = Math.round(recalculatedTotal * 100);
  const clientPaise = Math.round(totalAmount * 100);
  if (recalculatedPaise !== clientPaise) {
    return NextResponse.json(
      { error: "Order amount mismatch. Please restart checkout." },
      { status: 400 }
    );
  }

  // 5. Write everything atomically — order + stock + coupon in one transaction
  const order = await prisma.$transaction(async (tx) => {
    // Idempotency guard — reject duplicate payment IDs
    const duplicate = await tx.order.findFirst({
      where: { paymentId: razorpayPaymentId },
      select: { id: true },
    });
    if (duplicate) {
      return duplicate; // already processed, return existing order
    }

    // Create the order — priceAtPurchase comes from productMap, not the client
    const newOrder = await tx.order.create({
      data: {
        userId: userId ?? null,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: address,
        notes: notes ?? null,
        totalAmount: recalculatedTotal,
        discountAmount: recalculatedDiscount,
        couponCode: validatedCouponCode,
        paymentStatus: "paid",
        paymentId: razorpayPaymentId,
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

    // Decrement stock for variants
    for (const item of items.filter((i) => i.variantId)) {
      await tx.productVariant.update({
        where: { id: item.variantId! },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    // Increment coupon usage (only if coupon was valid)
    if (validatedCouponCode) {
      await tx.coupon.update({
        where: { code: validatedCouponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return newOrder;
  });

  return NextResponse.json({ orderId: order.id });
}
