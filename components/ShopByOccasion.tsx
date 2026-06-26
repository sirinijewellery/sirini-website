import Image from "next/image";
import Link from "next/link";
import type { HomeTaxonomyTile } from "@/lib/queries/home";

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
            style={occ.coverImage ? undefined : { background: gradients[i % gradients.length] }}
          >
            {occ.coverImage && (
              <>
                <Image
                  src={occ.coverImage}
                  alt={occ.label}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </>
            )}

            <span
              className={`absolute top-7 left-7 h-px w-10 ${occ.coverImage ? "bg-white/60" : "bg-[#C9A96E]"}`}
              aria-hidden="true"
            />

            <div className="relative z-10">
              <h3 className={`font-headline-md text-[24px] md:text-[26px] leading-tight ${occ.coverImage ? "text-white" : "text-on-surface"}`}>
                {occ.label}
              </h3>
              {occ.blurb && (
                <p className={`mt-2 font-body text-sm leading-snug line-clamp-2 ${occ.coverImage ? "text-white/80" : "text-on-surface-variant"}`}>
                  {occ.blurb}
                </p>
              )}
              <span className={`mt-4 inline-block font-label-caps text-label-caps font-semibold transition-colors ${occ.coverImage ? "text-white/80 group-hover/card:text-white" : "text-primary/70 group-hover/card:text-primary"}`}>
                Explore{" "}
                <span className="inline-block transition-transform duration-300 ease-out group-hover/card:translate-x-1" aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
