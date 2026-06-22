/**
 * Client-safe taxonomy constants (no Prisma / Node imports).
 * Safe to import from both server and "use client" components.
 * Re-exported from lib/queries/products.ts for server callers.
 */

export const NAV_CATEGORIES = [
  // Newest categories first (owner request).
  { slug: "bracelet", label: "Bracelet" },
  { slug: "tops", label: "Tops" },
  { slug: "nose-ring", label: "Nose Ring (Nath)" },
  { slug: "belt", label: "Belt" },
  { slug: "tikka", label: "Tikka" },
  { slug: "kalgi", label: "Kalgi" },
  { slug: "hathpaan", label: "Hathpaan" },
  { slug: "groom-mala", label: "Groom Mala" },
  { slug: "necklace-sets", label: "Necklace Sets" },
  { slug: "long-sets", label: "Long Sets" },
  { slug: "earrings", label: "Earrings" },
  { slug: "bangles", label: "Bangles" },
  { slug: "finger-rings", label: "Finger Rings" },
  { slug: "anklets", label: "Anklets" },
] as const;

/**
 * Display label for a category SLUG. Slugs (lowercase, e.g. "earrings") are the
 * canonical value used in URLs/filters/DB; this is the ONLY way category text
 * should be shown to users so casing is consistent everywhere ("Earrings").
 */
export function categoryLabel(slug: string): string {
  return (
    NAV_CATEGORIES.find((c) => c.slug === slug)?.label ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
  );
}

export const OCCASIONS = [
  { slug: "bridal", label: "Bridal & Wedding", blurb: "Heirloom Kundan, Polki & Jadau statement sets for the big day." },
  { slug: "festive", label: "Festive Edit", blurb: "Meenakari, temple & jhumka pieces to light up every celebration." },
  { slug: "party", label: "Party & Cocktail", blurb: "Statement earrings, cocktail rings & evening-ready sparkle." },
  { slug: "daily", label: "Daily Wear", blurb: "Lightweight, everyday elegance — studs, chains & subtle shine." },
] as const;

export const STYLES = [
  { slug: "kundan", label: "Kundan", blurb: "Timeless uncut-stone glamour." },
  { slug: "meenakari", label: "Meenakari", blurb: "Hand-painted enamel colour." },
  { slug: "polki", label: "Polki", blurb: "Regal uncut-diamond style." },
  { slug: "temple", label: "Temple", blurb: "Divine South-Indian heritage." },
  { slug: "pearl", label: "Pearl", blurb: "Soft, classic elegance." },
  { slug: "antique", label: "Antique Gold", blurb: "Oxidised, vintage charm." },
] as const;

// Map a free-text search query to the category slugs it implies, so searching
// "necklace set" surfaces every necklace, "jhumka" surfaces earrings, etc.
// Word-boundary patterns prevent false hits (e.g. "earring" must NOT match ring).
const CATEGORY_SEARCH_PATTERNS: { slug: string; patterns: RegExp[] }[] = [
  { slug: "necklace-sets", patterns: [/necklace/, /\bchoker/, /\bhaar/, /\brani\b/, /\bpendant/] },
  { slug: "long-sets", patterns: [/\blong set/, /\blong haar/, /\brani haar/] },
  { slug: "earrings", patterns: [/earring/, /\bjhumk/, /\bchandbali/, /\bstud\b/, /\bjhumka/] },
  { slug: "bangles", patterns: [/\bbangle/, /\bkada\b/, /\bbracelet/, /\bkangan/] },
  { slug: "finger-rings", patterns: [/\bring\b/, /\brings\b/, /\bcocktail ring/] },
  { slug: "anklets", patterns: [/\banklet/, /\bpayal/] },
];

export function matchCategorySlugs(search: string): string[] {
  const s = search.toLowerCase();
  return CATEGORY_SEARCH_PATTERNS.filter(({ patterns }) =>
    patterns.some((re) => re.test(s)),
  ).map((c) => c.slug);
}

/* ── Admin-managed taxonomy (DB-driven) — client-safe shapes ─────────────── */
// Mirrors the Prisma TaxonomyGroup / TaxonomyTerm models. Reads live in
// lib/queries/taxonomy.ts (server); admin writes go through /api/admin/taxonomy.
export interface TaxonomyTermData {
  id: string;
  slug: string;
  label: string;
  blurb: string | null;
  coverImage: string | null;
  sortOrder: number;
  showInMenu: boolean;
  parentId: string | null;
  /** Populated for hierarchical (category) groups. */
  children: TaxonomyTermData[];
}

export interface TaxonomyGroupData {
  id: string;
  slug: string;
  label: string;
  hierarchical: boolean;
  sortOrder: number;
  showInMenu: boolean;
  isSystem: boolean;
  /** Top-level terms (sub-terms nested under `children`). */
  terms: TaxonomyTermData[];
}

/** The fixed system dimension slugs seeded at launch (owner may add more). */
export const SYSTEM_GROUP_SLUGS = [
  "category",
  "occasion",
  "collection",
  "look",
  "stone",
  "colour",
] as const;

export const PRICE_BUCKETS = [
  { slug: "under-999", label: "Under ₹999", priceMin: undefined as number | undefined, priceMax: 999 },
  { slug: "1000-2499", label: "₹1,000 – ₹2,499", priceMin: 1000, priceMax: 2499 },
  { slug: "2500-4999", label: "₹2,500 – ₹4,999", priceMin: 2500, priceMax: 4999 },
  { slug: "5000-plus", label: "₹5,000 & Above", priceMin: 5000, priceMax: undefined as number | undefined },
] as const;
