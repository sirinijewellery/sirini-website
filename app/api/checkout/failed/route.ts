import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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
