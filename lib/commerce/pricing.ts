// ─────────────────────────────────────────────────────────────────────────
// Commerce money-math — SINGLE SOURCE OF TRUTH.
//
// CheckoutForm (client) and BOTH checkout API routes (create-order, cod)
// validate the order total by an EXACT paise equality. If their math ever
// diverges, real orders are rejected with "Order amount mismatch". To make
// divergence impossible, all three import `computeTotals` from here.
//
// This module is CLIENT-SAFE: it imports nothing server-only, so it can run in
// the browser (CheckoutForm) and on the server (route handlers) identically.
//
// Golden rule: the defaults below MUST equal the values the site currently
// shows hardcoded, so shipping these settings changes nothing visible until
// the owner edits them.
// ─────────────────────────────────────────────────────────────────────────

export interface CommerceSettings {
  /** GST rate as a fraction, e.g. 0.03 = 3%. */
  gstRate: number;
  /** Gift-wrap fee in rupees. */
  giftWrapFee: number;
  /** Flat shipping fee in rupees (charged when below the free-ship threshold). */
  shippingFee: number;
  /** Order value (in rupees) at/above which shipping is free. 0 disables the
   *  threshold check (shipping stays free, matching current behaviour). */
  freeShipThreshold: number;
  /** Whether Cash on Delivery is offered. */
  codEnabled: boolean;
  /** Max order total (rupees) eligible for COD. 0 = no cap. */
  codMaxOrder: number;
}

// Defaults = the values currently hardcoded across checkout. Shipping these
// changes nothing until the owner edits a value.
export const DEFAULT_COMMERCE: CommerceSettings = {
  gstRate: 0.03,
  giftWrapFee: 49,
  shippingFee: 0,
  freeShipThreshold: 0,
  codEnabled: true,
  codMaxOrder: 0,
};

export interface ComputeTotalsInput {
  /** Cart subtotal in rupees (before any discount). */
  subtotal: number;
  /** Coupon/discount amount in rupees. */
  discount: number;
  /** Whether the customer opted into gift wrapping. */
  giftWrap: boolean;
  /** Commerce settings (rates + fees). */
  settings: CommerceSettings;
}

export interface ComputedTotals {
  /** Subtotal after discount, floored at 0. */
  discountedSubtotal: number;
  /** GST in rupees (rounded). */
  gst: number;
  /** Shipping charge in rupees. */
  shipping: number;
  /** Gift-wrap fee applied (0 when not opted in). */
  giftWrapFee: number;
  /** Grand total in rupees, floored at 0. */
  total: number;
  /** Grand total in paise — the value compared for the mismatch guard. */
  totalPaise: number;
}

/**
 * The ONE place order totals are computed. Used by CheckoutForm and both
 * checkout routes so the client total and server-recalculated total can never
 * diverge.
 *
 * Paise rounding is kept identical to the original hardcoded code:
 *   - GST is rounded to the nearest rupee, then summed.
 *   - The grand total (already an integer rupee sum) is multiplied by 100.
 */
export interface AppliedCouponLike {
  discountType: string;
  discountValue: number;
  /** Coupon's minimum order amount, when known (null/undefined = no minimum). */
  minOrderAmount?: number | null;
}

/**
 * Recomputes a coupon's discount against the CURRENT subtotal with exactly the
 * math the checkout API routes use (unrounded percentage, capped at subtotal,
 * zero when below the coupon's minimum). The client must use this instead of a
 * discount amount frozen at apply-time — the cart can change after a coupon is
 * applied, and any divergence trips the exact-paise order-amount check.
 */
export function computeCouponDiscount(
  coupon: AppliedCouponLike | null | undefined,
  subtotal: number
): number {
  if (!coupon || subtotal <= 0) return 0;
  if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) return 0;
  const raw =
    coupon.discountType.toLowerCase() === "percentage"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;
  return Math.min(raw, subtotal);
}

export function computeTotals({
  subtotal,
  discount,
  giftWrap,
  settings,
}: ComputeTotalsInput): ComputedTotals {
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const gst = Math.round(discountedSubtotal * settings.gstRate);

  // Shipping: free when the threshold is met (threshold > 0 and discounted
  // subtotal >= threshold) OR when the flat fee is 0. Default (0/0) → free,
  // matching the previous always-free behaviour.
  const qualifiesForFreeShip =
    settings.freeShipThreshold > 0 &&
    discountedSubtotal >= settings.freeShipThreshold;
  const shipping = qualifiesForFreeShip
    ? 0
    : Math.max(0, settings.shippingFee);

  const giftWrapFee = giftWrap ? Math.max(0, settings.giftWrapFee) : 0;

  const total = Math.max(0, discountedSubtotal + gst + shipping + giftWrapFee);
  const totalPaise = Math.round(total * 100);

  return { discountedSubtotal, gst, shipping, giftWrapFee, total, totalPaise };
}
