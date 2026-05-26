import { Suspense } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { BrandStory } from "@/components/BrandStory";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ScrollReveal } from "@/components/ScrollReveal";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Sirini Jewellery — Handcrafted Fashion Jewellery",
  "Shop elegant necklaces, earrings, bangles, rings and bridal jewellery. Free shipping in India.",
);

export default function HomePage() {
  return (
    <>
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
