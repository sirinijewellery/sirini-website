import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.error("[Checkout] Payment failed for Razorpay order:", body?.razorpayOrderId ?? "unknown");
  } catch {
    // Non-critical — log failure silently
  }
  return NextResponse.json({ ok: true });
}
