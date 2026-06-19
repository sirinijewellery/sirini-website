import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { matchCategorySlugs } from "@/lib/taxonomy";

export type ProductWithVariants = Awaited<ReturnType<typeof getProducts>>["products"][number];
// NB: name retained for import compatibility; products no longer have variants
// (stock lives on Product.stock).

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
  inStock?: boolean;
  minRating?: number;
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
    inStock,
    minRating,
  } = options;

  // Only show products from active (image-bearing) categories
  const activeCats = await prisma.category.findMany({
    where: { image: { not: null } },
    select: { slug: true },
  });
  const activeSlugs = activeCats.map((c) => c.slug);

  const ci = Prisma.QueryMode.insensitive;
  const searchCatSlugs = search ? matchCategorySlugs(search) : [];

  const where: Prisma.ProductWhereInput = {
    // Multi-category: a product matches a category if its categories[] contains
    // the slug. With no category filter, show all active (image-bearing) ones.
    ...(category
      ? { categories: { has: category } }
      : { categories: { hasSome: activeSlugs } }),
    ...(material && { material }),
    ...(featuredOnly && { isFeatured: true }),
    ...(occasion && { occasions: { has: occasion } }),
    ...(style && { styles: { has: style } }),
    ...(inStock && { stock: { gt: 0 } }),
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
        { name: { contains: search, mode: ci } },
        { description: { contains: search, mode: ci } },
        { material: { contains: search, mode: ci } },
        { sku: { contains: search, mode: ci } },
        ...(searchCatSlugs.length ? [{ categories: { hasSome: searchCatSlugs } }] : []),
      ],
    }),
  };

  const orderBy = {
    newest: { createdAt: "desc" as const },
    price_asc: { price: "asc" as const },
    price_desc: { price: "desc" as const },
    name_asc: { name: "asc" as const },
  }[sort];

  let products: Awaited<ReturnType<typeof prisma.product.findMany>>;
  let total: number;

  if (sort === "newest") {
    // Curated default ordering (owner rule):
    //  1. admin-pinned products first (displayOrder asc — editable per product)
    //  2. then model-shot and decorative products INTERLEAVED so every shop
    //     row mixes model photography with styled product shots
    // The catalogue is small (~160 rows), so we order in JS and slice the page.
    const all = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const hasModelImg = (p: { images: unknown }) =>
      Array.isArray(p.images) && (p.images as string[]).some((u) => /model/i.test(u));

    const pinned = all
      .filter((p) => p.displayOrder != null)
      .sort((a, b) => a.displayOrder! - b.displayOrder!);
    const rest = all.filter((p) => p.displayOrder == null);
    const model = rest.filter(hasModelImg);
    const deco = rest.filter((p) => !hasModelImg(p));

    // Interleave: M D M D … → every 4-card desktop row gets 2 model + 2
    // decorative covers while both pools last.
    const interleaved: typeof rest = [];
    for (let i = 0; i < Math.max(model.length, deco.length); i++) {
      if (i < model.length) interleaved.push(model[i]);
      if (i < deco.length) interleaved.push(deco[i]);
    }

    const curated = [...pinned, ...interleaved];
    total = curated.length;
    products = curated.slice((page - 1) * limit, page * limit);
  } else {
    [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);
  }

  const productsWithRatings = await attachRatings(products);

  // minRating can't be a SQL filter (rating is aggregated, not a column), so we
  // filter the fetched page in-memory. We only filter the current page (not the
  // whole catalogue), so `total`/pagination reflect the unfiltered count; this
  // keeps the query cheap and is acceptable for our catalogue size.
  if (minRating !== undefined) {
    const filtered = productsWithRatings.filter((p) => p.avgRating >= minRating);
    return {
      products: filtered,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  }

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
  });
}

export async function getRelatedProducts(category: string, excludeId: string, limit = 4) {
  return prisma.product.findMany({
    where: { categories: { has: category }, id: { not: excludeId } },
    take: limit,
    orderBy: { createdAt: "desc" },
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

  const featured = await prisma.product.findMany({
    where: { isFeatured: true, categories: { hasSome: activeSlugs } },
    orderBy: { createdAt: "desc" },
  });

  // Model-shot products lead the rail; admin displayOrder breaks ties.
  const hasModelImg = (p: { images: unknown }) =>
    Array.isArray(p.images) && (p.images as string[]).some((u) => /model/i.test(u));
  featured.sort((a, b) => {
    const ma = hasModelImg(a) ? 0 : 1;
    const mb = hasModelImg(b) ? 0 : 1;
    if (ma !== mb) return ma - mb;
    return (a.displayOrder ?? 1e9) - (b.displayOrder ?? 1e9);
  });

  return featured.slice(0, limit);
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
    where: { id: { in: ranked.map((r) => r.productId) }, categories: { hasSome: activeSlugs } },
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
      where: { categories: { has: "necklace-sets" } },
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

/**
 * Returns a DISTINCT model-shot cover for every occasion in one pass, so no two
 * occasion cards ever show the same image (the per-occasion hash could collide).
 * Prefers a model image whose product is tagged with that occasion; otherwise
 * falls back to the next unused necklace-set model image.
 */
export async function getOccasionCovers(): Promise<Record<string, string | null>> {
  const { parseImages } = await import("@/lib/parseImages");
  const { OCCASIONS } = await import("@/lib/taxonomy");

  // All necklace-set model images (only category with model shots), priced desc.
  const ns = await prisma.product.findMany({
    where: { categories: { has: "necklace-sets" } },
    orderBy: { price: "desc" },
    select: { images: true, occasions: true },
  });
  const modelImgs: { url: string; occasions: string[] }[] = [];
  for (const p of ns) {
    const m = parseImages(p.images).find((u) => /model/i.test(u));
    if (m) modelImgs.push({ url: m, occasions: p.occasions });
  }

  const used = new Set<string>();
  const result: Record<string, string | null> = {};
  for (const occ of OCCASIONS) {
    const pick =
      modelImgs.find((m) => m.occasions.includes(occ.slug) && !used.has(m.url))?.url ??
      modelImgs.find((m) => !used.has(m.url))?.url ??
      modelImgs[0]?.url ??
      null;
    if (pick) used.add(pick);
    result[occ.slug] = pick;
  }
  return result;
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
