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
function isModel(url: string) {
  return /-model\.(jpe?g|png|webp)$/i.test(url);
}
function isDetailShot(url: string) {
  // Sequential variant numbers are 1–2 digits; prices in filenames are 3–5 digits.
  // Matches: -1.jpg  -2.jpg  -3.jpg … -99.jpg  (but NOT -675.jpg or -2250.jpg)
  return /-\d{1,2}\.(jpe?g|png|webp)$/i.test(url);
}
function isMain(url: string) {
  // Main full-product image: not a sequential detail, not model, not catalogue composite
  return !isDetailShot(url) && !isModel(url) && !/cpt/i.test(url);
}

export function selectCardImages(images: string[]): {
  primary: string | null;
  hover: string | null;
} {
  const modelShots = images.filter(isModel);       // e.g. -Model.jpg
  const mainShots  = images.filter(isMain);        // e.g. SKU-price.jpg
  const detailShots = images.filter(isDetailShot); // -1.jpg, -2.jpg …

  // PRIMARY: model first, then main full-set, then detail
  const primary = modelShots[0] ?? mainShots[0] ?? detailShots[0] ?? null;

  // HOVER: prefer a *second* model shot (coloured-bg), then main, then detail
  const hover =
    modelShots[1] ??   // second model image (different angle / coloured bg)
    mainShots[0] ??    // full-set plain image
    detailShots[0] ??  // any detail shot
    null;

  return { primary, hover };
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
