import Link from "next/link";
import Image from "next/image";
import { getStyleCoverImage, STYLES } from "@/lib/queries/products";

// Async server component — fetches a representative cover image for each
// jewellery style/material and renders a responsive discovery grid.
export async function ShopByMaterial() {
  const covers = await Promise.all(
    STYLES.map((s) => getStyleCoverImage(s.slug)),
  );

  return (
    <section className="py-[120px] reveal noise-texture overflow-hidden">
      {/* Section header */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-16 mb-12">
        <div className="section-gold-rule">
          <h2 className="font-headline-lg text-[48px] md:text-[64px] leading-[1.0] tracking-[-0.02em] font-light text-on-surface gradient-title-bg">
            Shop by Material
          </h2>
          <p className="font-label-caps text-[10px] tracking-[0.25em] uppercase text-on-surface-variant mt-3">
            Find your favourite craft
          </p>
        </div>
      </div>

      {/* Responsive material grid */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STYLES.map((style, i) => {
            const cover = covers[i];
            return (
              <Link
                key={style.slug}
                href={`/shop?style=${style.slug}`}
                className="group flex flex-col items-center"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface-container">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={style.label}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#FFF8F5] text-on-surface-variant font-display text-4xl">
                      {style.label.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="mt-3 text-center font-display text-sm md:text-base text-on-surface transition-colors group-hover:text-[#C9A227]">
                  {style.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
