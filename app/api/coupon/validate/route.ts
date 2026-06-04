import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
  orderAmount: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { code, orderAmount } = parsed.data;

    const coupon = await prisma.coupon.findUnique({ where: { code } });

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
        ? Math.round((orderAmount * coupon.discountValue) / 100)
        : Math.min(coupon.discountValue, orderAmount);

    return NextResponse.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
    });
  } catch (error) {
    console.error("[Coupon validate error]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
