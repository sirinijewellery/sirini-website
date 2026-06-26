import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/queries/site";
import { getTaxonomyTree } from "@/lib/queries/taxonomy";

// ---------------------------------------------------------------------------
// Homepage storefront settings — getters + defaults.
//
// GOLDEN RULE: every default below MUST reproduce the CURRENT hardcoded look,
// so nothing changes visibly until the owner edits a setting in the admin.
//
// Read these from server components only. Writes go through
// PATCH /api/admin/settings with { key: "home.<name>", value }.
// ---------------------------------------------------------------------------

/* ── 1) Promo banner ──────────────────────────────────────────── */

export interface PromoBanner {
  enabled: boolean;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  bg: string;
}

// Default: disabled, so the banner does NOT appear until the owner turns it on.
export const DEFAULT_PROMO: PromoBanner = {
  enabled: false,
  text: "Free Pan-India shipping on all orders",
  ctaLabel: "Shop now",
  ctaHref: "/shop",
  bg: "#8a4853",
};

export const getPromoBanner = cache(async (): Promise<PromoBanner> => {
  const v = await getSetting<Partial<PromoBanner> | null>("home.promo", null);
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return { ...DEFAULT_PROMO, ...v };
  }
  return DEFAULT_PROMO;
});

/* ── 2) Trust badges ──────────────────────────────────────────── */

// `icon` is an enum key mapping to a fixed set of Lucide icons imported in
// TrustStrip.tsx. Unknown keys fall back to a sensible default there.
export type TrustIconKey =
  | "shield"
  | "truck"
  | "exchange"
  | "lock"
  | "badge"
  | "gem"
  | "heart"
  | "award"
  | "sparkles"
  | "gift";

export interface TrustBadge {
  icon: TrustIconKey;
  title: string;
  sub: string;
}

// Default = the CURRENT five TrustStrip items, in order.
export const DEFAULT_TRUST_BADGES: TrustBadge[] = [
  { icon: "shield", title: "Genuine Materials", sub: "100% authentic Kundan & Meenakari" },
  { icon: "truck", title: "Free Shipping", sub: "Pan-India on all orders" },
  { icon: "exchange", title: "Easy Exchange", sub: "7-day hassle-free exchange" },
  { icon: "lock", title: "Secure Payments", sub: "UPI, Cards, COD accepted" },
  { icon: "badge", title: "Trusted Seller on Flipkart", sub: "Official verified seller" },
];

export const getTrustBadges = cache(async (): Promise<TrustBadge[]> => {
  const v = await getSetting<unknown>("home.trustBadges", null);
  if (Array.isArray(v)) {
    const clean = v
      .filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
      .map((b) => ({
        icon: (typeof b.icon === "string" ? b.icon : "shield") as TrustIconKey,
        title: typeof b.title === "string" ? b.title : "",
        sub: typeof b.sub === "string" ? b.sub : "",
      }))
      .filter((b) => b.title.trim());
    if (clean.length) return clean;
  }
  return DEFAULT_TRUST_BADGES;
});

/* ── 3) Featured testimonials (real, published reviews) ───────── */

export interface FeaturedTestimonial {
  title: string;
  quote: string;
  author: string;
  rating: number;
}

