import { Suspense } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { BrandStory } from "@/components/BrandStory";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TrustStrip } from "@/components/TrustStrip";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { PullQuote } from "@/components/PullQuote";
import { pageMetadata, siteConfig } from "@/lib/seo";

export const metadata = pageMetadata(
  "Sirini Jewellery — Handcrafted Fashion Jewellery",
  "Shop handcrafted Kundan, Meenakari, and gold-plated jewellery — necklace sets, earrings, bangles, finger rings and anklets. Pan India free shipping.",
  { canonical: siteConfig.url },
);

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <ScrollReveal />

      {/* Zone 1 — Cream */}
      <HeroSection />
      <TrustStrip />

      {/* Gradient bridge: cream → warm blush */}
      <div className="h-12 bg-gradient-to-b from-[#FFF8F5] to-[#FAF0EC] pointer-events-none" aria-hidden="true" />

      {/* Zone 2 — Warm blush */}
      <div className="bg-[#FAF0EC]">
        <Suspense fallback={<div className="h-96 bg-[#FAF0EC] animate-pulse" />}>
          <CategoryGrid />
        </Suspense>
      </div>

      {/* Gradient bridge: warm blush → cream */}
      <div className="h-12 bg-gradient-to-b from-[#FAF0EC] to-[#FFF8F5] pointer-events-none" aria-hidden="true" />

      {/* Zone 3 — Cream */}
      <Suspense fallback={<div className="h-96 bg-muted animate-pulse" />}>
        <FeaturedProducts />
      </Suspense>

      {/* Pull quote — editorial interruption */}
      <PullQuote />

      {/* Gradient bridge: cream → warm blush */}
      <div className="h-12 bg-gradient-to-b from-[#FFF8F5] to-[#FAF0EC] pointer-events-none" aria-hidden="true" />

      {/* Zone 4 — Warm blush */}
      <div className="bg-[#FAF0EC]">
        <BrandStory />
        <TestimonialsSection />
      </div>

      {/* Gradient bridge: warm blush → cream */}
      <div className="h-12 bg-gradient-to-b from-[#FAF0EC] to-[#FFF8F5] pointer-events-none" aria-hidden="true" />

      {/* Zone 5 — Cream */}
      <NewsletterSignup />
    </>
  );
}
