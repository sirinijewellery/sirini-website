"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddToCartButton } from "@/components/AddToCartButton";
import { PriceDisplay } from "@/components/PriceDisplay";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  material: string;
  badge: string | null;
  images: string[];
  stock?: number;
}

interface QuickViewModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ slug, isOpen, onClose }: QuickViewModalProps) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen || !slug) return;
    setLoading(true);
    setError(false);
    setProduct(null);
    fetch(`/api/products/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: ProductData) => {
        setProduct(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isOpen, slug]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl p-0 overflow-hidden bg-background"
      >
        {/* Manual close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-3 right-3 z-20 p-1.5 bg-background/80 backdrop-blur-sm border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="animate-pulse bg-surface-container aspect-[4/5]" />
            <div className="animate-pulse space-y-4 p-6">
              <div className="h-3 bg-surface-container rounded w-1/3" />
              <div className="h-6 bg-surface-container rounded w-3/4" />
              <div className="h-5 bg-surface-container rounded w-1/4" />
              <div className="space-y-2">
                <div className="h-3 bg-surface-container rounded w-full" />
                <div className="h-3 bg-surface-container rounded w-5/6" />
                <div className="h-3 bg-surface-container rounded w-4/6" />
              </div>
              <div className="h-10 bg-surface-container rounded w-full mt-4" />
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
            <p className="font-sans text-sm text-on-surface-variant">
              Could not load product
            </p>
            <Link
              href={`/shop/${slug}`}
              className="font-sans text-sm text-primary underline underline-offset-2 hover:text-primary/80"
              onClick={onClose}
            >
              View Product
            </Link>
          </div>
        )}

        {/* Product content */}
        {!loading && !error && product && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Product image */}
            <div className="relative aspect-[4/5] bg-surface-container overflow-hidden">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low">
                  <span className="font-display text-5xl text-primary opacity-30 select-none">
                    S
                  </span>
                </div>
              )}

              {/* Badge overlay */}
              {product.badge && (
                <div className="absolute top-4 left-4 border border-outline-variant bg-background/80 backdrop-blur-sm px-2 py-1">
                  <span
                    className={`font-sans text-[10px] font-semibold uppercase tracking-wider ${
                      product.badge === "NEW"
                        ? "text-success-emerald"
                        : product.badge === "SALE"
                        ? "text-primary"
                        : "text-on-surface"
                    }`}
                  >
                    {product.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Product details */}
            <div className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[min(80vh,600px)]">
              <DialogHeader>
                {/* Category label */}
                <p className="text-xs font-label-caps tracking-widest uppercase text-muted-foreground">
                  {product.category}
                </p>

                {/* Product name */}
                <DialogTitle className="font-display text-2xl text-on-surface leading-tight">
                  {product.name}
                </DialogTitle>

                {/* Price */}
                <PriceDisplay price={product.price} mrp={product.compareAtPrice ?? undefined} size="lg" />
              </DialogHeader>

              {/* Description */}
              {product.description && (
                <p className="font-sans text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* Material */}
              {product.material && (
                <p className="font-sans text-xs text-on-surface-variant">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Material:{" "}
                  </span>
                  {product.material}
                </p>
              )}

              {/* Add to Cart */}
              <div className="mt-auto pt-2">
                <AddToCartButton
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice,
                    images: product.images,
                    category: product.category,
                    stock: product.stock,
                  }}
                />
              </div>

              {/* View full details link */}
              <Link
                href={`/shop/${product.slug}`}
                onClick={onClose}
                className="font-sans text-sm text-center text-on-surface-variant hover:text-primary transition-colors underline underline-offset-2"
              >
                View Full Details &rarr;
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
