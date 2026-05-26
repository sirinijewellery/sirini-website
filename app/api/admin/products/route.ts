import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const variantSchema = z.object({
  size: z.string().optional(),
  colour: z.string().optional(),
  stockQuantity: z.number().int().min(0),
});

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  material: z.string().min(1, "Material is required"),
  sku: z.string().min(1, "SKU is required"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  badge: z.enum(["NEW", "HOT", "SALE"]).optional().nullable(),
  isFeatured: z.boolean(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

// GET /api/admin/products?page=1&search=ring
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const search = searchParams.get("search")?.trim() || undefined;

  const where = search
    ? { OR: [{ name: { contains: search } }, { category: { contains: search } }] }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
      include: { variants: { select: { id: true, stockQuantity: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / 20) });
}

// POST /api/admin/products
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

  const result = productSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { variants, ...fields } = result.data;

  // Check unique slug
  const existingSlug = await prisma.product.findUnique({ where: { slug: fields.slug } });
  if (existingSlug) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  // Check unique SKU
  const existingSku = await prisma.product.findUnique({ where: { sku: fields.sku } });
  if (existingSku) {
    return NextResponse.json({ error: "SKU already in use" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      ...fields,
      badge: fields.badge ?? null,
      images: fields.images,
      variants: { create: variants },
    },
    include: { variants: true },
  });

  return NextResponse.json(product, { status: 201 });
}
