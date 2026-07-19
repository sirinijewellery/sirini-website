import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { emailSchema } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  message: z.string().trim().min(10).max(5000),
});

export async function POST(request: Request) {
  // Throttle abuse — each submission writes a DB row and (best-effort) sends an
  // email, so an unbounded flood would spam the inbox and burn email quota.
  const limited = enforceRateLimit(request, "contact", 5, 10 * 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    // Persist FIRST — the DB row is the source of truth (owner reads them at
    // /admin/messages), so a message is never lost even if email is down or
    // RESEND_API_KEY isn't configured yet.
    await prisma.contactMessage.create({ data: parsed.data });

    // Also capture the submitter as a lead — anyone who contacts us is a warm
    // prospect for the nurture flow. Best-effort: never overwrite an existing
    // lead's source (update: {}), and a failure here must never break the
    // contact submission, so it's wrapped separately from the response.
    try {
      await prisma.lead.upsert({
        where: { email: parsed.data.email },
        update: {},
        create: { email: parsed.data.email, source: "contact" },
      });
    } catch (err) {
      console.error("[Contact Form] lead upsert failed", err);
    }

    // Best-effort owner notification; never blocks or fails the submission.
    await sendContactEmail(parsed.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact Form Error]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
