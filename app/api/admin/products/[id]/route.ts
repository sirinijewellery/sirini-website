import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { parseImages } from "@/lib/queries/products";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and dashes"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  categories: z.array(z.string().min(1)).min(1, "Select at least one category"),
  material: z.string().min(1, "Material is required"),
  sku: z.string().min(1, "SKU is required"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  badge: z
    .enum(["NEW", "HOT", "SALE", "Handcrafted", "Traditional", "Bestseller"])
    .optional()
    .nullable(),
  isFeatured: z.boolean(),
  occasions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(0),
  // Shop front-page position (1 = first). Null = unpin; absent = unchanged.
  displayOrder: z.number().int().positive().optional().nullable(),
  // Per-product SEO overrides. Blank/absent → auto-generated in generateMetadata.
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  // Taxonomy term IDs to assign (replaces the product's current set).
  termIds: z.array(z.string().min(1)).optional(),
});

// GET /api/admin/products/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PUT /api/admin/products/[id]
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

  const result = productSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  // Separate taxonomy term IDs from the scalar product fields.
  const { termIds, ...fields } = result.data;

  // Ensure product exists
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Check slug uniqueness (exclude current product)
  const slugConflict = await prisma.product.findFirst({
    where: { slug: fields.slug, id: { not: id } },
  });
  if (slugConflict) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  // Check SKU uniqueness (exclude current product)
  const skuConflict = await prisma.product.findFirst({
    where: { sku: fields.sku, id: { not: id } },
  });
  if (skuConflict) {
    return NextResponse.json({ error: "SKU already in use" }, { status: 409 });
  }

  // Validate any taxonomy term IDs against the DB (de-dupe, reject unknowns).
  const uniqueTermIds = termIds?.length ? [...new Set(termIds)] : [];
  if (uniqueTermIds.length) {
    const found = await prisma.taxonomyTerm.findMany({
      where: { id: { in: uniqueTermIds } },
      select: { id: true },
    });
    if (found.length !== uniqueTermIds.length) {
      return NextResponse.json(
        { error: "One or more selected taxonomy terms no longer exist" },
        { status: 422 }
      );
    }
  }

  const productData = {
    ...fields,
    category: fields.categories[0],
    categories: fields.categories,
    badge: fields.badge ?? null,
    images: fields.images,
    occasions: fields.occasions ?? [],
    tags: fields.tags ?? [],
    stock: fields.stock,
    // Normalise blank SEO overrides to null so generateMetadata auto-generates.
    metaTitle: fields.metaTitle?.trim() || null,
    metaDescription: fields.metaDescription?.trim() || null,
  };

  // Update the product and atomically replace its ProductTerm rows
  // (deleteMany → createMany) so the assignment always reflects the form.
  const [, updated] = await prisma.$transaction([
    prisma.productTerm.deleteMany({ where: { productId: id } }),
    prisma.product.update({ where: { id }, data: productData }),
    ...(uniqueTermIds.length
      ? [
          prisma.productTerm.createMany({
            data: uniqueTermIds.map((termId) => ({ productId: id, termId })),
          }),
        ]
      : []),
  ]);

  return NextResponse.json(updated);
}

// DELETE /api/admin/products/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });

  // Best-effort Cloudinary cleanup — don't fail the request if deletion errors
  try {
    const images = parseImages(existing.images);
    await Promise.allSettled(
      images
        .filter((url) => url.includes("cloudinary.com"))
        .map((url) => {
          // Extract public ID from a Cloudinary URL
          // e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/sirini-jewellery/abc.jpg
          const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
          return match ? deleteFromCloudinary(match[1]) : Promise.resolve();
        })
    );
  } catch {
    // Non-fatal — images will remain in Cloudinary but the product is gone
  }

  return NextResponse.json({ success: true });
}
