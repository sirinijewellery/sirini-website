"use client";

import { useState, useRef, useEffect } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { WishlistButton } from "@/components/WishlistButton";
import { Separator } from "@/components/ui/separator";
import { PriceDisplay, formatPrice } from "@/components/PriceDisplay";
import { PincodeEstimator } from "@/components/PincodeEstimator";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewed";
import { categoryLabel } from "@/lib/taxonomy";
import {
  DEFAULT_BADGES,
  DEFAULT_LOW_STOCK_THRESHOLD,
  badgeColor,
  type BadgeDef,
} from "@/lib/catalog";

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    category: string;
    material: string;
    sku: string;
    badge: string | null;
    stock?: number;
  };
  images: string[];
  /** Owner-defined badges. Defaults to the original 6 if not supplied. */
  badges?: BadgeDef[];
  /** Stock level at/below which the "only N left" line shows. Default 5. */
  lowStockThreshold?: number;
}

export default function ProductDetailClient({
  product,
  images,
  badges = DEFAULT_BADGES,
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
}: ProductDetailClientProps) {
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

  function handleWhatsAppShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://sirinijewellery.com/shop/${product.slug}`;
    const price = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(product.price);
    const text = `✨ ${product.name} — ${price}\n\nHandcrafted ${categoryLabel(product.category)} by Sirini Jewellery. Check it out:\n${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Badge + Category */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
          {categoryLabel(product.category)}
        </span>
        {product.badge && (
          <span
            className={`text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${badgeColor(
              badges,
              product.badge
            )}`}
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
      <PriceDisplay price={product.price} mrp={product.compareAtPrice ?? undefined} size="xl" />

      {/* You save line — shown when a real compare-at saving exists */}
      {product.compareAtPrice != null && product.compareAtPrice > product.price && (
        <p className="text-sm font-sans font-medium text-green-700">
          You save {formatPrice(product.compareAtPrice - product.price)}
        </p>
      )}

      {/* Social proof / urgency */}
      <div className="flex items-center gap-2 text-[13px] font-sans text-rose-600">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
        </span>
        <span>High demand — lots of shoppers love this piece. Order soon before it sells out.</span>
      </div>

      {/* Stock-level urgency line — complements the social-proof line above */}
      {product.stock !== undefined && product.stock > 0 && product.stock <= lowStockThreshold && (
        <div className="flex items-center gap-2 text-[13px] font-sans font-medium text-rose-600">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          <span>Hurry — only {product.stock} left in stock!</span>
        </div>
      )}
      {product.stock === 0 && (
        <div className="text-[13px] font-sans text-muted-foreground">
          Out of stock
        </div>
      )}

      <Separator />

      {/* Add to cart + Wishlist */}
      <div ref={ctaRef} className="flex gap-3">
        <div className="flex-1">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              images,
              category: product.category,
              stock: product.stock,
            }}
          />
        </div>
        <WishlistButton productId={product.id} />
      </div>

      {/* Pincode delivery-date estimator */}
      <PincodeEstimator />

      {/* ── Trust badges block ─────────────────────────────────────── */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          {/* 1-Year Warranty — Shield */}
          <div className="flex items-start gap-2.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-[#C9A96E]" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold tracking-[0.12em] uppercase text-on-surface leading-tight">
                1-Year Warranty
              </p>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight mt-0.5">
                On plating &amp; polish
              </p>
            </div>
          </div>

          {/* Free Shipping — Truck */}
          <div className="flex items-start gap-2.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-[#C9A96E]" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold tracking-[0.12em] uppercase text-on-surface leading-tight">
                Free Shipping
              </p>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight mt-0.5">
                Across India
              </p>
            </div>
          </div>

          {/* 7-Day Returns — Refresh */}
          <div className="flex items-start gap-2.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-[#C9A96E]" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
            </svg>
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold tracking-[0.12em] uppercase text-on-surface leading-tight">
                7-Day Returns
              </p>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight mt-0.5">
                Easy &amp; hassle-free
              </p>
            </div>
          </div>

          {/* 100% Genuine — BadgeCheck */}
          <div className="flex items-start gap-2.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-[#C9A96E]" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold tracking-[0.12em] uppercase text-on-surface leading-tight">
                100% Genuine
              </p>
              <p className="text-[10px] font-sans text-on-surface-variant leading-tight mt-0.5">
                Quality assured
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Share on WhatsApp */}
      <button
        type="button"
        onClick={handleWhatsAppShare}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans font-medium bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors duration-200 cursor-pointer w-fit"
        aria-label="Share this product on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>Share on WhatsApp</span>
      </button>

      {/* Description */}
      <div className="space-y-2">
        <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Description
        </h2>
        <p className="font-sans text-sm leading-relaxed text-foreground">
          {product.description}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Details
        </h2>
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
                compareAtPrice: product.compareAtPrice,
                images,
                category: product.category,
                stock: product.stock,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
