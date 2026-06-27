import Image from "next/image";
import Link from "next/link";
import type { HomeTaxonomyTile } from "@/lib/queries/home";

// "Shop by Collection" — top-level terms of the admin-managed `collection`
// taxonomy group. When a term has a cover image (set in admin → Shop), it
// renders as a tall portrait card with the image and an overlaid title;
// otherwise it falls back to a clean, gold-bordered label card. Each links
// into the filtered shop at /shop?collection=<slug>.

export function ShopByCollection({ collections }: { collections: HomeTaxonomyTile[] }) {
  if (collections.length === 0) return null;

  return (
    <section className="py-[120px] px-4 md:px-16 max-w-screen-2xl mx-auto reveal">
      <div className="text-center mb-16">
        <div className="section-gold-rule inline-block">
          <h2 className="font-headline-lg text-[40px] md:text-[56px] leading-[1.0] tracking-[-0.02em] font-light text-on-surface gradient-title-bg reveal reveal-clip">
            Shop by Collection
          </h2>
        </div>
        <p className="font-label-caps text-[11px] tracking-[0.2em] uppercase text-on-surface-variant mt-3">
          Curated edits, told as a story.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 reveal stagger-grid">
        {collections.map((col) =>
          col.coverImage ? (
            // ── Portrait image card ──────────────────────────────────────
            <Link
              key={col.id}
              href={`/shop?collection=${col.slug}`}
              className="group/card relative flex flex-col justify-end overflow-hidden rounded-sm aspect-[4/5] p-7 cursor-pointer transition-transform duration-500 ease-out hover:-translate-y-1"
            >
              <Image
                src={col.coverImage}
                alt={col.label}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <span className="absolute top-7 left-7 h-px w-10 bg-white/60" aria-hidden="true" />

              <div className="relative z-10">
                <h3 className="font-headline-md text-[24px] md:text-[28px] leading-tight text-white">
                  {col.label}
                </h3>
                {col.blurb && (
                  <p className="mt-2 font-body text-sm leading-snug line-clamp-2 text-white/80">
                    {col.blurb}
                  </p>
                )}
                <span className="mt-4 inline-block font-label-caps text-label-caps font-semibold text-white/80 transition-colors group-hover/card:text-white">
                  Explore the edit{" "}
                  <span className="inline-block transition-transform duration-300 ease-out group-hover/card:translate-x-1" aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ) : (
            // ── Imageless label card (fallback) ──────────────────────────
            <Link
              key={col.id}
              href={`/shop?collection=${col.slug}`}
              className="group/card relative flex flex-col items-center justify-center text-center rounded-sm border border-[#E7D8C9] bg-[#FFF8F5] px-8 py-12 cursor-pointer transition-colors duration-300 hover:border-[#C9A96E]"
            >
              <h3 className="font-headline-md text-[24px] md:text-[28px] leading-tight text-on-surface">
                {col.label}
              </h3>
              {col.blurb && (
                <p className="mt-3 max-w-xs font-body text-sm text-on-surface-variant leading-snug line-clamp-2">
                  {col.blurb}
                </p>
              )}
              <span className="mt-5 font-label-caps text-label-caps font-semibold text-primary/70 group-hover/card:text-primary transition-colors">
                Explore the edit{" "}
                <span className="inline-block transition-transform duration-300 ease-out group-hover/card:translate-x-1" aria-hidden="true">→</span>
              </span>
            </Link>
          ),
        )}
      </div>
    </section>
  );
}
