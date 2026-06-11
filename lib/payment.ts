import crypto from "crypto";
import Razorpay from "razorpay";

// Lazy singleton — avoids module-load error when env vars aren't set during build
let _razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not configured.");
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

export async function createRazorpayOrder(amountInPaise: number, receiptId: string) {
  return getRazorpay().orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: receiptId,
  });
}

// Fetch an order from Razorpay — used by the verify route to confirm the
// amount actually paid matches the server-recalculated cart total.
export async function fetchRazorpayOrder(orderId: string) {
  return getRazorpay().orders.fetch(orderId);
}

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  }
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  // Timing-safe comparison — a plain === leaks timing information
  const sigBuf = Buffer.from(razorpaySignature);
  const expBuf = Buffer.from(expected);
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}
