"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

const BADGE_STYLES: Record<string, string> = {
  NEW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  HOT: "bg-orange-50 text-orange-700 border-orange-200",
  SALE: "bg-red-50 text-red-700 border-red-200",
};

export interface ProductRowData {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  badge: string | null;
  isFeatured: boolean;
  coverImage?: string;
}

export function ProductRow({ product }: { product: ProductRowData }) {
  const router = useRouter();
  const editHref = `/admin/products/${product.id}/edit`;

  return (
    <tr
      onClick={() => router.push(editHref)}
      className="cursor-pointer hover:bg-gray-50/50 transition-colors duration-100"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(editHref);
      }}
      aria-label={`Edit ${product.name}`}
    >
      {/* Stock — first column */}
      <td className="px-4 py-3 text-sm text-right">
        <span
          className={
            product.stock === 0
              ? "text-red-600 font-medium"
              : product.stock < 5
              ? "text-amber-600 font-medium"
              : "text-gray-700"
          }
        >
          {product.stock}
        </span>
      </td>

      {/* Product */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            {product.coverImage ? (
              <Image
                src={product.coverImage}
                alt={product.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-4 w-4 text-gray-300" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
              {product.name}
            </p>
            <p className="text-xs text-gray-400 truncate max-w-[180px]">
              {product.sku}
            </p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>

      {/* Price */}
      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
        ₹{product.price.toLocaleString("en-IN")}
      </td>

      {/* Badge */}
      <td className="px-4 py-3 text-center">
        {product.badge ? (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              BADGE_STYLES[product.badge] ?? "bg-gray-50 text-gray-600 border-gray-200"
            }`}
          >
            {product.badge}
          </span>
        ) : (
          <span className="text-gray-300 text-sm">—</span>
        )}
      </td>

      {/* Featured */}
      <td className="px-4 py-3 text-center">
        {product.isFeatured ? (
          <svg
            className="h-4 w-4 text-emerald-500 mx-auto"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg
            className="h-4 w-4 text-gray-300 mx-auto"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
          </svg>
        )}
      </td>

      {/* Actions — stop propagation so buttons don't trigger row navigation */}
      <td className="px-4 py-3">
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href={editHref}
            aria-label={`Edit ${product.name}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "text-gray-400 hover:text-gray-700"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </Link>
          <DeleteProductButton
            productId={product.id}
            productName={product.name}
          />
        </div>
      </td>
    </tr>
  );
}
