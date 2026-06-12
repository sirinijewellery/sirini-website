import { getFeaturedProducts } from "@/lib/queries/products";
import { parseImages, selectCardImages } from "@/lib/parseImages";
import { MovingProductRail, type RailProduct } from "@/components/MovingProductRail";

// Async server component — fetches featured products, then hands them to the
// client-side auto-scrolling marquee (MovingProductRail).
export async function FeaturedProducts() {
  // 16 = the 8 model-shot picks + the original variety (earrings, bangles,
  // rings, anklets) so the home rail still represents the whole catalogue.
  const products = await getFeaturedProducts(16);

  if (products.length === 0) return null;

  const rail: RailProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    image: selectCardImages(parseImages(p.images)).primary,
    badge: p.badge,
  }));

  return (
    <section className="py-[120px] bg-surface-container-low reveal noise-texture overflow-hidden">
      {/* Section header */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-16 mb-12">
        <div className="section-gold-rule">
          <h2 className="font-headline-lg text-[48px] md:text-[64px] leading-[1.0] tracking-[-0.02em] font-light text-on-surface gradient-title-bg">
            Curated Collection
          </h2>
          <p className="font-label-caps text-[10px] tracking-[0.25em] uppercase text-on-surface-variant mt-3">
            Handpicked · Bestselling pieces
          </p>
        </div>
      </div>

      {/* Auto-scrolling rail */}
      <MovingProductRail products={rail} />
    </section>
  );
}
