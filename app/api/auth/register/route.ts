import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { emailSchema } from "@/lib/validation";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  // Normalized (trimmed + lowercased) so the same address can't register twice
  // with different casing.
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    // bcrypt only uses the first 72 bytes; also prevents oversized-input DoS
    .max(72, "Password must be at most 72 characters"),
});

export async function POST(request: Request) {
  // Throttle abuse — each attempt runs a cost-12 bcrypt hash (expensive) and
  // can be used to enumerate registered emails via the 409 response.
  const limited = enforceRateLimit(request, "register", 5, 10 * 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    // Rely on the DB unique constraint and catch P2002 — avoids TOCTOU race
    await prisma.user.create({
      data: { name, email, passwordHash },
    });

    // Never return internal IDs to the client
    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    // Prisma unique constraint violation — email already taken
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    console.error("[Register Error]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
