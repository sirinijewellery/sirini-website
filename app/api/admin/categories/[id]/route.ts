import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// All fields optional so the admin table can persist a lone toggle
// (showOnHome / sortOrder) without re-sending name + slug. The full edit form
// still sends name + slug + image together.
const updateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and dashes")
    .optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  showOnHome: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, slug, image, sortOrder, showOnHome } = result.data;

  // Verify category exists (prevent unhandled P2025 → 500)
  const categoryExists = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!categoryExists) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Check slug conflict (excluding this category) — only when a slug is given.
  if (slug !== undefined) {
    const existing = await prisma.category.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 409 }
      );
    }
  }

  // Build a partial update so a lone toggle doesn't clobber other fields.
  const data: {
    name?: string;
    slug?: string;
    image?: string | null;
    sortOrder?: number;
    showOnHome?: boolean;
  } = {};
  if (name !== undefined) data.name = name.trim();
  if (slug !== undefined) data.slug = slug.trim();
  if (image !== undefined) data.image = image && image.trim() ? image.trim() : null;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;
  if (showOnHome !== undefined) data.showOnHome = showOnHome;

  const category = await prisma.category.update({
    where: { id },
    data,
  });

  return NextResponse.json(category);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Look up the category name before deleting so we can check products
  const category = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Block deletion if products still belong to this category
  const productCount = await prisma.product.count({ where: { category: category.name } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${productCount} product${productCount !== 1 ? "s" : ""} still use this category. Reassign them first.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
