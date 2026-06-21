import { Suspense } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { BestsellersRail } from "@/components/BestsellersRail";
import { ShopByPrice } from "@/components/ShopByPrice";
import { BrandStory } from "@/components/BrandStory";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { InstagramStrip } from "@/components/InstagramStrip";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { AskAISection } from "@/components/AskAISection";
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
  categories: BLUSH,        // original Zone 2 — warm blush
  featuredProducts: CREAM,  // original Zone 3 — cream
  bestsellers: CREAM,       // cream (follows featured)
  shopByPrice: CREAM,       // cream (transparent band)
  pullQuote: CREAM,         // cream (editorial interruption)
  brandStory: BLUSH,        // original Zone 4 — warm blush
  testimonials: BLUSH,      // warm blush
  instagram: BLUSH,         // warm blush (component also paints its own blush)
  newsletter: CREAM,        // original Zone 5 — cream
  askAI: CREAM,             // cream (last word before footer)
};

export default async function HomePage() {
  // Resolve every owner-configurable input on the server. cache() dedupes the
  // settings reads across components in this render.
  const [promo, trustBadges, testimonials, sections, brandStory, pullQuote, homeCategories] =
    await Promise.all([
      getPromoBanner(),
      getTrustBadges(),
      getFeaturedTestimonials(),
      getHomeSections(),
      getBrandStory(),
      getPullQuote(),
      getHomeCategories(),
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
    shopByPrice: <ShopByPrice />,
    pullQuote: <PullQuote content={pullQuote} />,
    brandStory: <BrandStory content={brandStory} />,
    testimonials: <TestimonialsSection items={testimonials} />,
    instagram: (
      <Suspense fallback={<div className="h-96 animate-pulse" />}>
        <InstagramStrip />
      </Suspense>
    ),
    newsletter: <NewsletterSignup />,
    askAI: <AskAISection />,
  };

  // The visible, ordered configurable sections (post-hero). Hero + TrustStrip
  // always sit above this list in the opening cream zone.
  const visible = sections.filter((s) => s.enabled);

  // Track the previous visible section's background so we only insert a gradient
  // bridge when the zone colour actually changes. The Hero + TrustStrip zone
  // above is CREAM.
  let prevBg = CREAM;

  return (
    <>
      <OrganizationJsonLd />

      {/* Promo banner — only when the owner enables it (renders nothing otherwise) */}
      <PromoBanner promo={promo} />

      {/* Zone 1 — Cream: Hero + Trust badges always lead the page */}
      <HeroSection />
      <TrustStrip badges={trustBadges} />

      {visible.map((section) => {
        const bg = SECTION_BG[section.key];
        const bridgeFrom = prevBg;
        const bridgeTo = bg;
        const needsBridge = bridgeFrom !== bridgeTo;
        prevBg = bg;

        return (
          <div key={section.key}>
            {needsBridge && (
              <div
                className="h-12 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${bridgeFrom}, ${bridgeTo})`,
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
