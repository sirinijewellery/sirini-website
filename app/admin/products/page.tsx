import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus, Package } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/queries/products";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/admin/SearchInput";
import { ProductRow } from "@/components/admin/ProductRow";

export const metadata: Metadata = { title: "Products" };

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

const PAGE_SIZE = 20;

export default async function AdminProductsPage({ searchParams }: Props) {
  const { page, search } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1") || 1);
  const searchTerm = search?.trim() || undefined;

  const where = searchTerm
    ? {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" as const } },
          { sku: { contains: searchTerm, mode: "insensitive" as const } },
          { category: { contains: searchTerm, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        price: true,
        images: true,
        stock: true,
        badge: true,
        isFeatured: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function paginationHref(p: number) {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-sans">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} product{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/admin/products/new" className={cn(buttonVariants({ size: "default" }), "gap-1.5")}>
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Suspense fallback={<div className="h-8 w-64 rounded-lg bg-gray-100 animate-pulse" />}>
          <SearchInput
            defaultValue={searchTerm}
            placeholder="Search by name, SKU, or category…"
          />
        </Suspense>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {searchTerm ? "No products match your search." : "No products yet."}
            </p>
            {!searchTerm && (
              <Link
                href="/admin/products/new"
                className="mt-3 text-sm text-primary hover:underline underline-offset-4"
              >
                Add your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]" aria-label="Products table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Badge
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const coverImage = parseImages(product.images)[0];
                  return (
                    <ProductRow
                      key={product.id}
                      product={{
                        id: product.id,
                        name: product.name,
                        sku: product.sku,
                        category: product.category,
                        price: product.price,
                        stock: product.stock,
                        badge: product.badge,
                        isFeatured: product.isFeatured,
                        coverImage,
                      }}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-4 flex items-center justify-between"
          aria-label="Pagination"
        >
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} &middot; {total} results
          </p>
          <div className="flex items-center gap-1">
            {currentPage > 1 && (
              <Link
                href={paginationHref(currentPage - 1)}
                aria-label="Previous page"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Previous
              </Link>
            )}

            {/* Page numbers — show window around current page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 1
              )
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">
                    …
                  </span>
                ) : item === currentPage ? (
                  <span
                    key={item}
                    aria-current="page"
                    className={buttonVariants({ variant: "default", size: "sm" })}
                  >
                    {item}
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={paginationHref(item as number)}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    {item}
                  </Link>
                )
              )}

            {currentPage < totalPages && (
              <Link
                href={paginationHref(currentPage + 1)}
                aria-label="Next page"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
