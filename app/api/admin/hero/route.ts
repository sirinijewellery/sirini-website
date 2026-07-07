import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const focal = z.string().regex(/^\d{1,3}% \d{1,3}%$/, "Bad focal point").optional();

const slideSchema = z.object({
  imageUrl: z.string().url("Image URL is required"),
  mobileImageUrl: z.string().url().nullable().optional(),
  focalDesktop: focal,
  focalMobile: focal,
  brightness: z.number().min(0.2).max(2).optional(),
  contrast: z.number().min(0.2).max(2).optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const slides = await prisma.heroSlide.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const durationRow = await prisma.setting.findUnique({ where: { key: "hero.durationMs" } });
  return NextResponse.json({ slides, durationMs: (durationRow?.value as number) ?? 6000 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = slideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;

  const count = await prisma.heroSlide.count();
  const slide = await prisma.heroSlide.create({
    data: {
      imageUrl: d.imageUrl,
      mobileImageUrl: d.mobileImageUrl ?? null,
      focalDesktop: d.focalDesktop ?? "50% 50%",
      focalMobile: d.focalMobile ?? "50% 50%",
      brightness: d.brightness ?? 1.0,
      contrast: d.contrast ?? 1.0,
      overlayOpacity: d.overlayOpacity ?? 0.4,
      order: d.order ?? count,
      isActive: d.isActive ?? true,
    },
  });
  revalidatePath("/"); // hero renders on the home page only
  return NextResponse.json(slide, { status: 201 });
}
