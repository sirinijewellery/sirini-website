import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1).max(50),
  orderAmount: z.number().positive(),
});

export async function POST(request: Request) {
  // Throttle abuse — unauthenticated, DB-backed lookup that could otherwise be
  // used to brute-force/enumerate coupon codes.
  const limited = enforceRateLimit(request, "coupon-validate", 20, 10 * 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { code, orderAmount } = parsed.data;

    // Uppercase to match how checkout routes look coupons up — otherwise a
    // customer typing "test1" is told the coupon doesn't exist even though
    // checkout would accept it.
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Coupon code not found or inactive" }, { status: 404 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
    }

    if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order of ₹${coupon.minOrderAmount} required for this coupon` },
        { status: 400 }
      );
    }

    const discountAmount =
      coupon.discountType.toUpperCase() === "PERCENTAGE"
        ? Math.min(Math.round((orderAmount * coupon.discountValue) / 100), orderAmount)
        : Math.min(coupon.discountValue, orderAmount);

    return NextResponse.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      // Sent so the client can drop the discount if the cart later falls
      // below the coupon's minimum (mirrors the checkout routes' meetsMin).
      minOrderAmount: coupon.minOrderAmount,
    });
  } catch (error) {
    console.error("[Coupon validate error]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
