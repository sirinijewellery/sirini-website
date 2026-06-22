import Link from "next/link";
import type { HomeTaxonomyTile } from "@/lib/queries/home";

// "Shop by Occasion" — top-level terms of the admin-managed `occasion` taxonomy
// group rendered as clean, imageless editorial tiles. Each links into the
// filtered shop at /shop?occasion=<slug>. No cover images yet; the card leads
// with the occasion name in the headline serif and an optional one-line blurb,
// over a warm gradient field, with a thin gold rule for the editorial feel.

export function ShopByOccasion({ occasions }: { occasions: HomeTaxonomyTile[] }) {
  if (occasions.length === 0) return null;

  const gradients = [
    "linear-gradient(150deg, #FFF8F5 0%, #FAF0EC 100%)",
    "linear-gradient(150deg, #FAF0EC 0%, #F3E4DC 100%)",
    "linear-gradient(150deg, #F7EAE3 0%, #EFDFD8 100%)",
  ];

  return (
    <section className="py-[120px] px-4 md:px-16 max-w-screen-2xl mx-auto reveal">
      <div className="text-center mb-16">
        <div className="section-gold-rule inline-block">
          <h2 className="font-headline-lg text-[40px] md:text-[56px] leading-[1.0] tracking-[-0.02em] font-light text-on-surface gradient-title-bg reveal reveal-clip">
            Shop by Occasion
          </h2>
        </div>
        <p className="font-label-caps text-[11px] tracking-[0.2em] uppercase text-on-surface-variant mt-3">
          Dressed for the moment that matters.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 reveal stagger-grid">
        {occasions.map((occ, i) => (
          <Link
            key={occ.id}
            href={`/shop?occasion=${occ.slug}`}
            className="group/card relative flex flex-col justify-end overflow-hidden rounded-sm aspect-[4/5] p-7 cursor-pointer transition-transform duration-500 ease-out hover:-translate-y-1"
            style={{ background: gradients[i % gradients.length] }}
          >
            {/* Thin gold rule, top-left — quiet editorial marker */}
            <span
              className="absolute top-7 left-7 h-px w-10 bg-[#C9A96E]"
              aria-hidden="true"
            />

            <h3 className="font-headline-md text-[24px] md:text-[26px] leading-tight text-on-surface">
              {occ.label}
            </h3>
            {occ.blurb && (
              <p className="mt-2 font-body text-sm text-on-surface-variant leading-snug line-clamp-2">
                {occ.blurb}
              </p>
            )}
            <span className="mt-4 font-label-caps text-label-caps font-semibold text-primary/70 group-hover/card:text-primary transition-colors">
              Explore{" "}
              <span className="inline-block transition-transform duration-300 ease-out group-hover/card:translate-x-1" aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
