import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// Shared single-use coupon minting for the lead-nurture / welcome-discount flow.
// Extracted from app/api/leads/coupon/route.ts so it can be called both from
// that key-authed HTTP endpoint AND in-process from the public POST /api/leads
// handler (no HTTP hop, no API key on the wire). Idempotent per email: a second
// mint for the same address returns the existing coupon instead of a new one.

export interface MintLeadCouponArgs {
  email?: string;
  discountPercent: number;
  expiresInDays: number;
}

export interface MintedCoupon {
  code: string;
  discountPercent: number;
  expiresAt: Date;
}

// Thrown when three consecutive random codes all collide (astronomically
// unlikely). Lets the HTTP wrapper reproduce its original distinct 500 body
// for this case without string-matching on a message.
export class CouponCodeExhaustedError extends Error {
  constructor() {
    super("Could not generate a unique code");
    this.name = "CouponCodeExhaustedError";
  }
}

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

export async function mintLeadCoupon({
  email,
  discountPercent,
  expiresInDays,
}: MintLeadCouponArgs): Promise<MintedCoupon> {
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
      return {
        code: existing.code,
        discountPercent: existing.discountValue,
        expiresAt: existing.expiresAt!,
      };
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
      return { code, discountPercent, expiresAt };
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
            return {
              code: winner.code,
              discountPercent: winner.discountValue,
              expiresAt: winner.expiresAt!,
            };
          }
        }
        // Code collision — try a new code.
        continue;
      }
      throw e;
    }
  }

  throw new CouponCodeExhaustedError();
}
