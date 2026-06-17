import { HeroCarousel } from "@/components/HeroCarousel";
import { getHeroSlides, getHeroDuration } from "@/lib/queries/site";

// Server component: pulls owner-managed hero slides + rotation duration from
// the DB and hands them to the client carousel. Falls back to a single default
// editorial slide when none are configured.
export async function HeroSection() {
  const [slides, durationMs] = await Promise.all([getHeroSlides(), getHeroDuration()]);
  return <HeroCarousel slides={slides} durationMs={durationMs} />;
}
