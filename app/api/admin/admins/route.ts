import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(40, "Username is too long")
  .regex(/^[a-z0-9._-]+$/, "Username can use lowercase letters, numbers, dots, hyphens and underscores");

const createSchema = z.object({
  username: usernameSchema,
  name: z.string().trim().min(1).max(100).optional(),
  password: z.string().min(4, "Password must be at least 4 characters").max(72),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, username: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ admins, currentUserId: session.user.id });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { username, name, password } = parsed.data;
  const email = `${username}@sirini.local`; // synthetic; admins sign in with username

  const clash = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (clash) return NextResponse.json({ error: "That username is already taken" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: { username, email, name: name ?? username, passwordHash, isAdmin: true },
    select: { id: true, username: true, email: true, name: true, createdAt: true },
  });
  return NextResponse.json(admin, { status: 201 });
}
