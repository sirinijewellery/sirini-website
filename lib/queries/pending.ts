// ─────────────────────────────────────────────────────────────────────────
// SERVER reads for the admin "Pending" tab — a small checklist of taxonomy
// chores the owner still has to do while tagging the 191-product catalogue.
//
// Each check is resilient: any DB hiccup degrades that item's count to 0 (and
// getPendingCount() to 0) rather than throwing into the admin layout/render.
// Reads only — writes happen elsewhere. Do not import this from client code.
// ─────────────────────────────────────────────────────────────────────────
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface PendingItem {
  /** Stable identifier for the check (used as React key). */
  key: string;
  /** Short, owner-facing title. */
  label: string;
  /** How many records currently match this check. */
  count: number;
  /** Where the owner goes to clear it. */
  href: string;
  /** One-line explanation of why this matters / what to do. */
  description: string;
}

/**
 * Compute the pending checklist. Each entry reports how many records still need
 * attention plus where to fix them. Items with a zero count are kept in the
 * returned array (the page filters them) but excluded from the badge total.
 *
 * Every check is wrapped so a single failing query can't take down the whole
 * checklist — it just contributes 0.
 */
export const getPendingItems = cache(async (): Promise<PendingItem[]> => {
  const [
    productsMissingCategory,
    productsWithoutAnyTerms,
    termsMissingCover,
  ] = await Promise.all([
    countProductsMissingCategory(),
    countProductsWithoutAnyTerms(),
    countTermsMissingCover(),
  ]);

  return [
    {
      key: "products-missing-category",
      label: "Products without a category",
      count: productsMissingCategory,
      href: "/admin/products",
      description:
        "These products aren't tagged with any Category term, so they won't show up when shoppers browse or filter by category. Open each product and assign a category.",
    },
    {
      key: "products-without-terms",
      label: "Untagged products",
      count: productsWithoutAnyTerms,
      href: "/admin/products",
      description:
        "These products have no taxonomy terms at all (category, occasion, look, etc.). Tag them so they appear in menus, collections and filtered views.",
    },
    {
      key: "terms-missing-cover",
      label: "Terms missing a cover image",
      count: termsMissingCover,
      href: "/admin/shop",
      description:
        "These category and dimension terms have no cover image, so their tiles on the Shop page look empty. Add a cover image to each.",
    },
  ];
});

/**
 * The number shown on the sidebar badge: the count of checks that still have
 * outstanding work (i.e. non-zero items). Using the number of open checks keeps
 * the badge a small, glanceable "things left to do" figure rather than a large
 * record total. Always resolves to a number; never throws.
 */
export const getPendingCount = cache(async (): Promise<number> => {
  try {
    const items = await getPendingItems();
    return items.filter((i) => i.count > 0).length;
  } catch {
    return 0;
  }
});

// ── Individual checks ──────────────────────────────────────────────────────

/** Products with zero ProductTerm rows pointing at a term in the "category" group. */
async function countProductsMissingCategory(): Promise<number> {
  try {
    return await prisma.product.count({
      where: {
        terms: {
          none: { term: { group: { slug: "category" } } },
        },
      },
    });
  } catch {
    return 0;
  }
}

/** Products with no taxonomy terms assigned at all. */
async function countProductsWithoutAnyTerms(): Promise<number> {
  try {
    return await prisma.product.count({
      where: { terms: { none: {} } },
    });
  } catch {
    return 0;
  }
}

/**
 * Category & dimension terms that have no cover image. The Shop page renders a
 * tile per term, so an empty coverImage shows a blank tile. We count terms
 * across every taxonomy group (the cover image is relevant wherever a term can
 * surface as a browsable tile).
 */
async function countTermsMissingCover(): Promise<number> {
  try {
    return await prisma.taxonomyTerm.count({
      where: { coverImage: null },
    });
  } catch {
    return 0;
  }
}
