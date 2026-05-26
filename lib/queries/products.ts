import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ProductWithVariants = Awaited<ReturnType<typeof getProducts>>["products"][number];

export interface GetProductsOptions {
  page?: number;
  limit?: number;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  material?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
  search?: string;
  featuredOnly?: boolean;
}

export async function getProducts(options: GetProductsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    priceMin,
    priceMax,
    material,
    sort = "newest",
    search,
    featuredOnly,
  } = options;

  const where = {
    ...(category && { category }),
    ...(material && { material }),
    ...(featuredOnly && { isFeatured: true }),
    ...(priceMin !== undefined || priceMax !== undefined
      ? {
          price: {
            ...(priceMin !== undefined && { gte: priceMin }),
            ...(priceMax !== undefined && { lte: priceMax }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { material: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ],
    }),
  };

  const orderBy = {
    newest: { createdAt: "desc" as const },
    price_asc: { price: "asc" as const },
    price_desc: { price: "desc" as const },
    name_asc: { name: "asc" as const },
  }[sort];

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        variants: {
          select: { id: true, size: true, colour: true, stockQuantity: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      variants: true,
    },
  });
}

export async function getRelatedProducts(category: string, excludeId: string, limit = 4) {
  return prisma.product.findMany({
    where: { category, id: { not: excludeId } },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        select: { id: true, size: true, colour: true, stockQuantity: true },
      },
    },
  });
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isFeatured: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        select: { id: true, size: true, colour: true, stockQuantity: true },
      },
    },
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

// Re-exported so server-side code can still import from this module
export { parseImages, getMaterials } from "@/lib/parseImages";
