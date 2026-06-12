import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/queries/products";

// Async server component — fetches categories from DB.
// Editorial tone: 3-column portrait grid, deliberate vertical offset on centre card,
// gradient overlay for legibility, bold serif text at bottom of each card.

export async function CategoryGrid() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  // Branded gradient backgrounds for placeholder cards
  const placeholderGradients = [
    "linear-gradient(160deg, #fbebe3 0%, #efdfd8 100%)",
    "linear-gradient(160deg, #fff1ea 0%, #fbebe3 100%)",
    "linear-gradient(160deg, #f5e5dd 0%, #efdfd8 100%)",
  ];

  // Responsive equal-width grid — grows to accommodate all categories.
  // 2 cols mobile → 3 tablet → 5 desktop (or however many cats exist).
  const count = categories.length;
  const desktopCols =
    count <= 3 ? `lg:grid-cols-${count}` :
    count === 4 ? "lg:grid-cols-4" :
    "lg:grid-cols-5";

  // Sizing: taller aspect ratio when fewer cols, shorter when spreading across 5
  const aspectRatio = count >= 5 ? "aspect-[3/4]" : "aspect-[3/4]";

  return (
    <section className="py-[120px] px-4 md:px-16 max-w-screen-2xl mx-auto group reveal">
      {/* Section header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
        <div>
          <div className="section-gold-rule">
            <h2 className="font-headline-lg text-[48px] md:text-[64px] leading-[1.0] tracking-[-0.02em] font-light text-on-surface mb-2 gradient-title-bg reveal reveal-clip">
              Curated Collections
            </h2>
          </div>
          <p className="font-label-caps text-[11px] tracking-[0.2em] uppercase text-on-surface-variant mt-2">
            Intentional pieces for the modern aesthete.
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
            className={`group/card relative ${aspectRatio} overflow-hidden bg-surface-container`}
            href={`/shop?category=${cat.slug}`}
          >
            {/* Image or branded gradient placeholder */}
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.08]"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
                style={{ background: placeholderGradients[cat.id.charCodeAt(0) % 3] }}
              >
                <span className="font-headline-lg text-[80px] text-primary/20 select-none leading-none">
                  {cat.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Dark gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Category text — bottom left */}
            <div className="absolute bottom-6 left-6">
              <h3 className="font-headline-md text-headline-md text-white mb-1 leading-tight">
                {cat.name}
              </h3>
              <span className="font-label-caps text-label-caps font-semibold text-white/70 group-hover/card:text-white transition-colors">
                Explore →
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
