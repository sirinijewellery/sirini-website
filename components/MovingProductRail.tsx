"use client";

import Link from "next/link";
import Image from "next/image";
import { PriceDisplay } from "@/components/PriceDisplay";

export interface RailProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  badge: string | null;
  avgRating?: number;
  reviewCount?: number;
}

/**
 * Auto-scrolling marquee of product cards — like the testimonials carousel,
 * but a continuous seamless loop. Pauses on hover so shoppers can click.
 * The list is duplicated; the track animates translateX(0 → -50%) so the
 * second copy lands exactly where the first started (no visible seam).
 */
export function MovingProductRail({ products }: { products: RailProduct[] }) {
  if (products.length === 0) return null;

  const loop = [...products, ...products];
  // Slower for fewer cards, faster for more — keeps a calm, premium pace.
  const durationSeconds = Math.max(products.length * 5, 24);

  return (
    <div className="relative w-full overflow-hidden group/rail">
      {/* Soft edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 md:w-24 z-10 bg-gradient-to-r from-surface-container-low to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:w-24 z-10 bg-gradient-to-l from-surface-container-low to-transparent" />

      <div
        className="marquee-track flex w-max group-hover/rail:[animation-play-state:paused]"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {loop.map((product, i) => {
          const isClone = i >= products.length;
          return (
            <Link
              key={`${product.id}-${i}`}
              href={`/shop/${product.slug}`}
              aria-hidden={isClone}
              tabIndex={isClone ? -1 : 0}
              className="shrink-0 w-[260px] md:w-[300px] mr-8 group/item cursor-pointer"
            >
              {/* Image */}
              <div className="relative aspect-[4/5] bg-surface mb-4 overflow-hidden border border-outline-variant group-hover/item:border-primary/30 transition-colors duration-300">
                {/* No `priority` here — rail is below the fold; Next.js Image is lazy by default. */}
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={`${product.name} | Sirini Jewellery`}
                    fill
                    sizes="(max-width: 768px) 260px, 300px"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/item:scale-[1.08]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low">
                    <span className="font-headline-lg text-[80px] text-primary/20 select-none leading-none">
                      {product.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {product.badge && (
                  <div className="absolute top-4 left-4 border border-outline px-2 py-1 bg-surface/80 backdrop-blur-sm">
                    <span className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface">
                      {product.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1">
                <h4 className="font-body-md text-body-md text-on-surface truncate">
                  {product.name}
                </h4>
                {product.reviewCount && product.reviewCount > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#C9A227" aria-hidden="true">
                      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z" />
                    </svg>
                    <span className="font-medium text-on-surface">
                      {(product.avgRating ?? 0).toFixed(1)}
                    </span>
                    <span>({product.reviewCount})</span>
                  </div>
                ) : null}
                <PriceDisplay price={product.price} size="lg" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
