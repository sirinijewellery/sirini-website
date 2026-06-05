import Link from "next/link";
import { PRICE_BUCKETS } from "@/lib/taxonomy";

// Static server component (no data) — compact "Shop by Price" band rendering
// the price buckets as bordered cream pills linking into the filtered shop.
export function ShopByPrice() {
  return (
    <section className="py-16">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-16">
        <div className="flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="font-display text-2xl md:text-3xl text-on-surface">
              Shop by Price
            </h2>
            <p className="font-label-caps text-[10px] tracking-[0.25em] uppercase text-on-surface-variant mt-2">
              Something for every budget
            </p>
          </div>

          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRICE_BUCKETS.map((bucket) => {
              const params = new URLSearchParams();
              if (bucket.priceMin !== undefined) {
                params.set("priceMin", String(bucket.priceMin));
              }
              if (bucket.priceMax !== undefined) {
                params.set("priceMax", String(bucket.priceMax));
              }
              const query = params.toString();
              const href = query ? `/shop?${query}` : "/shop";

              return (
                <Link
                  key={bucket.slug}
                  href={href}
                  className="flex items-center justify-center rounded-full border border-[#E7D8C9] bg-[#FFF8F5] px-5 py-4 text-center font-display text-sm md:text-base text-on-surface transition-colors hover:border-[#C9A227] hover:text-[#C9A227]"
                >
                  {bucket.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
