import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Every field is optional so callers can PATCH-style update just what changed
// (e.g. the active-toggle sends only `isActive`, leaving expiresAt untouched so
// its time-of-day is never truncated to UTC midnight). Only keys actually
// present in the body are written to the DB.
const updateSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must be at most 20 characters")
      .regex(/^[A-Z0-9-]+$/, "Code can only contain letters, numbers, and dashes")
      .optional(),
    discountType: z.enum(["percentage", "flat"]).optional(),
    discountValue: z.number().positive("Discount value must be positive").optional(),
    minOrderAmount: z.number().positive().optional().nullable(),
    maxUses: z.number().int().positive().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.discountType !== "percentage" ||
      (data.discountValue != null &&
        data.discountValue >= 1 &&
        data.discountValue <= 100),
    {
      message: "Percentage discount must be between 1 and 100",
      path: ["discountValue"],
    }
  );

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Auto-uppercase code before validation (only when a code was sent)
  if (
    body &&
    typeof body === "object" &&
    "code" in body &&
    (body as Record<string, unknown>).code != null
  ) {
    (body as Record<string, unknown>).code = String(
      (body as Record<string, unknown>).code
    ).toUpperCase();
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive } =
    result.data;

  // Verify coupon exists (prevent unhandled P2025 → 500)
  const couponExists = await prisma.coupon.findUnique({ where: { id }, select: { id: true } });
  if (!couponExists) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  // Build a partial update — only touch fields that were actually sent. This is
  // what lets the active-toggle change `isActive` alone without rewriting (and
  // truncating) expiresAt. `undefined` = key omitted (skip); `null` = clear.
  const data: {
    code?: string;
    discountType?: "percentage" | "flat";
    discountValue?: number;
    minOrderAmount?: number | null;
    maxUses?: number | null;
    expiresAt?: Date | null;
    isActive?: boolean;
  } = {};

  if (code !== undefined) {
    // Check code conflict (excluding this coupon)
    const existing = await prisma.coupon.findFirst({ where: { code, NOT: { id } } });
    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }
    data.code = code;
  }
  if (discountType !== undefined) data.discountType = discountType;
  if (discountValue !== undefined) data.discountValue = discountValue;
  if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount ?? null;
  if (maxUses !== undefined) data.maxUses = maxUses ?? null;
  if (isActive !== undefined) data.isActive = isActive;
  if (expiresAt !== undefined) {
    // null clears the expiry; a string must be a real date before we touch the DB.
    if (expiresAt === null) {
      data.expiresAt = null;
    } else {
      const expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 });
      }
      data.expiresAt = expiresAtDate;
    }
  }

  const coupon = await prisma.coupon.update({ where: { id }, data });

  return NextResponse.json(coupon);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Verify coupon exists (prevent unhandled P2025 → 500)
  const existing = await prisma.coupon.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  await prisma.coupon.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
