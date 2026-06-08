import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendNewOrderEmails } from "@/lib/email";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
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
  paymentMethod: z.enum(["cod", "online"]).optional(),
});

// ₹49 gift-wrap fee (kept in sync with the client-side fee in CheckoutForm)
const GIFT_WRAP_FEE = 49;

export async function POST(req: NextRequest) {
  // Use server-side session for userId — never trust client-supplied value
  const session = await auth();

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

  // Always use authenticated session userId — ignore any client-supplied value
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
      }
    }
  }

  // Gift-wrap fee — server-authoritative; only added when the client opted in
  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0;

  // Mirror the client total EXACTLY: discountedSubtotal + 3% GST + gift wrap.
  const discountedSubtotal = Math.max(0, recalculatedSubtotal - recalculatedDiscount);
  const gst = Math.round(discountedSubtotal * 0.03);
  const recalculatedTotal = Math.max(0, discountedSubtotal + gst + giftWrapFee);

  // 3. Exact paise comparison — no ±1 tolerance that could be exploited
  const recalculatedPaise = Math.round(recalculatedTotal * 100);
  const clientPaise = Math.round(totalAmount * 100);
  if (recalculatedPaise !== clientPaise) {
    return NextResponse.json(
      { error: "Order amount mismatch. Please restart checkout." },
      { status: 400 }
    );
  }

  // Payment method / status.
  //  - A free order (₹0, e.g. 100%-off coupon) is fully paid up front, so it is
  //    recorded as paymentStatus "paid"; paymentMethod reflects whatever the
  //    customer actually selected (defaults to "online" for a free order).
  //  - A genuine cash-on-delivery order is "cod"/"cod".
  const isFree = recalculatedTotal <= 0;
  const paymentMethod =
    parsed.data.paymentMethod ?? (isFree ? "online" : "cod");
  const paymentStatus = isFree ? "paid" : "cod";

  // 4. Write everything atomically — order + stock + coupon in one transaction
  let order: { id: string; orderNumber: number };
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

      // Re-check stock inside the tx (prevent overselling)
      const fresh = await tx.product.findMany({
        where: { id: { in: [...qtyByProduct.keys()] } },
        select: { id: true, stock: true, name: true },
      });
      for (const p of fresh) {
        const need = qtyByProduct.get(p.id)!;
        if (p.stock < need) {
          throw new Error(`Insufficient stock for ${p.name}`);
        }
      }

      // Create the order — priceAtPurchase comes from productMap, not the client
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
          paymentStatus,
          paymentMethod,
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
        select: { id: true, orderNumber: true },
      });

      // Decrement product stock
      for (const [productId, qty] of qtyByProduct) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: qty } },
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Order creation failed";
    if (msg.includes("Insufficient stock")) {
      return NextResponse.json(
        {
          error:
            "Sorry, an item went out of stock. Please update your cart.",
        },
        { status: 409 }
      );
    }
    throw err; // re-throw unexpected errors
  }

  // Fire-and-forget admin notification — never let email block the response.
  try {
    await sendNewOrderEmails({
      orderNumber: order.orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount: recalculatedTotal,
      paymentMethod,
      shippingAddress: address,
      items: items.map((item) => ({
        name: productMap.get(item.productId)!.name,
        quantity: item.quantity,
      })),
    });
  } catch {
    // ignore — email failure must not affect the order
  }

  return NextResponse.json({ orderId: order.id });
}
