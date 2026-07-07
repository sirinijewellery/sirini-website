import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const focal = z.string().regex(/^\d{1,3}% \d{1,3}%$/, "Bad focal point").optional();

const patchSchema = z.object({
  imageUrl: z.string().url().optional(),
  mobileImageUrl: z.string().url().nullable().optional(),
  focalDesktop: focal,
  focalMobile: focal,
  brightness: z.number().min(0.2).max(2).optional(),
  contrast: z.number().min(0.2).max(2).optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  try {
    const slide = await prisma.heroSlide.update({ where: { id }, data: parsed.data });
    revalidatePath("/"); // hero renders on the home page only
    return NextResponse.json(slide);
  } catch {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  try {
    await prisma.heroSlide.delete({ where: { id } });
    revalidatePath("/"); // hero renders on the home page only
    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }
}
