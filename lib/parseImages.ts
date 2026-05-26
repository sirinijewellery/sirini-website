/**
 * Pure client-safe utilities — no Prisma / Node.js imports.
 * Safe to import from any "use client" component.
 */

export function parseImages(images: unknown): string[] {
  if (Array.isArray(images)) return images as string[];
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
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
