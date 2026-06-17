import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  heroDurationMs: z.number().int().min(1500).max(30000).optional(),
  ribbonMessages: z.array(z.string().trim().min(1).max(160)).max(8).optional(),
});

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
