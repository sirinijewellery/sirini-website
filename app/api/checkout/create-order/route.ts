import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/payment";
import { getCommerceSettings } from "@/lib/queries/commerce";
import { computeTotals } from "@/lib/commerce/pricing";

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
        quantity: z.number().int().positive().max(100),
      })
    )
    .min(1, "Cart is empty")
    .max(50),
  address: addressSchema,
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  couponCode: z.string().optional(),
  giftWrap: z.boolean().optional(),
  notes: z.string().optional(),
  savedAddressId: z.string().optional(),
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

  const { items, couponCode, giftWrap } = parsed.data;

  // Fetch product prices + stock from DB — never trust client prices
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true, name: true, stock: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more products not found" },
      { status: 400 }
    );
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate stock at the product level (sum quantity per product)
  const qtyByProduct = new Map<string, number>();
  for (const item of items) {
    qtyByProduct.set(
      item.productId,
      (qtyByProduct.get(item.productId) ?? 0) + item.quantity
    );
  }
  for (const [productId, qty] of qtyByProduct) {
    const product = productMap.get(productId)!;
    if (product.stock < qty) {
      return NextResponse.json(
        { error: `Insufficient stock for "${product.name}"` },
        { status: 400 }
      );
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

    if (coupon.discountType.toLowerCase() === "percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  // Mirror the client total EXACTLY via the shared single source of truth.
  // Fees/rates are owner-configurable; defaults equal the previous hardcoded
  // values (3% GST, ₹49 gift wrap, free shipping).
  const settings = await getCommerceSettings();
  const { total, totalPaise: amountInPaise } = computeTotals({
    subtotal,
    discount: discountAmount,
    giftWrap: !!giftWrap,
    settings,
  });

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
