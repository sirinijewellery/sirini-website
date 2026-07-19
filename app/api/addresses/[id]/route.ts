import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rateLimit";

const updateSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required").max(300).optional(),
  city: z.string().min(1, "City is required").max(100).optional(),
  state: z.string().min(1, "State is required").max(100).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits")
    .optional(),
  label: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = enforceRateLimit(request, "addresses", 20, 10 * 60_000);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { isDefault, ...rest } = result.data;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({
    where: { id },
    data: {
      ...rest,
      ...(isDefault !== undefined ? { isDefault } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = enforceRateLimit(request, "addresses", 20, 10 * 60_000);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.address.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
