import Link from "next/link";
import Image from "next/image";
import { getBestsellers, parseImages } from "@/lib/queries/products";
import { PriceDisplay } from "@/components/PriceDisplay";

// Async server component — bestselling products ranked by review count,
// rendered as a horizontal snap-scroll rail with star ratings (social proof).
export async function BestsellersRail() {
  const products = await getBestsellers(8);

  if (products.length === 0) return null;

  return (
    <section className="py-[120px] bg-surface-container-low reveal noise-texture overflow-hidden">
      {/* Section header */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-16 mb-12">
        <div className="section-gold-rule">
          <h2 className="font-headline-lg text-[48px] md:text-[64px] leading-[1.0] tracking-[-0.02em] font-light text-on-surface gradient-title-bg">
            Bestsellers
          </h2>
          <p className="font-label-caps text-[10px] tracking-[0.25em] uppercase text-on-surface-variant mt-3">
            Most-loved by our customers
          </p>
        </div>
      </div>

      {/* Horizontal snap-scroll rail */}
      <div className="flex gap-6 overflow-x-auto no-scrollbar snap-x px-4 md:px-16">
        {products.map((p) => {
          const image = parseImages(p.images)[0] ?? null;
          return (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="group snap-start shrink-0 w-[260px] md:w-[300px]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container">
                {image ? (
                  <Image
                    src={image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 260px, 300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#FFF8F5] text-on-surface-variant font-display text-3xl">
                    {p.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="mt-4 px-1">
                <h3 className="font-display text-base text-on-surface line-clamp-1">
                  {p.name}
                </h3>

                {p.reviewCount > 0 && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-on-surface-variant">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="#C9A227"
                      aria-hidden="true"
                    >
                      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z" />
                    </svg>
                    <span className="font-medium text-on-surface">
                      {p.avgRating.toFixed(1)}
                    </span>
                    <span>({p.reviewCount})</span>
                  </div>
                )}

                <div className="mt-2">
                  <PriceDisplay price={p.price} size="lg" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
