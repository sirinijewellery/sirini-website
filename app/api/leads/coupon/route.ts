import { NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Machine-to-machine single-use coupon minting for the lead-nurture flow (a
// welcome discount emailed to captured leads). Same fail-closed, timing-safe
// shared-secret auth as the marketing-metrics and lead-export routes.
function isAuthorized(req: Request): boolean {
  const expectedSecret = process.env.LEADS_API_KEY;
  if (!expectedSecret) return false; // fail closed if the env var is unset

  const provided = Buffer.from(req.headers.get("x-api-key") ?? "");
  const expected = Buffer.from(expectedSecret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

const mintSchema = z.object({
  discountPercent: z.number().int().min(5).max(10),
  expiresInDays: z.number().int().min(1).max(90).default(60),
});

// Unambiguous alphabet (no 0/O/1/I) — 32 chars, which divides 256 evenly so a
// `byte % 32` index has no modulo bias.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `SIRINI-${suffix}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = mintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { discountPercent, expiresInDays } = parsed.data;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // Retry on the (astronomically unlikely) unique-code collision — up to 3
  // fresh codes before giving up.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    try {
      await prisma.coupon.create({
        data: {
          code,
          // Case-insensitive at the validators, but "percentage" is the
          // canonical string the admin UI and checkout routes use.
          discountType: "percentage",
          discountValue: discountPercent,
          maxUses: 1,
          isActive: true,
          expiresAt,
        },
      });
      return NextResponse.json({ code, discountPercent, expiresAt });
    } catch (e) {
      const isUniqueCollision =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code: string }).code === "P2002";
      if (isUniqueCollision) continue; // try a new code
      console.error("[Lead coupon mint error]", e);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not generate a unique code" }, { status: 500 });
}
