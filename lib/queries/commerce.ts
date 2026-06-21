import { cache } from "react";
import { getSetting } from "@/lib/queries/site";
import { DEFAULT_COMMERCE, type CommerceSettings } from "@/lib/commerce/pricing";

export type { CommerceSettings } from "@/lib/commerce/pricing";
export { DEFAULT_COMMERCE } from "@/lib/commerce/pricing";

// ─────────────────────────────────────────────────────────────────────────
// Commerce settings reader (server-side).
//
// Each field is stored as its own Setting key under "commerce.*" and read with
// a per-field fallback equal to the value the site currently shows hardcoded,
// so any missing/unedited setting keeps the original behaviour.
//
// `cache()` dedupes the reads within a single render/request.
// ─────────────────────────────────────────────────────────────────────────

export const COMMERCE_SETTING_KEYS = {
  gstRate: "commerce.gstRate",
  giftWrapFee: "commerce.giftWrapFee",
  shippingFee: "commerce.shippingFee",
  freeShipThreshold: "commerce.freeShipThreshold",
  codEnabled: "commerce.codEnabled",
  codMaxOrder: "commerce.codMaxOrder",
} as const;

function num(v: unknown, fallback: number, { min = 0 }: { min?: number } = {}): number {
  return typeof v === "number" && Number.isFinite(v) && v >= min ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export const getCommerceSettings = cache(async (): Promise<CommerceSettings> => {
  const [gstRate, giftWrapFee, shippingFee, freeShipThreshold, codEnabled, codMaxOrder] =
    await Promise.all([
      getSetting<number>(COMMERCE_SETTING_KEYS.gstRate, DEFAULT_COMMERCE.gstRate),
      getSetting<number>(COMMERCE_SETTING_KEYS.giftWrapFee, DEFAULT_COMMERCE.giftWrapFee),
      getSetting<number>(COMMERCE_SETTING_KEYS.shippingFee, DEFAULT_COMMERCE.shippingFee),
      getSetting<number>(COMMERCE_SETTING_KEYS.freeShipThreshold, DEFAULT_COMMERCE.freeShipThreshold),
      getSetting<boolean>(COMMERCE_SETTING_KEYS.codEnabled, DEFAULT_COMMERCE.codEnabled),
      getSetting<number>(COMMERCE_SETTING_KEYS.codMaxOrder, DEFAULT_COMMERCE.codMaxOrder),
    ]);

  return {
    // GST rate is a fraction (0–1). Guard against bad stored values.
    gstRate: num(gstRate, DEFAULT_COMMERCE.gstRate) <= 1
      ? num(gstRate, DEFAULT_COMMERCE.gstRate)
      : DEFAULT_COMMERCE.gstRate,
    giftWrapFee: num(giftWrapFee, DEFAULT_COMMERCE.giftWrapFee),
    shippingFee: num(shippingFee, DEFAULT_COMMERCE.shippingFee),
    freeShipThreshold: num(freeShipThreshold, DEFAULT_COMMERCE.freeShipThreshold),
    codEnabled: bool(codEnabled, DEFAULT_COMMERCE.codEnabled),
    codMaxOrder: num(codMaxOrder, DEFAULT_COMMERCE.codMaxOrder),
  };
});
