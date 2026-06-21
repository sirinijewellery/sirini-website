// ─────────────────────────────────────────────────────────────────────────
// Owner-editable CATALOG settings — SERVER getters (prisma-backed).
//
// Client-safe types, defaults and pure helpers live in `lib/catalog.ts` and
// are re-exported here for server callers' convenience. CLIENT components must
// import those from "@/lib/catalog" directly (importing from this module would
// drag prisma into the browser bundle).
// ─────────────────────────────────────────────────────────────────────────

import { getSetting } from "@/lib/queries/site";
import {
  type BadgeDef,
  type CatalogSort,
  DEFAULT_BADGES,
  DEFAULT_LOW_STOCK_THRESHOLD,
  DEFAULT_HIDE_OUT_OF_STOCK,
  DEFAULT_CATALOG_SORT,
  VALID_CATALOG_SORTS,
  CATALOG_KEYS,
} from "@/lib/catalog";

// Re-export the client-safe surface so existing server imports keep working.
export * from "@/lib/catalog";

/** Owner-defined badges, falling back to the original 6 if unset/invalid. */
export async function getBadges(): Promise<BadgeDef[]> {
  const v = await getSetting<unknown>(CATALOG_KEYS.badges, DEFAULT_BADGES);
  if (Array.isArray(v)) {
    const clean = v
      .filter(
        (b): b is BadgeDef =>
          !!b &&
          typeof b === "object" &&
          typeof (b as BadgeDef).label === "string" &&
          (b as BadgeDef).label.trim() !== "" &&
          typeof (b as BadgeDef).color === "string"
      )
      .map((b) => ({ label: b.label.trim(), color: b.color.trim() }));
    if (clean.length) return clean;
  }
  return DEFAULT_BADGES;
}

/** Stock level at/below which the PDP shows the "only N left" urgency line. */
export async function getLowStockThreshold(): Promise<number> {
  const v = await getSetting<number>(
    CATALOG_KEYS.lowStockThreshold,
    DEFAULT_LOW_STOCK_THRESHOLD
  );
  return typeof v === "number" && Number.isFinite(v) && v >= 0
    ? Math.floor(v)
    : DEFAULT_LOW_STOCK_THRESHOLD;
}

/** Whether sold-out products are hidden from shop listings. */
export async function getHideOutOfStock(): Promise<boolean> {
  const v = await getSetting<boolean>(
    CATALOG_KEYS.hideOutOfStock,
    DEFAULT_HIDE_OUT_OF_STOCK
  );
  return typeof v === "boolean" ? v : DEFAULT_HIDE_OUT_OF_STOCK;
}

/** Default sort applied on the shop when no sort is chosen by the visitor. */
export async function getDefaultSort(): Promise<CatalogSort> {
  const v = await getSetting<CatalogSort>(
    CATALOG_KEYS.defaultSort,
    DEFAULT_CATALOG_SORT
  );
  return VALID_CATALOG_SORTS.includes(v) ? v : DEFAULT_CATALOG_SORT;
}
