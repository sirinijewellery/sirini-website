import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
  // Shop front-page position (1 = first). Null/absent = not pinned.
  displayOrder: z.number().int().positive().optional().nullable(),
  // Per-product SEO overrides. Blank/absent → auto-generated in generateMetadata.
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  // Taxonomy term IDs to assign (Category / Occasion / Collection / …). Additive.
  termIds: z.array(z.string().min(1)).optional(),
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
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        price: true,
        images: true,
        stock: true,
        isFeatured: true,
      },
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

  // Separate taxonomy term IDs from the scalar product fields.
  const { termIds, ...fields } = result.data;

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

  // Validate any taxonomy term IDs against the DB (de-dupe, drop unknowns).
  let validTermIds: string[] = [];
  if (termIds?.length) {
    const unique = [...new Set(termIds)];
    const found = await prisma.taxonomyTerm.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    const foundSet = new Set(found.map((t) => t.id));
    const invalid = unique.filter((id) => !foundSet.has(id));
    if (invalid.length) {
      return NextResponse.json(
        { error: "One or more selected taxonomy terms no longer exist" },
        { status: 422 }
      );
    }
    validTermIds = unique;
  }

  const product = await prisma.product.create({
    data: {
      ...fields,
      // Primary category (kept for display/back-compat) = first chosen category.
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
      // Assign taxonomy terms (ProductTerm rows) in the same write.
      ...(validTermIds.length
        ? { terms: { create: validTermIds.map((termId) => ({ termId })) } }
        : {}),
    },
  });

  // Surface the new product in listings + home rails immediately.
  revalidatePath(`/shop/${product.slug}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return NextResponse.json(product, { status: 201 });
}
