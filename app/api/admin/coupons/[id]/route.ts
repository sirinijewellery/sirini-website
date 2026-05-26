import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must be at most 20 characters")
      .regex(/^[A-Z0-9-]+$/, "Code can only contain letters, numbers, and dashes"),
    discountType: z.enum(["percentage", "flat"]),
    discountValue: z.number().positive("Discount value must be positive"),
    minOrderAmount: z.number().positive().optional().nullable(),
    maxUses: z.number().int().positive().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    isActive: z.boolean(),
  })
  .refine(
    (data) =>
      data.discountType !== "percentage" ||
      (data.discountValue >= 1 && data.discountValue <= 100),
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

  // Auto-uppercase code before validation
  if (body && typeof body === "object" && "code" in body) {
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

  // Validate expiresAt is a real date before touching the DB
  let expiresAtDate: Date | null = null;
  if (expiresAt) {
    expiresAtDate = new Date(expiresAt);
    if (isNaN(expiresAtDate.getTime())) {
      return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 });
    }
  }

  // Verify coupon exists (prevent unhandled P2025 → 500)
  const couponExists = await prisma.coupon.findUnique({ where: { id }, select: { id: true } });
  if (!couponExists) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  // Check code conflict (excluding this coupon)
  const existing = await prisma.coupon.findFirst({
    where: { code, NOT: { id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A coupon with this code already exists" },
      { status: 409 }
    );
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      code,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount ?? null,
      maxUses: maxUses ?? null,
      expiresAt: expiresAtDate,
      isActive,
    },
  });

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

  await prisma.coupon.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