// Fallback array = the CURRENT 15 hardcoded testimonials, so the section never
// empties when there are zero published reviews.
export const DEFAULT_TESTIMONIALS: FeaturedTestimonial[] = [
  { title: "Elegant & Premium Quality", quote: "I absolutely loved the jewelry from Sirini. The quality, shine, and detailing are truly amazing. It looks very premium and elegant, perfect for weddings and festive occasions.", author: "Priya Sharma", rating: 5 },
  { title: "Beautiful Traditional Design", quote: "The design is beautiful, lightweight, and very comfortable to wear all day. The finishing looks luxurious and matches perfectly with ethnic outfits. Highly recommended!", author: "Anjali Verma", rating: 5 },
  { title: "Royal Look & Amazing Finish", quote: "The craftsmanship and elegance are outstanding. Every detail looks carefully designed, and the quality feels premium. It adds a classy and royal touch to any look.", author: "Isha Singh", rating: 5 },
  { title: "Perfect for Every Occasion", quote: "I am really impressed with the beautiful design and premium finishing. The product looks exactly like the pictures and feels very stylish. Perfect for any special event.", author: "Sneha Kapoor", rating: 5 },
  { title: "Stylish & Comfortable", quote: "The jewelry is elegant, trendy, and comfortable to wear. The shine and detailing make it look very expensive and luxurious. A perfect addition to my collection.", author: "Pooja Singh", rating: 5 },
  { title: "Luxury Feel & Stunning Shine", quote: "I'm extremely happy with my purchase. The jewelry has a beautiful shine, premium finishing, and elegant design that instantly enhances the overall look.", author: "Kavya Jain", rating: 5 },
  { title: "Impeccable Attention to Detail", quote: "Absolutely stunning pieces that elevate any outfit. The attention to detail is impeccable, reflecting true mastery of traditional jewelry making.", author: "Meera R.", rating: 5 },
  { title: "A Beautiful Blend", quote: "A beautiful blend of tradition and modernity. I wore their necklace set for my wedding and felt like absolute royalty. Every guest asked about it.", author: "Aditi S.", rating: 5 },
  { title: "Unparalleled Craftsmanship", quote: "The craftsmanship is unparalleled. Each piece feels like a cherished heirloom that has been passed down through generations. Simply breathtaking.", author: "Riya G.", rating: 5 },
  { title: "Timeless Designs", quote: "Exceptional quality and timeless designs. The quiet luxury aesthetic they offer is hard to find anywhere else. I will definitely be returning for more.", author: "Sana K.", rating: 5 },
  { title: "Bridal Set of My Dreams", quote: "I bought a Kundan bridal set for my wedding and it was beyond beautiful. The pearls and stonework looked so rich in every photo. Worth every rupee.", author: "Nidhi Agarwal", rating: 5 },
  { title: "Festive Favourite", quote: "Wore the jhumkas for Diwali and got endless compliments. Lightweight enough to wear all evening, yet they sparkle like real gold. Absolutely love them.", author: "Tanvi Mehta", rating: 5 },
  { title: "Fast Delivery, Lovely Packaging", quote: "The order arrived earlier than expected and the packaging was so elegant — it felt like opening a gift. The anklets are dainty and gorgeous.", author: "Shruti Nair", rating: 5 },
  { title: "Gifted & Loved", quote: "I gifted a Meenakari necklace set to my mother and she was overjoyed. The enamel work is so detailed and the colours are stunning in person.", author: "Ananya Iyer", rating: 5 },
  { title: "My Go-To for Ethnic Wear", quote: "Every time I have a function, Sirini is my first stop. The pieces pair beautifully with sarees and lehengas, and the quality never disappoints.", author: "Divya Reddy", rating: 5 },
];

// Build a short editorial title from the product name when a review has none.
function titleForReview(productName: string | null | undefined): string {
  if (productName && productName.trim()) return productName.trim();
  return "A Happy Customer";
}

/**
 * Featured testimonials for the homepage carousel.
 *
 * Returns PUBLISHED reviews (newest first, with a body), up to ~12, mapped to
 * the carousel shape. Optionally curated via the `home.featuredReviewIds`
 * setting (an array of review ids, rendered in that order); otherwise newest.
 *
 * If there are ZERO usable published reviews, falls back to the current
 * hardcoded array so the section never empties.
 */
export const getFeaturedTestimonials = cache(async (): Promise<FeaturedTestimonial[]> => {
  const curatedIds = await getSetting<string[] | null>("home.featuredReviewIds", null);

  try {
    const where = {
      isPublished: true,
      body: { not: null },
      ...(Array.isArray(curatedIds) && curatedIds.length
        ? { id: { in: curatedIds } }
        : {}),
    };

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        authorName: true,
        rating: true,
        body: true,
        product: { select: { name: true } },
      },
    });

    let usable = reviews.filter((r) => r.body && r.body.trim().length > 0);

    // Preserve the curated order when ids were supplied.
    if (Array.isArray(curatedIds) && curatedIds.length) {
      const rank = new Map(curatedIds.map((id, i) => [id, i]));
      usable = usable.sort(
        (a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9),
      );
    }

    if (usable.length > 0) {
      return usable.map((r) => ({
        title: titleForReview(r.product?.name),
        quote: r.body!.trim(),
        author: r.authorName,
        rating: r.rating >= 1 && r.rating <= 5 ? r.rating : 5,
      }));
    }
  } catch {
    // DB hiccup — fall through to the safe default below.
  }

  return DEFAULT_TESTIMONIALS;
});

/* ── 4) Section order & visibility ────────────────────────────── */

export type HomeSectionKey =
  | "categories"
  | "shopByOccasion"
  | "shopByCollection"
  | "featuredProducts"
  | "bestsellers"
  | "pullQuote"
  | "brandStory"
  | "testimonials"
  | "instagram"
  | "newsletter"
  | "askAI";

export interface HomeSection {
  key: HomeSectionKey;
  enabled: boolean;
}

// Default = the post-hero section order, all on. The taxonomy "shop by" trio
// (Category → Occasion → Collection) leads, then the existing editorial /
// product sections, with Brand Story (Story) moved BELOW testimonials.
// NOTE: Hero + TrustStrip sit above this list and are always rendered.
export const DEFAULT_SECTIONS: HomeSection[] = [
  { key: "categories", enabled: true },
  { key: "shopByOccasion", enabled: true },
  { key: "shopByCollection", enabled: true },
  { key: "featuredProducts", enabled: true },
  { key: "bestsellers", enabled: true },
  { key: "pullQuote", enabled: true },
  { key: "testimonials", enabled: true },
  { key: "brandStory", enabled: true },
  { key: "instagram", enabled: true },
  { key: "newsletter", enabled: true },
  { key: "askAI", enabled: true },
];

