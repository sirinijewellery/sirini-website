"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseImages, selectCardImages } from "@/lib/parseImages";
import { QuickViewModal } from "@/components/QuickViewModal";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    category: string;
    images: unknown;
    badge?: string | null;
    variants?: { stockQuantity: number }[];
  };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
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

export function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const images = parseImages(product.images);
  const { primary: primaryImage, hover: secondImage } = selectCardImages(images);

  const totalStock =
    product.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) ?? 0;
  const isOutOfStock =
    product.variants && product.variants.length > 0 && totalStock === 0;

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
              alt={product.name}
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
                alt={product.name}
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

        {/* ── Wishlist heart ─────────────────────────────────────── */}
        {/* Always visible on mobile (touch), opacity-0→100 on hover for desktop */}
        <button
          type="button"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          disabled={wishlistLoading}
          className={`absolute top-4 right-4 p-1.5 backdrop-blur-sm border
            transition-all duration-200 cursor-pointer disabled:cursor-wait
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            ${wishlisted
              ? "bg-primary/10 border-primary text-primary"
              : "bg-background/80 border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/40"
            }`}
          onClick={handleWishlist}
        >
          <HeartIcon className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
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
          {product.name}
        </h4>
        <div className="flex flex-col gap-0.5">
          {/* Real price — larger, black, shown first */}
          <p className="font-sans text-base font-bold text-on-surface leading-tight">
            {formatPrice(product.price)}
          </p>
          {/* MRP — smaller, red, diagonal strikethrough */}
          <span className="relative inline-block text-red-500 text-xs leading-tight w-fit">
            {formatPrice((product.price * 2) + 1299)}
            <span
              className="absolute pointer-events-none"
              aria-hidden="true"
              style={{
                top: '50%',
                left: '-2%',
                width: '104%',
                height: '1px',
                background: 'rgb(239 68 68)',
                transform: 'rotate(-12deg)',
                transformOrigin: 'center',
                display: 'block',
              }}
            />
          </span>
        </div>
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
