import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rateLimit";

const addressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required").max(300),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  label: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });

  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "addresses", 20, 10 * 60_000);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = addressSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { line1, city, state, pincode, label, isDefault } = result.data;

  const existingAddresses = await prisma.address.findMany({
    where: { userId },
    select: { id: true },
  });

  if (existingAddresses.length >= 5) {
    return NextResponse.json(
      { error: "Maximum 5 addresses allowed" },
      { status: 400 }
    );
  }

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      line1,
      city,
      state,
      pincode,
      label: label ?? null,
      isDefault: isDefault ?? existingAddresses.length === 0,
    },
  });

  return NextResponse.json(address, { status: 201 });
}
