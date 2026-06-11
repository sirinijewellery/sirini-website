import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature, fetchRazorpayOrder } from "@/lib/payment";
import { auth } from "@/lib/auth";
import { sendNewOrderEmails } from "@/lib/email";

const bodySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variantId: z.string().optional(),
      quantity: z.number().int().positive().max(100),
      // priceAtPurchase is intentionally ignored — we use server DB price
    })
  ).min(1).max(50),
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
  totalAmount: z.number().nonnegative(),
  giftWrap: z.boolean().optional(),
  notes: z.string().optional(),
  userId: z.string().optional(),
});

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
    giftWrap,
    notes,
  } = parsed.data;

  // Always use authenticated session userId — ignore client-supplied value
  const userId = session?.user?.id ?? null;

  // 1. Verify Razorpay signature — proves the payment is authentic
  const isValid = verifyRazorpaySignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );
  if (!isValid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // 1b. Fetch the order from Razorpay — the signature only proves the
  // (orderId, paymentId) pair is authentic, NOT how much was paid. The amount
  // is compared against the server-recalculated total in step 4.
  let razorpayAmountPaise: number;
  try {
    const rzpOrder = await fetchRazorpayOrder(razorpayOrderId);
    razorpayAmountPaise = Number(rzpOrder.amount);
  } catch (err) {
    console.error("Razorpay order fetch failed:", err);
    return NextResponse.json(
      { error: "Payment gateway error. Please try again." },
      { status: 502 }
    );
  }

  // 2. Re-fetch product prices from DB — never trust client-supplied prices
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true, name: true },
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
      const meetsMin = coupon.minOrderAmount === null || recalculatedSubtotal >= coupon.minOrderAmount;
      if (notExpired && hasUses && meetsMin) {
        if (coupon.discountType.toLowerCase() === "percentage") {
          recalculatedDiscount = (recalculatedSubtotal * coupon.discountValue) / 100;
        } else {
          recalculatedDiscount = coupon.discountValue;
        }
        recalculatedDiscount = Math.min(recalculatedDiscount, recalculatedSubtotal);
        validatedCouponCode = coupon.code;
      }
    }
  }

  // Mirror the client total EXACTLY: discountedSubtotal + 3% GST + gift wrap.
  const giftWrapFee = giftWrap ? 49 : 0;
  const discountedSubtotal = Math.max(0, recalculatedSubtotal - recalculatedDiscount);
  const gst = Math.round(discountedSubtotal * 0.03);
  const recalculatedTotal = Math.max(0, discountedSubtotal + gst + giftWrapFee);

  // 4. Exact paise comparison — no ±1 tolerance that could be exploited.
  // The amount actually charged at Razorpay MUST equal the recalculated cart
  // total — otherwise a cheap payment could be replayed against a pricier cart.
  const recalculatedPaise = Math.round(recalculatedTotal * 100);
  const clientPaise = Math.round(totalAmount * 100);
  if (recalculatedPaise !== clientPaise || razorpayAmountPaise !== recalculatedPaise) {
    return NextResponse.json(
      { error: "Order amount mismatch. Please restart checkout." },
      { status: 400 }
    );
  }

  // 5. Write everything atomically — order + stock + coupon in one transaction
  let order: { id: string; orderNumber: number };
  let alreadyExisted = false;
  try {
  order = await prisma.$transaction(async (tx) => {
    // Idempotency guard — reject duplicate payment IDs
    const duplicate = await tx.order.findFirst({
      where: { paymentId: razorpayPaymentId },
      select: { id: true, orderNumber: true },
    });
    if (duplicate) {
      alreadyExisted = true;
      return duplicate; // already processed, return existing order
    }

    // Sum quantity per product
    const qtyByProduct = new Map<string, number>();
    for (const item of items) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.quantity
      );
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
        paymentMethod: "online",
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
      select: { id: true, orderNumber: true },
    });

    // Decrement product stock — conditional on sufficient stock so two
    // concurrent orders can never drive stock negative (oversell)
    for (const [productId, qty] of qtyByProduct) {
      const res = await tx.product.updateMany({
        where: { id: productId, stock: { gte: qty } },
        data: { stock: { decrement: qty } },
      });
      if (res.count === 0) {
        throw new Error(`Insufficient stock for ${productMap.get(productId)!.name}`);
      }
    }

    // Increment coupon usage (only if coupon was valid)
    if (validatedCouponCode) {
      await tx.coupon.update({
        where: { code: validatedCouponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return newOrder;
  }, { isolationLevel: "Serializable" });
  // Serializable: paymentId has no unique constraint, so the findFirst-then-
  // create idempotency guard above is only race-safe at this isolation level.
  } catch (err) {
    if ((err as { code?: string }).code === "P2034") {
      // Serialization conflict — a concurrent request for the same payment won
      return NextResponse.json(
        { error: "This payment is already being processed. Please check your orders." },
        { status: 409 }
      );
    }
    const msg = err instanceof Error ? err.message : "Order creation failed";
    if (msg.includes("Insufficient stock")) {
      return NextResponse.json({ error: "Sorry, an item went out of stock. Please update your cart." }, { status: 409 });
    }
    throw err; // re-throw unexpected errors
  }

  // Fire-and-forget admin notification — only for a freshly-created order.
  if (!alreadyExisted) {
    try {
      await sendNewOrderEmails({
        orderNumber: order.orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        totalAmount: recalculatedTotal,
        paymentMethod: "online",
        shippingAddress: address,
        items: items.map((item) => ({
          name: productMap.get(item.productId)!.name,
          quantity: item.quantity,
        })),
      });
    } catch {
      // ignore — email failure must not affect the order
    }
  }

  return NextResponse.json({ orderId: order.id });
}
