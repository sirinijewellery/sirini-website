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

/** Given a list of image URLs, return [modelUrl, productUrl].
 *  modelUrl  — URL with "model" in the path (shown by default)
 *  productUrl — first URL without "model" (shown on hover)
 *  Falls back gracefully when either type is missing. */
export function splitModelAndProduct(images: string[]): {
  modelImage: string | null;
  productImage: string | null;
} {
  const model = images.find((u) => u.toLowerCase().includes("model")) ?? null;
  const product = images.find((u) => !u.toLowerCase().includes("model")) ?? null;
  return { modelImage: model, productImage: product };
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
