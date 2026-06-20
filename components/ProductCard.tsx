"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseImages, selectCardImages } from "@/lib/parseImages";
import { QuickViewModal } from "@/components/QuickViewModal";
import { PriceDisplay, formatPrice } from "@/components/PriceDisplay";
import { categoryLabel } from "@/lib/taxonomy";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    category: string;
    images: unknown;
    badge?: string | null;
    stock?: number;
    tags?: string[];
    avgRating?: number;
    reviewCount?: number;
  };
}

// SVG heart icon — no emoji, accessible
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// Gold star icon — filled, used for the card rating row
function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="#C9A96E"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// WhatsApp icon — matches the path used on the product detail page
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const images = parseImages(product.images);
  const { primary: primaryImage, hover: secondImage } = selectCardImages(images);

  const isOutOfStock = product.stock != null && product.stock <= 0;

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      router.push(`/login?callbackUrl=/shop`);
      return;
    }
    setWishlistLoading(true);
    try {
      const method = wishlisted ? "DELETE" : "POST";
      const res = await fetch("/api/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        setWishlisted(!wishlisted);
        toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setWishlistLoading(false);
    }
  }

  function handleWhatsAppShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const text = `✨ ${product.name} — ${formatPrice(product.price)}\n\nHandcrafted by Sirini Jewellery:\n${window.location.origin}/shop/${product.slug}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <>
    <Link href={`/shop/${product.slug}`} className="group block cursor-pointer">
      {/* ── Image container ─────────────────────────────────────── */}
      <div className="relative aspect-[4/5] bg-surface-container overflow-hidden border border-outline-variant group-hover:border-primary/30 transition-colors duration-300 mb-4">

        {/* Primary image */}
        {primaryImage ? (
          <>
            <Image
              src={primaryImage}
              alt={`${product.name} — handcrafted ${categoryLabel(product.category)} by Sirini Jewellery`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover [transition:opacity_300ms_ease-out,transform_700ms_ease-out] group-hover:scale-[1.08] ${
                secondImage ? "group-hover:opacity-0" : ""
              }`}
            />
            {/* Secondary hover image — fades in over the primary */}
            {secondImage && (
              <Image
                src={secondImage}
                alt={`${product.name} — handcrafted ${categoryLabel(product.category)} by Sirini Jewellery - back view`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 [transition:opacity_300ms_ease-out,transform_700ms_ease-out] group-hover:opacity-100 group-hover:scale-[1.08]"
              />
            )}
          </>
        ) : (
          /* Fallback placeholder */
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low">
            <span className="font-display text-5xl text-primary opacity-30 select-none">S</span>
          </div>
        )}

        {/* ── Badge ─────────────────────────────────────────────── */}
        {product.badge && (
          <div className="absolute top-3 left-3">
            {product.badge === "NEW" && (
              <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0" aria-hidden="true" />
                <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.15em] text-success-emerald">New</span>
              </div>
            )}
            {product.badge === "SALE" && (
              <div className="bg-primary px-2.5 py-1">
                <span className="font-sans text-[9px] font-semibold italic tracking-wide text-on-primary">Sale</span>
              </div>
            )}
            {product.badge !== "NEW" && product.badge !== "SALE" && (
              <div className="bg-[#C9A96E] px-2 py-1">
                <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.15em] text-[#221A15]">{product.badge}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Low-stock urgency pill ─────────────────────────────── */}
        {/* Offset below the NEW/SALE badge area to avoid clashing */}
        {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && (
          <div className={`absolute left-3 ${product.badge ? "top-12" : "top-3"}`}>
            <span className="inline-block bg-rose-600/90 backdrop-blur-sm px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
              Only {product.stock} left
            </span>
          </div>
        )}

        {/* ── Wishlist heart ─────────────────────────────────────── */}
        {/* Always visible on mobile (touch), opacity-0→100 on hover for desktop */}
        <button
          type="button"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          disabled={wishlistLoading}
          className={`absolute top-4 right-4 p-1.5 backdrop-blur-sm border press-scale
            transition-all duration-200 cursor-pointer disabled:cursor-wait
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            ${wishlisted
              ? "bg-primary/10 border-primary text-primary"
              : "bg-background/80 border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/40"
            }`}
          onClick={handleWishlist}
        >
          {/* key forces remount on toggle so the pop replays every time */}
          <HeartIcon
            key={String(wishlisted)}
            className={`w-4 h-4 ${wishlisted ? "fill-current animate-heart-pop" : ""}`}
          />
        </button>

        {/* ── WhatsApp share ─────────────────────────────────────── */}
        <button
          type="button"
          aria-label={`Share ${product.name} on WhatsApp`}
          className="absolute top-14 right-4 p-1.5 backdrop-blur-sm border press-scale
            transition-all duration-200 cursor-pointer
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            bg-[#25D366] border-[#25D366] text-white
            hover:bg-[#1ebe5d] hover:border-[#1ebe5d]"
          onClick={handleWhatsAppShare}
        >
          <WhatsAppIcon className="w-4 h-4" />
        </button>

        {/* ── Out of stock overlay ───────────────────────────────── */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant border border-outline-variant px-3 py-1 bg-background/90">
              Out of Stock
            </span>
          </div>
        )}

        {/* ── Quick view button — desktop hover only ─────────────── */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setQuickViewOpen(true);
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center gap-1.5 px-4 py-2 bg-background/95 backdrop-blur-sm border border-outline-variant text-on-surface text-xs font-label-caps tracking-wider uppercase hover:bg-primary hover:text-on-primary hover:border-primary whitespace-nowrap z-10 cursor-pointer"
          aria-label={`Quick view ${product.name}`}
        >
          Quick View
        </button>

        {/* Vignette — warm spotlight on hover */}
        <div className="vignette-overlay" aria-hidden="true" />
      </div>

      {/* ── Product info ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h4 className="font-sans text-sm text-on-surface leading-snug line-clamp-2">
          {/* inline span so the underline sweep hugs the text, not the column */}
          <span className="link-sweep">{product.name}</span>
        </h4>
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags.includes("new-arrivals") && (
              <span className="font-sans text-[10px] font-medium text-emerald-700 tracking-wide">New</span>
            )}
            {product.tags.includes("bestsellers") && (
              <span className="font-sans text-[10px] font-medium text-amber-700 tracking-wide">&#9733; Bestseller</span>
            )}
            {product.tags.includes("handpicked") && (
              <span className="font-sans text-[10px] font-medium text-purple-700 tracking-wide">&#10022; Handpicked</span>
            )}
          </div>
        )}
        <PriceDisplay price={product.price} mrp={product.compareAtPrice ?? undefined} size="md" />

        {/* ── Rating row — only when reviews exist ─────────────────── */}
        {product.reviewCount && product.reviewCount > 0 ? (
          <div className="flex items-center gap-1 font-sans text-xs text-on-surface-variant">
            <StarIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-on-surface font-medium">
              {(product.avgRating ?? 0).toFixed(1)}
            </span>
            <span className="text-on-surface-variant/70">·</span>
            <span className="text-on-surface-variant/70">
              ({product.reviewCount})
            </span>
          </div>
        ) : null}
      </div>
    </Link>

    <QuickViewModal
      slug={product.slug}
      isOpen={quickViewOpen}
      onClose={() => setQuickViewOpen(false)}
    />
    </>
  );
}
