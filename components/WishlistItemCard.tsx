"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { parseImages } from "@/lib/parseImages";
import type { WishlistItemWithProduct } from "@/lib/queries/wishlist";

interface WishlistItemCardProps {
  item: WishlistItemWithProduct;
}

const badgeConfig: Record<string, { label: string; classes: string }> = {
  NEW: { label: "New", classes: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  HOT: { label: "Hot", classes: "bg-amber-100 text-amber-700 border-amber-200" },
  SALE: { label: "Sale", classes: "bg-rose-100 text-rose-700 border-rose-200" },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

export function WishlistItemCard({ item }: WishlistItemCardProps) {
  const [removed, setRemoved] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { product } = item;
  const images = parseImages(product.images);
  const primaryImage = images[0] || null;
  const secondImage = images[1] || null;
  const totalStock =
    product.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) ?? 0;
  const isOutOfStock =
    product.variants && product.variants.length > 0 && totalStock === 0;
  const badge = product.badge ? badgeConfig[product.badge] : null;

  async function handleRemove() {
    setIsRemoving(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      if (!res.ok) throw new Error("Failed to remove");

      setRemoved(true);
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  }

  if (removed) return null;

  return (
    <article className="group flex flex-col bg-background rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
        aria-label={`View ${product.name}`}
      >
        {primaryImage ? (
          <>
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className={`object-cover transition-opacity duration-300 ${
                secondImage ? "group-hover:opacity-0" : ""
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {secondImage && (
              <Image
                src={secondImage}
                alt={product.name}
                fill
                className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
          </>
        ) : (
          /* Branded placeholder */
          <div className="absolute inset-0 flex items-center justify-center bg-blush">
            <span className="font-display text-5xl font-light text-rose-gold opacity-50">
              S
            </span>
          </div>
        )}

        {/* Badge overlay */}
        {badge && (
          <span
            className={`absolute top-2 left-2 text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.classes}`}
          >
            {badge.label}
          </span>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-xs font-sans text-muted-foreground uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
            {product.category}
          </p>
          <h3 className="font-display text-base leading-snug text-foreground line-clamp-2">
            {product.name}
          </h3>
          <p className="font-sans text-sm font-medium text-primary">
            {formatPrice(product.price)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href={`/shop/${product.slug}`}
            className="w-full text-center text-sm font-sans font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-rose-gold-dark transition-colors duration-150 cursor-pointer"
          >
            View Product
          </Link>
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            aria-label={`Remove ${product.name} from wishlist`}
            className="w-full text-center text-sm font-sans font-normal px-4 py-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRemoving ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}
