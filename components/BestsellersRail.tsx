import { getBestsellers, parseImages } from "@/lib/queries/products";
import { selectCardImages } from "@/lib/parseImages";
import { MovingProductRail, type RailProduct } from "@/components/MovingProductRail";

// Async server component — bestselling products ranked by review count,
// rendered as an auto-scrolling marquee (like the Curated Collection) with
// star ratings for social proof.
export async function BestsellersRail() {
  const products = await getBestsellers(8);

  if (products.length === 0) return null;

  const rail: RailProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    image: selectCardImages(parseImages(p.images)).primary,
    badge: p.badge,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
  }));

  return (
    <section className="py-[120px] bg-surface-container-low reveal noise-texture overflow-hidden">
      {/* Section header */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-16 mb-12">
        <div className="section-gold-rule">
          <h2 className="font-headline-lg text-[48px] md:text-[64px] leading-[1.0] tracking-[-0.02em] font-light text-on-surface gradient-title-bg heading-shimmer">
            Bestsellers
          </h2>
          <p className="font-label-caps text-[10px] tracking-[0.25em] uppercase text-on-surface-variant mt-3">
            Most-loved by our customers
          </p>
        </div>
      </div>

      {/* Auto-scrolling rail */}
      <MovingProductRail products={rail} />
    </section>
  );
}
