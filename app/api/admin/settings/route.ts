import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  heroDurationMs: z.number().int().min(1500).max(30000).optional(),
  ribbonMessages: z.array(z.string().trim().min(1).max(160)).max(8).optional(),
});

// ── Generic key/value settings registry ──────────────────────────────────
// Each owner-editable setting group maps its Setting key to a zod schema. The
// generic PATCH branch (`{ key, value }`) validates against this before saving,
// so new admin settings pages just add an entry here + a form.
const businessDetailsSchema = z.object({
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().regex(/^[0-9]*$/, "Digits only (no spaces or +)").max(20),
  instagramUrl: z.string().trim().url().max(200).or(z.literal("")),
  instagramHandle: z.string().trim().max(60),
  followerText: z.string().trim().max(40),
  addressLine: z.string().trim().max(160),
  city: z.string().trim().max(80),
  region: z.string().trim().max(80),
  postalCode: z.string().trim().max(20),
  country: z.string().trim().min(2).max(2),
  openingHours: z.string().trim().max(80),
  justdialUrl: z.string().trim().url().max(200).or(z.literal("")),
});

const SETTINGS_REGISTRY: Record<string, z.ZodTypeAny> = {
  "business.details": businessDetailsSchema,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.setting.findMany({
    where: { key: { in: ["hero.durationMs", "ribbon.messages"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({
    heroDurationMs: (map["hero.durationMs"] as number) ?? 6000,
    ribbonMessages: (map["ribbon.messages"] as string[]) ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Generic branch — `{ key, value }` validated against the registry.
  if (body && typeof body === "object" && "key" in body && typeof (body as { key: unknown }).key === "string") {
    const key = (body as { key: string }).key;
    const value = (body as { value?: unknown }).value;
    const groupSchema = SETTINGS_REGISTRY[key];
    if (!groupSchema) return NextResponse.json({ error: "Unknown setting" }, { status: 400 });
    const result = groupSchema.safeParse(value);
    if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    const data = result.data as Prisma.InputJsonValue;
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: data },
      update: { value: data },
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ message: "Saved" });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { heroDurationMs, ribbonMessages } = parsed.data;

  const ops = [];
  if (heroDurationMs !== undefined) {
    ops.push(prisma.setting.upsert({
      where: { key: "hero.durationMs" },
      create: { key: "hero.durationMs", value: heroDurationMs },
      update: { value: heroDurationMs },
    }));
  }
  if (ribbonMessages !== undefined) {
    const clean = ribbonMessages.map((s) => s.trim()).filter(Boolean);
    ops.push(prisma.setting.upsert({
      where: { key: "ribbon.messages" },
      create: { key: "ribbon.messages", value: clean },
      update: { value: clean },
    }));
  }
  if (ops.length) await Promise.all(ops);

  revalidatePath("/", "layout");
  return NextResponse.json({ message: "Saved" });
}
