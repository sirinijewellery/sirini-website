import Link from "next/link";
import Image from "next/image";
import { getFeaturedProducts } from "@/lib/queries/products";
import { parseImages } from "@/lib/parseImages";

// Async server component — horizontal scroll rail of featured products.
// Inline card markup matches Stitch HTML exactly. No onClick (server component).

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

// SVG heart icon — no emoji, keyboard accessible
function HeartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(8);

  if (products.length === 0) return null;

  return (
    <section className="py-[120px] bg-surface-container-low pl-4 md:pl-16 reveal noise-texture">
      {/* Section header — no "View All" per Stitch design */}
      <div className="max-w-screen-2xl mx-auto pr-4 md:pr-16 mb-12">
        <div className="section-gold-rule">
          <h2 className="font-headline-lg text-headline-lg text-on-surface gradient-title-bg">
            New Arrivals
          </h2>
        </div>
      </div>

      {/* Horizontal scroll rail */}
      <div className="flex gap-8 overflow-x-auto no-scrollbar pb-8 snap-x snap-mandatory">
        {/* Left spacer — aligns first card with section left padding */}
        <div className="snap-start shrink-0 w-4 md:w-0" />

        {products.map((product) => {
          const images = parseImages(product.images);
          const primaryImage = images[0] || null;

          const badgeColor =
            product.badge === "NEW"
              ? "text-success-emerald"
              : product.badge === "SALE"
              ? "text-primary"
              : "text-on-surface";

          return (
            <Link
              key={product.id}
              href={`/shop/${product.slug}`}
              className="snap-start shrink-0 w-[280px] md:w-[320px] group/item cursor-pointer"
            >
              {/* Image container */}
              <div className="relative aspect-[4/5] bg-surface mb-4 overflow-hidden border border-outline-variant group-hover/item:border-primary/30 transition-colors duration-300">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 280px, 320px"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/item:scale-[1.08]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low">
                    <span className="font-headline-lg text-[80px] text-primary/20 select-none leading-none">
                      {product.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Wishlist heart — visual only, server component */}
                <button
                  type="button"
                  aria-label={`Add ${product.name} to wishlist`}
                  className="absolute top-4 right-4 text-on-surface-variant hover:text-primary opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"
                >
                  <HeartIcon />
                </button>

                {/* Badge — if present */}
                {product.badge && (
                  <div className="absolute top-4 left-4 border border-outline px-2 py-1">
                    <span
                      className={`font-label-caps text-[10px] uppercase tracking-wider ${badgeColor}`}
                    >
                      {product.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="flex flex-col gap-1">
                <h4 className="font-body-md text-body-md text-on-surface">
                  {product.name}
                </h4>
                <p className="font-price-display text-price-display font-bold text-on-surface">
                  {formatPrice(product.price)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
