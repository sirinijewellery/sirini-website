import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature, fetchRazorpayOrder } from "@/lib/payment";
import { auth } from "@/lib/auth";
import { sendNewOrderEmails } from "@/lib/email";
import { getCommerceSettings } from "@/lib/queries/commerce";
import { computeTotals } from "@/lib/commerce/pricing";
import { recordOrphanedPayment } from "@/lib/orphanedPayment";
import { enforceRateLimit } from "@/lib/rateLimit";

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
  // Normalize to lowercase so Order.customerEmail matches lead emails (also
  // lowercase) on a plain, index-using `in` lookup in the leads GET.
  customerEmail: z.string().email().toLowerCase(),
  customerPhone: z.string().regex(/^\d{10}$/),
  couponCode: z.string().optional(),
  // totalAmount / discountAmount from client are used only for cross-check, not stored
  totalAmount: z.number().nonnegative(),
  giftWrap: z.boolean().optional(),
  notes: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Throttle abuse — public, unauthenticated-callable route (same directory as
  // cod/create-order, which already carry this). Invalid signatures are cheap
  // to reject, but each invocation still costs a serverless execution, and a
  // valid-signature flood would hit the Razorpay order-fetch API and write DB
  // rows, so cap it like its siblings.
  // Ceiling is per-IP and Indian mobile traffic is heavily CGNAT'd (many
  // unrelated shoppers share one IP), so keep it high enough that a promo
  // spike of legitimate orders doesn't 429 real customers.
  const limited = enforceRateLimit(req, "checkout-verify", 30, 10 * 60_000);
  if (limited) return limited;

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

  // Mirror the client total EXACTLY via the shared single source of truth —
  // the same computeTotals() that create-order used to set the Razorpay
  // charge amount, so owner-edited rates/fees can never cause a mismatch here.
  const settings = await getCommerceSettings();
  const { total: recalculatedTotal, totalPaise: recalculatedPaise } = computeTotals({
    subtotal: recalculatedSubtotal,
    discount: recalculatedDiscount,
    giftWrap: !!giftWrap,
    settings,
  });

  // 4. Exact paise comparison — no ±1 tolerance that could be exploited.
  // The amount actually charged at Razorpay MUST equal the recalculated cart
  // total — otherwise a cheap payment could be replayed against a pricier cart.
  const clientPaise = Math.round(totalAmount * 100);
  if (recalculatedPaise !== clientPaise || razorpayAmountPaise !== recalculatedPaise) {
    // The payment was already captured (signature + Razorpay fetch above), but
    // the recalculated total no longer matches what was charged — e.g. a coupon
    // was consumed/changed between create-order and here. No Order is written on
    // this path, so flag the captured money as orphaned or it is silently lost.
    await recordOrphanedPayment({
      paymentId: razorpayPaymentId,
      razorpayOrderId,
      amountPaise: razorpayAmountPaise,
      reason: "amount mismatch after capture (coupon race?)",
      customerEmail,
      customerPhone,
    });
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
      // Serialization conflict. This does NOT necessarily mean a concurrent
      // request for the SAME payment is handling it — Serializable isolation
      // aborts on ANY overlapping read/write (e.g. two different customers'
      // orders touching the same product's stock row, or the same coupon
      // row). Re-check for real before assuming this is a harmless duplicate,
      // otherwise a genuinely orphaned captured payment goes unflagged.
      const existing = await prisma.order.findFirst({
        where: { paymentId: razorpayPaymentId },
        select: { id: true },
      });
      if (existing) {
        // Confirmed: the concurrent winner already created this exact order.
        return NextResponse.json({ orderId: existing.id });
      }
      // Genuine orphan — payment was captured but this order lost the
      // serialization race and was never created. Flag it like any other
      // failed-after-payment case so the owner can refund/fulfil it.
      await recordOrphanedPayment({
        paymentId: razorpayPaymentId,
        razorpayOrderId,
        amountPaise: razorpayAmountPaise,
        reason: "Serialization conflict during order creation — payment captured but order not created",
        customerEmail,
        customerPhone,
      });
      return NextResponse.json(
        {
          error:
            "We couldn't confirm your order due to a temporary conflict. We've flagged your payment for review — please contact us and we'll sort it out.",
        },
        { status: 409 }
      );
    }
    const msg = err instanceof Error ? err.message : "Order creation failed";
    // The payment was captured (signature + amount verified above) but the
    // order could not be created — flag it so the money is never silently lost
    // and the owner can refund/fulfil it. Best-effort; never masks the error.
    await recordOrphanedPayment({
      paymentId: razorpayPaymentId,
      razorpayOrderId,
      amountPaise: razorpayAmountPaise,
      reason: msg.includes("Insufficient stock")
        ? "Item sold out mid-payment — order not created"
        : `Order creation failed after payment: ${msg}`,
      customerEmail,
      customerPhone,
    });
    if (msg.includes("Insufficient stock")) {
      return NextResponse.json(
        {
          error:
            "Sorry, an item went out of stock right as you paid. We've flagged your payment for a refund — please contact us and we'll sort it out.",
        },
        { status: 409 }
      );
    }
    throw err; // re-throw unexpected errors (already recorded above)
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
