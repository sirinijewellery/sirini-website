"use client";

import { useState, useRef, useEffect } from "react";
import { VariantSelector } from "@/components/VariantSelector";
import { AddToCartButton } from "@/components/AddToCartButton";
import { WishlistButton } from "@/components/WishlistButton";
import { Separator } from "@/components/ui/separator";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewed";

interface Variant {
  id: string;
  size: string | null;
  colour: string | null;
  stockQuantity: number;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    category: string;
    material: string;
    sku: string;
    badge: string | null;
    variants: Variant[];
  };
  images: string[];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

const badgeStyle: Record<string, string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  HOT: "bg-amber-100 text-amber-700",
  SALE: "bg-rose-100 text-rose-700",
};

export default function ProductDetailClient({
  product,
  images,
}: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.length === 1 ? product.variants[0].id : null
  );

  const ctaRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);

  useEffect(() => {
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: images[0] ?? "",
      category: product.category,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]); // run once when product changes

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? null;
  const hasVariants = product.variants.length > 0;

  return (
    <>
    <div className="space-y-6">
      {/* Badge + Category */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
          {product.category}
        </span>
        {product.badge && (
          <span
            className={`text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
              badgeStyle[product.badge] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {product.badge}
          </span>
        )}
      </div>

      {/* Name */}
      <h1 className="font-display text-3xl md:text-4xl font-light text-foreground leading-tight">
        {product.name}
      </h1>

      {/* Price */}
      <p className="font-sans text-2xl font-semibold text-primary">
        {formatPrice(product.price)}
      </p>

      <Separator />

      {/* Variant selector */}
      {hasVariants && (
        <VariantSelector
          variants={product.variants}
          selectedVariantId={selectedVariantId}
          onSelect={setSelectedVariantId}
        />
      )}

      {/* Add to cart + Wishlist */}
      <div ref={ctaRef} className="flex gap-3">
        <div className="flex-1">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              images,
              category: product.category,
            }}
            selectedVariant={selectedVariant}
            hasVariants={hasVariants}
          />
        </div>
        <WishlistButton productId={product.id} />
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-2">
        <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Description
        </h3>
        <p className="font-sans text-sm leading-relaxed text-foreground">
          {product.description}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Details
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-sans">
          <span className="text-muted-foreground">Material</span>
          <span className="text-foreground">{product.material}</span>
          <span className="text-muted-foreground">SKU</span>
          <span className="text-foreground">{product.sku}</span>
        </div>
      </div>
    </div>

    {/* Sticky mobile CTA — visible when main button is off screen */}
      <div
        className={`md:hidden fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3 max-w-screen-2xl mx-auto">
          {/* Product info */}
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-medium text-on-surface truncate">{product.name}</p>
            <p className="font-sans text-sm font-semibold text-primary">{formatPrice(product.price)}</p>
          </div>
          {/* CTA button — same props as main AddToCartButton */}
          <div className="shrink-0 w-40">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                images,
                category: product.category,
              }}
              selectedVariant={selectedVariant}
              hasVariants={hasVariants}
            />
          </div>
        </div>
      </div>
    </>
  );
}
