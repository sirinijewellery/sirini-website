import Link from "next/link";
import type { HomeTaxonomyTile } from "@/lib/queries/home";

// "Shop by Collection" — top-level terms of the admin-managed `collection`
// taxonomy group rendered as clean, imageless pill-cards. Each links into the
// filtered shop at /shop?collection=<slug>. No cover images yet; styled to sit
// quietly between the bolder Category/Occasion grids — a centred row of warm,
// gold-bordered cards with the collection name and an optional blurb.

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 reveal stagger-grid">
        {collections.map((col) => (
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
        ))}
      </div>
    </section>
  );
}
