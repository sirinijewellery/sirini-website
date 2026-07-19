import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";
import { emailSchema } from "@/lib/validation";
import { isAuthorizedByApiKey } from "@/lib/apiKeyAuth";

const leadSchema = z.object({
  email: emailSchema,
  source: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  // Ceiling is per-IP and Indian mobile traffic is heavily CGNAT'd (many
  // unrelated shoppers share one IP), so keep it high enough that a genuine
  // burst of popup signups doesn't 429 real visitors — matches the checkout
  // routes' reasoning.
  const limited = enforceRateLimit(request, "leads", 30, 10 * 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  await prisma.lead.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email, source: parsed.data.source ?? "popup" },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  if (!isAuthorizedByApiKey(request, "LEADS_API_KEY")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  let sinceDate: Date | undefined;
  if (since !== null) {
    sinceDate = new Date(since);
    if (Number.isNaN(sinceDate.getTime())) {
      return NextResponse.json({ error: "Invalid since date" }, { status: 400 });
    }
  }

  const leads = await prisma.lead.findMany({
    where: sinceDate ? { createdAt: { gte: sinceDate } } : undefined,
    orderBy: { createdAt: "asc" },
    select: { email: true, source: true, createdAt: true },
  });

  // Flag which leads have placed a *real* order (the daily automation gives
  // these a discount coupon). "Real" = payment actually settled (online "paid"
  // or genuine "cod") AND not cancelled — this deliberately excludes
  // "payment_link"/"pending" orders whose payment never completed. Orphaned
  // payments are a separate model (never an Order), so they can't leak in here.
  // Lead emails and Order.customerEmail are both stored lowercase, so a plain
  // `in` match works and uses the Order.customerEmail index. One query for all.
  const emails = leads.map((lead) => lead.email);
  const purchasedRows = emails.length
    ? await prisma.order.findMany({
        where: {
          customerEmail: { in: emails },
          paymentStatus: { in: ["paid", "cod"] },
          orderStatus: { not: "cancelled" },
        },
        select: { customerEmail: true },
        distinct: ["customerEmail"],
      })
    : [];
  const purchasedEmails = new Set(
    purchasedRows.map((row) => row.customerEmail.toLowerCase())
  );

  const leadsWithPurchase = leads.map((lead) => ({
    ...lead,
    purchased: purchasedEmails.has(lead.email),
  }));

  return NextResponse.json({ leads: leadsWithPurchase });
}
