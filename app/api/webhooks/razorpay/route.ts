import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendNewOrderEmails } from "@/lib/email";
import { recordOrphanedPayment } from "@/lib/orphanedPayment";

// A captured payment younger than this may still have an in-flight verify call
// about to create its order — defer the orphan decision (return non-2xx so
// Razorpay retries) rather than flag a false positive.
const ORPHAN_GRACE_MS = 120_000;

// Public route — called by Razorpay's servers, no auth/session.
// We must read the RAW body to verify the signature, so this route relies on
// req.text() rather than req.json().
export async function POST(req: NextRequest) {
  const raw = await req.text();

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // No secret configured (e.g. local/dev) — acknowledge so Razorpay doesn't
    // retry, but do nothing.
    console.warn(
      "[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not set — ignoring webhook."
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Verify the signature: HMAC-SHA256(rawBody, secret)
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  const valid =
    sigBuf.length === expBuf.length &&
    crypto.timingSafeEqual(sigBuf, expBuf);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Parse the verified payload
  let payload: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          amount?: number;
          email?: string;
          contact?: string;
          created_at?: number;
        };
      };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;

  if (event === "payment.captured" || event === "order.paid") {
    const entity = payload.payload?.payment?.entity;
    const paymentId = entity?.id;

    if (paymentId) {
      // Find the matching order by the stored Razorpay payment id.
      const order = await prisma.order.findFirst({
        where: { paymentId },
        select: {
          id: true,
          orderNumber: true,
          paymentStatus: true,
          paymentMethod: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          totalAmount: true,
          shippingAddress: true,
          items: {
            select: {
              quantity: true,
              product: { select: { name: true } },
            },
          },
        },
      });

      if (order && order.paymentStatus !== "paid") {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "paid" },
        });

        // Send the admin notification if it likely wasn't sent yet (the
        // verify route already sends it on the happy path, but a webhook may
        // arrive for an order that was created via another flow).
        try {
          await sendNewOrderEmails({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            shippingAddress:
              (order.shippingAddress as {
                line1?: string;
                city?: string;
                state?: string;
                pincode?: string;
                label?: string;
              } | null) ?? null,
            items: order.items.map((item) => ({
              name: item.product?.name ?? "Product",
              quantity: item.quantity,
            })),
          });
        } catch {
          // never let email block the webhook ack
        }
      }

      if (!order) {
        // Money was captured but no order exists. This is either a still-in-
        // flight verify (fresh) or a genuine orphan (client dropped / never
        // verified). Defer the fresh case: return non-2xx so Razorpay retries
        // later, by which point either the order exists or enough time has
        // passed to call it a true orphan — avoids false positives.
        const createdMs = entity?.created_at ? entity.created_at * 1000 : 0;
        const ageMs = createdMs ? Date.now() - createdMs : Infinity;
        if (ageMs < ORPHAN_GRACE_MS) {
          return NextResponse.json(
            { received: false, retry: true },
            { status: 503 }
          );
        }
        await recordOrphanedPayment({
          paymentId,
          razorpayOrderId: entity?.order_id ?? null,
          amountPaise: entity?.amount ?? null,
          reason: "Payment captured but no matching order (client never completed verification)",
          customerEmail: entity?.email ?? null,
          customerPhone: entity?.contact ?? null,
        });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
