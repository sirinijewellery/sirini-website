import { Suspense } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductFilters } from "@/components/ProductFilters";
import { SortSelect } from "@/components/SortSelect";
import {
  getProducts,
  getShopCategories,
  getMaterials,
  OCCASIONS,
  STYLES,
  type GetProductsOptions,
} from "@/lib/queries/products";
import { getDefaultSort } from "@/lib/queries/catalog";
import { getTaxonomyTree } from "@/lib/queries/taxonomy";
import type { TaxonomyGroupData, TaxonomyTermData } from "@/lib/taxonomy";
import Link from "next/link";
import { siteConfig } from "@/lib/seo";
import { NAV_CATEGORIES } from "@/lib/taxonomy";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import type { Metadata } from "next";

/** Pretty label for a category slug ("necklace-sets" → "Necklace Sets"). */
function categoryLabel(slug: string): string {
  return (
    NAV_CATEGORIES.find((c) => c.slug === slug)?.label ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
  );
}

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
    collection?: string;
    look?: string;
    stone?: string;
    colour?: string;
    minRating?: string;
    inStock?: string;
  }>;
}

/**
 * Find a term's display label within the taxonomy tree by its group + slug
 * (walks nested children for hierarchical groups). Falls back to a prettified
 * slug so a freshly-added term always shows *something* readable.
 */
function termLabel(
  tree: TaxonomyGroupData[],
  groupSlug: string,
  termSlug: string
): string {
  const group = tree.find((g) => g.slug === groupSlug);
  const pretty = termSlug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  if (!group) return pretty;
  const walk = (terms: TaxonomyTermData[]): string | null => {
    for (const t of terms) {
      if (t.slug === termSlug) return t.label;
      const found = walk(t.children);
      if (found) return found;
    }
    return null;
  };
  return walk(group.terms) ?? pretty;
}

