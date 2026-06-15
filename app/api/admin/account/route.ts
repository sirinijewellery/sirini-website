import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Admin "My Account": view email/name, edit username (name + login email) and
// password. The current password is required to authorise ANY change. The
// existing password itself can never be read back — it is stored only as a
// bcrypt hash.

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  currentPassword: z.string().min(1, "Enter your current password to save changes"),
  // Empty string = "don't change the password"
  newPassword: z
    .union([z.string().min(8, "New password must be at least 8 characters").max(72), z.literal("")])
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, email, currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  // Gate every change behind the current password.
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const data: { name?: string; email?: string; passwordHash?: string } = {};
  if (name !== user.name) data.name = name;
  if (email !== user.email) data.email = email;
  if (newPassword && newPassword.length > 0) {
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "Nothing to update" });
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data });
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    console.error("[Admin Account Update]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    message: "Account updated successfully",
    // Email/password changes apply to your NEXT sign-in.
    reauth: Boolean(data.email || data.passwordHash),
  });
}
