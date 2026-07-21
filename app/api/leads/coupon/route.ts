import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rateLimit";
import { emailSchema } from "@/lib/validation";
import { isAuthorizedByApiKey } from "@/lib/apiKeyAuth";
import { mintLeadCoupon, CouponCodeExhaustedError } from "@/lib/mintLeadCoupon";

// Machine-to-machine single-use coupon minting for the lead-nurture flow (a
// welcome discount emailed to captured leads). Same fail-closed, timing-safe
// shared-secret auth as the marketing-metrics and lead-export routes. The
// actual minting logic lives in lib/mintLeadCoupon.ts so the public
// POST /api/leads handler can call it in-process without this key.

const mintSchema = z.object({
  discountPercent: z.number().int().min(5).max(10),
  expiresInDays: z.number().int().min(1).max(90).default(60),
  // Optional lead this coupon is minted for. When present it's stored on the
  // coupon (unique), which makes minting idempotent per email.
  email: emailSchema.optional(),
});

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

  try {
    const coupon = await mintLeadCoupon({ email, discountPercent, expiresInDays });
    return NextResponse.json({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      expiresAt: coupon.expiresAt,
    });
  } catch (e) {
    if (e instanceof CouponCodeExhaustedError) {
      return NextResponse.json({ error: "Could not generate a unique code" }, { status: 500 });
    }
    console.error("[Lead coupon mint error]", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
