import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";

const leadSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.string().max(40).optional(),
});

// Machine-to-machine export (no browser session), so auth is a shared secret
// header rather than the admin cookie session — same fail-closed, timing-safe
// pattern as the marketing-metrics route.
function isAuthorized(req: Request): boolean {
  const expectedSecret = process.env.LEADS_API_KEY;
  if (!expectedSecret) return false; // fail closed if the env var is unset

  const provided = Buffer.from(req.headers.get("x-api-key") ?? "");
  const expected = Buffer.from(expectedSecret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "leads", 5, 10 * 60_000);
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
  if (!isAuthorized(request)) {
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

  return NextResponse.json({ leads });
}
