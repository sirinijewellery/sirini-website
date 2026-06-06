import Link from "next/link";
import Image from "next/image";
import { PriceDisplay, formatPrice } from "@/components/PriceDisplay";

interface PairingProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string | null;
}

interface CompleteTheSetProps {
  products: PairingProduct[];
  /** The current product's selling price, included in the bundle total. */
  mainPrice: number;
  /** The current product's compare-at price, included in the original bundle total. */
  mainCompareAt?: number;
}

const BUNDLE_DISCOUNT = 0.1; // 10% off when bought together (display-only)

/**
 * "Complete the Look" — a presentational bundle suggestion shown on the
 * product detail page. Pairs the current product with a couple of
 * complementary pieces and surfaces a display-only "buy together & save 10%"
 * bundle price. No data fetching and no cart interaction happens here.
 */
export function CompleteTheSet({ products, mainPrice, mainCompareAt }: CompleteTheSetProps) {
  if (!products || products.length === 0) return null;

  const pairing = products.slice(0, 3);
  const bundleSum = mainPrice + pairing.reduce((sum, p) => sum + p.price, 0);
  const bundlePrice = Math.round(bundleSum * (1 - BUNDLE_DISCOUNT));

  // Combined compare-at ("original") bundle price. Falls back to price * 2
  // for any item missing compare-at data so the math stays consistent.
  const compareAtSum =
    (mainCompareAt ?? mainPrice * 2) +
    pairing.reduce((sum, p) => sum + (p.compareAtPrice ?? p.price * 2), 0);

  return (
    <section className="mt-20">
      <div
        className="rounded-2xl border border-cream-dark/70 p-6 sm:p-10"
        style={{ backgroundColor: "var(--color-cream)" }}
      >
        {/* Heading */}
        <div className="mb-8 text-center">
          <p className="font-label-caps text-label-caps tracking-widest text-primary uppercase mb-3">
            Complete the Look
          </p>
          <h2 className="font-display text-3xl font-light text-foreground">
            Styled Together by Sirini
          </h2>
          <p className="mt-2 text-sm font-sans text-muted-foreground">
            Pair it perfectly — styled together by Sirini.
          </p>
        </div>

        {/* Pairing product cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {pairing.map((product) => (
            <Link
              key={product.id}
              href={`/shop/${product.slug}`}
              className="group block text-center"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-cream-dark">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <h3 className="mt-3 font-display text-base font-light text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <div className="mt-1 flex justify-center">
                <PriceDisplay price={product.price} size="sm" layout="row" />
              </div>
            </Link>
          ))}
        </div>

        {/* Bundle pricing */}
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-cream-dark/70 pt-8">
          <p className="font-label-caps text-label-caps tracking-widest text-primary uppercase">
            Buy together &amp; save 10%
          </p>
          <div className="flex items-baseline gap-3">
            {/* Combined original (compare-at) bundle price — struck through */}
            <span
              className="font-sans text-sm line-through"
              style={{ color: "#ef4444", textDecoration: "line-through" }}
            >
              {formatPrice(compareAtSum)}
            </span>
            <span className="font-display text-3xl font-light text-primary">
              {formatPrice(bundlePrice)}
            </span>
          </div>
          <p className="text-xs font-sans text-muted-foreground">
            Bundle total for this piece &amp; its perfect pairings.
          </p>
        </div>
      </div>
    </section>
  );
}
