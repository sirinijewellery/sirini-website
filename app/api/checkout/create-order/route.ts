import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/payment";

const addressSchema = z.object({
  line1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  label: z.string().optional(),
});

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Cart is empty"),
  address: addressSchema,
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  couponCode: z.string().optional(),
  giftWrap: z.boolean().optional(),
  notes: z.string().optional(),
  savedAddressId: z.string().optional(),
});

// ₹49 gift-wrap fee (kept in sync with the client-side fee in CheckoutForm)
const GIFT_WRAP_FEE = 49;

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

  const { items, couponCode, giftWrap } = parsed.data;

  // Fetch product prices from DB — never trust client prices
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

  // Validate stock for each item with a variant
  const variantIds = items.map((i) => i.variantId).filter(Boolean) as string[];
  const variants =
    variantIds.length > 0
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, stockQuantity: true, productId: true },
        })
      : [];
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const item of items) {
    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: `Variant not found for product ${item.productId}` },
          { status: 400 }
        );
      }
      // Bug fix: ensure the variant actually belongs to the requested product
      if (variant.productId !== item.productId) {
        return NextResponse.json(
          { error: "Invalid variant for product" },
          { status: 400 }
        );
      }
      if (variant.stockQuantity < item.quantity) {
        const product = productMap.get(item.productId);
        return NextResponse.json(
          { error: `Insufficient stock for "${product?.name ?? item.productId}"` },
          { status: 400 }
        );
      }
    }
  }

  // Calculate subtotal
  let subtotal = 0;
  for (const item of items) {
    const product = productMap.get(item.productId)!;
    subtotal += product.price * item.quantity;
  }

  // Validate coupon if provided
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid or inactive coupon" }, { status: 400 });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }
    if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`,
        },
        { status: 400 }
      );
    }

    if (coupon.discountType === "percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  // Gift-wrap fee — server-authoritative; only added when the client opted in.
  // Mirror the client total EXACTLY: discountedSubtotal + 3% GST + gift wrap.
  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const gst = Math.round(discountedSubtotal * 0.03);
  const total = Math.max(1, discountedSubtotal + gst + giftWrapFee);
  const amountInPaise = Math.round(total * 100);

  // Create Razorpay order
  let razorpayOrder: Awaited<ReturnType<typeof createRazorpayOrder>>;
  try {
    razorpayOrder = await createRazorpayOrder(amountInPaise, `rcpt_${Date.now()}`);
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json(
      { error: "Payment gateway error. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    razorpayOrderId: razorpayOrder.id,
    amount: total,
    discountAmount,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