const VALID_SECTION_KEYS = new Set<HomeSectionKey>(
  DEFAULT_SECTIONS.map((s) => s.key),
);

export const getHomeSections = cache(async (): Promise<HomeSection[]> => {
  const v = await getSetting<unknown>("home.sections", null);
  if (Array.isArray(v)) {
    const seen = new Set<string>();
    const cleaned: HomeSection[] = [];
    for (const item of v) {
      if (!item || typeof item !== "object") continue;
      const key = (item as Record<string, unknown>).key;
      if (typeof key !== "string" || !VALID_SECTION_KEYS.has(key as HomeSectionKey)) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      cleaned.push({
        key: key as HomeSectionKey,
        enabled: (item as Record<string, unknown>).enabled !== false,
      });
    }
    // Append any keys missing from the stored value (e.g. a newly added section)
    // so future sections appear automatically, enabled, at the end.
    for (const def of DEFAULT_SECTIONS) {
      if (!seen.has(def.key)) cleaned.push({ ...def });
    }
    if (cleaned.length) return cleaned;
  }
  return DEFAULT_SECTIONS;
});

/* ── 6) Brand story + pull quote ──────────────────────────────── */

export interface BrandStoryContent {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
}

// Default = the CURRENT BrandStory copy + image + link.
export const DEFAULT_BRAND_STORY: BrandStoryContent = {
  heading: "Crafted with Intention",
  body: "Every piece of Sirini jewellery tells a story of heritage. Our master artisans employ centuries-old techniques, working slowly and deliberately to create heirlooms that transcend fleeting trends. We believe in the quiet luxury of meticulous craftsmanship.",
  ctaLabel: "Our Story",
  ctaHref: "/about",
  image:
    "https://res.cloudinary.com/dp8a2lvxg/image/upload/v1779797844/sirini-jewellery/brand/artisan-workshop.jpg",
};

export const getBrandStory = cache(async (): Promise<BrandStoryContent> => {
  const v = await getSetting<Partial<BrandStoryContent> | null>("home.brandStory", null);
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return { ...DEFAULT_BRAND_STORY, ...v };
  }
  return DEFAULT_BRAND_STORY;
});

export interface PullQuoteContent {
  text: string;
  attribution: string;
}

// Default = the CURRENT pull-quote text + attribution.
export const DEFAULT_PULL_QUOTE: PullQuoteContent = {
  text: "I wore this to my cousin's sangeet and couldn't stop receiving compliments — every aunty asked where I got it from.",
  attribution: "Priya M., Mumbai",
};

export const getPullQuote = cache(async (): Promise<PullQuoteContent> => {
  const v = await getSetting<Partial<PullQuoteContent> | null>("home.pullQuote", null);
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return { ...DEFAULT_PULL_QUOTE, ...v };
  }
  return DEFAULT_PULL_QUOTE;
});

/* ── 7) Taxonomy-driven "shop by" cards (category / occasion / collection) ── */

export interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

/**
 * "Shop by Category" cards = the MAIN terms of the admin-managed `category`
 * taxonomy group (necklace-set / earrings / bangles / accessories), in their
 * sortOrder. Sub-categories are intentionally NOT shown here — the grid stays
 * to the top-level mains, and each links to /shop?category=<slug> (the shop
 * expands a main slug to include its sub-categories).
 */
export const getHomeCategories = cache(async (): Promise<HomeCategory[]> => {
  try {
    const tree = await getTaxonomyTree();
    const group = tree.find((g) => g.slug === "category");
    if (!group) return [];
    return group.terms.map((t) => ({
      id: t.id,
      name: t.label,
      slug: t.slug,
      image: t.coverImage, // null for now — CategoryGrid renders a clean label card
    }));
  } catch {
    return [];
  }
});

/**
 * A generic "shop by <dimension>" tile — used for occasion & collection. The
 * `param` is the /shop query-string key (e.g. "occasion") so a card links to
 * /shop?<param>=<slug>.
 */
export interface HomeTaxonomyTile {
  id: string;
  slug: string;
  label: string;
  blurb: string | null;
}

async function getGroupTerms(groupSlug: string): Promise<HomeTaxonomyTile[]> {
  try {
    const tree = await getTaxonomyTree();
    const group = tree.find((g) => g.slug === groupSlug);
    if (!group) return [];
    return group.terms.map((t) => ({
      id: t.id,
      slug: t.slug,
      label: t.label,
      blurb: t.blurb,
    }));
  } catch {
    return [];
  }
}

/** "Shop by Occasion" tiles — top-level terms of the `occasion` group. */
export const getHomeOccasions = cache(
  async (): Promise<HomeTaxonomyTile[]> => getGroupTerms("occasion"),
);

/** "Shop by Collection" tiles — top-level terms of the `collection` group. */
export const getHomeCollections = cache(
  async (): Promise<HomeTaxonomyTile[]> => getGroupTerms("collection"),
);
