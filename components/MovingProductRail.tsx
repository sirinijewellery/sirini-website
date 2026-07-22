"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useCallback } from "react";
import { PriceDisplay } from "@/components/PriceDisplay";

export interface RailProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string | null;
  badge: string | null;
  avgRating?: number;
  reviewCount?: number;
}

/**
 * Auto-scrolling product ribbon with manual prev/next arrows.
 * - Continuously auto-scrolls (JS-driven, seamless loop via duplicated list).
 * - Hover pauses; resumes on leave.
 * - Arrows / touch / wheel pause it, then it auto-resumes after 5 seconds.
 * - Cards are real <Link>s — always clickable/tappable.
 */
export function MovingProductRail({ products }: { products: RailProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Continuous auto-scroll via requestAnimationFrame.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Auto-scroll pace (px per frame). Touch devices get a slightly brisker
    // ribbon since there's no hover-to-browse — desktop stays calm/premium.
    //   ≤ 1024px (phones + iPad): faster   |   desktop: calm
    const speedRef = { current: 0.6 };
    const computeSpeed = () => {
      speedRef.current = window.innerWidth <= 1024 ? 1.6 : 1.0;
    };
    computeSpeed();
    window.addEventListener("resize", computeSpeed);

    function step() {
      const node = scrollRef.current;
      if (node && !pausedRef.current) {
        node.scrollLeft += speedRef.current;
        const half = node.scrollWidth / 2;
        if (half > 0 && node.scrollLeft >= half) node.scrollLeft -= half;
      }
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      window.removeEventListener("resize", computeSpeed);
    };
  }, []);

  // Pause now, auto-resume 5s after the last interaction.
  const pauseThenResume = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, 5000);
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  const nudge = useCallback(
    (dir: 1 | -1) => {
      const el = scrollRef.current;
      if (!el) return;
      pauseThenResume();
      el.scrollBy({ left: dir * 332, behavior: "smooth" });
    },
    [pauseThenResume],
  );

  if (products.length === 0) return null;

  const loop = [...products, ...products];

  return (
    <div className="relative w-full group/rail">
      {/* Soft edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 md:w-24 z-10 bg-gradient-to-r from-surface-container-low to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:w-24 z-10 bg-gradient-to-l from-surface-container-low to-transparent" />

      {/* Prev / Next arrows */}
      <button
        type="button"
        aria-label="Previous products"
        onClick={() => nudge(-1)}
        className="absolute left-2 md:left-6 top-[40%] -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A96E]/60 bg-background/80 backdrop-blur-sm text-on-surface hover:bg-[#C9A96E] hover:text-white transition-colors shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next products"
        onClick={() => nudge(1)}
        className="absolute right-2 md:right-6 top-[40%] -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A96E]/60 bg-background/80 backdrop-blur-sm text-on-surface hover:bg-[#C9A96E] hover:text-white transition-colors shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar px-4 md:px-16 scroll-smooth"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pauseThenResume}
        onWheel={pauseThenResume}
        onPointerDown={pauseThenResume}
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
                <h3 className="font-body-md text-body-md text-on-surface truncate">
                  {product.name}
                </h3>
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
                <PriceDisplay price={product.price} mrp={product.compareAtPrice ?? undefined} size="lg" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
