import { Suspense } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { BrandStory } from "@/components/BrandStory";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ScrollReveal } from "@/components/ScrollReveal";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
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
      <HeroSection />
      <Suspense fallback={<div className="h-96 bg-muted animate-pulse" />}>
        <CategoryGrid />
      </Suspense>
      <Suspense fallback={<div className="h-96 bg-muted animate-pulse" />}>
        <FeaturedProducts />
      </Suspense>
      <BrandStory />
      <TestimonialsSection />
      <NewsletterSignup />
    </>
  );
}
