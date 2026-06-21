import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers and dashes")
    .optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  showOnHome: z.boolean().optional(),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = categorySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, slug: rawSlug, image, sortOrder, showOnHome } = result.data;
  const slug = rawSlug && rawSlug.trim() ? rawSlug.trim() : generateSlug(name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A category with this slug already exists" },
      { status: 409 }
    );
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      image: image && image.trim() ? image.trim() : null,
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      ...(showOnHome !== undefined ? { showOnHome } : {}),
    },
  });

  return NextResponse.json(category, { status: 201 });
}
