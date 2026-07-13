import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendNewOrderEmails } from "@/lib/email";
import { getCommerceSettings } from "@/lib/queries/commerce";
import { computeTotals } from "@/lib/commerce/pricing";
import { enforceRateLimit } from "@/lib/rateLimit";

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
  paymentMethod: z.enum(["cod", "online"]).optional(),
});

export async function POST(req: NextRequest) {
  // Throttle abuse — this route creates a real DB order and decrements stock
  // WITHOUT taking payment, so an unbounded flood could spam fake orders / the
  // owner's order-notification inbox and exhaust inventory.
  // Ceiling is per-IP and Indian mobile traffic is heavily CGNAT'd (many
  // unrelated shoppers share one IP), so keep it high enough that a promo
  // spike of legitimate orders doesn't 429 real customers.
  const limited = enforceRateLimit(req, "checkout-cod", 30, 10 * 60_000);
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

  // Mirror the client total EXACTLY via the shared single source of truth.
  // Fees/rates are owner-configurable; defaults equal the previous hardcoded
  // values (3% GST, ₹49 gift wrap, free shipping).
  const settings = await getCommerceSettings();
  const { total: recalculatedTotal, totalPaise: recalculatedPaise } = computeTotals({
    subtotal: recalculatedSubtotal,
    discount: recalculatedDiscount,
    giftWrap: !!giftWrap,
    settings,
  });

  // 3. Exact paise comparison — no ±1 tolerance that could be exploited
  const clientPaise = Math.round(totalAmount * 100);
  if (recalculatedPaise !== clientPaise) {
    return NextResponse.json(
      { error: "Order amount mismatch. Please restart checkout." },
      { status: 400 }
    );
  }

  // 3b. Enforce Cash-on-Delivery availability server-side. A genuine COD order
  // (paymentMethod "cod") must be rejected when COD is disabled, or when the
  // total exceeds the configured cap. Free orders that selected online payment
  // (paymentMethod "online") are unaffected.
  const isCodOrder = parsed.data.paymentMethod === "cod" || parsed.data.paymentMethod === undefined;
  if (isCodOrder && recalculatedTotal > 0) {
    if (!settings.codEnabled) {
      return NextResponse.json(
        { error: "Cash on Delivery is currently unavailable. Please pay online." },
        { status: 400 }
      );
    }
    if (settings.codMaxOrder > 0 && recalculatedTotal > settings.codMaxOrder) {
      return NextResponse.json(
        {
          error: `Cash on Delivery is available only for orders up to ₹${settings.codMaxOrder}. Please pay online.`,
        },
        { status: 400 }
      );
    }
  }

  // Payment method / status.
  //  - A free order (₹0, e.g. 100%-off coupon) is fully paid up front, so it is
  //    recorded as paymentStatus "paid"; paymentMethod reflects whatever the
  //    customer actually selected (defaults to "online" for a free order).
  //  - A genuine cash-on-delivery order is "cod"/"cod".
  // A non-free order through this route is ALWAYS cash-on-delivery — never
  // honour a client-sent "online" label for an order no money was taken for.
  const isFree = recalculatedTotal <= 0;
  const paymentMethod = isFree
    ? parsed.data.paymentMethod ?? "online"
    : "cod";
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
        {
          error:
            "Sorry, an item went out of stock. Please update your cart.",
        },
        { status: 409 }
      );
    }
    if (msg.includes("Coupon usage limit")) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit." },
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
