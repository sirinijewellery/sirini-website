import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";
import { emailSchema } from "@/lib/validation";
import { isAuthorizedByApiKey } from "@/lib/apiKeyAuth";

// Machine-to-machine single-use coupon minting for the lead-nurture flow (a
// welcome discount emailed to captured leads). Same fail-closed, timing-safe
// shared-secret auth as the marketing-metrics and lead-export routes.

const mintSchema = z.object({
  discountPercent: z.number().int().min(5).max(10),
  expiresInDays: z.number().int().min(1).max(90).default(60),
  // Optional lead this coupon is minted for. When present it's stored on the
  // coupon (unique), which makes minting idempotent per email.
  email: emailSchema.optional(),
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

function isP2002(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

export async function POST(request: Request) {
  // Mutates (creates real coupon rows), so throttle even though the key-auth
  // already makes this non-public — defense in depth if the key is ever leaked.
  const limited = enforceRateLimit(request, "coupon-mint", 10, 10 * 60_000);
  if (limited) return limited;

  if (!isAuthorizedByApiKey(request, "LEADS_API_KEY")) {
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

  const { discountPercent, expiresInDays, email } = parsed.data;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // Idempotent per lead: if a coupon was already minted for this email, return
  // it instead of minting another — re-runs of the nurture job must not pile
  // up duplicate coupons. (Belt; the P2002 catch below is the suspenders for
  // the race where two mints for the same email pass this check concurrently.)
  if (email) {
    const existing = await prisma.coupon.findUnique({
      where: { issuedToEmail: email },
      select: { code: true, discountValue: true, expiresAt: true },
    });
    if (existing) {
      return NextResponse.json({
        code: existing.code,
        discountPercent: existing.discountValue,
        expiresAt: existing.expiresAt,
      });
    }
  }

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
          issuedToEmail: email ?? null,
        },
      });
      return NextResponse.json({ code, discountPercent, expiresAt });
    } catch (e) {
      if (isP2002(e)) {
        // The violated constraint is either `issuedToEmail` (a concurrent mint
        // for the same email won the race — return its coupon, idempotent) or
        // `code` (collision — retry with a fresh code). Deliberately NOT
        // dispatching on e.meta.target: its shape varies across Prisma driver
        // adapters (string vs array vs constraint name), so re-reading by
        // email is the only reliable disambiguation.
        if (email) {
          const winner = await prisma.coupon.findUnique({
            where: { issuedToEmail: email },
            select: { code: true, discountValue: true, expiresAt: true },
          });
          if (winner) {
            return NextResponse.json({
              code: winner.code,
              discountPercent: winner.discountValue,
              expiresAt: winner.expiresAt,
            });
          }
        }
        // Code collision — try a new code.
        continue;
      }
      console.error("[Lead coupon mint error]", e);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not generate a unique code" }, { status: 500 });
}
