import { Suspense } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ShopByOccasion } from "@/components/ShopByOccasion";
import { ShopByCollection } from "@/components/ShopByCollection";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { BestsellersRail } from "@/components/BestsellersRail";
import { BrandStory } from "@/components/BrandStory";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { InstagramStrip } from "@/components/InstagramStrip";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { AskAISection } from "@/components/AskAISection";
import { WorldPortal } from "@/components/WorldPortal";
import { TrustStrip } from "@/components/TrustStrip";
import { PromoBanner } from "@/components/PromoBanner";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { PullQuote } from "@/components/PullQuote";
import { pageMetadata, siteConfig } from "@/lib/seo";
import type { HomeSectionKey } from "@/lib/queries/home";
import {
  getPromoBanner,
  getTrustBadges,
  getFeaturedTestimonials,
  getHomeSections,
  getBrandStory,
  getPullQuote,
  getHomeCategories,
  getHomeOccasions,
  getHomeCollections,
} from "@/lib/queries/home";

export const metadata = pageMetadata(
  "Sirini Jewellery — Handcrafted Fashion Jewellery",
  "Shop handcrafted Kundan, Meenakari, and gold-plated jewellery — necklace sets, earrings, bangles, finger rings and anklets. Pan India free shipping.",
  { canonical: siteConfig.url },
);

// ISR — the home page (featured/bestseller queries) is served from cache and
// refreshed at most every 10 minutes.
export const revalidate = 600;

// Zone palette — preserves the original cream ↔ warm-blush rhythm.
const CREAM = "#FFF8F5";
const BLUSH = "#FAF0EC";

// Each configurable section has a "home" zone background, chosen so the DEFAULT
// order reproduces the original hand-tuned zones EXACTLY (cream → blush →
// cream → blush). Consecutive same-background sections merge into one zone (no
// bridge); a gradient bridge is inserted only where the background changes.
// On reorder/hide this still yields a coherent alternating look.
const SECTION_BG: Record<HomeSectionKey, string> = {
  categories: BLUSH,        // Shop by Category — warm blush (first zone after hero)
  shopByOccasion: CREAM,    // Shop by Occasion — cream
  shopByCollection: BLUSH,  // Shop by Collection — warm blush
  featuredProducts: CREAM,  // cream
  bestsellers: CREAM,       // cream (follows featured)
  pullQuote: CREAM,         // cream (editorial interruption)
  testimonials: BLUSH,      // warm blush
  brandStory: BLUSH,        // Brand Story now sits below testimonials — warm blush
  instagram: BLUSH,         // warm blush (component also paints its own blush)
  newsletter: CREAM,        // cream
  worldPortal: CREAM,       // component paints its own velvet band edge-to-edge
  askAI: CREAM,             // cream (last word before footer)
};

export default async function HomePage() {
  // Resolve every owner-configurable input on the server. cache() dedupes the
  // settings reads across components in this render.
  const [
    promo,
    trustBadges,
    testimonials,
    sections,
    brandStory,
    pullQuote,
    homeCategories,
    homeOccasions,
    homeCollections,
  ] = await Promise.all([
    getPromoBanner(),
    getTrustBadges(),
    getFeaturedTestimonials(),
    getHomeSections(),
    getBrandStory(),
    getPullQuote(),
    getHomeCategories(),
    getHomeOccasions(),
    getHomeCollections(),
  ]);

  // Registry: section key → rendered node. Each entry already carries its own
  // <Suspense> wrapper where the underlying component fetches data, so the zone
  // wrapper below only handles background + spacing.
  const REGISTRY: Record<HomeSectionKey, React.ReactNode> = {
    categories: (
      <Suspense fallback={<div className="h-96 animate-pulse" />}>
        <CategoryGrid categories={homeCategories} />
      </Suspense>
    ),
    shopByOccasion: (
      <Suspense fallback={<div className="h-96 animate-pulse" />}>
        <ShopByOccasion occasions={homeOccasions} />
      </Suspense>
    ),
    shopByCollection: (
      <Suspense fallback={<div className="h-96 animate-pulse" />}>
        <ShopByCollection collections={homeCollections} />
      </Suspense>
    ),
    featuredProducts: (
      <Suspense fallback={<div className="h-96 animate-pulse" />}>
        <FeaturedProducts />
      </Suspense>
    ),
    bestsellers: (
      <Suspense fallback={<div className="h-96 animate-pulse" />}>
        <BestsellersRail />
      </Suspense>
    ),
    pullQuote: <PullQuote content={pullQuote} />,
    brandStory: <BrandStory content={brandStory} />,
    testimonials: <TestimonialsSection items={testimonials} />,
    instagram: (
      <Suspense fallback={<div className="h-96 animate-pulse" />}>
        <InstagramStrip />
      </Suspense>
    ),
    newsletter: <NewsletterSignup />,
    worldPortal: <WorldPortal />,
    askAI: <AskAISection />,
  };

  // The visible, ordered configurable sections (post-hero). Hero + TrustStrip
  // always sit above this list in the opening cream zone.
  const visible = sections.filter((s) => s.enabled);

  // Precompute each section's background and whether a gradient bridge is
  // needed from the section above it (the Hero + TrustStrip zone is CREAM).
  // Pure derivation — no mutation during render.
  const zoned = visible.map((section, i) => {
    const bg = SECTION_BG[section.key];
    const bridgeFrom = i === 0 ? CREAM : SECTION_BG[visible[i - 1].key];
    return { section, bg, bridgeFrom, needsBridge: bridgeFrom !== bg };
  });

  return (
    <>
      <OrganizationJsonLd />

      {/* Promo banner — only when the owner enables it (renders nothing otherwise) */}
      <PromoBanner promo={promo} />

      {/* Zone 1 — Cream: Hero + Trust badges always lead the page */}
      <HeroSection />
      <TrustStrip badges={trustBadges} />

      {zoned.map(({ section, bg, bridgeFrom, needsBridge }) => {
        return (
          <div key={section.key}>
            {needsBridge && (
              <div
                className="h-12 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${bridgeFrom}, ${bg})`,
                }}
                aria-hidden="true"
              />
            )}
            <div style={{ backgroundColor: bg }}>{REGISTRY[section.key]}</div>
          </div>
        );
      })}
    </>
  );
}
