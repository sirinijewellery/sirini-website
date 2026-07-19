import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { emailSchema } from "@/lib/validation";

// emailSchema normalizes to lowercase (previously this route did NOT), so the
// same address can't create case-duplicate subscriber rows.
const schema = z.object({ email: emailSchema });

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "newsletter", 5, 10 * 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
