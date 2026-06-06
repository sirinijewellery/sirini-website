import { Suspense } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductFilters } from "@/components/ProductFilters";
import { SortSelect } from "@/components/SortSelect";
import {
  getProducts,
  getCategories,
  getMaterials,
  OCCASIONS,
  STYLES,
  type GetProductsOptions,
} from "@/lib/queries/products";
import Link from "next/link";
import type { Metadata } from "next";

interface ShopPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    material?: string;
    priceMin?: string;
    priceMax?: string;
    sort?: string;
    search?: string;
    occasion?: string;
    style?: string;
    minRating?: string;
    inStock?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));

  // Count "indexable" facets. A page is canonical-worthy only when it has at
  // most ONE of these primary facets and no secondary refinements / pagination.
  const primaryFacets = [params.category, params.occasion, params.style].filter(Boolean);
  const hasRefinement = Boolean(
    params.material ||
      params.priceMin ||
      params.priceMax ||
      params.minRating ||
      params.inStock ||
      params.search
  );
  const isCleanSingleFacet =
    primaryFacets.length <= 1 && !hasRefinement && page === 1;

  // For clean single-facet pages, self-reference the canonical at that facet URL.
  // Multi-filter combos or page>1 are noindex,follow to avoid thin/dupe content.
  const seo: Pick<Metadata, "alternates" | "robots"> = isCleanSingleFacet
    ? {
        alternates: {
          canonical: params.occasion
            ? `/shop?occasion=${params.occasion}`
            : params.style
              ? `/shop?style=${params.style}`
              : params.category
                ? `/shop?category=${encodeURIComponent(params.category)}`
                : "/shop",
        },
        robots: { index: true, follow: true },
      }
    : { robots: { index: false, follow: true } };

  if (params.occasion) {
    const occ = OCCASIONS.find((o) => o.slug === params.occasion);
    const title =
      params.occasion === "bridal"
        ? "Bridal & Wedding Jewellery"
        : params.occasion === "festive"
          ? "Festive Jewellery"
          : `${occ?.label ?? params.occasion} Jewellery`;
    return {
      title: `${title} | Sirini Jewellery`,
      description:
        occ?.blurb ??
        `Shop handcrafted jewellery for ${params.occasion} occasions. Free shipping across India.`,
      ...seo,
    };
  }
  if (params.style) {
    const st = STYLES.find((s) => s.slug === params.style);
    return {
      title: `${st?.label ?? params.style} Jewellery | Sirini Jewellery`,
      description:
        `Shop handcrafted ${st?.label ?? params.style} jewellery — necklace sets, earrings, bangles & more. Free shipping across India.`,
      ...seo,
    };
  }
  if (params.category) {
    return {
      title: `${params.category} — Handcrafted Indian Jewellery`,
      description: `Shop handcrafted ${params.category.toLowerCase()} — Kundan, Meenakari & gold-plated designs. Free shipping across India.`,
      ...seo,
    };
  }
  return {
    title: "Shop Handcrafted Indian Jewellery — Kundan, Meenakari & Gold-Plated",
    description:
      "Browse 100+ handcrafted jewellery pieces — Kundan necklace sets, gold-plated earrings, bangles, rings & anklets. Free shipping across India.",
    ...seo,
  };
}

async function ShopContent({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const options: GetProductsOptions = {
    page,
    limit: 20,
    category: params.category,
    material: params.material,
    priceMin: params.priceMin ? parseFloat(params.priceMin) : undefined,
    priceMax: params.priceMax ? parseFloat(params.priceMax) : undefined,
    sort: (params.sort as GetProductsOptions["sort"]) || "newest",
    search: params.search,
    occasion: params.occasion,
    style: params.style,
    minRating: params.minRating ? parseFloat(params.minRating) : undefined,
    inStock: params.inStock === "1",
  };

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getProducts(options),
    getCategories(),
  ]);

  const materials = getMaterials();
  const currentSort = params.sort || "newest";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="section-gold-rule">
          <h1 className="font-display text-[40px] md:text-[56px] font-light leading-[1.0] tracking-[-0.02em] text-on-surface">
            {params.search ? (
              <>
                <em style={{ fontStyle: "italic" }}>Results for</em>{" "}
                &ldquo;{params.search}&rdquo;
              </>
            ) : params.occasion ? (
              OCCASIONS.find((o) => o.slug === params.occasion)?.label ||
              params.occasion
            ) : params.style ? (
              `${STYLES.find((s) => s.slug === params.style)?.label || params.style} Jewellery`
            ) : (
              params.category || "All Jewellery"
            )}
          </h1>
        </div>
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-on-surface-variant mt-3">
          {total} {total === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div className="space-y-6">
        {/* Pill filter bar — full width, scrollable on mobile */}
        <ProductFilters categories={categories} materials={materials} />

        {/* Sort bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-sans hidden sm:block">
            Showing {total === 0 ? 0 : Math.min((page - 1) * 20 + 1, total)}–
            {Math.min(page * 20, total)} of {total}
          </p>
          <div className="ml-auto">
            <SortSelect currentSort={currentSort} />
          </div>
        </div>

        <ProductGrid products={products} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {page > 1 && (
              <PaginationLink href={buildHref(params, page - 1)} label="← Previous" />
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <PaginationLink
                  key={p}
                  href={buildHref(params, p)}
                  label={String(p)}
                  active={p === page}
                />
              );
            })}
            {page < totalPages && (
              <PaginationLink href={buildHref(params, page + 1)} label="Next →" />
            )}
          </div>
        )}

        {/* SEO copy block — only on clean single-facet pages, never on search results */}
        <SeoCopyBlock
          category={params.category}
          occasion={params.occasion}
          style={params.style}
          search={params.search}
        />
      </div>
    </div>
  );
}

