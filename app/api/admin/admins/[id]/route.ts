import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(40)
    .regex(/^[a-z0-9._-]+$/, "Username can use lowercase letters, numbers, dots, hyphens and underscores")
    .optional(),
  name: z.string().trim().min(1).max(100).optional(),
  // Empty string = leave password unchanged.
  password: z.union([z.string().min(4, "Password must be at least 4 characters").max(72), z.literal("")]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { username, name, password } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !target.isAdmin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  const data: { username?: string; email?: string; name?: string; passwordHash?: string } = {};
  if (username && username !== target.username) {
    const clash = await prisma.user.findFirst({ where: { username, id: { not: id } } });
    if (clash) return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    data.username = username;
    // Keep a synthetic email in sync only for username-based (.local) accounts.
    if (target.email.endsWith("@sirini.local")) data.email = `${username}@sirini.local`;
  }
  if (name) data.name = name;
  if (password && password.length > 0) data.passwordHash = await bcrypt.hash(password, 12);

  if (Object.keys(data).length === 0) return NextResponse.json({ message: "Nothing to update" });

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, name: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    }
    console.error("[Admin update]", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "You can't delete your own account while signed in." }, { status: 400 });
  }
  const adminCount = await prisma.user.count({ where: { isAdmin: true } });
  if (adminCount <= 1) {
    return NextResponse.json({ error: "Can't remove the last remaining admin." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !target.isAdmin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  // Demote rather than hard-delete if the account has linked data (orders/reviews).
  const orders = await prisma.order.count({ where: { userId: id } });
  if (orders > 0) {
    await prisma.user.update({ where: { id }, data: { isAdmin: false } });
    return NextResponse.json({ message: "Admin access removed (account kept — it has order history)." });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Admin removed" });
}