/** Parse a positive integer query param; falls back to 1 on NaN/garbage. */
function parsePage(raw: string | undefined): number {
  const n = parseInt(raw || "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Parse a float query param; returns undefined on NaN/garbage so Prisma never sees NaN. */
function parseFloatParam(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = parsePage(params.page);

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

  // Shared OG/Twitter card for every facet variant — category/occasion/style
  // links get shared a lot (esp. WhatsApp), so give each its own social card
  // instead of falling back to the generic homepage card.
  const ogImage = siteConfig.defaultOgImage;
  const ogPath = params.occasion
    ? `/shop?occasion=${params.occasion}`
    : params.style
      ? `/shop?style=${params.style}`
      : params.category
        ? `/shop?category=${encodeURIComponent(params.category)}`
        : "/shop";
  const build = (title: string, description: string): Metadata => ({
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_IN",
      url: `${siteConfig.url}${ogPath}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    ...seo,
  });

  if (params.occasion) {
    const occ = OCCASIONS.find((o) => o.slug === params.occasion);
    const title =
      params.occasion === "bridal"
        ? "Bridal & Wedding Jewellery"
        : params.occasion === "festive"
          ? "Festive Jewellery"
          : `${occ?.label ?? params.occasion} Jewellery`;
    return build(
      `${title} | Sirini Jewellery`,
      occ?.blurb ??
        `Shop handcrafted jewellery for ${params.occasion} occasions. Free shipping across India.`,
    );
  }
  if (params.style) {
    const st = STYLES.find((s) => s.slug === params.style);
    return build(
      `${st?.label ?? params.style} Jewellery | Sirini Jewellery`,
      `Shop handcrafted ${st?.label ?? params.style} jewellery — necklace sets, earrings, bangles & more. Free shipping across India.`,
    );
  }
  if (params.category) {
    const label = categoryLabel(params.category);
    return build(
      `${label} — Buy Handcrafted Indian Jewellery Online`,
      `Shop handcrafted ${label.toLowerCase()} — Kundan, Meenakari & gold-plated designs by Sirini Jewellery, Mumbai. Free shipping across India, COD available.`,
    );
  }
  return build(
    "Shop Handcrafted Indian Jewellery — Kundan, Meenakari & Gold-Plated",
    "Browse 100+ handcrafted jewellery pieces — Kundan necklace sets, gold-plated earrings, bangles, rings & anklets. Free shipping across India.",
  );
}

async function ShopContent({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const page = parsePage(params.page);

  // Owner-configurable default sort applies only when the visitor hasn't chosen one.
  const defaultSort = await getDefaultSort();

  const options: GetProductsOptions = {
    page,
    limit: 20,
    category: params.category,
    material: params.material,
    priceMin: parseFloatParam(params.priceMin),
    priceMax: parseFloatParam(params.priceMax),
    sort: (params.sort as GetProductsOptions["sort"]) || defaultSort,
    search: params.search,
    occasion: params.occasion,
    style: params.style,
    collection: params.collection,
    look: params.look,
    stone: params.stone,
    colour: params.colour,
    minRating: parseFloatParam(params.minRating),
    inStock: params.inStock === "1",
  };

  const [{ products, total, totalPages }, categories, taxonomyTree] = await Promise.all([
    getProducts(options),
    getShopCategories(),
    getTaxonomyTree(),
  ]);

  const materials = getMaterials();
  const currentSort = params.sort || defaultSort;
  const limit = options.limit ?? 20;

  // Visible breadcrumb label for the active facet (if any).
  const facetLabel = params.search
    ? `Results for “${params.search}”`
    : params.occasion
      ? OCCASIONS.find((o) => o.slug === params.occasion)?.label || params.occasion
      : params.style
        ? `${STYLES.find((s) => s.slug === params.style)?.label || params.style} Jewellery`
        : params.category
          ? categoryLabel(params.category)
          : params.collection
            ? termLabel(taxonomyTree, "collection", params.collection)
            : params.look
              ? termLabel(taxonomyTree, "look", params.look)
              : params.stone
                ? termLabel(taxonomyTree, "stone", params.stone)
                : params.colour
                  ? termLabel(taxonomyTree, "colour", params.colour)
                  : null;

  // ItemList structured data for the products on the current page.
  const itemListSchema =
    products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: (page - 1) * limit + i + 1,
            url: `${siteConfig.url}/shop/${p.slug}`,
            name: p.name,
          })),
        }
      : null;

  // BreadcrumbList schema — pairs with the visible breadcrumb nav below.
  const facetUrl = params.category
    ? `${siteConfig.url}/shop?category=${encodeURIComponent(params.category)}`
    : params.occasion
      ? `${siteConfig.url}/shop?occasion=${encodeURIComponent(params.occasion)}`
      : params.style
        ? `${siteConfig.url}/shop?style=${encodeURIComponent(params.style)}`
        : params.collection
          ? `${siteConfig.url}/shop?collection=${encodeURIComponent(params.collection)}`
          : params.look
            ? `${siteConfig.url}/shop?look=${encodeURIComponent(params.look)}`
            : params.stone
              ? `${siteConfig.url}/shop?stone=${encodeURIComponent(params.stone)}`
              : params.colour
                ? `${siteConfig.url}/shop?colour=${encodeURIComponent(params.colour)}`
                : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemListSchema).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Shop", url: `${siteConfig.url}/shop` },
          ...(facetLabel && facetUrl
            ? [{ name: facetLabel, url: facetUrl }]
            : []),
        ]}
      />
      {/* Header */}
      <div className="mb-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="font-sans text-xs text-on-surface-variant mb-4"
        >
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          {facetLabel ? (
            <>
              <Link href="/shop" className="hover:text-primary">
                Shop
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-on-surface">{facetLabel}</span>
            </>
          ) : (
            <span className="text-on-surface">Shop</span>
          )}
        </nav>
        <div className="section-gold-rule">
          <h1 className="font-display text-[40px] md:text-[56px] font-light leading-[1.0] tracking-[-0.02em] text-on-surface">
            {params.search ? (
              <>
                <em style={{ fontStyle: "italic" }}>Results for</em>{" "}
                &ldquo;{params.search}&rdquo;
              </>
            ) : (
              facetLabel ?? "All Jewellery"
            )}
          </h1>
        </div>
        <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-on-surface-variant mt-3">
          {total} {total === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div className="space-y-6">
        {/* Pill filter bar — full width, scrollable on mobile */}
        <ProductFilters
          categories={categories}
          materials={materials}
          taxonomy={taxonomyTree}
        />

        {/* Sort bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-sans hidden sm:block">
            Showing {total === 0 ? 0 : Math.min((page - 1) * 20 + 1, total)}–
            {Math.min(page * 20, total)} of {total}
          </p>
          <div className="ml-auto">
            <SortSelect currentSort={currentSort} defaultSort={defaultSort} />
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
  party:
    "Turn heads at every soirée with Sirini's party and cocktail edit — statement Kundan earrings, bold cocktail rings and evening-ready necklace sets. Lightweight, gold-plated and made to sparkle under the lights.",
  daily:
    "Effortless everyday elegance from Sirini — delicate studs, slim chains and subtle gold-plated pieces that move from desk to dinner. Skin-friendly and lightweight, with free shipping across India.",
  // categories
  "long-sets":
    "Sirini's long necklace sets — rani haars, layered Polki strands and temple long sets — drape beautifully for brides and festive dressing. Each is gold-plated and handcrafted in Mumbai, with free pan-India shipping.",
  // styles
  kundan:
    "Kundan jewellery sets pure gold foil around uncut stones for a signature regal glow. Sirini's handcrafted Kundan necklace sets, chokers and jhumkas are made for brides and festive occasions — gold-plated, crafted in Mumbai.",
  meenakari:
    "Meenakari is the art of hand-painted enamel, layering jewel-bright colour onto gold-plated jewellery. Explore Sirini's Meenakari jhumkas, necklace sets and bangles — vivid, festive and handcrafted, with free pan-India shipping.",
  polki:
    "Polki jewellery showcases uncut, unfaceted diamonds for an heirloom, old-world richness. Sirini's Polki necklace sets and rani haars bring bridal grandeur in gold-plated, handcrafted designs — shipped free across India.",
  temple:
    "Temple jewellery draws on South-Indian heritage, rendering deities and motifs in richly carved gold tones. Sirini's temple necklace sets, jhumkas and long haars suit weddings and classical occasions — handcrafted in Mumbai.",
  pearl:
    "Pearl jewellery brings soft, timeless elegance to any look. Sirini's pearl necklace sets, drops and chokers pair lustrous pearls with gold-plated detailing — understated pieces for work, daily wear and weddings.",
  antique:
    "Antique gold jewellery wears its vintage, oxidised finish with quiet character. Sirini's antique-finish necklace sets, jhumkas and bangles offer heritage charm for festive and ethnic looks — handcrafted and gold-plated.",
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
      className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-2 text-sm font-sans rounded border transition-colors ${
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
  if (params.collection) p.set("collection", params.collection);
  if (params.look) p.set("look", params.look);
  if (params.stone) p.set("stone", params.stone);
  if (params.colour) p.set("colour", params.colour);
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
