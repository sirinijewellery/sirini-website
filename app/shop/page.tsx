import { Suspense } from "react";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductFilters } from "@/components/ProductFilters";
import { SortSelect } from "@/components/SortSelect";
import {
  getProducts,
  getCategories,
  getMaterials,
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
  }>;
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  if (params.category) {
    return {
      title: `${params.category} — Handcrafted Indian Jewellery`,
      description: `Shop handcrafted ${params.category.toLowerCase()} — Kundan, Meenakari & gold-plated designs. Free shipping across India.`,
      robots: { index: true, follow: true },
    };
  }
  return {
    title: "Shop Handcrafted Indian Jewellery — Kundan, Meenakari & Gold-Plated",
    description:
      "Browse 100+ handcrafted jewellery pieces — Kundan necklace sets, gold-plated earrings, bangles, rings & anklets. Free shipping across India.",
    robots: { index: true, follow: true },
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
      </div>
    </div>
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
