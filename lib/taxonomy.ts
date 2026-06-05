/**
 * Client-safe taxonomy constants (no Prisma / Node imports).
 * Safe to import from both server and "use client" components.
 * Re-exported from lib/queries/products.ts for server callers.
 */

export const NAV_CATEGORIES = [
  { slug: "necklace-sets", label: "Necklace Sets" },
  { slug: "earrings", label: "Earrings" },
  { slug: "bangles", label: "Bangles" },
  { slug: "finger-rings", label: "Finger Rings" },
  { slug: "anklets", label: "Anklets" },
] as const;

export const OCCASIONS = [
  { slug: "bridal", label: "Bridal & Wedding", blurb: "Heirloom Kundan, Polki & Jadau statement sets for the big day." },
  { slug: "festive", label: "Festive Edit", blurb: "Meenakari, temple & jhumka pieces to light up every celebration." },
] as const;

export const STYLES = [
  { slug: "kundan", label: "Kundan", blurb: "Timeless uncut-stone glamour." },
  { slug: "meenakari", label: "Meenakari", blurb: "Hand-painted enamel colour." },
  { slug: "polki", label: "Polki", blurb: "Regal uncut-diamond style." },
  { slug: "temple", label: "Temple", blurb: "Divine South-Indian heritage." },
  { slug: "pearl", label: "Pearl", blurb: "Soft, classic elegance." },
  { slug: "antique", label: "Antique Gold", blurb: "Oxidised, vintage charm." },
] as const;

export const PRICE_BUCKETS = [
  { slug: "under-999", label: "Under ₹999", priceMin: undefined as number | undefined, priceMax: 999 },
  { slug: "1000-2499", label: "₹1,000 – ₹2,499", priceMin: 1000, priceMax: 2499 },
  { slug: "2500-4999", label: "₹2,500 – ₹4,999", priceMin: 2500, priceMax: 4999 },
  { slug: "5000-plus", label: "₹5,000 & Above", priceMin: 5000, priceMax: undefined as number | undefined },
] as const;
