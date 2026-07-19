import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Throttle abuse — public, unauthenticated logging endpoint; unbounded calls
  // would still cost a serverless execution per hit.
  const limited = enforceRateLimit(req, "checkout-failed", 30, 10 * 60_000);
  if (limited) return limited;

  try {
    const body = await req.json();
    // Only log a bounded string — never raw client-controlled values
    const orderId =
      typeof body?.razorpayOrderId === "string"
        ? body.razorpayOrderId.slice(0, 64)
        : "unknown";
    console.error("[Checkout] Payment failed for Razorpay order:", orderId);
  } catch {
    // Non-critical — log failure silently
  }
  return NextResponse.json({ ok: true });
}
