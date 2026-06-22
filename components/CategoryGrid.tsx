import Image from "next/image";
import type { HomeCategory } from "@/lib/queries/home";

// Editorial category grid. Categories are the MAIN terms of the admin-managed
// `category` taxonomy group (getHomeCategories), in their sortOrder, so the
// owner controls exactly what shows here and in what order.
//
// There are no cover images yet, so each card is a clean, imageless label tile:
// a warm gradient field with a large ghosted initial and the category name set
// in the headline serif. When a coverImage is later added to a term, the card
// upgrades to the photographic treatment automatically.

export function CategoryGrid({ categories }: { categories: HomeCategory[] }) {
  if (categories.length === 0) return null;

  // Branded gradient backgrounds for imageless cards — warm editorial palette.
  const placeholderGradients = [
    "linear-gradient(160deg, #fbebe3 0%, #efdfd8 100%)",
    "linear-gradient(160deg, #fff1ea 0%, #fbebe3 100%)",
    "linear-gradient(160deg, #f5e5dd 0%, #efdfd8 100%)",
  ];

  // Responsive equal-width grid — grows to accommodate all categories.
  // 2 cols mobile → 3 tablet → up to 4 desktop (the category mains are a small,
  // fixed set: necklace-set / earrings / bangles / accessories).
  const count = categories.length;
  const desktopCols =
    count <= 3 ? `lg:grid-cols-${count}` : "lg:grid-cols-4";

  return (
    <section className="py-[120px] px-4 md:px-16 max-w-screen-2xl mx-auto group reveal">
      {/* Section header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
        <div>
          <div className="section-gold-rule">
            <h2 className="font-headline-lg text-[48px] md:text-[64px] leading-[1.0] tracking-[-0.02em] font-light text-on-surface mb-2 gradient-title-bg reveal reveal-clip">
              Shop by Category
            </h2>
          </div>
          <p className="font-label-caps text-[11px] tracking-[0.2em] uppercase text-on-surface-variant mt-2">
            Find your piece by what you&apos;re looking for.
          </p>
        </div>
        <a
          className="font-label-caps text-label-caps font-semibold text-primary border-b border-primary pb-1 hover:text-on-primary-fixed-variant hover:border-on-primary-fixed-variant transition-colors"
          href="/shop"
        >
          View All Categories
        </a>
      </div>

      {/* Equal-height grid — tiles stagger in one-by-one on scroll */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${desktopCols} gap-4 md:gap-6 reveal stagger-grid`}>
        {categories.map((cat) => (
          <a
            key={cat.id}
            className="group/card relative aspect-[3/4] overflow-hidden bg-surface-container cursor-pointer"
            href={`/shop?category=${cat.slug}`}
          >
            {/* Cover image (when a term gets one) or a clean imageless tile */}
            {cat.image ? (
              <>
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.08]"
                />
                {/* Dark gradient overlay for text legibility over photos */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h3 className="font-headline-md text-headline-md text-white mb-1 leading-tight">
                    {cat.name}
                  </h3>
                  <span className="font-label-caps text-label-caps font-semibold text-white/70 group-hover/card:text-white transition-colors">
                    Explore{" "}
                    <span className="inline-block transition-transform duration-300 ease-out group-hover/card:translate-x-1" aria-hidden="true">→</span>
                  </span>
                </div>
              </>
            ) : (
              <div
                className="absolute inset-0 flex flex-col justify-between p-6 transition-transform duration-700 ease-out group-hover/card:scale-[1.03]"
                style={{ background: placeholderGradients[cat.slug.charCodeAt(0) % 3] }}
              >
                {/* Large ghosted initial — quiet decorative anchor, top-right */}
                <span
                  className="self-end font-headline-lg text-[96px] leading-none text-primary/15 select-none"
                  aria-hidden="true"
                >
                  {cat.name.charAt(0).toUpperCase()}
                </span>

                {/* Category name + explore affordance — bottom-left, dark on warm */}
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-1 leading-tight">
                    {cat.name}
                  </h3>
                  <span className="font-label-caps text-label-caps font-semibold text-primary/70 group-hover/card:text-primary transition-colors">
                    Explore{" "}
                    <span className="inline-block transition-transform duration-300 ease-out group-hover/card:translate-x-1" aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
