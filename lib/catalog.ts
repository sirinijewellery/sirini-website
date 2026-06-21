// ─────────────────────────────────────────────────────────────────────────
// CLIENT-SAFE catalog config — types, defaults + pure helpers.
//
// This module imports nothing server-only (no prisma), so it is safe to import
// from client components (ProductForm, ProductDetailClient, CatalogSettings
// Manager). The prisma-backed reads live in `lib/queries/catalog.ts` and the
// validated writes go through `app/api/admin/settings/route.ts`.
//
// Golden rule: every default below MUST equal the value the site currently
// shows when hardcoded, so shipping a setting changes nothing visible until
// the owner edits it.
// ─────────────────────────────────────────────────────────────────────────

/* ── Badges ───────────────────────────────────────────────────────────── */
// A product badge is a free-text label with a colour. Historically the label
// was a hardcoded enum (ProductForm) and the colour a hardcoded map
// (ProductDetailClient). These defaults reproduce exactly that behaviour.
export interface BadgeDef {
  /** The label stored on Product.badge and shown on the PDP. */
  label: string;
  /** Tailwind classes for the badge pill (background + text colour). */
  color: string;
}

// The original 6 badges. NEW/HOT/SALE kept their distinct colours from the old
// `badgeStyle` map; the other three had no entry, so they fell through to the
// grey muted fallback — we encode that grey explicitly here so they look
// identical to before.
export const DEFAULT_BADGES: BadgeDef[] = [
  { label: "NEW", color: "bg-emerald-100 text-emerald-700" },
  { label: "HOT", color: "bg-amber-100 text-amber-700" },
  { label: "SALE", color: "bg-rose-100 text-rose-700" },
  { label: "Handcrafted", color: "bg-muted text-muted-foreground" },
  { label: "Traditional", color: "bg-muted text-muted-foreground" },
  { label: "Bestseller", color: "bg-muted text-muted-foreground" },
];

/** Fallback pill style for any label not found in the badge list. */
export const BADGE_FALLBACK_COLOR = "bg-muted text-muted-foreground";

/** Resolve a badge label to its pill classes (unknown → grey fallback). */
export function badgeColor(badges: BadgeDef[], label: string | null | undefined): string {
  if (!label) return BADGE_FALLBACK_COLOR;
  return badges.find((b) => b.label === label)?.color ?? BADGE_FALLBACK_COLOR;
}

/* ── Stock display ────────────────────────────────────────────────────── */
// PDP shows an "only N left" urgency line when stock is at/below this number.
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/* ── Catalog behaviour ────────────────────────────────────────────────── */
// When true, products with stock <= 0 are excluded from shop listings.
export const DEFAULT_HIDE_OUT_OF_STOCK = false;

export type CatalogSort = "newest" | "price_asc" | "price_desc" | "name_asc";
// Default sort order applied on the shop when the visitor hasn't chosen one.
export const DEFAULT_CATALOG_SORT: CatalogSort = "newest";
export const VALID_CATALOG_SORTS: CatalogSort[] = [
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
];

/* ── Setting keys ─────────────────────────────────────────────────────── */
export const CATALOG_KEYS = {
  badges: "catalog.badges",
  lowStockThreshold: "catalog.lowStockThreshold",
  hideOutOfStock: "catalog.hideOutOfStock",
  defaultSort: "catalog.defaultSort",
} as const;
