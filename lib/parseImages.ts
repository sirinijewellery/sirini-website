/**
 * Pure client-safe utilities — no Prisma / Node.js imports.
 * Safe to import from any "use client" component.
 */

export function parseImages(images: unknown): string[] {
  if (Array.isArray(images)) return (images as string[]).filter(Boolean);
  if (typeof images === "string") {
    // Try JSON array first
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // Fall through to comma-split
    }
    // Comma-separated fallback (legacy storage format)
    const parts = images.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return [];
}

/**
 * Image URL classifiers for product cards.
 *
 * Naming conventions observed in uploaded assets:
 *   SKU-price.jpg          → main full-set shot (white/plain bg, complete jewellery)
 *   SKU-price-1.jpg …-4   → numbered detail/close-up shots (earrings, pendant, etc.)
 *   SKU-price-Model.jpg    → model wearing the full set
 *   SKU-CPT.jpg            → catalogue composite
 *
 * Display priority
 *   PRIMARY (default card view) : model  → main  → detail
 *   HOVER                       : another model  → main  → detail
 *
 * This ensures necklace sets always show the full set first (not an earring
 * close-up), and model-on-coloured-bg shots surface before plain white shots
 * whenever the vendor supplies more than one model image.
 */
// ── Image classification ───────────────────────────────────────────
// Display priority everywhere: MODEL → DECORATIVE (coloured bg) → WHITE (plain).
function isModel(url: string) {
  return /model/i.test(url);
}
function isWhite(url: string) {
  // "WHITE" in the filename = plain white-background studio shot.
  return /white/i.test(url) && !isModel(url);
}
function isCpt(url: string) {
  return /cpt/i.test(url); // catalogue composite — lowest priority / excluded
}
function isDecorative(url: string) {
  // Colourful / styled shots: anything that isn't model, white, or composite.
  return !isModel(url) && !isWhite(url) && !isCpt(url);
}
function isNumbered(url: string) {
  // Sequential variant numbers (-1, -2 …) come AFTER the hero shot within a group.
  return /-\d{1,2}\.(jpe?g|png|webp)$/i.test(url);
}
/** Within a group: hero (non-numbered) first, then numbered, stable by name. */
function orderGroup(arr: string[]): string[] {
  return [...arr].sort((a, b) => {
    const na = isNumbered(a);
    const nb = isNumbered(b);
    if (na !== nb) return na ? 1 : -1;
    return a.localeCompare(b);
  });
}

export function selectCardImages(images: string[]): {
  primary: string | null;
  hover: string | null;
} {
  const model = orderGroup(images.filter(isModel));
  const deco = orderGroup(images.filter(isDecorative));
  const white = orderGroup(images.filter(isWhite));
  const ordered = [...model, ...deco, ...white];

  // PRIMARY: model → decorative → white
  const primary = ordered[0] ?? null;
  // HOVER: the next distinct image (prefer a 2nd model, else decorative, else white)
  const hover = ordered.find((u) => u !== primary) ?? null;

  return { primary, hover };
}

/**
 * Returns ALL images for the product gallery in priority order:
 *   model → decorative (coloured bg) → white (plain) → composite (last).
 * The first image matches what the shop card shows by default.
 */
export function sortAllImages(images: string[]): string[] {
  const model = orderGroup(images.filter(isModel));
  const deco = orderGroup(images.filter(isDecorative));
  const white = orderGroup(images.filter(isWhite));
  const cpt = images.filter(isCpt);
  return [...model, ...deco, ...white, ...cpt];
}

/** @deprecated use selectCardImages */
export function splitModelAndProduct(images: string[]) {
  const { primary, hover } = selectCardImages(images);
  return { modelImage: primary, productImage: hover };
}

export function getMaterials(): string[] {
  return [
    "Gold Plated",
    "Rose Gold Plated",
    "Silver Plated",
    "Oxidised Silver",
    "Kundan",
    "Meenakari",
    "Terracotta",
    "Pearl & Gold Plated",
  ];
}
