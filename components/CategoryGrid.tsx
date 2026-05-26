import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/queries/products";

// Async server component — fetches categories from DB.
// Editorial tone: 3-column portrait grid, deliberate vertical offset on centre card,
// gradient overlay for legibility, bold serif text at bottom of each card.

export async function CategoryGrid() {
  const categories = await getCategories();
  const displayCats = categories.slice(0, 3);
  const placeholderCount = Math.max(0, 3 - displayCats.length);

  if (categories.length === 0) return null;

  // Branded gradient backgrounds for placeholder cards
  const placeholderGradients = [
    "linear-gradient(160deg, #fbebe3 0%, #efdfd8 100%)",
    "linear-gradient(160deg, #fff1ea 0%, #fbebe3 100%)",
    "linear-gradient(160deg, #f5e5dd 0%, #efdfd8 100%)",
  ];

  return (
    <section className="py-[120px] px-4 md:px-16 max-w-screen-2xl mx-auto group reveal">
      {/* Section header — split layout: title left, "View All" right */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 gradient-title-bg">
            Curated Collections
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
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

      {/* 3-column portrait grid — middle card offset downward for editorial depth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayCats.map((cat, i) => (
          <a
            key={cat.id}
            className={`group/card relative aspect-[3/4] overflow-hidden bg-surface-container${
              i === 1 ? " md:translate-y-8" : ""
            }`}
            href={`/shop?category=${cat.slug}`}
          >
            {/* Image or branded gradient placeholder */}
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.08]"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
                style={{ background: placeholderGradients[i % 3] }}
              >
                <span className="font-headline-lg text-[80px] text-primary/20 select-none leading-none">
                  {cat.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Dark gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

            {/* Category text — bottom left */}
            <div className="absolute bottom-8 left-8">
              <h3 className="font-headline-md text-headline-md text-white mb-2">
                {cat.name}
              </h3>
              <span className="font-label-caps text-label-caps font-semibold text-white/80 group-hover/card:text-white transition-colors">
                Explore Category
              </span>
            </div>
          </a>
        ))}

        {/* Placeholder cards if fewer than 3 categories in DB */}
        {Array.from({ length: placeholderCount }).map((_, i) => {
          const cardIndex = displayCats.length + i;
          return (
            <div
              key={`placeholder-${i}`}
              className={`group/card relative aspect-[3/4] overflow-hidden bg-surface-container${
                cardIndex === 1 ? " md:translate-y-8" : ""
              }`}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: placeholderGradients[cardIndex % 3] }}
              >
                <span className="font-headline-lg text-[80px] text-primary/20 select-none leading-none">
                  S
                </span>
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
