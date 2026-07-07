import { prisma } from "@/lib/prisma";
import { sendOrphanedPaymentAlert } from "@/lib/email";

// Records a Razorpay payment that was captured but for which no Order exists —
// e.g. the customer's confirmation request dropped after paying, or the last
// unit sold out mid-payment. Called by BOTH the verify route (deterministic:
// it knows the payment succeeded and order creation just threw) and the webhook
// (safety net for when the browser never called verify at all).
//
// Idempotent on paymentId (unique column + the existence checks below), and
// fully best-effort: it NEVER throws, so a logging/email hiccup can't mask the
// original error path to the customer.
export async function recordOrphanedPayment(input: {
  paymentId: string;
  razorpayOrderId?: string | null;
  amountPaise?: number | null;
  reason: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<void> {
  try {
    // If an order already exists for this payment, it isn't orphaned.
    const existingOrder = await prisma.order.findFirst({
      where: { paymentId: input.paymentId },
      select: { id: true },
    });
    if (existingOrder) return;

    // Already recorded (and the owner already alerted) — don't duplicate.
    const existing = await prisma.orphanedPayment.findUnique({
      where: { paymentId: input.paymentId },
      select: { id: true },
    });
    if (existing) return;

    await prisma.orphanedPayment.create({
      data: {
        paymentId: input.paymentId,
        razorpayOrderId: input.razorpayOrderId ?? null,
        amountPaise: input.amountPaise ?? null,
        reason: input.reason.slice(0, 500),
        customerEmail: input.customerEmail ?? null,
        customerPhone: input.customerPhone ?? null,
      },
    });

    await sendOrphanedPaymentAlert({
      paymentId: input.paymentId,
      amountPaise: input.amountPaise ?? null,
      reason: input.reason,
      customerEmail: input.customerEmail ?? null,
      customerPhone: input.customerPhone ?? null,
    });
  } catch (err) {
    // A unique-constraint race (two writers at once) lands here harmlessly —
    // one row wins, the loser is logged and dropped.
    console.error("[orphaned-payment] failed to record:", err);
  }
}
