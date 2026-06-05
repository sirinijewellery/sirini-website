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
  occasion?: string;
  style?: string;
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
    occasion,
    style,
  } = options;

  // Only show products from active (image-bearing) categories
  const activeCats = await prisma.category.findMany({
    where: { image: { not: null } },
    select: { slug: true },
  });
  const activeSlugs = activeCats.map((c) => c.slug);

  const where: Prisma.ProductWhereInput = {
    category: category
      ? category                    // exact slug passed by caller
      : { in: activeSlugs },        // all active categories when no filter
    ...(material && { material }),
    ...(featuredOnly && { isFeatured: true }),
    ...(occasion && { occasions: { has: occasion } }),
    ...(style && { styles: { has: style } }),
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

  const productsWithRatings = await attachRatings(products);

  return { products: productsWithRatings, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Attaches { avgRating, reviewCount } to each product via a single grouped query.
 * Used by listing grids so cards can show ⭐ ratings without N+1 lookups.
 */
async function attachRatings<T extends { id: string }>(
  products: T[]
): Promise<(T & { avgRating: number; reviewCount: number })[]> {
  if (products.length === 0) return [];
  const grouped = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map((p) => p.id) }, isPublished: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map(
    grouped.map((g) => [g.productId, { avg: g._avg.rating ?? 0, count: g._count._all }])
  );
  return products.map((p) => ({
    ...p,
    avgRating: map.get(p.id)?.avg ?? 0,
    reviewCount: map.get(p.id)?.count ?? 0,
  }));
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

/**
 * "You Can Pair This With" — fetches 2 products each from 2 DIFFERENT categories
 * so the section always shows complementary categories, not the same one.
 */
export async function getPairingProducts(currentCategory: string, excludeId: string) {
  // Find up to 2 other categories that actually have products in the DB
  const rows = await prisma.product.findMany({
    where: { category: { not: currentCategory } },
    select: { category: true },
    distinct: ["category"],
    take: 2,
    orderBy: { createdAt: "desc" },
  });

  if (rows.length === 0) return [];

  // Fetch 2 products per pairing category in parallel
  const groups = await Promise.all(
    rows.map(({ category }) =>
      prisma.product.findMany({
        where: { category, id: { not: excludeId } },
        take: 2,
        orderBy: { createdAt: "desc" },
        include: {
          variants: {
            select: { id: true, size: true, colour: true, stockQuantity: true },
          },
        },
      })
    )
  );

  // Interleave: [cat1[0], cat2[0], cat1[1], cat2[1]] so the grid
  // alternates between the two pairing categories visually
  const maxLen = Math.max(...groups.map((g) => g.length));
  const interleaved = [];
  for (let i = 0; i < maxLen; i++) {
    for (const group of groups) {
      if (group[i]) interleaved.push(group[i]);
    }
  }
  return interleaved;
}

export async function getFeaturedProducts(limit = 8) {
  // Only show featured products from active (image-bearing) categories
  const activeCats = await prisma.category.findMany({
    where: { image: { not: null } },
    select: { slug: true },
  });
  const activeSlugs = activeCats.map((c) => c.slug);

  return prisma.product.findMany({
    where: { isFeatured: true, category: { in: activeSlugs } },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        select: { id: true, size: true, colour: true, stockQuantity: true },
      },
    },
  });
}

/**
 * Bestsellers — products ranked by number of reviews (social proof).
 * Returns products with avgRating + reviewCount attached.
 */
export async function getBestsellers(limit = 8) {
  const activeCats = await prisma.category.findMany({
    where: { image: { not: null } },
    select: { slug: true },
  });
  const activeSlugs = activeCats.map((c) => c.slug);

  // Rank product ids by review count
  const ranked = await prisma.review.groupBy({
    by: ["productId"],
    where: { isPublished: true },
    _count: { _all: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit * 2, // over-fetch, then filter to active categories
  });

  const products = await prisma.product.findMany({
    where: { id: { in: ranked.map((r) => r.productId) }, category: { in: activeSlugs } },
    include: {
      variants: { select: { id: true, size: true, colour: true, stockQuantity: true } },
    },
  });

  // Preserve the ranked order
  const order = new Map(ranked.map((r, i) => [r.productId, i]));
  products.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));

  return attachRatings(products.slice(0, limit));
}

export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    where: { image: { not: null } },
  });
  // Always put Necklace Sets (or any necklace category) first
  return categories.sort((a, b) => {
    const aIsNecklace = a.name.toLowerCase().includes("necklace");
    const bIsNecklace = b.name.toLowerCase().includes("necklace");
    if (aIsNecklace && !bIsNecklace) return -1;
    if (!aIsNecklace && bIsNecklace) return 1;
    return 0;
  });
}

function hashSlug(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Returns a MODEL shot (model wearing the jewellery) for an occasion card.
 * Prefers model images from the occasion's own products; falls back to any
 * necklace-set model image so every card always shows a model. A per-occasion
 * hash picks a distinct image from the pool so the 4 cards don't repeat.
 */
export async function getOccasionCoverImage(occasion: string): Promise<string | null> {
  const { parseImages } = await import("@/lib/parseImages");
  const pool: string[] = [];

  const rows = await prisma.product.findMany({
    where: { occasions: { has: occasion } },
    orderBy: { price: "desc" },
    select: { images: true },
    take: 30,
  });
  for (const r of rows) {
    const m = parseImages(r.images).find((u) => /model/i.test(u));
    if (m) pool.push(m);
  }

  // Fallback: necklace-set model images (the only category with model shots)
  if (pool.length === 0) {
    const ns = await prisma.product.findMany({
      where: { category: "necklace-sets" },
      orderBy: { price: "desc" },
      select: { images: true },
      take: 30,
    });
    for (const r of ns) {
      const m = parseImages(r.images).find((u) => /model/i.test(u));
      if (m) pool.push(m);
    }
  }

  if (pool.length === 0) {
    return rows[0] ? parseImages(rows[0].images)[0] ?? null : null;
  }
  return pool[hashSlug(occasion) % pool.length];
}

/* ── Shop by Material (style) ───────────────────────────────── */
export async function getStyleCoverImage(style: string): Promise<string | null> {
  const p = await prisma.product.findFirst({
    where: { styles: { has: style } },
    orderBy: { price: "desc" },
    select: { images: true },
  });
  if (!p) return null;
  const { parseImages } = await import("@/lib/parseImages");
  return parseImages(p.images)[0] ?? null;
}

// Taxonomy constants live in a client-safe module; re-export for server callers.
export { OCCASIONS, STYLES, PRICE_BUCKETS } from "@/lib/taxonomy";

// Re-exported so server-side code can still import from this module
export { parseImages, getMaterials } from "@/lib/parseImages";
