import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendDailyDigestEmail } from "@/lib/email";

// Daily revenue digest — invoked by Vercel Cron (see vercel.json).
// Secured by CRON_SECRET: Vercel automatically sends
//   Authorization: Bearer ${CRON_SECRET}
// when that env var is set. If CRON_SECRET is unset we allow the call (so the
// job still works before it's configured) but log a warning.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    // Timing-safe comparison — a plain !== leaks how many leading characters
    // match via response timing.
    const provided = Buffer.from(req.headers.get("authorization") ?? "");
    const expected = Buffer.from(`Bearer ${secret}`);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Fail closed in production — without a secret anyone could trigger the
    // digest (email-quota burn + order-table scan on every hit).
    console.warn("[cron] CRON_SECRET not set — refusing unauthenticated digest request.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    console.warn("[cron] CRON_SECRET not set — allowing in non-production only.");
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: {
      orderNumber: true,
      customerName: true,
      totalAmount: true,
      paymentStatus: true,
      paymentMethod: true,
    },
    orderBy: { orderNumber: "desc" },
  });

  const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const paidRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((s, o) => s + o.totalAmount, 0);
  const codRevenue = orders
    .filter((o) => o.paymentMethod === "cod" || o.paymentStatus === "cod")
    .reduce((s, o) => s + o.totalAmount, 0);

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  await sendDailyDigestEmail({
    dateLabel,
    orderCount: orders.length,
    revenue,
    paidRevenue,
    codRevenue,
    topOrders: orders.slice(0, 20).map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
    })),
  });

  // Don't echo business numbers back to the caller — the digest email is the
  // delivery channel; the response only needs to acknowledge the run.
  return NextResponse.json({ ok: true, orders: orders.length });
}
