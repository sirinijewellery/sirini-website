import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and dashes"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
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

  const { name, slug, image } = result.data;

  // Verify category exists (prevent unhandled P2025 → 500)
  const categoryExists = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!categoryExists) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Check slug conflict (excluding this category)
  const existing = await prisma.category.findFirst({
    where: { slug, NOT: { id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A category with this slug already exists" },
      { status: 409 }
    );
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: name.trim(),
      slug: slug.trim(),
      image: image && image.trim() ? image.trim() : null,
    },
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
