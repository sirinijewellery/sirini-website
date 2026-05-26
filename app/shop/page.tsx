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
  const title = params.category ? `Shop ${params.category}` : "Shop All Jewellery";
  return {
    title,
    description:
      "Browse our complete collection of handcrafted fashion jewellery — necklaces, earrings, bangles, rings and more.",
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
      <div className="mb-8">
        <h1 className="font-display text-4xl font-light text-foreground">
          {params.search
            ? `Results for "${params.search}"`
            : params.category || "All Jewellery"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-sans">{total} products</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <ProductFilters categories={categories} materials={materials} />

        {/* Product grid area */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-6">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-10 w-48 bg-muted rounded animate-pulse mb-8" />
      <div className="flex gap-8">
        <div className="w-56 shrink-0 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square bg-muted rounded-lg animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