// ── SEO copy block ────────────────────────────────────────────────────────────
// Tasteful, human-readable copy rendered below the product grid on clean
// single-facet pages (category / occasion / style, no search, page 1).
// Intentionally left out of paginated / multi-filter URLs to avoid thin content.

const SEO_COPY: Record<string, string> = {
  // categories
  "necklace-sets":
    "Sirini's handcrafted necklace sets span Kundan chokers, Polki rani haars and Meenakari layered sets — each piece crafted in Mumbai with 22kt gold plating and ethically sourced stones. Free pan-India shipping on all orders.",
  earrings:
    "From delicate Kundan jhumkas to statement Chandbali earrings, our collection is lightweight yet luxurious — perfect for daily wear or festive occasions.",
  bangles:
    "Our gold-plated bangle sets pair traditional Meenakari work with modern sizing for an effortless festive or bridal look.",
  anklets:
    "Handcrafted ghungroo payals and silver-finish anklets — subtle enough for daily wear, special enough for weddings.",
  "finger-rings":
    "Adjustable Kundan cocktail rings and enamel statement rings designed to complement every ethnic look.",
  // occasions
  bridal:
    "Sirini's bridal collection brings together Kundan, Polki and Jadau statement sets — heirloom craftsmanship for your most important day.",
  festive:
    "From Navratri to Diwali, our festive edit of Meenakari jhumkas, temple sets and gold-plated bangles ensures you shine at every celebration.",
};

function SeoCopyBlock({
  category,
  occasion,
  style,
  search,
}: {
  category?: string;
  occasion?: string;
  style?: string;
  search?: string;
}) {
  // Never render on search results or when multiple facets are active
  if (search) return null;

  const activeFacets = [category, occasion, style].filter(Boolean);
  if (activeFacets.length !== 1) return null;

  // Resolve copy: occasion and category have explicit entries; styles fall through
  const key = occasion ?? category ?? style ?? "";
  const copy = SEO_COPY[key];
  if (!copy) return null;

  // Split into two sentences for a tasteful italic opener + body treatment
  const sentenceBreak = copy.indexOf(". ");
  const opener =
    sentenceBreak !== -1 ? copy.slice(0, sentenceBreak + 1) : copy;
  const rest = sentenceBreak !== -1 ? copy.slice(sentenceBreak + 2) : "";

  return (
    <section
      aria-label="About this collection"
      className="mt-16 pt-8 border-t border-outline-variant"
    >
      <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant leading-relaxed">
        <em className="not-italic text-on-surface-variant">{opener}</em>
        {rest && <> {rest}</>}
      </p>
    </section>
  );
}

function PaginationLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm font-sans rounded border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );
}

function buildHref(
  params: Record<string, string | undefined>,
  page: number
) {
  const p = new URLSearchParams();
  if (params.category) p.set("category", params.category);
  if (params.material) p.set("material", params.material);
  if (params.priceMin) p.set("priceMin", params.priceMin);
  if (params.priceMax) p.set("priceMax", params.priceMax);
  if (params.sort) p.set("sort", params.sort);
  if (params.search) p.set("search", params.search);
  if (params.occasion) p.set("occasion", params.occasion);
  if (params.style) p.set("style", params.style);
  if (params.minRating) p.set("minRating", params.minRating);
  if (params.inStock) p.set("inStock", params.inStock);
  if (page > 1) p.set("page", String(page));
  return `/shop?${p.toString()}`;
}

export default function ShopPage(props: ShopPageProps) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent {...props} />
    </Suspense>
  );
}

function ShopSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="h-12 w-56 skeleton-shimmer" />
      {/* Pill bar skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-8 skeleton-shimmer rounded-full shrink-0"
            style={{ width: `${70 + (i % 3) * 20}px` }}
          />
        ))}
      </div>
      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[4/5] skeleton-shimmer" />
            <div className="h-3 skeleton-shimmer rounded" />
            <div className="h-4 skeleton-shimmer rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
