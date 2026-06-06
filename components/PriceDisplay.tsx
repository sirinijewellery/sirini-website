import { cn } from "@/lib/utils";

/**
 * Single source of truth for product pricing display across the entire site.
 *
 * MRP / "Original" (cancelled) price formula:  realPrice * 2
 * (i.e. the struck-through original is exactly double the selling price,
 *  which itself is 2× the wholesale base — so OG reads as a clean "50% off".)
 * NOTE: this is display-only. It never affects the amount a customer is charged.
 *
 * Visual template (strict):
 *   - Real price   → black (#000000), bold (700+), distinctly LARGER
 *   - Original     → red (#ef4444), smaller, line-through strikethrough
 *   - Both prices prepended with the ₹ symbol (via en-IN INR formatter)
 */

export function getMrp(realPrice: number): number {
  return realPrice * 2;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

type PriceSize = "sm" | "md" | "lg" | "xl";

const REAL_SIZE: Record<PriceSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl md:text-3xl",
};

const MRP_SIZE: Record<PriceSize, string> = {
  sm: "text-[11px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
};

/** Discount percent off, rounded. Returns 0 when there's no real saving. */
export function getDiscountPercent(price: number, original: number): number {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

interface PriceDisplayProps {
  /** The real selling price (already multiplied by quantity if a line total). */
  price: number;
  /**
   * The cancelled/original "compare-at" price (strikethrough). Pass the
   * product's stored compareAtPrice. Falls back to getMrp(price) when omitted.
   * For line totals pass compareAtPrice * quantity.
   */
  mrp?: number;
  /** Relative sizing of the price pair. */
  size?: PriceSize;
  /** "col" = real on top, MRP below (default). "row" = side by side. */
  layout?: "col" | "row";
  /** Show the "X% OFF" badge next to the struck price. Default true. */
  showDiscount?: boolean;
  className?: string;
}

export function PriceDisplay({
  price,
  mrp,
  size = "md",
  layout = "col",
  showDiscount = true,
  className,
}: PriceDisplayProps) {
  const original = mrp ?? getMrp(price);
  const pct = getDiscountPercent(price, original);
  const hasDiscount = pct > 0;

  return (
    <div
      className={cn(
        "flex",
        layout === "row" ? "items-baseline gap-2" : "flex-col gap-0.5",
        className,
      )}
    >
      {/* Real price — black, bold, larger */}
      <span
        className={cn("font-sans font-bold leading-tight", REAL_SIZE[size])}
        style={{ color: "#000000" }}
      >
        {formatPrice(price)}
      </span>

      {hasDiscount && (
        <span className="flex items-baseline gap-2">
          {/* Original / compare-at price — red, line-through, smaller */}
          <span
            className={cn("font-sans leading-tight line-through", MRP_SIZE[size])}
            style={{ color: "#ef4444", textDecoration: "line-through" }}
          >
            {formatPrice(original)}
          </span>
          {/* Discount percent */}
          {showDiscount && (
            <span
              className={cn(
                "font-sans font-semibold leading-tight",
                size === "sm" ? "text-[10px]" : "text-xs",
              )}
              style={{ color: "#16803c" }}
            >
              {pct}% OFF
            </span>
          )}
        </span>
      )}
    </div>
  );
}
